import { Perfume } from "@/types/perfume";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardAnswers {
  /** Vibe selection from Step 1: "Silk" | "Smoke" | "Rain" | "Sun" | "Forest" | "Spice" */
  vibe: string;
  /** Style selection from Step 2: "Minimalist" | "Charismatic" | "Free Spirit" | "Romantic" */
  style: string;
  /** Occasion from Step 3: "Daily Wear" | "Office / Work" | "Date Night" | "Night Out" | "Special Occasion" */
  occasion: string;
  /** Season from Step 3: "Spring" | "Summer" | "Autumn" | "Winter" | "All Seasons" */
  season: string;
  /** Gender preference: "Feminine" | "Masculine" | "Unisex" */
  gender: string;
  /** Intensity: "Light" | "Moderate" | "Rich / Intense" */
  intensity: string;
  /** Sillage preference */
  sillage: string;
  /** Dress code */
  dressCode: string;
  /** Free-text preferred notes (comma-separated) */
  preferredNotesText: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 1 – Seasonal Fit  (max 35 pts)
// ─────────────────────────────────────────────────────────────────────────────

function scoreSeasonalFit(answers: WizardAnswers, perfume: Perfume): number {
  const { season } = answers;
  const seasons: string[] = perfume.seasons ?? [];

  if (season === "All Seasons") {
    return seasons.includes("All Seasons") ? 35 : 28;
  }
  if (seasons.includes(season)) return 35;
  if (seasons.includes("All Seasons")) return 30;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 2 – Occasion Fit  (max 35 pts)
// ─────────────────────────────────────────────────────────────────────────────

const OCCASION_MAP: Record<string, string[]> = {
  "Daily Wear":       ["Casual Everyday", "Office Safe"],
  "Office / Work":    ["Office Safe", "Casual Everyday"],
  "Date Night":       ["Date Night", "Gala Formal"],
  "Night Out":        ["Date Night", "Gala Formal"],
  "Special Occasion": ["Gala Formal", "Date Night"],
};

function scoreOccasionFit(answers: WizardAnswers, perfume: Perfume): number {
  const { occasion } = answers;
  const occasions: string[] = perfume.occasions ?? [];
  const targets = OCCASION_MAP[occasion] ?? [];

  if (targets.length > 0 && occasions.includes(targets[0])) return 35;
  if (targets.length > 1 && occasions.includes(targets[1])) return 25;
  if (occasions.length >= 3) return 15;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 3 – Olfactory Profile Alignment  (max 30 pts)
// ─────────────────────────────────────────────────────────────────────────────

interface OlfactoryVector {
  Floral: number;
  Woody: number;
  Spicy: number;
  Fresh: number;
  Sweet: number;
}

function buildTargetVector(answers: WizardAnswers): OlfactoryVector {
  let Floral = 20, Woody = 20, Spicy = 20, Fresh = 20, Sweet = 20;

  switch (answers.vibe) {
    case "Silk":   Floral += 40; Fresh += 20; Sweet += 10; Woody -= 10; Spicy -= 10; break;
    case "Smoke":  Woody += 40; Spicy += 30; Fresh -= 20; Floral -= 10; break;
    case "Rain":   Fresh += 40; Floral += 10; Woody += 10; Sweet -= 20; Spicy -= 10; break;
    case "Sun":    Sweet += 30; Fresh += 20; Floral += 10; Woody -= 15; break;
    case "Forest": Woody += 40; Fresh += 20; Sweet -= 15; Spicy -= 10; break;
    case "Spice":  Spicy += 45; Sweet += 15; Fresh -= 15; Floral -= 15; break;
  }

  switch (answers.style) {
    case "Minimalist":  Fresh += 20; Floral -= 10; Sweet -= 10; break;
    case "Charismatic": Woody += 20; Spicy += 20; Fresh -= 10; break;
    case "Free Spirit": Fresh += 30; Sweet -= 15; break;
    case "Romantic":    Floral += 30; Sweet += 10; break;
  }

  if (answers.occasion === "Daily Wear" || answers.occasion === "Office / Work") {
    Fresh += 10; Spicy -= 10; Sweet -= 10;
  } else if (["Date Night", "Night Out", "Special Occasion"].includes(answers.occasion)) {
    Sweet += 15; Spicy += 15; Fresh -= 15;
  }

  switch (answers.season) {
    case "Spring": Floral += 15; Fresh += 10; break;
    case "Summer": Fresh += 25; Sweet -= 10; Spicy -= 10; break;
    case "Autumn": Woody += 15; Spicy += 10; break;
    case "Winter": Sweet += 20; Spicy += 15; Fresh -= 15; break;
  }

  return {
    Floral: Math.max(0, Floral),
    Woody:  Math.max(0, Woody),
    Spicy:  Math.max(0, Spicy),
    Fresh:  Math.max(0, Fresh),
    Sweet:  Math.max(0, Sweet),
  };
}

function normalise(v: OlfactoryVector): OlfactoryVector {
  const total = v.Floral + v.Woody + v.Spicy + v.Fresh + v.Sweet;
  if (total === 0) return { Floral: 20, Woody: 20, Spicy: 20, Fresh: 20, Sweet: 20 };
  return {
    Floral: (v.Floral / total) * 100,
    Woody:  (v.Woody  / total) * 100,
    Spicy:  (v.Spicy  / total) * 100,
    Fresh:  (v.Fresh  / total) * 100,
    Sweet:  (v.Sweet  / total) * 100,
  };
}

function scoreOlfactoryAlignment(answers: WizardAnswers, perfume: Perfume): number {
  const target     = normalise(buildTargetVector(answers));
  const profile    = perfume.olfactoryProfile;
  const profileSum = profile.Floral + profile.Woody + profile.Spicy + profile.Fresh + profile.Sweet;

  const normProfile: OlfactoryVector =
    profileSum > 0
      ? {
          Floral: (profile.Floral / profileSum) * 100,
          Woody:  (profile.Woody  / profileSum) * 100,
          Spicy:  (profile.Spicy  / profileSum) * 100,
          Fresh:  (profile.Fresh  / profileSum) * 100,
          Sweet:  (profile.Sweet  / profileSum) * 100,
        }
      : { Floral: 20, Woody: 20, Spicy: 20, Fresh: 20, Sweet: 20 };

  const totalDeviation =
    Math.abs(target.Floral - normProfile.Floral) +
    Math.abs(target.Woody  - normProfile.Woody)  +
    Math.abs(target.Spicy  - normProfile.Spicy)  +
    Math.abs(target.Fresh  - normProfile.Fresh)  +
    Math.abs(target.Sweet  - normProfile.Sweet);

  // 0 deviation -> 30 pts, 200 deviation -> 0 pts
  return Math.max(0, (1 - totalDeviation / 200) * 30);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bonus tie-breakers  (gender alignment + preferred notes keywords)
// ─────────────────────────────────────────────────────────────────────────────

function scoreBonusFactors(answers: WizardAnswers, perfume: Perfume): number {
  let bonus = 0;

  if (answers.gender === "Feminine") {
    if (perfume.gender === "Women") bonus += 5;
    else if (perfume.gender === "Men") bonus -= 5;
  } else if (answers.gender === "Masculine") {
    if (perfume.gender === "Men") bonus += 5;
    else if (perfume.gender === "Women") bonus -= 5;
  }

  const noteKeywords = answers.preferredNotesText
    .toLowerCase()
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (noteKeywords.length > 0) {
    const allNotes = [
      ...(perfume.notes.top  ?? []),
      ...(perfume.notes.mid  ?? []),
      ...(perfume.notes.base ?? []),
    ].map((n) => n.toLowerCase());

    let noteBonus = 0;
    for (const keyword of noteKeywords) {
      if (allNotes.some((n) => n.includes(keyword))) noteBonus += 2;
    }
    bonus += Math.min(noteBonus, 8);
  }

  return bonus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates a compatibility match score (30–98) for a perfume
 * given a user's wizard answers, using a three-axis weighted scoring model:
 *
 *   Seasonal Fit        → 35 pts
 *   Occasion Fit        → 35 pts
 *   Olfactory Alignment → 30 pts
 *   + Bonus (gender + notes keywords) ≤ ~13 pts
 *
 * Result is clamped to [30, 98].
 */
export function calculateMatchScore(
  answers: WizardAnswers,
  perfume: Perfume
): number {
  const seasonal  = scoreSeasonalFit(answers, perfume);
  const occasion  = scoreOccasionFit(answers, perfume);
  const olfactory = scoreOlfactoryAlignment(answers, perfume);
  const bonus     = scoreBonusFactors(answers, perfume);

  const raw = seasonal + occasion + olfactory + bonus;
  return Math.min(98, Math.max(30, Math.round(raw)));
}
