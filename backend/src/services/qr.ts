import * as QRCode from 'qrcode';

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 2,
      color: {
        dark: '#7A1F2B',  // Deep Maroon
        light: '#FDF6E3'  // Warm Ivory
      },
      width: 400
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}
