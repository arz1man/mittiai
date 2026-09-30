import { NextResponse } from "next/server";
import { getDistrictReports } from "@/lib/data/feeds";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getDistrictReports());
}
