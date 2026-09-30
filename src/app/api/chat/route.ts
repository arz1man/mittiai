import { NextResponse } from "next/server";
import { chatReply } from "@/lib/ai/gemini";
import { getPlot, getStats } from "@/lib/data/feeds";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, lang, plotId } = (await req.json()) as {
      messages: { role: "user" | "assistant"; text: string }[];
      lang?: string; plotId?: string;
    };
    const plot = getPlot(plotId ?? "");
    const stats = getStats();
    const context = `Plot: ${plot.name} (${plot.district}, ${plot.state}), crop ${plot.crop}, soil N${plot.soil.n}/P${plot.soil.p}/K${plot.soil.k}, pH ${plot.soil.ph}, OC ${plot.soil.oc}. Network-wide today: ${stats.total} disease reports from ${stats.districts} districts, ${stats.high} high-severity hotspots.`;
    const reply = await chatReply(messages, context, lang);
    return NextResponse.json(reply);
  } catch (e) {
    console.error("[api/chat]", e);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
