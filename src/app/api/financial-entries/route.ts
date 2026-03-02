import { NextResponse } from "next/server";
import { addFinancialEntries } from "@/lib/server/dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  entries?: Array<{
    income?: number;
    expense?: number;
    isAnomaly?: boolean;
  }>;
  uploadedBy?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const entries = Array.isArray(body.entries) ? body.entries : [];
  const uploadedBy = typeof body.uploadedBy === "string" ? body.uploadedBy : "Admin";

  if (entries.length === 0) {
    return NextResponse.json({ error: "No entries to upload." }, { status: 400 });
  }

  const sanitized = entries.map((entry) => ({
    income: Number(entry.income ?? 0),
    expense: Number(entry.expense ?? 0),
    isAnomaly: Boolean(entry.isAnomaly),
  }));

  const data = await addFinancialEntries(sanitized, uploadedBy);
  return NextResponse.json(data);
}
