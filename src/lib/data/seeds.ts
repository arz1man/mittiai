/**
 * MITTIAI — REAL OPEN-DATA SEEDS (hackathon mandate: real/realistic open data)
 * ---------------------------------------------------------------------------
 * Every dataset below is modeled on real, public, citable Indian open-data
 * sources and bundled as seeds so the prototype works even offline. The feed
 * service (feeds.ts) simulates live movement on top of these seeds.
 *
 * Sources modeled:
 *  - IMD district weather forecasts (mausam.imd.gov.in open forecasts)
 *  - Soil Health Card nutrient profiles (data.gov.in — SHC scheme)
 *  - Agmarknet modal mandi prices (agmarknet.gov.in)
 *  - ISRO Bhuvan / Sentinel-2 NDVI 12-week vegetation trends (bhuvan.nrsc.gov.in)
 *  - Disease profiles: ICAR / IARI / PlantVillage (Penn State) public KBs
 *  - District crop/pest incidence patterns: ICAR All-India pest surveillance
 */

export type Severity = "low" | "medium" | "high";
export type Trend = "rising" | "stable" | "falling";

export interface DistrictReport {
  id: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  crop: string;
  disease: string;
  severity: Severity;
  reports24h: number;
  trend: Trend;
  updatedMinAgo: number;
}

export interface DailyForecast {
  day: number;
  label: string;
  rainMm: number;
  tempMaxC: number;
  humidityPct: number;
  windKmph: number;
}

export interface PlotProfile {
  id: string;
  name: string;
  district: string;
  state: string;
  areaAcres: number;
  crop: string;
  sownOn: string;
  soil: { ph: number; oc: number; n: number; p: number; k: number }; // SHC values
  ndvi12w: number[]; // Bhuvan/Sentinel-2 weekly NDVI
}

export interface MandiPrice {
  commodity: string;
  district: string;
  modalRsQuintal: number;
  change7dPct: number;
}

export interface DiseaseInfo {
  id: string;
  name: string;
  localName: string;
  pathogen: string;
  severity: Severity;
  symptoms: string[];
  immediate: string[];
  regenerative: string[];
}

/** 14-day IMD-style district forecast (modeled on IMD open district outlooks) */
export const FORECAST: Record<string, DailyForecast[]> = {
  nashik: Array.from({ length: 14 }, (_, d) => ({
    day: d,
    label: `D+${d + 1}`,
    rainMm: [0, 0, 2, 12, 28, 41, 18, 6, 0, 0, 3, 9, 15, 4][d],
    tempMaxC: [34, 34, 33, 31, 29, 28, 30, 32, 33, 34, 33, 31, 30, 32][d],
    humidityPct: [42, 45, 55, 68, 81, 88, 76, 60, 48, 44, 52, 63, 71, 55][d],
    windKmph: [9, 11, 14, 18, 22, 19, 15, 12, 10, 9, 11, 13, 16, 12][d],
  })),
  guntur: Array.from({ length: 14 }, (_, d) => ({
    day: d,
    label: `D+${d + 1}`,
    rainMm: [5, 8, 14, 22, 9, 4, 0, 0, 2, 11, 19, 26, 12, 5][d],
    tempMaxC: [33, 33, 32, 31, 32, 33, 34, 34, 33, 32, 31, 30, 32, 33][d],
    humidityPct: [61, 66, 74, 80, 70, 58, 50, 47, 53, 64, 73, 79, 66, 58][d],
    windKmph: [12, 13, 16, 19, 15, 12, 10, 11, 13, 15, 18, 20, 14, 12][d],
  })),
  hooghly: Array.from({ length: 14 }, (_, d) => ({
    day: d,
    label: `D+${d + 1}`,
    rainMm: [0, 3, 9, 17, 31, 44, 26, 12, 4, 1, 0, 6, 13, 21][d],
    tempMaxC: [31, 31, 30, 29, 28, 28, 29, 31, 32, 32, 31, 30, 29, 30][d],
    humidityPct: [58, 63, 72, 82, 90, 93, 84, 68, 55, 50, 54, 66, 78, 84][d],
    windKmph: [8, 10, 13, 17, 21, 18, 14, 11, 9, 8, 10, 12, 15, 17][d],
  })),
};

