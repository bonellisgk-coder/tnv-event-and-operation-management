import { Router, Response } from 'express';
import { prisma } from '../utils/db';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth';
import { ParticipantStatus, Role } from '@prisma/client';
import { generateCertificateBuffer } from '../services/certificate';
import archiver from 'archiver';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Create uploads directory for certificate templates if not exists
const CERT_TEMPLATES_DIR = path.join(__dirname, '../../assets/templates');
if (!fs.existsSync(CERT_TEMPLATES_DIR)) {
  try {
    fs.mkdirSync(CERT_TEMPLATES_DIR, { recursive: true });
  } catch (e) {
    // Ignore in serverless/read-only environments
  }
}

// 1. Create or Update Certificate Template (Admins)
router.post('/templates', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { eventId, imageBase64, imageName, namePosition, qrPosition } = req.body;

  if (!eventId || !namePosition || !qrPosition) {
    return res.status(400).json({ error: 'Event ID, namePosition, and qrPosition are required' });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Role check
    if (req.user?.role === Role.DEPARTMENT_ADMIN && event.departmentId !== req.user?.departmentId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    let finalImageUrl = '';

    // If a new template image is uploaded as base64
    if (imageBase64) {
      const extension = imageName ? path.extname(imageName) : '.png';
      const filename = `template-${eventId}-${Date.now()}${extension}`;
      const filePath = path.join(CERT_TEMPLATES_DIR, filename);

      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(filePath, buffer);

      finalImageUrl = `/assets/templates/${filename}`;
    } else {
      // Find existing
      const existing = await prisma.certificateTemplate.findUnique({
        where: { eventId }
      });
      if (!existing) {
        return res.status(400).json({ error: 'Image file base64 is required for new template creation' });
      }
      finalImageUrl = existing.imageUrl;
    }

    // Save template configs to database
    const template = await prisma.certificateTemplate.upsert({
      where: { eventId },
      update: {
        imageUrl: finalImageUrl,
        namePosition: JSON.stringify(namePosition),
        qrPosition: JSON.stringify(qrPosition)
      },
      create: {
        eventId,
        imageUrl: finalImageUrl,
        namePosition: JSON.stringify(namePosition),
        qrPosition: JSON.stringify(qrPosition)
      }
    });

    return res.json(template);
  } catch (error) {
    console.error('Save template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Fetch template details for an Event
router.get('/templates/:eventId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { eventId }
    });

    if (!template) {
      return res.status(404).json({ error: 'No certificate template found for this event' });
    }

    return res.json({
      ...template,
      namePosition: JSON.parse(template.namePosition),
      qrPosition: JSON.parse(template.qrPosition)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Bulk Generate Certificates ZIP (Admins only)
router.get('/generate-bulk/:eventId', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user?.role === Role.DEPARTMENT_ADMIN && event.departmentId !== req.user?.departmentId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    // Get the template
    const template = await prisma.certificateTemplate.findUnique({
      where: { eventId }
    });

    if (!template) {
      return res.status(400).json({ error: 'Please set up a certificate template for this event first' });
    }

    // Parse coordinates
    const namePos = JSON.parse(template.namePosition);
    const qrPos = JSON.parse(template.qrPosition);

    // Get all present participants
    const presentParticipants = await prisma.participant.findMany({
      where: {
        eventId,
        status: ParticipantStatus.PRESENT
      }
    });

    if (presentParticipants.length === 0) {
      return res.status(400).json({ error: 'No attendees marked as PRESENT to generate certificates for.' });
    }

    // Set headers for file stream
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Certificates-${event.slug}.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 } // maximum compression
    });

    archive.on('error', (err: Error) => {
      throw err;
    });

    archive.pipe(res);

    // Construct local absolute path to the template image file
    const absoluteImagePath = path.join(__dirname, '../../', template.imageUrl);

    if (!fs.existsSync(absoluteImagePath)) {
      return res.status(404).json({ error: 'Base template image file was not found on server disk.' });
    }

    // Generate certificates and add to archive
    for (const p of presentParticipants) {
      try {
        const qrVerificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify/attendance/${p.id}`;

        const certBuffer = await generateCertificateBuffer({
          templateImageUrl: absoluteImagePath,
          participantName: p.name,
          qrText: qrVerificationUrl,
          namePosition: namePos,
          qrPosition: qrPos
        });

        // Add to zip archive: filename format: karthik_cert_123.png
        const certFilename = `${p.name.replace(/[^a-zA-Z0-9]/g, '_')}-${p.id.substring(0, 5)}.png`;
        archive.append(certBuffer, { name: certFilename });
      } catch (err) {
        console.error(`Error archiving certificate for participant ${p.name}:`, err);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Bulk generate certificates error:', error);
    // Don't call send status or response if headers already sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error during certificate generation' });
    }
  }
});

export default router;
