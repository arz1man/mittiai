"use client";

import { useTour } from "./TourOverlay";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "mr", label: "मरा" },
  { code: "ta", label: "தமி" },
  { code: "te", label: "తెలు" },
  { code: "bn", label: "বাং" },
];

export default function LangSelect() {
  const { lang, setLang } = useTour();
  return (
    <div className="flex items-center rounded-full border border-soil/20 bg-white/70 text-xs font-semibold">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-full px-2 py-1 transition ${lang === l.code ? "bg-leaf text-white" : "text-soil hover:bg-soil/10"}`}
          title={l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
