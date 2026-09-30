import { NextResponse } from "next/server";
import { getStats } from "@/lib/data/feeds";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getStats());
}
