import { NextResponse } from "next/server";
import { getDashboardData, runSecurityScan } from "@/lib/server/dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  guardPhone?: string;
  guardEmail?: string;
}

function countSecurityAnomalies(data: Awaited<ReturnType<typeof getDashboardData>>) {
  const now = Date.now();
  return data.visitorLogs
    .filter((visitor) => !visitor.exitTimeIso)
    .filter((visitor) => {
      const type = visitor.visitorType.toLowerCase();
      const thresholdHours =
        type === "delivery" ? 2 : type === "maid" ? 10 : type === "staff" ? 12 : type === "guest" ? 72 : 24;
      const insideHours = (now - new Date(visitor.entryTimeIso).getTime()) / (1000 * 60 * 60);
      return insideHours > thresholdHours;
    }).length;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const guardPhone = body.guardPhone?.trim() || "+91-9000000001";
  const guardEmail = body.guardEmail?.trim() || "security.head@smartsociety.local";

  const updated = await runSecurityScan(guardPhone, guardEmail);
  const anomaliesFound = countSecurityAnomalies(updated);

  return NextResponse.json({
    status: "Security Scan Complete",
    anomaliesFound,
    summary:
      anomaliesFound > 0
        ? `Anomaly alerts sent to ${guardPhone} and ${guardEmail}.`
        : "No anomaly detected. Logged as clean scan.",
  });
}
