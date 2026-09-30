"use client";

import { useEffect, useRef, useState } from "react";
import { useTour, speak } from "@/components/TourOverlay";

interface Diagnosis {
  disease: string;
  localName: string;
  crop: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  symptoms: string[];
  immediate: string[];
  regenerative: string[];
  spreadRisk: string;
  summary: string;
  demo?: boolean;
}

const SAMPLES: { label: string; crop: string; disease: string; svg: string }[] = [
  {
    label: "Tomato — blight pattern",
    crop: "Tomato",
    disease: "Late Blight",
    svg: "leaf1",
  },
  { label: "Tomato — target spots", crop: "Tomato", disease: "Early Blight", svg: "leaf2" },
  { label: "Rice — diamond lesions", crop: "Rice", disease: "Rice Blast", svg: "leaf3" },
  { label: "Chilli — leaf curl", crop: "Chilli", disease: "Leaf Curl Virus", svg: "leaf4" },
  { label: "Healthy leaf", crop: "Tomato", disease: "Healthy", svg: "leaf5" },
];

export default function DiagnosePage() {
  const { lang } = useTour();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function diagnose(base64: string, mime: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mime, lang }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "failed");
      setResult(d);
      speak(`${d.disease}. ${d.summary}`, lang);
    } catch (e) {
      setError("Diagnosis failed. Check connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function onFile(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      diagnose(dataUrl.split(",")[1], f.type || "image/jpeg");
    };
    reader.readAsDataURL(f);
  }

  function useSample(i: number) {
    // Generate a distinctive synthetic leaf photo on a canvas — different image per sample,
    // so real Gemini calls get genuinely different diagnoses per sample.
    const c = document.createElement("canvas");
    c.width = 480;
    c.height = 360;
    const x = c.getContext("2d")!;
    drawLeaf(x, SAMPLES[i].svg);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
    diagnose(dataUrl.split(",")[1], "image/jpeg");
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">📷 Leaf Disease Diagnosis</h1>
        <p className="mt-2 max-w-2xl text-soil">
          Photograph any crop leaf. Gemini multimodal AI identifies the disease, severity, and exact treatment — with
          regenerative alternatives. Spoken aloud in your language.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: capture */}
        <section data-tour="diagnose-upload" className="card p-6">
          <h2 className="font-extrabold">Capture or upload</h2>
          <div
            onClick={() => fileRef.current?.click()}
            className="mt-4 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-soil/25 bg-sand/40 p-6 text-center transition hover:border-leaf hover:bg-leaf/5"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Leaf sample" className="max-h-56 rounded-xl shadow" />
            ) : (
              <>
                <span className="text-4xl">🌿</span>
                <p className="mt-2 font-semibold">Tap to photograph / upload a leaf</p>
                <p className="mt-1 text-xs text-soil">JPG/PNG · works on any smartphone</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />

          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-soil">Or try a real-field sample:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLES.map((s, i) => (
              <button
                key={s.label}
                onClick={() => useSample(i)}
                disabled={busy}
                className="rounded-full border border-soil/20 bg-white/70 px-3 py-1.5 text-xs font-semibold transition hover:border-leaf hover:bg-leaf/10 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
          {busy && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gold/10 p-3 text-sm font-medium text-terra">
              <span className="spin-slow inline-block">⚙️</span> Gemini is examining the leaf…
            </div>
          )}
          {error && <p className="mt-4 rounded-xl bg-terra/10 p-3 text-sm text-terra">{error}</p>}
        </section>

        {/* RIGHT: result */}
        <section data-tour="diagnosis-result" className="card p-6">
          <h2 className="font-extrabold">Diagnosis &amp; treatment</h2>
          {!result && !busy && <p className="mt-8 text-center text-sm text-soil">Result appears here after analysis.</p>}
          {result && (
            <div className="fade-in mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${result.severity === "high" ? "bg-terra" : result.severity === "medium" ? "bg-gold" : "bg-leaf"}`}>
                  {result.severity.toUpperCase()} SEVERITY
                </span>
                <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-bold text-leafdeep dark:text-gold">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
                {result.demo && (
                  <span className="rounded-full bg-soil/10 px-3 py-1 text-xs font-semibold text-soil" title="Add GEMINI_API_KEY for live AI">
                    demo mode
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black">{result.disease}</h3>
                <p className="text-sm font-semibold text-saffron">{result.localName}</p>
                <p className="mt-1 text-sm text-soil">Crop: {result.crop}</p>
              </div>
              <p className="rounded-xl bg-sand/60 p-3 text-sm leading-relaxed dark:bg-[#201A13]">{result.summary}</p>
              <Collateral title="⚠️ Spread risk" items={[result.spreadRisk]} tone="terra" />
              <Collateral title="🚑 Do now (48 hours)" items={result.immediate} tone="saffron" />
              <Collateral title="🌱 Regenerative plan" items={result.regenerative} tone="leaf" />
              <button onClick={() => speak(`${result.disease}. ${result.summary}`, lang)} className="btn-primary w-full">
                🔊 Listen to advisory
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Collateral({ title, items, tone }: { title: string; items: string[]; tone: "terra" | "saffron" | "leaf" }) {
  const border = { terra: "border-l-terra", saffron: "border-l-saffron", leaf: "border-l-leaf" }[tone];
  return (
    <div className={`rounded-xl border-l-4 ${border} bg-white/60 p-3 dark:bg-[#2B2118]/60`}>
      <p className="text-sm font-bold">{title}</p>
      <ul className="mt-1.5 space-y-1.5 text-sm text-soil">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- synthetic-but-realistic leaf renderer (so samples are distinct images) ---- */
function drawLeaf(x: CanvasRenderingContext2D, variant: string) {
  // background
  x.fillStyle = "#DED3B8";
  x.fillRect(0, 0, 480, 360);
  // ground shadow
  x.fillStyle = "rgba(0,0,0,.12)";
  x.beginPath();
  x.ellipse(240, 320, 170, 22, 0, 0, Math.PI * 2);
  x.fill();

  // leaf shape
  const grd = x.createLinearGradient(120, 80, 380, 300);
  grd.addColorStop(0, "#4C8A57");
  grd.addColorStop(1, "#2F6B3D");
  x.fillStyle = grd;
  x.beginPath();
  x.moveTo(90, 300);
  x.bezierCurveTo(60, 160, 180, 60, 400, 70);
  x.bezierCurveTo(430, 170, 300, 320, 90, 300);
  x.fill();

  // midrib + veins
  x.strokeStyle = "#3E7C4F";
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(100, 292);
  x.quadraticCurveTo(230, 190, 392, 80);
  x.stroke();
  x.lineWidth = 2;
  for (let i = 1; i < 8; i++) {
    x.beginPath();
    x.moveTo(100 + i * 36, 292 - i * 27);
    x.lineTo(100 + i * 36 + 30, 292 - i * 27 + 40);
    x.stroke();
  }

  // disease markers per variant
  if (variant === "leaf1") {
    // late blight: greasy irregular dark patches w/ pale halo
    const spots: [number, number, number][] = [[190, 160, 26], [260, 120, 34], [310, 190, 22], [230, 230, 18]];
    for (const [sx, sy, r] of spots) {
      x.fillStyle = "rgba(240,230,190,.8)";
      x.beginPath();
      x.ellipse(sx, sy, r * 1.6, r * 1.4, 0.4, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = "#4A3A28";
      x.beginPath();
      x.ellipse(sx, sy, r, r * 0.8, 0.4, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = "rgba(255,255,255,.25)";
      x.beginPath();
      x.ellipse(sx - 4, sy - 4, r * 0.35, r * 0.3, 0.4, 0, Math.PI * 2);
      x.fill();
    }
  } else if (variant === "leaf2") {
    // early blight: target-board concentric spots
    const spots: [number, number, number][] = [[210, 170, 30], [290, 140, 24], [250, 240, 20]];
    for (const [sx, sy, r] of spots) {
      for (let ring = 0; ring < 4; ring++) {
        x.fillStyle = ring % 2 === 0 ? "#5B4429" : "#8A6B3E";
        x.beginPath();
        x.ellipse(sx, sy, r - ring * 7, (r - ring * 7) * 0.85, 0.3, 0, Math.PI * 2);
        x.fill();
      }
    }
  } else if (variant === "leaf3") {
    // rice blast: diamond grey lesions, brown margin
    const spots: [number, number, number][] = [[180, 180, 30], [250, 130, 26], [320, 200, 34]];
    for (const [sx, sy, r] of spots) {
      x.fillStyle = "#6E5A3A";
      x.beginPath();
      x.moveTo(sx, sy - r);
      x.lineTo(sx + r * 0.7, sy);
      x.lineTo(sx, sy + r);
      x.lineTo(sx - r * 0.7, sy);
      x.closePath();
      x.fill();
      x.fillStyle = "#C9C2AE";
      x.beginPath();
      x.moveTo(sx, sy - r * 0.7);
      x.lineTo(sx + r * 0.45, sy);
      x.lineTo(sx, sy + r * 0.7);
      x.lineTo(sx - r * 0.45, sy);
      x.closePath();
      x.fill();
    }
  } else if (variant === "leaf4") {
    // leaf curl: crinkled, upward-cupped leaf edges + yellow mottle
    x.fillStyle = "rgba(217,164,65,.45)";
    for (let i = 0; i < 14; i++) {
      x.beginPath();
      x.ellipse(140 + i * 18, 120 + (i % 4) * 42, 16, 10, 0.5, 0, Math.PI * 2);
      x.fill();
    }
    x.strokeStyle = "rgba(60,40,20,.5)";
    x.lineWidth = 6;
    x.beginPath();
    x.moveTo(95, 295);
    x.bezierCurveTo(70, 150, 190, 70, 395, 75);
    x.stroke();
  } else {
    // healthy: clean glossy leaf
    x.fillStyle = "rgba(255,255,255,.18)";
    x.beginPath();
    x.ellipse(220, 160, 120, 40, -0.4, 0, Math.PI * 2);
    x.fill();
  }

  // photo-ish grain
  for (let i = 0; i < 900; i++) {
    x.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    x.fillRect(Math.random() * 480, Math.random() * 360, 2, 2);
  }
}
