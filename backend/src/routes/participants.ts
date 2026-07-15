import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { generateSecureToken } from '../utils/token';
import { sendRegistrationConfirmation, sendMemberInvitation, sendAbsenceNotice } from '../services/email';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth';
import { ParticipantStatus, Role } from '@prisma/client';

const router = Router();

// ==========================================
// PUBLIC ROUTES (No Auth Required)
// ==========================================

// Public event registration
router.post('/register', async (req: Request, res: Response) => {
  const { eventId, name, email, phone, additionalMembers } = req.body;

  if (!eventId || !name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields (eventId, name, email, phone)' });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Expiry of edit token: 30 days from now (or date of event plus a few days)
    const editToken = generateSecureToken();
    const editTokenExpires = new Date();
    editTokenExpires.setDate(editTokenExpires.getDate() + 30);

    // Create participant and additional members in a transaction
    const participant = await prisma.$transaction(async (tx) => {
      // 1. Create main participant
      const p = await tx.participant.create({
        data: {
          eventId,
          name,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          editToken,
          editTokenExpires,
          status: ParticipantStatus.PENDING
        }
      });

      // 2. Create additional members
      if (additionalMembers && Array.isArray(additionalMembers)) {
        for (const m of additionalMembers) {
          if (m.name && m.email) {
            await tx.additionalMember.create({
              data: {
                participantId: p.id,
                name: m.name,
                email: m.email.trim().toLowerCase()
              }
            });
          }
        }
      }
      return p;
    });

    // Send emails
    const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const editLink = `${process.env.APP_URL || 'http://localhost:5173'}/edit-registration?token=${editToken}`;

    // Email to main participant
    await sendRegistrationConfirmation(
      participant.email,
      participant.name,
      event.title,
      `${formattedDate} at ${event.startTime}`,
      event.venue,
      editLink
    );

    // Email to additional members
    if (additionalMembers && Array.isArray(additionalMembers)) {
      for (const m of additionalMembers) {
        if (m.name && m.email) {
          await sendMemberInvitation(
            m.email,
            participant.name,
            m.name,
            event.title,
            `${formattedDate} at ${event.startTime}`,
            event.venue,
            editLink // Same link allows editing the whole reservation group
          );
        }
      }
    }

    return res.status(201).json(participant);
  } catch (error: any) {
    console.error('Register participant error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A volunteer with this email or phone is already registered for this event.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET registration details by token (to populate the edit page)
router.get('/edit/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const participant = await prisma.participant.findUnique({
      where: { editToken: token },
      include: {
        event: {
          include: { department: true }
        },
        additionalMembers: true
      }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Invalid or expired registration token' });
    }

    if (participant.editTokenExpires < new Date()) {
      return res.status(400).json({ error: 'This registration link has expired' });
    }

    return res.json(participant);
  } catch (error) {
    console.error('Fetch registration by token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update registration by token
router.put('/edit/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { name, email, phone, additionalMembers } = req.body;

  try {
    const participant = await prisma.participant.findUnique({
      where: { editToken: token },
      include: { additionalMembers: true }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (participant.editTokenExpires < new Date()) {
      return res.status(400).json({ error: 'This registration link has expired' });
    }

    const updatedParticipant = await prisma.$transaction(async (tx) => {
      // 1. Update main participant
      const p = await tx.participant.update({
        where: { id: participant.id },
        data: {
          name: name || undefined,
          email: email ? email.trim().toLowerCase() : undefined,
          phone: phone ? phone.trim() : undefined
        }
      });

      // 2. Sync additional members (simplest way is delete all and recreate)
      if (additionalMembers && Array.isArray(additionalMembers)) {
        await tx.additionalMember.deleteMany({
          where: { participantId: participant.id }
        });

        for (const m of additionalMembers) {
          if (m.name && m.email) {
            await tx.additionalMember.create({
              data: {
                participantId: participant.id,
                name: m.name,
                email: m.email.trim().toLowerCase()
              }
            });
          }
        }
      }

      return p;
    });

    return res.json(updatedParticipant);
  } catch (error) {
    console.error('Update registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Self Check-in flow (Scan QR and confirm email/phone)
router.post('/self-checkin', async (req: Request, res: Response) => {
  const { slug, identifier } = req.body; // slug of event, identifier is email or phone

  if (!slug || !identifier) {
    return res.status(400).json({ error: 'Event slug and email/phone identifier are required' });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.checkinEnabled) {
      return res.status(400).json({ error: 'Check-in is currently disabled for this event by coordinators' });
    }

    // Find the participant
    const participant = await prisma.participant.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { email: identifier.trim().toLowerCase() },
          { phone: identifier.trim() }
        ]
      }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found. Please register first or verify your email/phone' });
    }

    // Update status to PRESENT
    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        status: ParticipantStatus.PRESENT,
        checkinAt: new Date()
      }
    });

    return res.json({
      message: 'Check-in successful! Thank you.',
      participant: {
        name: updated.name,
        email: updated.email,
        status: updated.status,
        checkinAt: updated.checkinAt
      }
    });
  } catch (error) {
    console.error('Self check-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// AUTHENTICATED / SCOPED ROUTES
// ==========================================

// Get participants list for event (Search, Filter, Sort)
router.get('/event/:eventId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { search, status, sortBy, sortOrder } = req.query;
  const userRole = req.user?.role;
  const userDeptId = req.user?.departmentId;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Scoped restriction for Department Admin
    if (userRole === Role.DEPARTMENT_ADMIN && event.departmentId !== userDeptId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    // Query builder
    const where: any = { eventId };

    if (status) {
      where.status = status as ParticipantStatus;
    }

    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { phone: { contains: searchStr } }
      ];
    }

    // Sorting
    const orderBy: any = {};
    const validSortFields = ['name', 'email', 'phone', 'status', 'checkinAt', 'createdAt'];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'createdAt';
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = direction;

    const participants = await prisma.participant.findMany({
      where,
      include: {
        additionalMembers: true
      },
      orderBy
    });

    return res.json(participants);
  } catch (error) {
    console.error('Get participants list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually update participant status (Coordinators/Admins check-in)
router.patch('/:id/status', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // PENDING, PRESENT, ABSENT

  if (!status || !Object.values(ParticipantStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status' });
  }

  try {
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { event: true }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;

    // Scoped restriction for Department Admin
    if (userRole === Role.DEPARTMENT_ADMIN && participant.event.departmentId !== userDeptId) {
      return res.status(403).json({ error: 'Forbidden: Participant belongs to another department' });
    }

    const updated = await prisma.participant.update({
      where: { id },
      data: {
        status: status as ParticipantStatus,
        checkinAt: status === ParticipantStatus.PRESENT ? new Date() : null
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update participant status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger Grace Period Auto-email for Absentees
// Manually triggers/runs the job for checking absentees for completed/past events
router.post('/auto-email-absentees', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Scoped restriction for Department Admin
    if (req.user?.role === Role.DEPARTMENT_ADMIN && event.departmentId !== req.user?.departmentId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    // Fetch all participants with PENDING status (who are actually ABSENT)
    const absentees = await prisma.participant.findMany({
      where: {
        eventId,
        status: ParticipantStatus.PENDING
      }
    });

    // Mark them as ABSENT and send email notifications
    const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    let emailsSent = 0;

    await prisma.$transaction(async (tx) => {
      // 1. Mark status as ABSENT
      await tx.participant.updateMany({
        where: {
          eventId,
          status: ParticipantStatus.PENDING
        },
        data: {
          status: ParticipantStatus.ABSENT
        }
      });
    });

    // Send emails asynchronously
    for (const p of absentees) {
      try {
        await sendAbsenceNotice(p.email, p.name, event.title, formattedDate);
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send absence notice to ${p.email}:`, err);
      }
    }

    return res.json({
      message: `Checked absentees successfully. ${absentees.length} marked ABSENT. ${emailsSent} absence warning emails dispatched.`
    });
  } catch (error) {
    console.error('Trigger absentee processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
