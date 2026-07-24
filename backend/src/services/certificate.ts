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
  // Dynamically load @napi-rs/canvas — may not be available in serverless environments
  let createCanvas: any, loadImage: any;
  try {
    const canvas = await import('@napi-rs/canvas');
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
  } catch {
    throw new Error('Certificate generation is not available in this environment (native canvas module missing).');
  }

  // 1. Load the background template image
  const image = await loadImage(templateImageUrl);
  const canvasEl = createCanvas(image.width, image.height);
  const ctx = canvasEl.getContext('2d');

  // 2. Draw template image onto canvas
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // 3. Draw participant name
  const fontSize = namePosition.fontSize || Math.round(image.height * 0.05);
  const textColor = namePosition.color || '#7A1F2B'; // Default Deep Maroon

  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(participantName, namePosition.x, namePosition.y);

  // 4. Generate QR code as Buffer
  const qrSize = qrPosition.size || Math.round(image.width * 0.15);
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
    qrPosition.x - qrSize / 2,
    qrPosition.y - qrSize / 2,
    qrSize,
    qrSize
  );

  // 6. Return PNG buffer
  return canvasEl.encode('png');
}
