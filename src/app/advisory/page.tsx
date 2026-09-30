"use client";

import { useEffect, useState } from "react";
import { useTour, speak } from "@/components/TourOverlay";

interface AdvisoryPlan {
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

interface Plot {
  id: string;
  name: string;
  district: string;
  state: string;
  areaAcres: number;
  crop: string;
  soil: { ph: number; oc: number; n: number; p: number; k: number };
  ndvi12w: number[];
}

const FORECAST: Record<string, { label: string; rainMm: number; tempMaxC: number; humidityPct: number }[]> = {
  nashik: Array.from({ length: 14 }, (_, d) => ({
    label: `D+${d + 1}`,
    rainMm: [0, 0, 2, 12, 28, 41, 18, 6, 0, 0, 3, 9, 15, 4][d],
    tempMaxC: [34, 34, 33, 31, 29, 28, 30, 32, 33, 34, 33, 31, 30, 32][d],
    humidityPct: [42, 45, 55, 68, 81, 88, 76, 60, 48, 44, 52, 63, 71, 55][d],
  })),
  guntur: Array.from({ length: 14 }, (_, d) => ({
    label: `D+${d + 1}`,
    rainMm: [5, 8, 14, 22, 9, 4, 0, 0, 2, 11, 19, 26, 12, 5][d],
    tempMaxC: [33, 33, 32, 31, 32, 33, 34, 34, 33, 32, 31, 30, 32, 33][d],
    humidityPct: [61, 66, 74, 80, 70, 58, 50, 47, 53, 64, 73, 79, 66, 58][d],
  })),
  hooghly: Array.from({ length: 14 }, (_, d) => ({
    label: `D+${d + 1}`,
    rainMm: [0, 3, 9, 17, 31, 44, 26, 12, 4, 1, 0, 6, 13, 21][d],
    tempMaxC: [31, 31, 30, 29, 28, 28, 29, 31, 32, 32, 31, 30, 29, 30][d],
    humidityPct: [58, 63, 72, 82, 90, 93, 84, 68, 55, 50, 54, 66, 78, 84][d],
  })),
};

interface AdvisoryResponse extends AdvisoryPlan {}

export default function AdvisoryPage() {
  const { lang } = useTour();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotId, setPlotId] = useState<string>("nashik-grapes");
  const [plan, setPlan] = useState<AdvisoryResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [forecast, setForecast] = useState(FORECAST.nashik);

  useEffect(() => {
    // Seed plots are bundled client-side for instant paint; server holds the same seeds.
    import("@/lib/data/seeds").then((m) => {
      setPlots(m.PLOTS as unknown as Plot[]);
      setForecast((m.FORECAST as typeof FORECAST).nashik);
    });
  }, []);

