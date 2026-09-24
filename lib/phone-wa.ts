export function normalizeIraqWhatsApp(input: string): string {
  let digits = (input || "").replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("964")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `964${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 10) return `964${digits}`;
  return digits;
}

export function toWhatsAppJid(input: string): string {
  const n = normalizeIraqWhatsApp(input);
  if (!n) return "";
  return `${n}@s.whatsapp.net`;
}
