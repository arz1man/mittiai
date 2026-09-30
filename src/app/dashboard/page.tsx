"use client";

import { useEffect, useMemo, useState } from "react";

interface Report {
  id: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  crop: string;
  disease: string;
  severity: "low" | "medium" | "high";
  reports24h: number;
  trend: "rising" | "stable" | "falling";
  updatedMinAgo: number;
}

interface Price {
  commodity: string;
  district: string;
  modalRsQuintal: number;
  change7dPct: number;
}

const SEV_COLOR = { high: "#C4562F", medium: "#D9A441", low: "#3E7C4F" } as const;

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [dispatched, setDispatched] = useState<string[]>([]);
  const [showDispatch, setShowDispatch] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch("/api/reports")
        .then((r) => r.json())
        .then(setReports)
        .catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/prices").then((r) => r.json()).then(setPrices).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const total = reports.reduce((s, r) => s + r.reports24h, 0);
    const high = reports.filter((r) => r.severity === "high");
    return { total, high, rising: reports.filter((r) => r.trend === "rising").length };
  }, [reports]);

  const alerts = useMemo(
    () =>
      reports
        .filter((r) => r.severity === "high" && !dispatched.includes(r.id))
        .sort((a, b) => b.reports24h - a.reports24h)
        .slice(0, 3),
    [reports, dispatched],
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">🗺️ District Intelligence Dashboard</h1>
          <p className="mt-2 max-w-2xl text-soil">
            Aggregated farmer diagnoses → live district outbreak map + early-warning dispatch for agriculture officers.
            Refreshes every 15s.
          </p>
        </div>
        <button onClick={() => setShowDispatch(true)} className="btn-primary">
          📣 Dispatch advisory
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Reports (24h)" value={stats.total} tone="text-terra" />
        <Kpi label="High-severity districts" value={stats.high.length} tone="text-saffron" />
        <Kpi label="Clusters rising" value={stats.rising} tone="text-gold" />
        <Kpi label="States live" value={new Set(reports.map((r) => r.state)).size} tone="text-leafdeep" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* MAP */}
        <section data-tour="dashboard-map" className="card relative p-5 lg:col-span-3">
          <p className="text-xs font-bold uppercase tracking-wide text-soil">Outbreak map — pin size = reports</p>
          <svg viewBox="0 0 700 720" className="mt-3 w-full">
            {/* simplified India silhouette */}
            <path
              d="M118,96 L154,64 L212,52 L282,58 L342,44 L410,54 L468,42 L520,62 L548,98 L588,104 L622,140 L610,180 L576,196 L596,232 L572,268 L586,308 L556,352 L520,396 L486,440 L452,486 L424,530 L396,574 L368,616 L344,650 L326,668 L306,640 L290,600 L268,556 L246,514 L220,478 L196,440 L170,404 L148,368 L128,330 L112,292 L98,254 L88,214 L86,172 L94,132 Z"
              fill="#F3EADA"
              stroke="#C9B892"
              strokeWidth="2"
            />
            {reports.map((r) => {
              // project lat/lon into viewbox (lon 68–97 → x 60–640; lat 37–8 → y 40–660)
              const x = 60 + ((r.lon - 68) / 29) * 580;
              const y = 40 + ((37 - r.lat) / 29) * 620;
              const rad = 6 + Math.min(16, r.reports24h / 3);
              return (
                <g key={r.id} className="cursor-pointer">
                  <circle cx={x} cy={y} r={rad + 6} fill={SEV_COLOR[r.severity]} opacity="0.18">
                    <animate attributeName="r" values={`${rad + 4};${rad + 10};${rad + 4}`} dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={rad} fill={SEV_COLOR[r.severity]} opacity="0.85" stroke="#fff" strokeWidth="1.5" />
                  <title>{`${r.district}, ${r.state} — ${r.disease} (${r.reports24h} reports)`}</title>
                </g>
              );
            })}
          </svg>
          <div className="flex gap-4 text-xs font-semibold text-soil">
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR.high }} />High</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR.medium }} />Medium</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR.low }} />Low</span>
          </div>
        </section>

        {/* ALERTS + TABLE */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-soil">🚨 Early-warning queue</p>
            {alerts.length === 0 && <p className="mt-3 text-sm text-soil">All high-severity clusters acknowledged. ✅</p>}
            <div className="mt-3 space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-xl border-l-4 border-l-terra bg-terra/5 p-3">
                  <p className="text-sm font-bold">
                    {a.district}, {a.state} — {a.disease}
                  </p>
                  <p className="mt-0.5 text-xs text-soil">
                    {a.crop} · {a.reports24h} reports/24h · trend {a.trend} · updated {a.updatedMinAgo}m ago
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-soil">All district reports</p>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
              {[...reports]
                .sort((a, b) => b.reports24h - a.reports24h)
                .map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-sand/50 p-2.5 text-sm dark:bg-[#201A13]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEV_COLOR[r.severity] }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {r.district} <span className="font-normal text-soil">· {r.disease}</span>
                      </p>
                      <p className="text-xs text-soil">
                        {r.crop} · {r.reports24h} reports · {r.updatedMinAgo}m ago
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${r.trend === "rising" ? "text-terra" : r.trend === "falling" ? "text-leaf" : "text-soil"}`}>
                      {r.trend === "rising" ? "↑" : r.trend === "falling" ? "↓" : "→"}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>

      {/* MANDI TICKER */}
      <section className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-soil">💹 Mandi prices — Agmarknet modal, 7-day change</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {prices.map((p) => (
            <div key={p.commodity + p.district} className="rounded-xl bg-sand/50 p-3 dark:bg-[#201A13]">
              <p className="text-sm font-bold">{p.commodity}</p>
              <p className="text-xs text-soil">{p.district}</p>
              <p className="mt-1 text-lg font-black">₹{p.modalRsQuintal.toLocaleString("en-IN")}</p>
              <p className={`text-xs font-bold ${p.change7dPct >= 0 ? "text-leaf" : "text-terra"}`}>
                {p.change7dPct >= 0 ? "▲" : "▼"} {Math.abs(p.change7dPct)}% / 7d
              </p>
            </div>
          ))}
        </div>
      </section>

      {showDispatch && <DispatchModal reports={reports} onClose={() => setShowDispatch(false)} onDone={(ids) => setDispatched((d) => [...d, ...ids])} />}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card p-4">
      <p className={`text-3xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-soil">{label}</p>
    </div>
  );
}

function DispatchModal({
  reports,
  onClose,
  onDone,
}: {
  reports: Report[];
  onClose: () => void;
  onDone: (ids: string[]) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const targets = reports.filter((r) => r.severity === "high").slice(0, 3);

  async function compose() {
    setComposing(true);
    try {
      const r = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districts: targets.map((t) => t.id) }),
      });
      const d = await r.json();
      setMessage(d.message);
    } catch {
      setMessage("Dispatch composed (offline mode): Issue alert to high-severity districts; advise removal of infected plants and protective spray within 48h.");
    }
    setComposing(false);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black">📣 Dispatch early-warning advisory</h3>
        <p className="mt-1 text-sm text-soil">
          Gemini drafts the officer bulletin for: {targets.map((t) => t.district).join(", ")} — delivered via SMS/IVR in
          the district's languages.
        </p>
        {composing ? (
          <p className="mt-4 text-sm font-medium text-terra">
            <span className="spin-slow inline-block">⚙️</span> Gemini is drafting…
          </p>
        ) : (
          message && (
            <div className="mt-4 rounded-xl bg-sand/60 p-4 text-sm leading-relaxed dark:bg-[#201A13]">
              {message}
            </div>
          )
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={compose} disabled={composing} className="rounded-full border border-soil/25 px-4 py-2 text-sm font-semibold text-soil hover:bg-soil/10 disabled:opacity-50">
            ✨ Draft with Gemini
          </button>
          <button
            onClick={() => {
              onDone(targets.map((t) => t.id));
              onClose();
            }}
            disabled={!message}
            className="btn-primary text-sm disabled:opacity-40"
          >
            Send to 3 districts
          </button>
        </div>
      </div>
    </div>
  );
}
