import { calculateMatchScore } from "@/services/dna";
import { mockPerfumes } from "@/services/mock-data";
import { getPerfumes } from "@/services/perfumes";
import { SCENT_DIMENSIONS } from "@/utils/constants";
import { localizeScentLabels, type ScentLanguage } from "@/utils/scentLabels";
import type { GenderPreference, Perfume, Recommendation, ScentDimension, ScentVector, WeatherSnapshot } from "@/utils/types";

interface RecommendationConfig {
  userDNA: ScentVector;
  weather?: WeatherSnapshot;
  occasion?: string;
  language?: ScentLanguage;
  limit?: number;
  excludeIds?: string[];
  genderPreference?: GenderPreference;
}

const RECOMMENDATION_POOL_LIMIT = 2400;
const BEST_MATCHES_LIMIT = 12;
const SECTION_LIMIT = 10;

function matchesGenderPreference(perfume: Perfume, genderPreference?: GenderPreference): boolean {
  if (!genderPreference) return true;
  if (genderPreference === "men") return perfume.gender === "men";
  if (genderPreference === "women") return perfume.gender === "women";
  return perfume.gender === "unisex";
}

async function loadRecommendationPool(genderPreference?: GenderPreference): Promise<Perfume[]> {
  let catalog: Perfume[] = mockPerfumes;
  try {
    const loaded = await getPerfumes(RECOMMENDATION_POOL_LIMIT);
    if (loaded.length > 0) {
      catalog = loaded;
    }
  } catch {}

  const filtered = catalog.filter((perfume) => matchesGenderPreference(perfume, genderPreference));
  return filtered;
}

// ─── Public: legacy/general getter (still used elsewhere) ───────────────────

