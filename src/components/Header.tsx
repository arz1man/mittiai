"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LangSelect from "./LangSelect";
import { useTour } from "./TourOverlay";

const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/diagnose", label: "Diagnose", icon: "📷" },
  { href: "/advisory", label: "Advisory", icon: "🌱" },
  { href: "/chat", label: "Sahayak", icon: "💬" },
  { href: "/dashboard", label: "Dashboard", icon: "🗺️" },
];

export default function Header() {
  const path = usePathname();
  const { startTour } = useTour();

  return (
    <header className="sticky top-0 z-50 border-b border-soil/10 bg-cream/80 backdrop-blur-md dark:bg-[#201A13]/80">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-terra text-base shadow">
            🌿
          </span>
          <span className="text-lg font-extrabold tracking-tight text-leafdeep dark:text-gold">
            Mitti<span className="text-saffron">AI</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                path === n.href ? "bg-leaf/10 text-leafdeep dark:text-gold" : "text-soil hover:bg-soil/10"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={startTour} className="hidden rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold text-terra transition hover:bg-gold/30 sm:block" title="Auto product tour">
            ▶ Guided tour
          </button>
          <LangSelect />
          <ThemeToggle />
        </div>
      </div>

      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-soil/10 px-3 py-1.5 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
              path === n.href ? "bg-leaf text-white" : "text-soil"
            }`}
          >
            {n.icon} {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
