import { proxyGateway } from "@/lib/wa-gateway";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  return proxyGateway("/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
