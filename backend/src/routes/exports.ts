import { Router, Response } from 'express';
import { prisma } from '../utils/db';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth';
import { ParticipantStatus, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();

// ==========================================
// EXPORT TO EXCEL
// ==========================================
router.get('/excel/:eventId', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'VOLUNTEER']), async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { department: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Role restriction
    if (req.user?.role === Role.DEPARTMENT_ADMIN && event.departmentId !== req.user?.departmentId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    const participants = await prisma.participant.findMany({
      where: { eventId },
      include: { additionalMembers: true },
      orderBy: { name: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendees');

    // Add Branded Headers
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'TAMIL NADU VOLUNTEER MANAGEMENT PLATFORM';
    titleCell.font = { name: 'Georgia', size: 16, bold: true, color: { argb: 'FFFDF6E3' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7A1F2B' } // Maroon
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    worksheet.mergeCells('A2:G2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `Event: ${event.title}  |  Department: ${event.department ? event.department.name : 'General'}  |  Date: ${new Date(event.date).toLocaleDateString('en-IN')}`;
    subCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF7A1F2B' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD4A017' } // Gold
    };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // Blank row
    worksheet.addRow([]);

    // Table Headers
    const headers = ['S.No', 'Name', 'Email', 'Phone', 'Status', 'Check-in Time', 'Additional Members'];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(4);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7A1F2B' }
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFD4A017' } }
      };
    });

    // Data rows
    participants.forEach((p: any, index: number) => {
      const additionalNames = p.additionalMembers.map((m: { name: string }) => m.name).join(', ') || 'None';
      const checkinTime = p.checkinAt ? new Date(p.checkinAt).toLocaleTimeString('en-IN') : 'N/A';
      
      const rowData = [
        index + 1,
        p.name,
        p.email,
        p.phone,
        p.status,
        checkinTime,
        additionalNames
      ];

      worksheet.addRow(rowData);
      const row = worksheet.getRow(5 + index);
      row.height = 20;

      // zebra striping and borders
      const isEven = index % 2 === 0;
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFEFEAE0' } }
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDFDFD' }
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDF6E3' } // light warm ivory tint
          };
        }
      });

      // Style Status cell specifically
      const statusCell = row.getCell(5);
      if (p.status === ParticipantStatus.PRESENT) {
        statusCell.font = { color: { argb: 'FF2E6B4F' }, bold: true };
      } else if (p.status === ParticipantStatus.ABSENT) {
        statusCell.font = { color: { argb: 'FFB3261E' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FF777777' } };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLen = 0;
      column.eachCell && column.eachCell({ includeEmpty: true }, cell => {
        const val = cell.value ? String(cell.value) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Attendees-${event.slug}.xlsx"`);
    
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// EXPORT TO PDF
// ==========================================
router.get('/pdf/:eventId', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'VOLUNTEER']), async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { department: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Role restriction
    if (req.user?.role === Role.DEPARTMENT_ADMIN && event.departmentId !== req.user?.departmentId) {
      return res.status(403).json({ error: 'Forbidden: Event belongs to another department' });
    }

    const participants = await prisma.participant.findMany({
      where: { eventId },
      orderBy: { name: 'asc' }
    });

    // Create PDF Document
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Attendees-${event.slug}.pdf"`);

    doc.pipe(res);

    // Header Banner
    doc.rect(40, 40, 515, 60).fill('#7A1F2B'); // Maroon
    doc.fillColor('#FDF6E3')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('GOVERNMENT OF TAMIL NADU', 40, 52, { align: 'center', width: 515 });
    
    doc.fontSize(10)
       .fillColor('#D4A017') // Gold
       .text('VOLUNTEER ATTENDANCE REPORT', 40, 75, { align: 'center', width: 515 });

    doc.moveDown(4);

    // Event Info Block
    doc.fillColor('#333333').font('Helvetica-Bold').fontSize(14).text(event.title, 40, 120);
    
    doc.font('Helvetica').fontSize(10).fillColor('#666666');
    doc.text(`Department: ${event.department ? event.department.name : 'General'}`);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString('en-IN')}`);
    doc.text(`Venue: ${event.venue}`);
    doc.text(`Total Registered: ${participants.length}`);

    doc.moveDown(1.5);

    // Table Headers
    const startY = doc.y;
    doc.rect(40, startY, 515, 20).fill('#7A1F2B');
    doc.fillColor('#FDF6E3').font('Helvetica-Bold').fontSize(9);
    doc.text('S.No', 45, startY + 6, { width: 30 });
    doc.text('Name', 80, startY + 6, { width: 150 });
    doc.text('Email', 230, startY + 6, { width: 150 });
    doc.text('Phone', 380, startY + 6, { width: 90 });
    doc.text('Status', 480, startY + 6, { width: 70 });

    let currentY = startY + 20;

    // Draw Data rows
    participants.forEach((p: any, index: number) => {
      // Manage pagination if overflow page size
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        
        // Redraw table headers on new page
        doc.rect(40, currentY, 515, 20).fill('#7A1F2B');
        doc.fillColor('#FDF6E3').font('Helvetica-Bold').fontSize(9);
        doc.text('S.No', 45, currentY + 6, { width: 30 });
        doc.text('Name', 80, currentY + 6, { width: 150 });
        doc.text('Email', 230, currentY + 6, { width: 150 });
        doc.text('Phone', 380, currentY + 6, { width: 90 });
        doc.text('Status', 480, currentY + 6, { width: 70 });
        currentY += 20;
      }

      // Alternate background tint
      if (index % 2 === 0) {
        doc.rect(40, currentY, 515, 20).fill('#FDF6E3');
      } else {
        doc.rect(40, currentY, 515, 20).fill('#FFFFFF');
      }

      doc.fillColor('#333333').font('Helvetica').fontSize(9);
      doc.text(String(index + 1), 45, currentY + 6, { width: 30 });
      doc.text(p.name, 80, currentY + 6, { width: 150 });
      doc.text(p.email, 230, currentY + 6, { width: 150 });
      doc.text(p.phone, 380, currentY + 6, { width: 90 });

      // Color coding status
      if (p.status === ParticipantStatus.PRESENT) {
        doc.fillColor('#2E6B4F').font('Helvetica-Bold');
      } else if (p.status === ParticipantStatus.ABSENT) {
        doc.fillColor('#B3261E').font('Helvetica-Bold');
      } else {
        doc.fillColor('#666666');
      }
      doc.text(p.status, 480, currentY + 6, { width: 70 });

      currentY += 20;
    });

    // Add Generation stamp at bottom page
    doc.fillColor('#999999').font('Helvetica-Oblique').fontSize(8);
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.text(
        `Report generated on: ${new Date().toLocaleDateString('en-IN')}  |  Page ${i + 1} of ${totalPages}`,
        40,
        780,
        { align: 'center', width: 515 }
      );
    }

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
