import { NextResponse } from "next/server";
import { updateComplaintStatus } from "@/lib/server/dashboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  status?: "pending" | "resolved";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as Body;

  if (!id) {
    return NextResponse.json({ error: "Complaint id is required." }, { status: 400 });
  }

  if (body.status !== "pending" && body.status !== "resolved") {
    return NextResponse.json({ error: "Valid status is required." }, { status: 400 });
  }

  const data = await updateComplaintStatus(id, body.status);
  return NextResponse.json(data);
}
