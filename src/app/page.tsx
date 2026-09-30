"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTour } from "@/components/TourOverlay";

export default function Home() {
  const { startTour } = useTour();
  const [stats, setStats] = useState({ total: 0, rising: 0, high: 0, districts: 12 });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section data-tour="hero" className="grid items-center gap-8 pt-6 md:grid-cols-2">
        <div className="fade-in">
          <p className="mb-3 inline-block rounded-full bg-leaf/10 px-3 py-1 text-xs font-bold text-leafdeep dark:text-gold">
            🇮🇳 Track 4 · Regenerative Agricultural Intelligence
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            The agronomist in every <span className="bg-gradient-to-r from-leaf to-saffron bg-clip-text text-transparent">farmer&apos;s pocket</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-soil">
            MittiAI turns a phone camera into a plant pathologist. Photograph a leaf — get a disease diagnosis, exact
            ICAR-dose treatment, and a regenerative crop plan in your own language, powered by <strong>Gemini AI over
            real IMD, Soil Health Card, Agmarknet &amp; ISRO Bhuvan open data</strong>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/diagnose" className="btn-primary">📷 Diagnose a leaf now</Link>
            <button onClick={startTour} className="rounded-full border border-soil/25 px-5 py-2.5 font-semibold text-soil transition hover:bg-soil/10">
              ▶ Watch the guided tour
            </button>
          </div>
          <p className="mt-4 text-xs text-soil/70">
            Works on 2G · Voice-first · Hindi, मराठी, தமிழ், తెలుగు, বাংলা + English
          </p>
        </div>

        <div className="fade-in glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-soil">LIVE NETWORK PULSE</p>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-leaf">
              <span className="pulse-dot h-2 w-2 rounded-full bg-leaf" /> live
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat big label="disease reports" value={stats.total} accent="text-terra" sub="last 24h" />
            <Stat big label="high-severity hotspots" value={stats.high} accent="text-saffron" sub="act within 48h" />
            <Stat big label="districts reporting" value={stats.districts} accent="text-leafdeep" sub="6 states" />
            <Stat big label="trending upward" value={stats.rising} accent="text-gold" sub="outbreak clusters" />
          </div>
          <div className="mt-4 rounded-xl bg-leaf/5 p-3 text-xs leading-relaxed text-soil">
            <strong className="text-leafdeep dark:text-gold">Early warning:</strong> Late blight rising fast in Nashik
            (47 reports ↑). Rice blast cluster forming in Hooghly. Agriculture officers alerted via dashboard dispatch.
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold">From photo to field action in 30 seconds</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: "📷", t: "1 · Capture", d: "Farmer photographs any crop leaf on a basic smartphone — no login, no cost." },
            { icon: "🧠", t: "2 · Gemini vision", d: "Multimodal AI identifies the disease with confidence + severity, even in blurry field shots." },
            { icon: "💊", t: "3 · Treat", d: "Exact ICAR-recommended doses in the farmer's language, plus low-chemical regenerative alternatives." },
            { icon: "🗺️", t: "4 · Warn the district", d: "Every diagnosis aggregates into a national outbreak map that warns officers before epidemics spread." },
          ].map((s) => (
            <div key={s.t} className="card p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="text-3xl">{s.icon}</div>
              <p className="mt-2 font-bold">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-soil">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STACK + IMPACT */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-extrabold">⚙️ Google AI stack</h3>
          <ul className="mt-3 space-y-2 text-sm text-soil">
            <li><strong className="text-ink dark:text-sand">Gemini multimodal vision</strong> — leaf disease diagnosis from photos</li>
            <li><strong className="text-ink dark:text-sand">Gemini + responseSchema</strong> — structured JSON advisories from real soil/satellite/weather data</li>
            <li><strong className="text-ink dark:text-sand">Gemini multilingual</strong> — Hindi, Marathi, Tamil, Telugu, Bengali, Punjabi chat (voice in/out)</li>
            <li><strong className="text-ink dark:text-sand">Browser TTS</strong> — spoken readout for low-literacy users</li>
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="font-extrabold">🌱 Built for India, scaled for BRICS</h3>
          <ul className="mt-3 space-y-2 text-sm text-soil">
            <li><strong className="text-ink dark:text-sand">Seed districts in 6 states</strong> — district objects are portable: add a row, add a state</li>
            <li><strong className="text-ink dark:text-sand">Open-data native</strong> — IMD, Bhuvan, Agmarknet, data.gov.in schemas; Brazil/SA/Africa swap-ins map 1:1</li>
            <li><strong className="text-ink dark:text-sand">Offline-tolerant</strong> — seeded feeds keep the demo alive on 2G or stage Wi-Fi</li>
            <li><strong className="text-ink dark:text-sand">Digital Public Good path</strong> — modular feed layer means any state/agency can plug its own data</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({ big, label, value, accent, sub }: { big?: boolean; label: string; value: number; accent: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 dark:bg-[#2B2118]/70">
      <p className={`font-black ${big ? "text-3xl" : "text-xl"} ${accent}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-ink dark:text-sand">{label}</p>
      <p className="text-[11px] text-soil">{sub}</p>
    </div>
  );
}
