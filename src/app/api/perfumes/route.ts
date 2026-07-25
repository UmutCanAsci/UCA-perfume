/**
 * src/app/api/perfumes/route.ts
 * ──────────────────────────────
 * Route Handlers: GET | POST /api/perfumes
 *
 * GET  — Returns the full perfume catalogue from MySQL, shaped into the
 *         client-side Perfume interface (bilingual notes, olfactory profile,
 *         seasons, occasions). This is the single source of truth that the
 *         UCAContext uses to hydrate the perfumes state array on
 *         every application mount — eliminating reliance on the static JSON.
 *
 * POST — Creates a brand-new perfume record in MySQL with full cascade:
 *          * Perfume scalar row
 *          * PerfumeNote rows for all three layers (bilingual EN + TR)
 *          * OlfactoryProfile row
 *         Returns the fully-shaped new record so the context can merge it
 *         without a second round-trip.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteLayer, Concentration, Gender, Prisma } from "@/generated/prisma/client";

// --- Shared enum helpers ---

function toConcentrationEnum(raw: string): Concentration {
  switch (raw) {
    case "Eau de Parfum":     return Concentration.EAU_DE_PARFUM;
    case "Extrait de Parfum": return Concentration.EXTRAIT;
    case "Eau de Toilette":   return Concentration.EAU_DE_TOILETTE;
    default:                  return Concentration.EAU_DE_PARFUM;
  }
}

function toGenderEnum(raw: string): Gender {
  switch (raw) {
    case "Men":    return Gender.Men;
    case "Women":  return Gender.Women;
    default:       return Gender.Unisex;
  }
}

// --- Shared DB row shape ---

const CONCENTRATION_DISPLAY: Record<string, string> = {
  EAU_DE_PARFUM:   "Eau de Parfum",
  EXTRAIT:         "Extrait de Parfum",
  EAU_DE_TOILETTE: "Eau de Toilette",
};

const PERFUME_WITH_RELATIONS = {
  include: {
    notes:            true,
    olfactoryProfile: true,
  },
} satisfies Prisma.PerfumeFindManyArgs;

type PerfumeRow = Prisma.PerfumeGetPayload<typeof PERFUME_WITH_RELATIONS>;

function shapeRow(row: PerfumeRow) {
  const notesTr = (layer: NoteLayer) =>
    row.notes.filter(n => n.layer === layer).map(n => n.noteNameTr);
  const notesEn = (layer: NoteLayer) =>
    row.notes.filter(n => n.layer === layer).map(n => n.noteNameEn);

  const profile = row.olfactoryProfile;
  const seasons   = row.seasons.split(",").map((s: string) => s.trim()).filter(Boolean);
  const occasions = row.occasions.split(",").map((s: string) => s.trim()).filter(Boolean);

  // Return canonical concentration key — frontend uses translateRaw() to localize display
  const concentrationKey = String(row.concentration);

  return {
    id:             row.id,
    name:           row.name,
    brand:          row.brand,
    gender:         row.gender as string,
    concentration:  concentrationKey,
    description:    row.mainDescriptionTr,
    description_tr: row.mainDescriptionTr,
    description_en: row.mainDescriptionEn,
    notes: {
      top:     notesEn(NoteLayer.bas),
      mid:     notesEn(NoteLayer.kalp),
      base:    notesEn(NoteLayer.dip),
      top_tr:  notesTr(NoteLayer.bas),
      mid_tr:  notesTr(NoteLayer.kalp),
      base_tr: notesTr(NoteLayer.dip),
      top_en:  notesEn(NoteLayer.bas),
      mid_en:  notesEn(NoteLayer.kalp),
      base_en: notesEn(NoteLayer.dip),
    },
    olfactoryProfile: profile
      ? { Floral: profile.floral, Woody: profile.woody, Spicy: profile.spicy, Fresh: profile.fresh, Sweet: profile.sweet }
      : { Floral: 0, Woody: 0, Spicy: 0, Fresh: 0, Sweet: 0 },
    seasons,
    occasions,
    rating:      5.0,
    reviews:     [] as unknown[],
    // Return canonical keys — frontend translateRaw() resolves these to the active locale
    sillage:     "MODERATE",
    longevity:   "LONG-LASTING",
    yearReleased: 2024,
  };
}

// --- GET /api/perfumes ---
// Returns the full catalogue sorted by name.
// Called by UCAContext on mount to replace the static JSON seed.

export async function GET() {
  try {
    const rows = await prisma.perfume.findMany({
      ...PERFUME_WITH_RELATIONS,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rows.map(shapeRow));
  } catch (err) {
    console.error("[GET /api/perfumes]", err);
    // Graceful degradation: return an empty array so the context falls back
    // to the static JSON seed that is already loaded.
    return NextResponse.json([], { status: 200 });
  }
}

// --- POST /api/perfumes ---
// Creates a new perfume record with full relational cascade.

interface CreateBody {
  id?: string;
  name: string;
  brand: string;
  gender: string;
  concentration: string;
  descriptionEn: string;
  descriptionTr: string;
  notes: {
    topEn: string[];  topTr: string[];
    midEn: string[];  midTr: string[];
    baseEn: string[]; baseTr: string[];
  };
  olfactoryProfile: { Floral: number; Woody: number; Spicy: number; Fresh: number; Sweet: number };
  seasons: string;
  occasions: string;
  sillage?: string;
  longevity?: string;
  yearReleased?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateBody = await req.json();

    const id = (body.id?.trim() || body.name.toLowerCase().replace(/\s+/g, "-"));
    const concentration = toConcentrationEnum(body.concentration);
    const gender = toGenderEnum(body.gender);

    // 1. Upsert Perfume scalar row
    await prisma.perfume.upsert({
      where: { id },
      update: {
        name: body.name, brand: body.brand, concentration, gender,
        mainDescriptionEn: body.descriptionEn, mainDescriptionTr: body.descriptionTr,
        seasons: body.seasons, occasions: body.occasions,
      },
      create: {
        id, name: body.name, brand: body.brand, concentration, gender,
        mainDescriptionEn: body.descriptionEn, mainDescriptionTr: body.descriptionTr,
        seasons: body.seasons, occasions: body.occasions,
      },
    });

    // 2. Delete then recreate note rows (idempotent)
    await prisma.perfumeNote.deleteMany({ where: { perfumeId: id } });

    const noteRows: Array<{
      perfumeId: string; noteNameEn: string; noteNameTr: string; layer: NoteLayer;
    }> = [
      ...body.notes.topEn.map((en, i) => ({ perfumeId: id, noteNameEn: en, noteNameTr: body.notes.topTr[i] ?? en, layer: NoteLayer.bas })),
      ...body.notes.midEn.map((en, i) => ({ perfumeId: id, noteNameEn: en, noteNameTr: body.notes.midTr[i] ?? en, layer: NoteLayer.kalp })),
      ...body.notes.baseEn.map((en, i) => ({ perfumeId: id, noteNameEn: en, noteNameTr: body.notes.baseTr[i] ?? en, layer: NoteLayer.dip })),
    ];

    if (noteRows.length > 0) {
      await prisma.perfumeNote.createMany({ data: noteRows });
    }

    // 3. Upsert olfactory profile
    await prisma.olfactoryProfile.upsert({
      where: { perfumeId: id },
      update: { floral: body.olfactoryProfile.Floral, woody: body.olfactoryProfile.Woody, spicy: body.olfactoryProfile.Spicy, fresh: body.olfactoryProfile.Fresh, sweet: body.olfactoryProfile.Sweet },
      create: { perfumeId: id, floral: body.olfactoryProfile.Floral, woody: body.olfactoryProfile.Woody, spicy: body.olfactoryProfile.Spicy, fresh: body.olfactoryProfile.Fresh, sweet: body.olfactoryProfile.Sweet },
    });

    // 4. Read back the fully-shaped record
    const created = await prisma.perfume.findUnique({
      where: { id },
      include: { notes: true, olfactoryProfile: true },
    });

    if (!created) {
      return NextResponse.json({ error: "Record not found after creation" }, { status: 500 });
    }

    return NextResponse.json(shapeRow(created as PerfumeRow), { status: 201 });
  } catch (err) {
    console.error("[POST /api/perfumes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
