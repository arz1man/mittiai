# 🌾 MittiAI — Regenerative Agricultural Intelligence

> **The agronomist in every farmer's pocket.** Photograph a leaf → instant disease diagnosis, exact ICAR-dose treatment, and a regenerative crop plan in your own language — powered by **Google Gemini** over real Indian open data.

**Hackathon:** Google Cloud "Build with AI: Code for Communities" — *Solving for India*
**Track:** 4 — AgriN & Regenerative Agricultural Intelligence

---

## ✨ What it does

| Feature | Google AI used | Real data used |
|---|---|---|
| 📷 **Leaf disease diagnosis** — photo → disease, confidence, severity, treatment | Gemini multimodal (vision + structured JSON) | ICAR/PlantVillage disease KBs |
| 🌱 **Regenerative advisory** — sowing windows, crop mix, cover crops, AWD irrigation calendar | Gemini + `responseSchema` structured output | Soil Health Card (data.gov.in), ISRO Bhuvan/Sentinel-2 NDVI, IMD-style 14-day forecast |
| 💬 **Sahayak chat** — voice in, voice out, 6 languages | Gemini multilingual + Web Speech STT/TTS | Plot context + live outbreak stats |
| 🗺️ **District intelligence dashboard** — outbreak map, early-warning queue, Gemini-drafted officer bulletins | Gemini text | Simulated live feeds seeded from ICAR surveillance patterns; Agmarknet price ticker |

**Why it matters:** 100M+ Indian smallholders guess; crop loss to disease threatens food security. MittiAI gives an agronomist-grade second opinion in 30 seconds — and every diagnosis feeds a national early-warning network.

## 🚀 Run locally

```bash
npm install
cp .env.example .env.local   # add your free GEMINI_API_KEY from aistudio.google.com
npm run dev                  # http://localhost:3000
```

No API key? The app still runs in **demo mode** with realistic mock diagnoses — the UI never breaks.

## 🏗️ Architecture

```
src/
  app/                 # Next.js 15 App Router pages + API routes
    api/diagnose       # POST — leaf photo → Gemini vision → structured JSON
    api/advisory       # POST — SHC soil + NDVI + IMD forecast → Gemini plan
    api/chat           # POST — grounded multilingual Sahayak chat
    api/dispatch       # POST — Gemini drafts officer bulletins
    api/stats|reports|prices  # live feed endpoints
  components/          # Header, ThemeToggle, LangSelect, TourOverlay (guided tour)
  lib/ai/gemini.ts     # AI service layer: schemas, prompts, demo fallbacks
  lib/data/            # seeds.ts (real open-data), feeds.ts (live simulation seam)
```

- **Modular by mandate:** UI never touches data seeds directly — `feeds.ts` is the seam where real APIs (IMD, Bhuvan, Agmarknet, Earth Engine) plug in without touching components.
- **Never-fail demo:** every Gemini call has a timeout + demo-mode fallback with realistic structured output.

## 🌏 Built for India, scaled for BRICS

- District objects are portable — add a row, add a state/country.
- Open-data schemas map 1:1 to Brazil (INPE), South Africa (SAWS), Russia (Roshydromet).
- Voice-first, low-bandwidth tolerant, 6 languages, no login.

## 📦 Submission package

- **Live demo:** [Vercel URL — see Devfolio submission]
- **Demo video:** [YouTube link — see Devfolio submission]
- **Pitch deck:** [PDF in this repo → /docs]
- [SUBMISSION.md](docs/SUBMISSION.md) — description, pitch, video script

## 🛠️ Stack

Next.js 15 · TypeScript · Tailwind v4 · Gemini API (`@google/genai`) · Vercel

---

*Built with ❤️ for Indian farmers — Team MittiAI (arz1man)*
