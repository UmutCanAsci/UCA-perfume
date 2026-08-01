/**
 * src/app/api/consultant/route.ts
 * ────────────────────────────────
 * Route Handler: POST /api/consultant
 *
 * Accepts WizardAnswers, fetches all perfumes from MySQL (including notes,
 * seasons, occasions, and olfactory profiles), scores each one with the
 * three-axis weighted algorithm, and returns the top-3 sorted results.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteLayer, Prisma } from "@prisma/client";
import { calculateMatchScore, WizardAnswers } from "@/lib/matchmaking";
import type { Perfume } from "@/types/perfume";
import { runSyncEngine } from "@/lib/syncEngine";

// ─── Prisma payload type (includes nested relations) ─────────────────────────

const PERFUME_WITH_RELATIONS = {
  include: {
    notes: {
      include: { note: true },
    },
    seasons: true,
    occasions: true,
    olfactoryProfile: true,
  },
} satisfies Prisma.PerfumeFindManyArgs;

type PerfumeRow = Prisma.PerfumeGetPayload<typeof PERFUME_WITH_RELATIONS>;

// ─── Helper: shape DB row → Perfume type for the matchmaking algorithm ────────

function dbRowToPerfume(row: PerfumeRow): Perfume & {
  notes_tr: { top: string[]; mid: string[]; base: string[] };
  notes_en: { top: string[]; mid: string[]; base: string[] };
} {
  const notesTr = (layer: NoteLayer): string[] =>
    (row.notes || [])
      .filter((n) => n.layer === layer)
      .map((n) => n.note.nameTr);

  const notesEn = (layer: NoteLayer): string[] =>
    (row.notes || [])
      .filter((n) => n.layer === layer)
      .map((n) => n.note.nameEn);

  const profile = row.olfactoryProfile;

  const seasons = (row.seasons || []).map((s) => s.season);
  const occasions = (row.occasions || []).map((o) => o.occasion);

  return {
    id:             row.id,
    name:           row.name,
    brand:          row.brand,
    gender:         row.gender as Perfume["gender"],
    concentration:  row.concentration,
    description:    row.mainDescriptionTr,
    description_tr: row.mainDescriptionTr,
    description_en: row.mainDescriptionEn ?? row.mainDescriptionTr,

    // Algorithm uses English note names for the keyword-bonus axis
    notes: {
      top:  notesEn(NoteLayer.TOP),
      mid:  notesEn(NoteLayer.HEART),
      base: notesEn(NoteLayer.BASE),
    },

    // Extra bilingual note fields passed through to the results payload
    notes_tr: {
      top:  notesTr(NoteLayer.TOP),
      mid:  notesTr(NoteLayer.HEART),
      base: notesTr(NoteLayer.BASE),
    },
    notes_en: {
      top:  notesEn(NoteLayer.TOP),
      mid:  notesEn(NoteLayer.HEART),
      base: notesEn(NoteLayer.BASE),
    },

    olfactoryProfile: profile
      ? { Floral: profile.floral, Woody: profile.woody, Spicy: profile.spicy, Fresh: profile.fresh, Sweet: profile.sweet }
      : { Floral: 0, Woody: 0, Spicy: 0, Fresh: 0, Sweet: 0 },

    seasons,
    occasions,

    rating:       5.0,
    reviews:      [],
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

  answers.preferredNotesText = String(answers.preferredNotesText || "");

  try {
    const rows = await prisma.perfume.findMany(PERFUME_WITH_RELATIONS);

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
