import { NextResponse } from "next/server";
import { advisoryForPlot } from "@/lib/ai/gemini";
import { getPlot, getForecast } from "@/lib/data/feeds";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { plotId, lang } = (await req.json()) as { plotId?: string; lang?: string };
    const plot = getPlot(plotId ?? "");
    const forecast = getForecast(plot.id.split("-")[0]).slice(0, 10).map((f) => ({
      label: f.label, rainMm: f.rainMm, tempMaxC: f.tempMaxC, humidityPct: f.humidityPct,
    }));
    const plan = await advisoryForPlot({
      plotName: plot.name, district: plot.district, state: plot.state,
      crop: plot.crop, areaAcres: plot.areaAcres, soil: plot.soil as unknown as Record<string, number>,
      ndvi12w: plot.ndvi12w, forecast,
    }, lang);
    return NextResponse.json(plan);
  } catch (e) {
    console.error("[api/advisory]", e);
    return NextResponse.json({ error: "Advisory failed" }, { status: 500 });
  }
}
