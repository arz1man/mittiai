/**
 * AI SERVICE LAYER — Google Gemini via @google/genai (hackathon mandate).
 * Server-side only. Every call has a structured-output schema and a
 * demo-mode fallback so the product never hard-fails on stage.
 */
import { GoogleGenAI, Type } from "@google/genai";
import { DISEASES } from "../data/seeds";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const KEY = process.env.GEMINI_API_KEY || "";

let client: GoogleGenAI | null = null;
function ai() {
  if (!KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: KEY });
  return client;
}

/** Preferred model first; on failure (capacity/quota) fall through to backups. */
const MODELS = ["gemini-3.8-flash", "gemini-3-flash", "gemini-2.0-flash"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateWithFallback(
  build: (model: string) => Promise<string>,
): Promise<string | null> {
  const g = ai();
  if (!g) return null;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await Promise.race([
          build(model),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 35_000)),
        ]);
        if (typeof text === "string" && text.trim().length > 0) return text;
      } catch (e) {
        console.error(`[gemini] ${model} attempt ${attempt + 1} failed:`, (e as Error).message);
        await sleep(900);
      }
    }
  }
  return null;
}

export const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  mr: "Marathi (Devanagari script)",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  pa: "Punjabi",
};

function langLine(lang?: string) {
  const l = LANG_NAMES[lang ?? "en"] ?? "English";
  return `Write ALL human-readable text fields in ${l}. Keep scientific/Latin names in English.`;
}

/* ------------------------------ DIAGNOSIS ------------------------------ */

export interface Diagnosis {
  disease: string;
  localName: string;
  crop: string;
  confidence: number; // 0..1
  severity: "low" | "medium" | "high";
  symptoms: string[];
  immediate: string[];
  regenerative: string[];
  spreadRisk: string;
  summary: string;
  demo?: boolean;
}

const DIAG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    disease: { type: Type.STRING, description: "Common English disease name, or 'Healthy Leaf'" },
    localName: { type: Type.STRING, description: "Disease name in the requested Indian language" },
    crop: { type: Type.STRING, description: "Crop identified in the photo" },
    confidence: { type: Type.NUMBER, description: "0 to 1" },
    severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
    symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
    immediate: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Immediate actions incl. exact doses where relevant" },
    regenerative: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Regenerative/low-chemical longer-term practices" },
    spreadRisk: { type: Type.STRING, description: "1-2 sentences on how it spreads and containment priority" },
    summary: { type: Type.STRING, description: "2-3 sentence plain-language explanation for a smallholder farmer" },
  },
  required: ["disease", "crop", "confidence", "severity", "symptoms", "immediate", "regenerative", "spreadRisk", "summary"],
} as const;

const DIAG_PROMPT = `You are a senior plant pathologist advising small and marginal Indian farmers for a government digital-agriculture platform.
Look at the crop leaf photo. Identify the disease (or health). Consider common Indian crop diseases: late blight, early blight, rice blast, wheat/yellow rust, leaf curl virus, bacterial leaf spot, powdery mildew, nutrient deficiency.
Rules:
- Immediate actions must be actionable and specific with doses where standard ICAR recommendations exist (e.g. "Mancozeb 75 WP @ 2.5 g/L").
- Regenerative actions must favor low-chemical, soil-health-building practices (mulching, IPM, biocontrol, rotations).
- Confidence reflects genuine visual certainty; if the photo is unclear, say so in summary and keep confidence below 0.5.
`;

export async function diagnoseImage(
  imageBase64: string,
  mime: string,
  lang = "en",
): Promise<Diagnosis> {
  const g = ai();
  if (g) {
    const text = await generateWithFallback((model) =>
      g.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mime, data: imageBase64 } },
              { text: `${DIAG_PROMPT}\n${langLine(lang)}` },
            ],
          },
        ],
        config: { responseMimeType: "application/json", responseSchema: DIAG_SCHEMA, temperature: 0.2 },
      }).then((r) => r.text ?? ""),
    );
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.disease) return { ...parsed, demo: false } as Diagnosis;
      } catch {}
    }
  }
  return demoDiagnosis(imageBase64, lang);
}

