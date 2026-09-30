import { NextResponse } from "next/server";
import { getMandiPrices } from "@/lib/data/feeds";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getMandiPrices());
}
