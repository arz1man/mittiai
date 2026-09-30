"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* Tour context lives here so Header + pages can drive/read tour & language state. */

interface TourStep {
  target: string; // CSS selector to spotlight
  title: string;
  body: string;
  route?: string; // route to navigate before showing this step
}

interface TourCtx {
  lang: string;
  setLang: (l: string) => void;
  startTour: () => void;
  stopTour: () => void;
  step: number;
  stepCount: number;
}

const Ctx = createContext<TourCtx>({ lang: "en", setLang: () => {}, startTour: () => {}, stopTour: () => {}, step: 0, stepCount: 0 });

export const useTour = () => useContext(Ctx);

export const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='hero']",
    title: "1 · The problem",
    body: "100M+ Indian smallholder farmers guess. Crop loss to disease hits food security and incomes. MittiAI replaces guesswork with AI.",
    route: "/",
  },
  {
    target: "[data-tour='diagnose-upload']",
    title: "2 · Point your camera",
    body: "A farmer photographs a diseased leaf. Gemini's vision model identifies the disease — even in low-quality field photos.",
    route: "/diagnose",
  },
  {
    target: "[data-tour='diagnosis-result']",
    title: "3 · Instant diagnosis",
    body: "In seconds: disease ID, confidence, severity, ICAR-dose treatment, and a regenerative plan — spoken aloud in the farmer's language.",
    route: "/diagnose",
  },
  {
    target: "[data-tour='advisory-plan']",
    title: "4 · Satellite + soil advisory",
    body: "Real Soil Health Card nutrients, 12-week Bhuvan NDVI, and a 14-day IMD forecast → a regenerative crop calendar from Gemini.",
    route: "/advisory",
  },
  {
    target: "[data-tour='dashboard-map']",
    title: "5 · National network",
    body: "Every diagnosis feeds a live district-level outbreak map — early warnings for agriculture officers across states, ready for BRICS scale.",
    route: "/dashboard",
  },
  {
    target: "[data-tour='chat-panel']",
    title: "6 · Ask anything, in any language",
    body: "Sahayak chat answers in 6 Indian languages — voice in, voice out. No literacy barrier.",
    route: "/chat",
  },
];

export function speak(text: string, lang = "en") {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN", pa: "pa-IN" }[lang] ?? "en-IN";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

export default function TourOverlay({ children, initial = { lang: "en" } }: { children: ReactNode; initial?: { lang: string } }) {
  const [lang, setLangState] = useState(initial.lang);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [route, setRoute] = useState<string | null>(null);

  const startTour = () => {
    setStep(0);
    setActive(true);
  };
  const stopTour = () => setActive(false);

  const current = active ? TOUR_STEPS[Math.min(step, TOUR_STEPS.length - 1)] : null;

  // navigate when the step wants a new route
  useEffect(() => {
    if (!current) return;
    setRoute(current.route ?? null);
  }, [step, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLang = (l: string) => setLangState(l);

  return (
    <Ctx.Provider value={{ lang, setLang, startTour, stopTour, step, stepCount: TOUR_STEPS.length }}>
      {children}
      {route !== null && <RouteDriver href={route} onDone={() => setRoute(null)} />}
      {current && <TourCard step={step} setStep={setStep} onClose={stopTour} />}
    </Ctx.Provider>
  );
}

function RouteDriver({ href, onDone }: { href: string; onDone: () => void }) {
  useEffect(() => {
    if (href && window.location.pathname !== href) {
      window.location.href = href; // full nav resets page state cleanly between steps
    }
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [href, onDone]);
  return null;
}

function TourCard({ step, setStep, onClose }: { step: number; setStep: (n: number) => void; onClose: () => void }) {
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  function next() {
    if (last) onClose();
    else setStep(step + 1);
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[90] mx-auto w-[min(560px,92vw)] fade-in" data-tour="tour-card">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-leafdeep dark:text-gold">{s.title}</p>
            <p className="mt-1 text-sm leading-snug text-ink dark:text-sand">{s.body}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-soil hover:bg-soil/10" aria-label="Close tour">
            ✕
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === step ? "bg-saffron" : "bg-soil/25"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full px-3 py-1.5 text-xs font-medium text-soil hover:bg-soil/10">
              Skip
            </button>
            <button onClick={next} className="btn-primary px-4 py-1.5 text-xs">
              {last ? "Finish" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
