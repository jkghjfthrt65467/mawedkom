import { proxyGateway } from "@/lib/wa-gateway";

export const runtime = "nodejs";

export async function POST() {
  return proxyGateway("/logout", { method: "POST" });
}
