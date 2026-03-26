import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/report-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const report = getReport(params.id);

  if (!report) {
    return NextResponse.json(
      { error: "Report not found. It may still be processing or has expired." },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}
