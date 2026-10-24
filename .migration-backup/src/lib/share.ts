import QRCode from "qrcode";

export function buildWaMeUrl(phone: string | null, text: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${withCountryCode}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export async function buildQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 400 });
}

export function fillReminderText(template: string, payLink: string): string {
  return template.replace("{PAY_LINK}", payLink);
}
