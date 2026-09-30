import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import TourOverlay from "@/components/TourOverlay";

export const metadata: Metadata = {
  title: "MittiAI — Regenerative Agricultural Intelligence",
  description:
    "MittiAI turns a farmer's phone camera into an agronomist: instant crop-disease diagnosis, treatment, and regenerative advisories in your language — Gemini AI over real satellite, soil, and weather open data. Built for India, scalable across BRICS.",
};

const TOUR_CTX = { lang: "en" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('mitti-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <TourOverlay initial={TOUR_CTX}>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
          <footer className="border-t border-soil/10 py-6 text-center text-xs text-soil">
            <p className="font-medium">
              🌾 MittiAI — Track 4 · Regenerative Agricultural Intelligence · Google Cloud "Build with AI: Code for
              Communities"
            </p>
            <p className="mt-1">
              Data seeds: IMD · Soil Health Card (data.gov.in) · Agmarknet · ISRO Bhuvan/Sentinel-2 · ICAR/PlantVillage
              KBs · AI: Google Gemini
            </p>
          </footer>
        </TourOverlay>
      </body>
    </html>
  );
}
