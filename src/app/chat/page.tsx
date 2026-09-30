"use client";

import { useEffect, useRef, useState } from "react";
import { useTour, speak } from "@/components/TourOverlay";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  en: ["When should I irrigate this week?", "Is it safe to spray before rain?", "How do I raise my soil organic carbon?"],
  hi: ["इस हफ़्ते सिंचाई कब करूँ?", "बारिश से पहले छिड़काव करना ठीक है?", "मिट्टी की जैविक खाद कैसे बढ़ाऊँ?"],
};

export default function ChatPage() {
  const { lang } = useTour();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  // greeting
  useEffect(() => {
    const greet =
      lang === "hi"
        ? "नमस्ते! मैं मिट्टी AI सहायक हूँ। अपनी फसल के बारे में पूछें — मैं आपकी भाषा में जवाब दूँगा। 🌾"
        : lang === "mr"
          ? "नमस्कार! मी मिट्टी AI सहाय्यक आहे. तुमच्या पिकाबद्दल विचारा — उत्तर तुमच्या भाषेत मिळेल. 🌾"
          : "Namaste! I'm MittiAI Sahayak. Ask me anything about your crop, soil, or weather — I answer in your language. 🌾";
    setMsgs([{ role: "assistant", text: greet }]);
  }, [lang]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...msgs, { role: "user" as const, text: clean }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8), lang, plotId: "nashik-grapes" }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "assistant", text: d.text || "Sorry, try again." }]);
      speak(d.text || "", lang);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Network hiccup — please ask again." }]);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (listening) {
      (window as any).speechRecognition?.stop?.();
      recogRef.current?.stop?.();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input needs Chrome/Edge. You can type instead.");
      return;
    }
    const r = new SR();
    r.lang = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN" }[lang] ?? "en-IN";
    r.interimResults = false;
    r.onresult = (e: any) => {
      const said = e.results[0][0].transcript;
      setListening(false);
      send(said);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">💬 Sahayak — ask in your language</h1>
        <p className="mt-2 max-w-2xl text-soil">
          Grounded on your plot's soil card, satellite trend, and the live district outbreak map. Voice in, voice out —
          no literacy barrier.
        </p>
      </header>

      <section data-tour="chat-panel" className="card flex h-[60vh] flex-col p-4">
        <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-leaf text-white"
                    : "bg-sand/80 dark:bg-[#201A13]"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-sand/80 px-4 py-2.5 text-sm dark:bg-[#201A13]">
                <span className="spin-slow inline-block">⚙️</span> thinking…
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(SUGGESTIONS[lang] ?? SUGGESTIONS.en).map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy} className="rounded-full border border-soil/20 px-3 py-1.5 text-xs font-medium text-soil transition hover:bg-soil/10 disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex items-center gap-2 border-t border-soil/10 pt-3"
        >
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition ${
              listening ? "bg-terra text-white pulse-dot" : "bg-sand text-soil hover:bg-parchment"
            }`}
            aria-label="Voice input"
          >
            🎤
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "Ask about your crop…"}
            className="h-10 flex-1 rounded-full border border-soil/20 bg-white/80 px-4 text-sm outline-none focus:border-leaf dark:bg-[#201A13]"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn-primary h-10 px-5 text-sm disabled:opacity-40">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
