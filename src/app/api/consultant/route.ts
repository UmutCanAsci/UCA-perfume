/**
 * src/app/api/consultant/route.ts
 * ────────────────────────────────
 * Route Handler: POST /api/consultant
 *
 * Accepts WizardAnswers, fetches all perfumes from MySQL (including notes and
 * olfactory profiles), scores each one with the three-axis weighted algorithm,
 * and returns the top-3 sorted results.
 *
 * Season / Occasion data is now read directly from the `seasons` and `occasions`
 * DB columns (comma-separated English strings) — the static lookup maps that
 * were previously in this file have been removed entirely.
 *
 * Note arrays are returned bilingually so the UI can pick the right language.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteLayer, Prisma } from "@/generated/prisma/client";
import { calculateMatchScore, WizardAnswers } from "@/lib/matchmaking";
import type { Perfume } from "@/types/perfume";
import { runSyncEngine } from "@/lib/syncEngine";

// ─── Prisma payload type (includes nested relations) ─────────────────────────

const PERFUME_WITH_RELATIONS = {
  include: {
    notes:            true,
    olfactoryProfile: true,
  },
} satisfies Prisma.PerfumeFindManyArgs;

type PerfumeRow = Prisma.PerfumeGetPayload<typeof PERFUME_WITH_RELATIONS>;

// ─── Enum → display string ────────────────────────────────────────────────────

const CONCENTRATION_DISPLAY: Record<string, string> = {
  EAU_DE_PARFUM:   "Eau de Parfum",
  EXTRAIT:         "Extrait de Parfum",
  EAU_DE_TOILETTE: "Eau de Toilette",
};

// ─── Helper: shape DB row → Perfume type for the matchmaking algorithm ────────
//
// The matchmaking algorithm reads:
//   perfume.seasons[]   — English values, e.g. ["Spring", "Summer"]
//   perfume.occasions[] — English values, e.g. ["Casual Everyday", "Office Safe"]
//   perfume.notes.top / .mid / .base — English ingredient names (for keyword bonus)
//   perfume.olfactoryProfile.Floral … Sweet
//
// All four are now sourced directly from MySQL — no static fallback maps.

function dbRowToPerfume(row: PerfumeRow): Perfume & {
  notes_tr: { top: string[]; mid: string[]; base: string[] };
  notes_en: { top: string[]; mid: string[]; base: string[] };
} {
  const notesTr = (layer: NoteLayer): string[] =>
    (row.notes || []).filter((n) => n.layer === layer).map((n) => n.noteNameTr);

  const notesEn = (layer: NoteLayer): string[] =>
    (row.notes || []).filter((n) => n.layer === layer).map((n) => n.noteNameEn);

  const profile = row.olfactoryProfile;

  // Parse comma-separated DB strings into string arrays
  const seasons = row.seasons ? row.seasons.split(',').map(s => s.trim()) : [];
  const occasions = row.occasions ? row.occasions.split(',').map(o => o.trim()) : [];

  // Return canonical concentration key — frontend translateRaw() handles display
  const concentrationKey = String(row.concentration);

  return {
    id:             row.id,
    name:           row.name,
    brand:          row.brand,
    gender:         row.gender as Perfume["gender"],
    concentration:  concentrationKey,
    description:    row.mainDescriptionTr,
    description_tr: row.mainDescriptionTr,
    description_en: row.mainDescriptionEn,

    // Algorithm uses English note names for the keyword-bonus axis
    notes: {
      top:  notesEn(NoteLayer.bas),
      mid:  notesEn(NoteLayer.kalp),
      base: notesEn(NoteLayer.dip),
    },

    // Extra bilingual note fields passed through to the results payload
    notes_tr: {
      top:  notesTr(NoteLayer.bas),
      mid:  notesTr(NoteLayer.kalp),
      base: notesTr(NoteLayer.dip),
    },
    notes_en: {
      top:  notesEn(NoteLayer.bas),
      mid:  notesEn(NoteLayer.kalp),
      base: notesEn(NoteLayer.dip),
    },

    olfactoryProfile: profile
      ? { Floral: profile.floral, Woody: profile.woody, Spicy: profile.spicy, Fresh: profile.fresh, Sweet: profile.sweet }
      : { Floral: 0, Woody: 0, Spicy: 0, Fresh: 0, Sweet: 0 },

    // Sourced directly from MySQL — no static maps
    seasons,
    occasions,

    // Defaults for fields the algorithm doesn't use
    rating:       5.0,
    reviews:      [],
    // Return canonical keys — frontend translateRaw() resolves to active locale
    sillage:      "MODERATE",
    longevity:    "LONG-LASTING",
    yearReleased: 2024,
  };
}

// ─── Mock Fallback Data ───────────────────────────────────────────────────────

const MOCKED_FALLBACK_RECOMMENDATIONS = [
  {
    perfume: {
      id: "bleu-de-chanel",
      name: "Bleu de Chanel",
      brand: "Chanel",
      gender: "Men",
      concentration: "Eau de Parfum",
      description: "Modern erkeğin zamansız özgürlüğünü simgeleyen Bleu de Chanel...",
      description_tr: "Modern erkeğin zamansız özgürlüğünü simgeleyen Bleu de Chanel...",
      description_en: "Symbolizing the timeless freedom of the modern man...",
      notes: {
        top: ["Grapefruit", "Lemon", "Mint", "Pink Pepper"],
        mid: ["Ginger", "Nutmeg", "Jasmine"],
        base: ["Incense", "Cedarwood", "Sandalwood", "Patchouli", "Vetiver"]
      },
      notes_tr: {
        top: ["Greyfurt", "Limon", "Nane", "Pembe Biber"],
        mid: ["Zencefil", "Hindistan Cevizi", "Yasemin"],
        base: ["Tütsü", "Sedir Ağacı", "Sandal Ağacı", "Paçuli", "Vetiver"]
      },
      notes_en: {
        top: ["Grapefruit", "Lemon", "Mint", "Pink Pepper"],
        mid: ["Ginger", "Nutmeg", "Jasmine"],
        base: ["Incense", "Cedarwood", "Sandalwood", "Patchouli", "Vetiver"]
      },
      olfactoryProfile: { Floral: 5, Woody: 40, Spicy: 15, Fresh: 35, Sweet: 5 },
      seasons: ["Spring", "Summer", "Autumn"],
      occasions: ["Casual Everyday", "Office Safe", "Signature Scent"],
      rating: 5.0,
      reviews: [],
      sillage: "Moderate",
      longevity: "Long-Lasting",
      yearReleased: 2024
    },
    percentage: 95
  }
];

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Trigger sync engine immediately on API hit
  await runSyncEngine();

  let answers: WizardAnswers;

  try {
    answers = (await req.json()) as WizardAnswers;
  } catch (err: any) {
    console.log("CRITICAL BACKEND ERROR ->", err);
    return NextResponse.json({ error: `Invalid JSON body: ${err.message}` }, { status: 400 });
  }

  if (!answers.vibe || !answers.season || !answers.occasion) {
    return NextResponse.json(
      { error: "Missing required wizard fields: vibe, season, occasion" },
      { status: 400 }
    );
  }

  // Ensure preferredNotesText is securely initialized as string to prevent toLowerCase crashes
  answers.preferredNotesText = String(answers.preferredNotesText || "");

  try {
    const rows = await prisma.perfume.findMany(PERFUME_WITH_RELATIONS);

    // Fallback if no perfumes found in DB
    if (!rows || rows.length === 0) {
      console.log("Consultant API: Database is empty. Serving mocked fallback recommendations.");
      return NextResponse.json(MOCKED_FALLBACK_RECOMMENDATIONS);
    }

    const scoredList = rows
      .map(dbRowToPerfume)
      .map((perfume) => ({
        perfume,
        percentage: calculateMatchScore(answers, perfume),
      }));

    const top3 = scoredList
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    if (top3.length === 0) {
      return NextResponse.json(MOCKED_FALLBACK_RECOMMENDATIONS);
    }

    return NextResponse.json(top3);
  } catch (err: any) {
    console.log("CRITICAL BACKEND ERROR ->", err);
    console.error("Consultant Route Error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
