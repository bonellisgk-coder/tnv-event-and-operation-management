import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as QRCode from 'qrcode';

interface FieldPosition {
  x: number;
  y: number;
  fontSize?: number;
  size?: number;
  color?: string;
}

interface CertificateData {
  templateImageUrl: string; // Absolute path or base64 or url
  participantName: string;
  qrText: string;
  namePosition: FieldPosition;
  qrPosition: FieldPosition;
}

export async function generateCertificateBuffer({
  templateImageUrl,
  participantName,
  qrText,
  namePosition,
  qrPosition,
}: CertificateData): Promise<Buffer> {
  try {
    // 1. Load the background template image
    const image = await loadImage(templateImageUrl);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // 2. Draw template image onto canvas
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // 3. Draw participant name
    const fontSize = namePosition.fontSize || Math.round(image.height * 0.05); // Default size proportional to height
    const textColor = namePosition.color || '#7A1F2B'; // Default Deep Maroon

    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(participantName, namePosition.x, namePosition.y);

    // 4. Generate QR code as Buffer
    const qrSize = qrPosition.size || Math.round(image.width * 0.15); // Default size
    const qrBuffer = await QRCode.toBuffer(qrText, {
      margin: 1,
      width: qrSize,
      color: {
        dark: '#7A1F2B',
        light: '#FDF6E3',
      },
    });

    // 5. Load and draw QR code onto canvas
    const qrImage = await loadImage(qrBuffer);
    ctx.drawImage(
      qrImage,
      qrPosition.x - qrSize / 2, // Centered on x
      qrPosition.y - qrSize / 2, // Centered on y
      qrSize,
      qrSize
    );

    // 6. Return PNG buffer (@napi-rs/canvas uses encode instead of toBuffer)
    return canvas.encode('png');
  } catch (error) {
    console.error('Error generating certificate canvas:', error);
    throw error;
  }
}