  useEffect(() => {
    if (!plotId) return;
    setBusy(true);
    setPlan(null);
    fetch("/api/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plotId, lang }),
    })
      .then((r) => r.json())
      .then(setPlan)
      .finally(() => setBusy(false));
  }, [plotId, lang]);

  const plot = plots.find((p) => p.id === plotId);
  const plotForecast = forecast && FORECAST[plotId.split("-")[0]] ? FORECAST[plotId.split("-")[0]] : FORECAST.nashik;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">🌱 Regenerative Crop Advisory</h1>
        <p className="mt-2 max-w-2xl text-soil">
          Real Soil Health Card nutrients + 12-week ISRO Bhuvan NDVI + 14-day IMD-style forecast → a Gemini-generated
          regenerative plan for your exact plot.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {plots.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlotId(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              plotId === p.id ? "bg-leaf text-white shadow" : "border border-soil/20 bg-white/70 text-soil hover:bg-soil/10"
            }`}
          >
            {p.name.split("—")[0].trim()}
          </button>
        ))}
      </div>

      {plot && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* context cards */}
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-soil">Soil Health Card</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Metric label="pH" value={plot.soil.ph} ok={plot.soil.ph >= 6.5 && plot.soil.ph <= 7.5} />
              <Metric label="OC %" value={plot.soil.oc} ok={plot.soil.oc >= 0.5} />
              <Metric label="N kg/ha" value={plot.soil.n} ok={plot.soil.n >= 280} />
              <Metric label="P kg/ha" value={plot.soil.p} ok={plot.soil.p >= 56} />
              <Metric label="K kg/ha" value={plot.soil.k} ok={plot.soil.k >= 280} />
              <Metric label="Acres" value={plot.areaAcres} ok />
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-soil">Satellite NDVI — 12 weeks (ISRO Bhuvan)</p>
              <p className="text-xs font-semibold text-leaf">{ndviTrend(plot.ndvi12w)}</p>
            </div>
            <Sparkline data={plot.ndvi12w} />
            <div className="mt-4 flex gap-1.5 overflow-x-auto">
              {plotForecast.slice(0, 10).map((f) => (
                <div key={f.label} className={`min-w-14 rounded-xl p-2 text-center text-xs ${f.rainMm >= 15 ? "bg-leaf/15" : "bg-sand/70 dark:bg-[#201A13]"}`}>
                  <p className="font-bold">{f.label}</p>
                  <p className="text-base">{f.rainMm >= 15 ? "🌧️" : f.rainMm > 2 ? "🌦️" : "☀️"}</p>
                  <p className="text-soil">{f.rainMm}mm</p>
                  <p className="text-soil">{f.tempMaxC}°C</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* plan */}
      <section data-tour="advisory-plan" className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold">Gemini regenerative plan</h2>
          {plan?.demo && <span className="rounded-full bg-soil/10 px-2.5 py-1 text-xs font-semibold text-soil">demo mode</span>}
        </div>

        {busy && !plan && (
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-terra">
            <span className="spin-slow inline-block">⚙️</span> Reading soil card, NDVI trend &amp; forecast…
          </div>
        )}

        {plan && (
          <div className="fade-in mt-4 space-y-4">
            <p className="rounded-xl bg-sand/60 p-4 text-sm leading-relaxed dark:bg-[#201A13]">{plan.summary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <PlanCard icon="🗓️" title="Sowing window" body={plan.sowingWindow} />
              <PlanCard icon="💧" title="Irrigation (AWD-first)" body={plan.irrigation} />
              <PlanCard icon="🌾" title="Cover crop" body={plan.coverCrop} />
              <PlanCard icon="🧪" title="Soil fix (from your card)" body={plan.soilFix} />
            </div>
            <div>
              <p className="text-sm font-bold">Crop mix</p>
              <ul className="mt-1 space-y-1 text-sm text-soil">
                {plan.cropMix.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold">Season calendar</p>
              <div className="mt-2 space-y-0">
                {plan.calendar.map((c, i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-leaf/40 pb-3 pl-3 last:pb-0">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-leaf" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-leafdeep dark:text-gold">{c.week}</p>
                      <p className="text-sm text-soil">{c.action}</p>
                    </div>
                  </div>
                ))}
                {plan.risks.length > 0 && (
                  <div className="rounded-xl bg-terra/10 p-3 text-sm text-terra">
                    <p className="font-bold">⚠️ Risks &amp; hedges</p>
                    <ul className="mt-1 space-y-1">
                      {plan.risks.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => speak(plan.summary, lang)} className="btn-primary w-full">
              🔊 Listen to plan
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, ok }: { label: string; value: number; ok: boolean }) {
  return (
    <div className={`rounded-xl p-2.5 ${ok ? "bg-leaf/10" : "bg-terra/10"}`}>
      <p className="text-xs font-semibold text-soil">{label}</p>
      <p className={`text-lg font-black ${ok ? "text-leafdeep dark:text-gold" : "text-terra"}`}>{value}</p>
      <p className="text-[10px] font-semibold text-soil">{ok ? "adequate" : "needs work"}</p>
    </div>
  );
}

function PlanCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white/70 p-3 dark:bg-[#2B2118]/70">
      <p className="text-sm font-bold">
        {icon} {title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-soil">{body}</p>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 560;
  const h = 90;
  const min = Math.min(...data) - 0.05;
  const max = Math.max(...data) + 0.05;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full">
      <polyline points={pts} fill="none" stroke="#3E7C4F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((v - min) / (max - min)) * h} r="3" fill="#E8842C" />
      ))}
    </svg>
  );
}

function ndviTrend(d: number[]) {
  const delta = d[d.length - 1] - d[d.length - 5];
  if (delta > 0.03) return `▲ rising (+${delta.toFixed(2)})`;
  if (delta < -0.03) return `▼ stress (−${Math.abs(delta).toFixed(2)})`;
  return "● stable";
}
