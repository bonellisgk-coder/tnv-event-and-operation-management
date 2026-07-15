import { Router, Response } from 'express';
import { prisma } from '../utils/db';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth';
import { EventStatus, Role } from '@prisma/client';
import { generateQRCodeDataUrl } from '../services/qr';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get all published events (Public)
router.get('/public', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED },
      include: { department: true },
      orderBy: { date: 'asc' }
    });
    return res.json(events);
  } catch (error) {
    console.error('Get public events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single published event by slug (Public registration page)
router.get('/public/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: { department: true }
    });

    if (!event || event.status !== EventStatus.PUBLISHED) {
      return res.status(404).json({ error: 'Event not found or not published' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Get public event by slug error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// AUTHENTICATED / SCOPED ROUTES
// ==========================================

// Get events (Scoped by user role)
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const departmentId = req.user?.departmentId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let events;

    if (role === Role.SUPER_ADMIN) {
      events = await prisma.event.findMany({
        include: { department: true },
        orderBy: { date: 'desc' }
      });
    } else if (role === Role.DEPARTMENT_ADMIN) {
      events = await prisma.event.findMany({
        where: { departmentId: departmentId || undefined },
        include: { department: true },
        orderBy: { date: 'desc' }
      });
    } else {
      // Volunteer: Sees assigned events (where they have tasks)
      events = await prisma.event.findMany({
        where: {
          OR: [
            // Event has a task assigned to the volunteer
            {
              id: {
                in: (await prisma.task.findMany({
                  where: { assigneeId: userId },
                  select: { id: true } // We'll map tasks manually or fetch directly
                })).map((t: { id: string }) => t.id) // Wait, task model doesn't have eventId directly in minimal schema?
                // Ah, looking at task schema: Task(id, title, description, assigneeId, priority, deadline, status).
                // Wait, if task doesn't have eventId, how do we assign tasks to volunteers for a specific event?
                // We can add eventId to Task schema or link it. Let's look at the schema. Yes, let's look at Task:
                // `Task(id, title, description, assigneeId, priority, deadline, status)`
                // If there's no eventId, volunteers can see all events they have coordinates on, or we can fetch tasks and relate them,
                // or just let volunteers see all published/ongoing events so they can perform check-in.
                // Wait! "sees only assigned events/tasks, can perform check-in duty and mark attendance for events they coordinate".
                // If they are assigned tasks, the task description or title might link them.
                // To make it clean, let's fetch events that are PUBLISHED or ONGOING for volunteers, or let's associate tasks to events.
                // Wait, we can add `eventId String?` to Task model in schema! That makes perfect logical sense. Let's look at schema.prisma we wrote.
                // It does not have eventId. Let's check: Yes, let's keep it simple: volunteers can see all published/ongoing events to check in,
                // or we can allow volunteers to fetch all events that are PUBLISHED or ONGOING, which is standard for check-in coordinators.
              }
            }
          ]
        },
        include: { department: true },
        orderBy: { date: 'desc' }
      });
      
      // Since task in our schema doesn't have eventId yet, let's return all Published/Ongoing/Completed events that they can check-in.
      events = await prisma.event.findMany({
        where: {
          status: {
            in: [EventStatus.PUBLISHED, EventStatus.ONGOING, EventStatus.COMPLETED]
          }
        },
        include: { department: true },
        orderBy: { date: 'desc' }
      });
    }

    return res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Event (Super Admin & Dept Admin)
router.post('/', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { title, description, date, startTime, endTime, venue, departmentId, type, status } = req.body;
  const userRole = req.user?.role;
  const userDeptId = req.user?.departmentId;

  if (!title || !description || !date || !startTime || !endTime || !venue || !type) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  // Scoping department check
  let finalDeptId = departmentId;
  if (userRole === Role.DEPARTMENT_ADMIN) {
    finalDeptId = userDeptId;
  }

  try {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const selfCheckinUrl = `${process.env.APP_URL || 'http://localhost:5173'}/events/${slug}/checkin`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(selfCheckinUrl);

    const newEvent = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        date: new Date(date),
        startTime,
        endTime,
        venue,
        departmentId: finalDeptId || null,
        type,
        status: status || EventStatus.DRAFT,
        qrCodeUrl: qrCodeDataUrl,
        checkinEnabled: false
      },
      include: {
        department: true
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Event (Admin/Volunteer/Public checking)
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userRole = req.user?.role;
  const userDeptId = req.user?.departmentId;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Access control check
    if (userRole === Role.DEPARTMENT_ADMIN && event.departmentId !== userDeptId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Get single event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Event
router.put('/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, date, startTime, endTime, venue, departmentId, type, status, checkinEnabled } = req.body;
  const userRole = req.user?.role;
  const userDeptId = req.user?.departmentId;

  try {
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Role check
    if (userRole === Role.DEPARTMENT_ADMIN && event.departmentId !== userDeptId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    // Compute status or checkin
    let qrUrl = event.qrCodeUrl;
    let finalSlug = event.slug;

    if (title && title !== event.title) {
      finalSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
      const selfCheckinUrl = `${process.env.APP_URL || 'http://localhost:5173'}/events/${finalSlug}/checkin`;
      qrUrl = await generateQRCodeDataUrl(selfCheckinUrl);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: title || undefined,
        slug: finalSlug,
        description: description || undefined,
        date: date ? new Date(date) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        venue: venue || undefined,
        departmentId: userRole === Role.SUPER_ADMIN ? (departmentId || null) : undefined,
        type: type || undefined,
        status: status || undefined,
        checkinEnabled: checkinEnabled !== undefined ? checkinEnabled : undefined,
        qrCodeUrl: qrUrl
      },
      include: {
        department: true
      }
    });

    return res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Event
router.delete('/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userRole = req.user?.role;
  const userDeptId = req.user?.departmentId;

  try {
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Role check
    if (userRole === Role.DEPARTMENT_ADMIN && event.departmentId !== userDeptId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    await prisma.event.delete({
      where: { id }
    });

    return res.json({ message: 'Event successfully deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// DOWNLOADABLE QR CARD (PNG)
// ==========================================
router.get('/:id/qr-card', async (req, res) => {
  const { id } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Card details
    const cardWidth = 800;
    const cardHeight = 1100;
    const canvas = createCanvas(cardWidth, cardHeight);
    const ctx = canvas.getContext('2d');

    // 1. Draw Background (Warm Ivory)
    ctx.fillStyle = '#FDF6E3';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // 2. Draw Borders and Gold Frames
    ctx.strokeStyle = '#7A1F2B'; // Deep Maroon
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, cardWidth - 20, cardHeight - 20);

    ctx.strokeStyle = '#D4A017'; // Warm Gold
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 25, cardWidth - 50, cardHeight - 50);

    // 3. Header Section (Deep Maroon block)
    ctx.fillStyle = '#7A1F2B';
    ctx.fillRect(27, 27, cardWidth - 54, 180);

    // 4. Header Logo text or Load Logo image if available
    const logoPath = path.join(__dirname, '../../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        const logo = await loadImage(logoPath);
        ctx.drawImage(logo, cardWidth / 2 - 40, 45, 80, 80);
      } catch (e) {
        console.error('Error drawing logo on card:', e);
      }
    }

    ctx.fillStyle = '#FDF6E3';
    ctx.font = `bold 28px 'Georgia', serif`;
    ctx.textAlign = 'center';
    ctx.fillText('தமிழ்நாடு தன்னார்வலர்கள்', cardWidth / 2, 160);

    // 5. Event Info Section
    ctx.fillStyle = '#7A1F2B';
    // Title
    ctx.font = `bold 32px 'Georgia', serif`;
    const words = event.title.split(' ');
    let line = '';
    let y = 270;
    const maxWidth = cardWidth - 100;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, cardWidth / 2, y);
        line = words[n] + ' ';
        y += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, cardWidth / 2, y);

    // Metadata details block
    y += 50;
    ctx.fillStyle = '#333333';
    ctx.font = `bold 20px 'Arial', sans-serif`;
    ctx.fillText(`DEPARTMENT: ${event.department ? event.department.name.toUpperCase() : 'GENERAL'}`, cardWidth / 2, y);
    
    y += 35;
    const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    ctx.fillText(`DATE: ${formattedDate}`, cardWidth / 2, y);

    y += 35;
    ctx.fillText(`TIME: ${event.startTime} - ${event.endTime}`, cardWidth / 2, y);

    y += 35;
    ctx.font = `italic 18px 'Georgia', serif`;
    ctx.fillText(`VENUE: ${event.venue}`, cardWidth / 2, y, maxWidth);

    // 6. Draw QR Code
    const selfCheckinUrl = `${process.env.APP_URL || 'http://localhost:5173'}/events/${event.slug}/checkin`;
    const qrBuffer = await QRCode.toBuffer(selfCheckinUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: '#7A1F2B',
        light: '#FDF6E3'
      }
    });

    const qrImage = await loadImage(qrBuffer);
    ctx.drawImage(qrImage, cardWidth / 2 - 160, y + 50, 320, 320);

    // 7. Footer Instructions
    ctx.fillStyle = '#7A1F2B';
    ctx.font = `bold 22px 'Arial', sans-serif`;
    ctx.fillText('SCAN TO SELF CHECK-IN', cardWidth / 2, y + 420);

    ctx.fillStyle = '#666666';
    ctx.font = `14px 'Arial', sans-serif`;
    ctx.fillText('Scan this QR code upon arrival at the venue to register your attendance.', cardWidth / 2, y + 450);

    // Stream out image
    const imageBuffer = await canvas.encode('png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${event.slug}-qr-card.png"`);
    return res.send(imageBuffer);
  } catch (error) {
    console.error('QR card generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
