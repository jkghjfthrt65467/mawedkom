import { readDoc, writeDoc } from "./persist";

const KEY = "otp";
const TTL_MS = 10 * 60 * 1000;

type OtpRow = { phone: string; code: string; exp: number };

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function randomOtp(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export async function issueOtp(phone: string): Promise<{ code: string; exp: number }> {
  const code = randomOtp();
  const exp = Date.now() + TTL_MS;
  const all = (await readDoc<OtpRow[]>(KEY, [])).filter((r) => r.exp > Date.now() && digits(r.phone) !== digits(phone));
  all.push({ phone: digits(phone), code, exp });
  await writeDoc(KEY, all);
  return { code, exp };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const all = await readDoc<OtpRow[]>(KEY, []);
  const now = Date.now();
  const hit = all.find((r) => digits(r.phone) === digits(phone) && r.code === code.trim() && r.exp > now);
  if (!hit) return false;
  await writeDoc(
    KEY,
    all.filter((r) => r !== hit && r.exp > now),
  );
  return true;
}
