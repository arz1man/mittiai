import { NextResponse } from "next/server";
import { diagnoseImage } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { imageBase64, mime, lang } = (await req.json()) as {
      imageBase64: string; mime: string; lang?: string;
    };
    if (!imageBase64 || !mime) {
      return NextResponse.json({ error: "imageBase64 and mime required" }, { status: 400 });
    }
    const strip = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const diagnosis = await diagnoseImage(strip, mime, lang);
    return NextResponse.json(diagnosis);
  } catch (e) {
    console.error("[api/diagnose]", e);
    return NextResponse.json({ error: "Diagnosis failed" }, { status: 500 });
  }
}