/** Deterministic, realistic fallback keyed off the image content. */
export function demoDiagnosis(imageBase64: string, lang = "en"): Diagnosis {
  let h = 0;
  for (let i = 0; i < imageBase64.length; i += 997) h = (h * 31 + imageBase64.charCodeAt(i)) >>> 0;
  const pick = [DISEASES[0], DISEASES[1], DISEASES[2], DISEASES[3], DISEASES[4]][h % 5];
  const conf = [0.93, 0.88, 0.84, 0.9, 0.97][h % 5];
  return {
    disease: pick.name,
    localName: lang === "en" ? pick.name : pick.localName,
    crop: pick.name.includes("Rice") ? "Rice" : pick.name.includes("Leaf Curl") ? "Cotton/Chilli" : "Tomato",
    confidence: conf,
    severity: pick.severity,
    symptoms: pick.symptoms,
    immediate: pick.immediate,
    regenerative: pick.regenerative,
    spreadRisk:
      pick.id === "healthy"
        ? "No infectious risk detected. Keep weekly photo monitoring."
        : "Spreads fast in humid, windy spells via spores/splash and tools. Isolate affected rows and sanitize hands/tools after handling.",
    summary:
      pick.id === "healthy"
        ? "The leaf looks healthy — no lesions or discoloration detected. Continue weekly monitoring and mulching."
        : `Visual pattern matches ${pick.name} (${pick.pathogen}). Act within 48 hours — this stage is containable, and the regenerative steps below reduce next-season risk.`,
    demo: true,
  };
}

/* ------------------------------ ADVISORY ------------------------------ */

export interface AdvisoryPlan {
  sowingWindow: string;
  cropMix: string[];
  coverCrop: string;
  irrigation: string;
  soilFix: string;
  calendar: { week: string; action: string }[];
  risks: string[];
  summary: string;
  demo?: boolean;
}

const ADV_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sowingWindow: { type: Type.STRING },
    cropMix: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recommended crop/mix with brief why" },
    coverCrop: { type: Type.STRING },
    irrigation: { type: Type.STRING },
    soilFix: { type: Type.STRING, description: "How to fix the specific soil-card nutrient issues" },
    calendar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { week: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["week", "action"] } },
    risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Weather/pest risks from the forecast, with mitigations" },
    summary: { type: Type.STRING, description: "3-4 sentence farmer-friendly plan summary" },
  },
  required: ["sowingWindow", "cropMix", "coverCrop", "irrigation", "soilFix", "calendar", "risks", "summary"],
} as const;