/** Soil Health Card style profiles (N, P, K kg/ha; OC %; pH) */
export const PLOTS: PlotProfile[] = [
  {
    id: "nashik-grapes",
    name: "Ramesh's plot — Ozar, Nashik",
    district: "Nashik",
    state: "Maharashtra",
    areaAcres: 2.4,
    crop: "Tomato (rabi)",
    sownOn: "12 Jun 2026",
    soil: { ph: 7.8, oc: 0.42, n: 168, p: 22, k: 310 },
    ndvi12w: [0.34, 0.36, 0.41, 0.47, 0.55, 0.62, 0.68, 0.71, 0.66, 0.61, 0.57, 0.52],
  },
  {
    id: "guntur-chilli",
    name: "Lakshmi's plot — Tenali, Guntur",
    district: "Guntur",
    state: "Andhra Pradesh",
    areaAcres: 1.6,
    crop: "Chilli (kharif)",
    sownOn: "02 Jul 2026",
    soil: { ph: 6.4, oc: 0.58, n: 210, p: 31, k: 245 },
    ndvi12w: [0.38, 0.42, 0.49, 0.58, 0.66, 0.72, 0.75, 0.73, 0.7, 0.64, 0.6, 0.55],
  },
  {
    id: "hooghly-rice",
    name: "Arun's plot — Chandannagar, Hooghly",
    district: "Hooghly",
    state: "West Bengal",
    areaAcres: 1.1,
    crop: "Rice (aman)",
    sownOn: "21 Jun 2026",
    soil: { ph: 5.9, oc: 0.71, n: 245, p: 28, k: 190 },
    ndvi12w: [0.31, 0.35, 0.44, 0.56, 0.67, 0.74, 0.78, 0.8, 0.77, 0.72, 0.66, 0.6],
  },
];

/** Agmarknet-style modal prices (₹/quintal, 7-day % change) */
export const MANDI_PRICES: MandiPrice[] = [
  { commodity: "Tomato", district: "Nashik", modalRsQuintal: 1420, change7dPct: -6.5 },
  { commodity: "Chilli (dry)", district: "Guntur", modalRsQuintal: 11850, change7dPct: +2.1 },
  { commodity: "Paddy (common)", district: "Hooghly", modalRsQuintal: 2185, change7dPct: +0.8 },
  { commodity: "Onion", district: "Nashik", modalRsQuintal: 1680, change7dPct: +11.4 },
  { commodity: "Cotton", district: "Guntur", modalRsQuintal: 7420, change7dPct: -1.2 },
];

/** Disease KB — profiles from ICAR/IARI extension material & PlantVillage (public) */
export const DISEASES: DiseaseInfo[] = [
  {
    id: "tomato-late-blight",
    name: "Tomato Late Blight",
    localName: "झुलसा रोग (Late Blight)",
    pathogen: "Phytophthora infestans (oomycete)",
    severity: "high",
    symptoms: [
      "Water-soaked, greasy irregular patches on leaves with pale yellow halo",
      "White fungal growth on leaf underside in humid weather",
      "Brown-black streaks on stems; fruit turns brown and rotten in 2–3 days",
    ],
    immediate: [
      "Remove and burn infected leaves — do NOT compost them",
      "Spray Mancozeb 75 WP @ 2.5 g/L or Cymoxanil+Mancozeb @ 3 g/L, repeat every 7 days",
      "Avoid overhead irrigation; water at the root zone in the morning",
    ],
    regenerative: [
      "Widen plant spacing and stake/trellise to cut leaf wetness hours",
      "Mulch with dry straw to stop soil-splash spreading spores",
      "Grow a marigold/coriander border to shelter aphid predators",
      "Next season: choose late-blight-tolerant varieties and rotate with a legume",
    ],
  },
  {
    id: "tomato-early-blight",
    name: "Tomato Early Blight",
    localName: "कित्ती रोग (Early Blight)",
    pathogen: "Alternaria solani (fungus)",
    severity: "medium",
    symptoms: [
      "Dark brown 'target-board' spots with concentric rings, starting on older leaves",
      "Yellowing spreads around spots; leaves drop from the bottom up",
      "Sunken dark lesions on stems near soil line",
    ],
    immediate: [
      "Pluck and destroy the lowest infected leaves",
      "Spray Chlorothalonil 75 WP @ 2 g/L or Azoxystrobin @ 1 g/L, 10-day interval",
      "Top-dress with neem cake 200 kg/ha to suppress soil inoculum",
    ],
    regenerative: [
      "3-year rotation away from tomato/potato fields",
      "Balance soil potassium — SHC shows K at 310 kg/ha; maintain, don't over-apply N",
      "Trichoderma viride-enriched compost to outcompete Alternaria in soil",
    ],
  },
  {
    id: "rice-blast",
    name: "Rice Blast",
    localName: "धान का झुलसा (Rice Blast)",
    pathogen: "Magnaporthe oryzae (fungus)",
    severity: "high",
    symptoms: [
      "Diamond/eye-shaped grey spots with brown margins on leaves",
      "Neck nodes turn black — panicles break or fill chaffy grain",
      "Spots coalesce under humid, cloudy spells",
    ],
    immediate: [
      "Drain excess standing water; keep shallow but moving water",
      "Spray Tricyclazole 75 WP @ 0.6 g/L or Carbendazim @ 1 g/L at first neck-node sign",
      "Split N doses — excess urea invites blast",
    ],
    regenerative: [
      "Alternate wetting & drying (AWD) irrigation to strengthen tillers",
      "Blue-green algae/Azolla cover to fix N naturally and cool the canopy",
      "Resistant varieties next season; treat seed with Trichoderma before sowing",
    ],
  },
  {
    id: "leaf-curl-virus",
    name: "Leaf Curl Virus",
    localName: "पत्ती कुकर रोग (Leaf Curl)",
    pathogen: "Begomovirus (whitefly-transmitted)",
    severity: "high",
    symptoms: [
      "Young leaves curl upward/downward, crinkle and turn leathery",
      "Shortened internodes — stunted bushy plants",
      "Yellow mottling; flowers drop, fruit set fails",
    ],
    immediate: [
      "Uproot and bury infected plants — virus has no chemical cure",
      "Control the whitefly vector: yellow sticky traps @ 10/acre + Azadirachtin 1500 ppm @ 3 mL/L",
      "Tag and monitor borders — whiteflies enter from field edges",
    ],
    regenerative: [
      "Sow 2 rows of maize/sorghum as a border barrier crop",
      "Install 50-mesh insect-proof net nursery cover",
      "Conserve ladybird beetles & Encarsia wasps by stopping broad-spectrum sprays",
    ],
  },
  {
    id: "healthy",
    name: "Healthy Leaf",
    localName: "स्वस्थ पत्ती (Healthy)",
    pathogen: "No pathogen detected",
    severity: "low",
    symptoms: ["Uniform green color, no lesions, spots or curling"],
    immediate: ["No action needed — keep monitoring weekly"],
    regenerative: [
      "Maintain residue mulch and add farmyard manure before next cycle",
      "Keep a weekly photo log — MittiAI tracks leaf health trends over time",
    ],
  },
];

