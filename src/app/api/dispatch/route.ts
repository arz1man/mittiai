import { NextResponse } from "next/server";
import { getDistrictReports } from "@/lib/data/feeds";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { districts } = (await req.json()) as { districts: string[] };
    const all = getDistrictReports();
    const targets = all.filter((r) => districts.includes(r.id) || (Array.isArray(districts) && districts.length === 0));
    const picked = targets.length ? targets : all.filter((r) => r.severity === "high").slice(0, 3);
    const facts = picked
      .map((r) => `${r.district} (${r.state}): ${r.disease} on ${r.crop}, ${r.reports24h} reports/24h, trend ${r.trend}`)
      .join("; ");

    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const g = new GoogleGenAI({ apiKey: key });
        const res = await Promise.race([
          g.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Draft a concise early-warning bulletin (max 90 words) for district agriculture officers in India. Facts: ${facts}. Include: what to scout for, the single most important containment action this week, and one line to relay to farmers via SMS/IVR in simple language. Plain text only.`,
                  },
                ],
              },
            ],
            config: { temperature: 0.4 },
          }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 25_000)),
        ]);
        return NextResponse.json({ message: res.text?.trim() ?? "", demo: false });
      } catch (e) {
        console.error("[api/dispatch] gemini failed", e);
      }
    }
    return NextResponse.json({
      message: `EARLY WARNING — ${picked
        .map((r) => r.district)
        .join(", ")}: rising ${picked[0]?.disease ?? "disease"} pressure on ${picked[0]?.crop ?? "crop"}. Scout field edges today; remove and bury infected plants; protective spray per ICAR schedule within 48h. Farmer SMS: "Apne khet ke kinarey roz check karein; bimari ke nishaan dikhte hi mitra app par photo bhejein."`,
      demo: true,
    });
  } catch (e) {
    console.error("[api/dispatch]", e);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