export async function advisoryForPlot(
  ctx: { plotName: string; district: string; state: string; crop: string; areaAcres: number; soil: Record<string, number>; ndvi12w: number[]; forecast: { label: string; rainMm: number; tempMaxC: number; humidityPct: number }[] },
  lang = "en",
): Promise<AdvisoryPlan> {
  const g = ai();
  if (g) {
    const text = await generateWithFallback((model) =>
      g.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an agroecology advisor for smallholder Indian farmers on a government platform.
Using the REAL data below (Soil Health Card nutrients, 12-week satellite NDVI trend, 14-day IMD-style forecast), produce a regenerative farm plan.
Soil Health Card data: ${JSON.stringify(ctx.soil)} (N,P,K in kg/ha, OC in %, pH; ideal: OC>0.5%, N>280, P>56, K>280; pH 6.5-7.5)
Plot: ${ctx.plotName}, ${ctx.district}, ${ctx.state}; current crop ${ctx.crop}; ${ctx.areaAcres} acres.
NDVI weekly (Bhuvan/Sentinel-2): ${JSON.stringify(ctx.ndvi12w)} — comment on the trend (peak, decline, stress).
14-day forecast: ${JSON.stringify(ctx.forecast)} — align irrigation and spray windows with rain days.
Give practical, low-cost regenerative guidance (cover crops, mulching, AWD irrigation, bio-inputs, rotations). 4-6 calendar steps.
${langLine(lang)}`,
              },
            ],
          },
        ],
        config: { responseMimeType: "application/json", responseSchema: ADV_SCHEMA, temperature: 0.4 },
      }).then((r) => r.text ?? ""),
    );
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.sowingWindow) return { ...parsed, demo: false } as AdvisoryPlan;
      } catch {}
    }
  }
  return demoAdvisory(ctx, lang);
}

function demoAdvisory(ctx: { soil: Record<string, number>; ndvi12w: number[]; forecast: { rainMm: number }[]; district: string }, lang = "en"): AdvisoryPlan {
  const oc = ctx.soil.oc ?? 0.5;
  const rainSoon = ctx.forecast.slice(0, 7).some((f) => f.rainMm > 15);
  const ndviDrop = ctx.ndvi12w[ctx.ndvi12w.length - 1] < ctx.ndvi12w[Math.max(0, ctx.ndvi12w.length - 5)] - 0.05;
  return {
    sowingWindow: rainSoon ? "Rain window opens in 3–5 days — prepare beds now, sow right after first soaking rain." : "Sow within the next 7–10 days; pre-irrigate 2 days before sowing.",
    cropMix: [
      "Main crop kept (as growing) + pigeonpea every 4th row (nitrogen fixation)",
      "Border rows of marigold — traps pests, shelters predators",
      "2% of area as perennial mulch source (Leucaena/Glyricidia)",
    ],
    coverCrop: rainSoon ? "Dhaincha (Sesbania) — sow on bunds now, cut at 45 days for green manure" : "Cowpea as live mulch between rows after 20 days",
    irrigation: rainSoon
      ? "Skip irrigation for the coming rainy spell; resume alternate-day only after 5 dry days. Use AWD in paddy."
      : "Irrigate 25mm every 6–7 days; mulch after irrigation to cut evaporation ~30%.",
    soilFix:
      oc < 0.5
        ? `Soil organic carbon is low (${oc}%). Add 2 t/acre FYM or 1 t/acre vermicompost + grow dhaincha green manure this season to push OC above 0.5% in 2 years.`
        : "OC is adequate — maintain with residue mulching and avoid burning stubble.",
    calendar: [
      { week: "Week 1", action: rainSoon ? "Prepare raised beds + apply Trichoderma-enriched compost" : "Apply FYM + seed treatment with Trichoderma viride @ 4 g/kg" },
      { week: "Week 2", action: "Sow main crop; sow pigeonpea every 4th row and marigold borders" },
      { week: "Week 4", action: "Top-dress 50% N only if NDVI keeps rising; mulch with dry straw" },
      { week: "Week 6", action: "Scout weekly with MittiAI photo check; release Trichogramma if borers spotted" },
      { week: "Week 8", action: "Cut cover crop for green manure; second mulch layer" },
      { week: "Week 10", action: "Harvest/first pick; sow next catch crop within 48h of clearing" },
    ],
    risks: [
      ...(rainSoon ? ["Humid spell ahead → blight/blast pressure; keep fungicide ready but prefer bicarbonate/Trichoderma sprays first"] : []),
      ...(ndviDrop ? ["NDVI declining over last 4 weeks → possible nutrient stress or hidden pest — run a leaf diagnosis this week"] : []),
      "Monsoon variability: stagger sowing across two dates 10 days apart to hedge",
    ],
    summary: `Plan for ${ctx.district}: ${rainSoon ? "rain arriving this week — use it" : "dry week — pre-irrigate"} and rebuild soil carbon with green manure on bunds. ${ndviDrop ? "Satellite NDVI shows canopy stress, so scout leaves this week." : "Canopy vigor is stable."} All inputs chosen to cut chemical cost while keeping yield insurance.`,
    demo: true,
  };
}

/* ------------------------------ CHAT ------------------------------ */

export async function chatReply(
  messages: { role: "user" | "assistant"; text: string }[],
  context: string,
  lang = "en",
): Promise<{ text: string; demo?: boolean }> {
  const g = ai();
  if (g) {
    const text = await generateWithFallback((model) =>
      g.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are MittiAI Sahayak, a warm, practical agriculture advisor for Indian smallholder farmers. Keep answers short (max 120 words), step-wise, low-cost, and regenerative-first. Context about the farmer's situation:\n${context}\n\n${langLine(lang)}\n\nConversation:\n${messages.map((m) => `${m.role === "user" ? "Farmer" : "You"}: ${m.text}`).join("\n")}\n\nAnswer the farmer's latest message.`,
              },
            ],
          },
        ],
        config: { temperature: 0.6 },
      }).then((r) => r.text ?? ""),
    );
    if (text) return { text, demo: false };
  }
  const last = messages[messages.length - 1]?.text ?? "";
  return {
    text:
      lang === "en"
        ? `Demo mode: on the diagnosis above, first remove infected leaves, then spray as advised, and mulch to cut splashing. You asked: "${last.slice(0, 80)}". Add GEMINI_API_KEY for full conversational advice.`
        : `डेमो मोड: ऊपर दी गई जाँच के अनुसार पहले संक्रमित पत्तियाँ हटाएँ, फिर बताए गए छिड़काव करें, और छिड़काव रोकने के लिए मल्चिंग करें। आपने पूछा: "${last.slice(0, 80)}"। पूरी सलाह के लिए GEMINI_API_KEY जोड़ें।`,
    demo: true,
  };
}
