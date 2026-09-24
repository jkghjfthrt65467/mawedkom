import { proxyGateway } from "@/lib/wa-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return proxyGateway("/qr");
}
