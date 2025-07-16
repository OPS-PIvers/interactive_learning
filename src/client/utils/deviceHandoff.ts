import QRCode from 'qrcode';

export const generateDeviceHandoffUrl = (moduleId: string, position: number): string => {
  const url = new URL(window.location.href);
  url.searchParams.set('moduleId', moduleId);
  url.searchParams.set('position', position.toString());
  return url.toString();
};

export const generateQrCodeDataUrl = async (url: string): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(url);
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return null;
  }
};
