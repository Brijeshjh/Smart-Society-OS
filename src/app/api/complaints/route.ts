import { NextResponse } from "next/server";
import { addComplaint, getDashboardData } from "@/lib/server/dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  residentName?: string;
  unitNumber?: string;
  category?: string;
  description?: string;
  createdBy?: string;
}

export async function GET() {
  const data = await getDashboardData();
  return NextResponse.json({ complaints: data.complaints, revision: data.revision });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  if (!body.residentName?.trim() || !body.unitNumber?.trim() || !body.description?.trim()) {
    return NextResponse.json(
      { error: "residentName, unitNumber and description are required." },
      { status: 400 }
    );
  }

  const data = await addComplaint({
    residentName: body.residentName,
    unitNumber: body.unitNumber,
    category: body.category ?? "Other",
    description: body.description,
    createdBy: body.createdBy ?? "Resident",
  });

  return NextResponse.json(data);
}
