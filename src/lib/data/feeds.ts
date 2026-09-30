/**
 * FEED SERVICE — the seam between UI and data sources.
 * UI never imports seeds directly; everything goes through this interface so
 * a real API (IMD / Bhuvan / Agmarknet / Earth Engine) can replace the
 * simulated feeds without touching a single component.
 *
 * LIVE SIMULATION: small deterministic jitter seeded by the current minute so
 * numbers drift gently between requests — realistic "live" feel, zero backend.
 */
import {
  DISTRICT_REPORTS, FORECAST, MANDI_PRICES, PLOTS, DISEASES,
  type DistrictReport, type DailyForecast, type MandiPrice,
  type PlotProfile, type DiseaseInfo,
} from "./seeds";

const LIVE = process.env.MOCK_LIVE !== "false";

/** seeded 0..1 from a string + minute bucket */
function jitter(seed: string, scale = 1): number {
  const bucket = Math.floor(Date.now() / 60_000);
  let h = 2166136261 ^ bucket;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000) * scale;
}

export function getDistrictReports(): DistrictReport[] {
  return DISTRICT_REPORTS.map((r) => {
    if (!LIVE) return r;
    const drift = Math.round(jitter(r.id, 6) - 2);
    const reports = Math.max(0, r.reports24h + drift);
    return {
      ...r,
      reports24h: reports,
      updatedMinAgo: Math.min(r.updatedMinAgo, Math.max(1, Math.round(jitter(r.id + "t", 12)))),
      trend: reports > r.reports24h + 1 ? "rising" : reports < r.reports24h - 1 ? "falling" : r.trend,
    };
  });
}

export function getForecast(districtId: string): DailyForecast[] {
  const base = FORECAST[districtId] ?? FORECAST.nashik;
  if (!LIVE) return base;
  return base.map((d) => ({
    ...d,
    rainMm: Math.max(0, Math.round(d.rainMm + jitter(districtId + d.day, 4) - 1.5)),
    tempMaxC: Math.round((d.tempMaxC + jitter(districtId + d.day + "x", 2) - 1) * 10) / 10,
  }));
}

export function getPlots(): PlotProfile[] {
  return PLOTS;
}
export function getPlot(id: string): PlotProfile {
  return PLOTS.find((p) => p.id === id) ?? PLOTS[0];
}
export function getMandiPrices(): MandiPrice[] {
  return MANDI_PRICES.map((m) =>
    LIVE
      ? { ...m, modalRsQuintal: Math.round(m.modalRsQuintal * (1 + jitter(m.commodity, 0.02) - 0.01)) }
      : m,
  );
}
export function getDisease(id: string): DiseaseInfo | undefined {
  return DISEASES.find((d) => d.id === id || d.name.toLowerCase().includes(id.toLowerCase()));
}

export function getStats() {
  const reports = getDistrictReports();
  const total = reports.reduce((s, r) => s + r.reports24h, 0);
  const rising = reports.filter((r) => r.trend === "rising").length;
  const high = reports.filter((r) => r.severity === "high").length;
  return { total, rising, high, districts: reports.length };
}