export async function getRecommendations(config: RecommendationConfig): Promise<Recommendation[]> {
  const { userDNA, weather, occasion, language = "en", limit = 12, excludeIds = [], genderPreference } = config;
  const pool = await loadRecommendationPool(genderPreference);

  const scored = pool
    .filter((perfume) => !excludeIds.includes(perfume.id))
    .map((perfume) => {
      const reasons: string[] = [];
      let matchScore = calculateMatchScore(userDNA, perfume.scentVector);
      const temperature = weather?.temp;

      if (typeof temperature === "number" && temperature > 25 && perfume.families.some((family) => ["Fresh", "Citrus", "Aquatic"].includes(family))) {
        matchScore += 5;
        reasons.push(language === "tr" ? "Sıcak havada daha iyi çalışır" : "Great for warm weather");
      }

      if (typeof temperature === "number" && temperature < 15 && perfume.families.some((family) => ["Woody", "Spicy", "Amber", "Sweet"].includes(family))) {
        matchScore += 5;
        reasons.push(language === "tr" ? "Serin havada güçlü performans verir" : "Perfect for cool weather");
      }

      if (occasion && perfume.occasions.includes(occasion)) {
        matchScore += 3;
        const normalizedOccasion = occasion.toLowerCase();
        if (language === "tr") {
          const occasionLabel =
            normalizedOccasion === "night out" ? "gece dışarı çıkma"
              : normalizedOccasion === "date night" ? "romantik akşam"
                : normalizedOccasion === "office" ? "ofis"
                  : normalizedOccasion === "daily" ? "günlük kullanım"
                    : normalizedOccasion;
          reasons.push(`${occasionLabel} için uygun`);
        } else {
          reasons.push(`Great for ${normalizedOccasion}`);
        }
      }

      if (!reasons.length) {
        const localizedFamilies = localizeScentLabels(perfume.families.slice(0, 2), language);
        if (language === "tr") {
          reasons.push(`${localizedFamilies.join(" + ")} çizgisi profilinle uyumlu`);
        } else {
          reasons.push(`Matches your ${localizedFamilies.join(" + ").toLowerCase()} profile`);
        }
      }

      return {
        perfumeId: perfume.id,
        perfume,
        matchScore: Math.min(matchScore, 99),
        reason: reasons.join(". "),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored.slice(0, limit);
}

// ─── For-You sections (smart, deduplicated) ────────────────────────────────

export type ForYouSections = {
  todaysPick: Recommendation[];
  todaysPickContext: string;
  bestMatches: Recommendation[];
  freshDaily: Recommendation[];
  forNightOut: Recommendation[];
  hiddenGems: Recommendation[];
  similarToStyle: Recommendation[];
};

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 24) return "evening";
  return "night";
}

function timeOfDayLabelTR(tod: TimeOfDay): string {
  switch (tod) {
    case "morning": return "Sabah";
    case "afternoon": return "Öğle";
    case "evening": return "Akşam";
    case "night": return "Gece";
  }
}

function conditionLabelTR(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "Açık";
  if (c.includes("partly")) return "Parçalı Bulutlu";
  if (c.includes("cloud")) return "Bulutlu";
  if (c.includes("rain") || c.includes("drizzle")) return "Yağmurlu";
  if (c.includes("snow")) return "Karlı";
  if (c.includes("storm") || c.includes("thunder")) return "Fırtınalı";
  if (c.includes("fog") || c.includes("mist")) return "Sisli";
  return condition;
}

function familyHas(perfume: Perfume, families: string[]): boolean {
  return perfume.families.some((f) => families.includes(f));
}

function buildReason(perfume: Perfume, language: ScentLanguage, extra?: string): string {
  const localizedFamilies = localizeScentLabels(perfume.families.slice(0, 2), language);
  const base = language === "tr"
    ? `${localizedFamilies.join(" + ")} çizgisi profilinle uyumlu`
    : `Matches your ${localizedFamilies.join(" + ").toLowerCase()} profile`;
  return extra ? `${base}. ${extra}` : base;
}

function makeRec(perfume: Perfume, score: number, reason: string): Recommendation {
  return {
    perfumeId: perfume.id,
    perfume,
    matchScore: Math.min(Math.round(score), 99),
    reason,
  };
}

function topTwoDimensions(userDNA: ScentVector): ScentDimension[] {
  const sorted = [...SCENT_DIMENSIONS].sort((a, b) => (userDNA[b] ?? 0) - (userDNA[a] ?? 0));
  return [sorted[0], sorted[1]];
}

function dimensionScore(perfume: Perfume, dims: ScentDimension[]): number {
  let total = 0;
  for (const dim of dims) {
    const idx = SCENT_DIMENSIONS.indexOf(dim);
    if (idx >= 0) total += perfume.scentVector[idx] ?? 0;
  }
  return total;
}

export async function getForYouSections(
  userDNA: ScentVector,
  weather?: WeatherSnapshot,
  language: ScentLanguage = "en",
  genderPreference?: GenderPreference,
): Promise<ForYouSections> {
  const exclude = new Set<string>();
  const all = await loadRecommendationPool(genderPreference);
  const tod = getTimeOfDay();
  const temp = weather?.temp;

  const baseScore = (perfume: Perfume) => calculateMatchScore(userDNA, perfume.scentVector);

  // 1. todaysPick — DNA + weather + time-of-day
  const pickScored = all.map((perfume) => {
    let score = baseScore(perfume);

    // Time-of-day bonus
    if (tod === "morning" && familyHas(perfume, ["Fresh", "Citrus"])) score += 8;
    else if (tod === "afternoon" && familyHas(perfume, ["Fresh", "Woody"])) score += 4;
    else if (tod === "evening" || tod === "night") {
      if (familyHas(perfume, ["Amber", "Oriental", "Spicy"])) score += 8;
    }

    // Weather bonus
    if (typeof temp === "number") {
      if (temp > 25 && familyHas(perfume, ["Fresh", "Citrus", "Aquatic"])) score += 7;
      else if (temp < 12 && familyHas(perfume, ["Woody", "Amber", "Spicy", "Leather"])) score += 7;
    }

    return { perfume, score };
  }).sort((a, b) => b.score - a.score);

  const pickWinner = pickScored[0];
  const todaysPick: Recommendation[] = pickWinner
    ? [makeRec(
        pickWinner.perfume,
        pickWinner.score,
        buildReason(
          pickWinner.perfume,
          language,
          language === "tr" ? "Bu anın atmosferiyle eşleştirildi" : "Matched to this moment",
        ),
      )]
    : [];
  if (pickWinner) exclude.add(pickWinner.perfume.id);

  // todaysPickContext
  const contextParts: string[] = [];
  if (typeof temp === "number") contextParts.push(`${temp}°C`);
  if (weather?.condition) contextParts.push(conditionLabelTR(weather.condition));
  contextParts.push(language === "tr" ? `${timeOfDayLabelTR(tod)} seçimi` : `${tod} pick`);
  const todaysPickContext = contextParts.join(" · ");

  // 2. bestMatches — pure DNA, top 6
  const bestMatchesScored = all
    .filter((p) => !exclude.has(p.id))
    .map((p) => ({ perfume: p, score: baseScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, BEST_MATCHES_LIMIT);
  const bestMatches: Recommendation[] = bestMatchesScored.map(({ perfume, score }) =>
    makeRec(perfume, score, buildReason(perfume, language)),
  );
  bestMatches.forEach((r) => exclude.add(r.perfumeId));

  // 3. freshDaily — Fresh/Citrus/Aquatic with freshness bonus
  const freshFamilies = ["Fresh", "Citrus", "Aquatic"];
  const freshScored = all
    .filter((p) => !exclude.has(p.id) && familyHas(p, freshFamilies))
    .map((p) => {
      let score = baseScore(p);
      if (p.families.includes("Fresh")) score += 10;
      else if (p.families.includes("Citrus")) score += 6;
      else if (p.families.includes("Aquatic")) score += 5;
      return { perfume: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SECTION_LIMIT);
  const freshDaily: Recommendation[] = freshScored.map(({ perfume, score }) =>
    makeRec(
      perfume,
      score,
      buildReason(perfume, language, language === "tr" ? "Günlük tazelik için" : "Fresh for everyday"),
    ),
  );
  freshDaily.forEach((r) => exclude.add(r.perfumeId));

  // 4. forNightOut — occasion or evening families
  const eveningFamilies = ["Amber", "Oriental", "Spicy"];
  const nightOccasions = ["Night Out", "Date Night"];
  const nightScored = all
    .filter((p) => {
      if (exclude.has(p.id)) return false;
      const hasOccasion = p.occasions.some((o) => nightOccasions.includes(o));
      const hasFamily = familyHas(p, eveningFamilies);
      return hasOccasion || hasFamily;
    })
    .map((p) => {
      let score = baseScore(p);
      if (p.occasions.some((o) => nightOccasions.includes(o))) score += 8;
      if (familyHas(p, eveningFamilies)) score += 6;
      return { perfume: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SECTION_LIMIT);
  const forNightOut: Recommendation[] = nightScored.map(({ perfume, score }) =>
    makeRec(
      perfume,
      score,
      buildReason(perfume, language, language === "tr" ? "Geceye uygun" : "Made for night"),
    ),
  );
  forNightOut.forEach((r) => exclude.add(r.perfumeId));

  // 5. hiddenGems — underrated (ratingAvg present, ratingCount < 100)
  const gemScored = all
    .filter((p) => !exclude.has(p.id))
    .filter((p) => typeof p.ratingAvg === "number" && typeof p.ratingCount === "number" && p.ratingCount < 100)
    .map((p) => ({ perfume: p, score: baseScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, SECTION_LIMIT);
  const hiddenGems: Recommendation[] = gemScored.map(({ perfume, score }) =>
    makeRec(
      perfume,
      score,
      buildReason(perfume, language, language === "tr" ? "Az bilinen bir keşif" : "An underrated find"),
    ),
  );
  hiddenGems.forEach((r) => exclude.add(r.perfumeId));

  // 6. similarToStyle — match user's top 2 DNA dimensions
  const topDims = topTwoDimensions(userDNA);
  const styleScored = all
    .filter((p) => !exclude.has(p.id))
    .map((p) => ({
      perfume: p,
      score: baseScore(p) + dimensionScore(p, topDims) * 0.6,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, SECTION_LIMIT);
  const similarToStyle: Recommendation[] = styleScored.map(({ perfume, score }) => {
    const dimsLabels = localizeScentLabels(topDims as unknown as string[], language);
    const styleNote = language === "tr"
      ? `${dimsLabels.join(" & ")} stilini güçlendirir`
      : `Reinforces your ${dimsLabels.join(" & ").toLowerCase()} style`;
    return makeRec(perfume, score, buildReason(perfume, language, styleNote));
  });

  return {
    todaysPick,
    todaysPickContext,
    bestMatches,
    freshDaily,
    forNightOut,
    hiddenGems,
    similarToStyle,
  };
}