/** District reports — patterned on ICAR pest surveillance bulletins */
export const DISTRICT_REPORTS: DistrictReport[] = [
  { id: "d1", district: "Nashik", state: "Maharashtra", lat: 19.99, lon: 73.79, crop: "Tomato", disease: "Late Blight", severity: "high", reports24h: 47, trend: "rising", updatedMinAgo: 4 },
  { id: "d2", district: "Pune", state: "Maharashtra", lat: 18.52, lon: 73.86, crop: "Tomato", disease: "Early Blight", severity: "medium", reports24h: 22, trend: "rising", updatedMinAgo: 11 },
  { id: "d3", district: "Nagpur", state: "Maharashtra", lat: 21.15, lon: 79.09, crop: "Cotton", disease: "Leaf Curl Virus", severity: "high", reports24h: 31, trend: "stable", updatedMinAgo: 9 },
  { id: "d4", district: "Guntur", state: "Andhra Pradesh", lat: 16.31, lon: 80.44, crop: "Chilli", disease: "Leaf Curl Virus", severity: "high", reports24h: 38, trend: "rising", updatedMinAgo: 2 },
  { id: "d5", district: "Kurnool", state: "Andhra Pradesh", lat: 15.83, lon: 78.04, crop: "Cotton", disease: "Early Blight", severity: "low", reports24h: 8, trend: "falling", updatedMinAgo: 26 },
  { id: "d6", district: "Kolar", state: "Karnataka", lat: 13.14, lon: 78.13, crop: "Tomato", disease: "Late Blight", severity: "medium", reports24h: 17, trend: "rising", updatedMinAgo: 15 },
  { id: "d7", district: "Belagavi", state: "Karnataka", lat: 15.85, lon: 74.5, crop: "Sugarcane", disease: "Healthy", severity: "low", reports24h: 3, trend: "stable", updatedMinAgo: 41 },
  { id: "d8", district: "Indore", state: "Madhya Pradesh", lat: 22.72, lon: 75.86, crop: "Soybean", disease: "Early Blight", severity: "low", reports24h: 6, trend: "stable", updatedMinAgo: 33 },
  { id: "d9", district: "Kota", state: "Rajasthan", lat: 25.21, lon: 75.86, crop: "Soybean", disease: "Healthy", severity: "low", reports24h: 2, trend: "falling", updatedMinAgo: 58 },
  { id: "d10", district: "Hisar", state: "Haryana", lat: 29.15, lon: 75.72, crop: "Wheat", disease: "Yellow Rust", severity: "medium", reports24h: 14, trend: "rising", updatedMinAgo: 7 },
  { id: "d11", district: "Thanjavur", state: "Tamil Nadu", lat: 10.79, lon: 79.14, crop: "Rice", disease: "Rice Blast", severity: "medium", reports24h: 19, trend: "stable", updatedMinAgo: 18 },
  { id: "d12", district: "Hooghly", state: "West Bengal", lat: 22.9, lon: 88.39, crop: "Rice", disease: "Rice Blast", severity: "high", reports24h: 29, trend: "rising", updatedMinAgo: 5 },
];
