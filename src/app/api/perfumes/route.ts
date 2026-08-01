/**
 * src/app/api/perfumes/route.ts
 * ──────────────────────────────
 * Route Handlers: GET | POST /api/perfumes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteLayer, Prisma, SeasonEnum, OccasionEnum } from "@prisma/client";
import { SEASON_MAP, OCCASION_MAP } from "@/lib/localize";

// --- Shared DB row shape ---

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

function shapeRow(row: PerfumeRow) {
  const notesTr = (layer: NoteLayer) =>
    (row.notes || []).filter(n => n.layer === layer).map(n => n.note.nameTr);
  const notesEn = (layer: NoteLayer) =>
    (row.notes || []).filter(n => n.layer === layer).map(n => n.note.nameEn);

  const profile = row.olfactoryProfile;
  const seasons   = (row.seasons || []).map(s => s.season);
  const occasions = (row.occasions || []).map(o => o.occasion);

  return {
    id:             row.id,
    name:           row.name,
    brand:          row.brand,
    gender:         row.gender,
    concentration:  row.concentration,
    description:       row.mainDescriptionTr,
    description_tr:    row.mainDescriptionTr,
    description_en:    row.mainDescriptionEn ?? row.mainDescriptionTr,
    mainDescriptionTr: row.mainDescriptionTr,
    mainDescriptionEn: row.mainDescriptionEn ?? row.mainDescriptionTr,
    notes: {
      top:     notesEn(NoteLayer.TOP),
      mid:     notesEn(NoteLayer.HEART),
      base:    notesEn(NoteLayer.BASE),
      top_tr:  notesTr(NoteLayer.TOP),
      mid_tr:  notesTr(NoteLayer.HEART),
      base_tr: notesTr(NoteLayer.BASE),
      top_en:  notesEn(NoteLayer.TOP),
      mid_en:  notesEn(NoteLayer.HEART),
      base_en: notesEn(NoteLayer.BASE),
    },
    olfactoryProfile: profile
      ? { Floral: profile.floral, Woody: profile.woody, Spicy: profile.spicy, Fresh: profile.fresh, Sweet: profile.sweet }
      : { Floral: 0, Woody: 0, Spicy: 0, Fresh: 0, Sweet: 0 },
    seasons,
    occasions,
    rating:       5.0,
    reviews:      [] as unknown[],
    sillage:      "MODERATE",
    longevity:    "LONG-LASTING",
    yearReleased: 2024,
  };
}

// --- GET /api/perfumes ---

export async function GET() {
  try {
    const rows = await prisma.perfume.findMany({
      ...PERFUME_WITH_RELATIONS,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rows.map(shapeRow));
  } catch (err) {
    console.error("[GET /api/perfumes]", err);
    return NextResponse.json([], { status: 200 });
  }
}

// --- POST /api/perfumes ---

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
  seasons: SeasonEnum[];
  occasions: OccasionEnum[];
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateBody = await req.json();

    const id = (body.id?.trim() || body.name.toLowerCase().replace(/\s+/g, "-"));

    // 1. Upsert Perfume scalar row
    await prisma.perfume.upsert({
      where: { id },
      update: {
        name: body.name, brand: body.brand, concentration: body.concentration, gender: body.gender,
        mainDescriptionEn: body.descriptionEn, mainDescriptionTr: body.descriptionTr,
      },
      create: {
        id, name: body.name, brand: body.brand, concentration: body.concentration, gender: body.gender,
        mainDescriptionEn: body.descriptionEn, mainDescriptionTr: body.descriptionTr,
      },
    });

    // 2. Seasons & Occasions
    await prisma.perfumeSeason.deleteMany({ where: { perfumeId: id } });
    if (Array.isArray(body.seasons) && body.seasons.length > 0) {
      await prisma.perfumeSeason.createMany({
        data: body.seasons.map((season) => ({
          perfumeId: id,
          season,
          seasonTr: SEASON_MAP[season]?.tr ?? String(season),
          seasonEn: SEASON_MAP[season]?.en ?? String(season),
        })),
        skipDuplicates: true,
      });
    }

    await prisma.perfumeOccasion.deleteMany({ where: { perfumeId: id } });
    if (Array.isArray(body.occasions) && body.occasions.length > 0) {
      await prisma.perfumeOccasion.createMany({
        data: body.occasions.map((occasion) => ({
          perfumeId: id,
          occasion,
          occasionTr: OCCASION_MAP[occasion]?.tr ?? String(occasion),
          occasionEn: OCCASION_MAP[occasion]?.en ?? String(occasion),
        })),
        skipDuplicates: true,
      });
    }

    // 3. Delete then recreate note rows (idempotent)
    await prisma.perfumeNote.deleteMany({ where: { perfumeId: id } });

    const noteSpecs: Array<{ tr: string; en: string; layer: NoteLayer }> = [
      ...body.notes.topTr.map((tr, i) => ({ tr, en: body.notes.topEn[i] ?? tr, layer: NoteLayer.TOP })),
      ...body.notes.midTr.map((tr, i) => ({ tr, en: body.notes.midEn[i] ?? tr, layer: NoteLayer.HEART })),
      ...body.notes.baseTr.map((tr, i) => ({ tr, en: body.notes.baseEn[i] ?? tr, layer: NoteLayer.BASE })),
    ];

    for (const spec of noteSpecs) {
      const note = await prisma.note.upsert({
        where: { nameTr: spec.tr },
        update: { nameEn: spec.en },
        create: { nameTr: spec.tr, nameEn: spec.en },
      });

      await prisma.perfumeNote.upsert({
        where: {
          perfumeId_noteId_layer: { perfumeId: id, noteId: note.id, layer: spec.layer },
        },
        update: {},
        create: { perfumeId: id, noteId: note.id, layer: spec.layer },
      });
    }

    // 4. Upsert olfactory profile
    await prisma.olfactoryProfile.upsert({
      where: { perfumeId: id },
      update: { floral: body.olfactoryProfile.Floral, woody: body.olfactoryProfile.Woody, spicy: body.olfactoryProfile.Spicy, fresh: body.olfactoryProfile.Fresh, sweet: body.olfactoryProfile.Sweet },
      create: { perfumeId: id, floral: body.olfactoryProfile.Floral, woody: body.olfactoryProfile.Woody, spicy: body.olfactoryProfile.Spicy, fresh: body.olfactoryProfile.Fresh, sweet: body.olfactoryProfile.Sweet },
    });

    // 5. Read back the fully-shaped record
    const created = await prisma.perfume.findUnique({
      where: { id },
      ...PERFUME_WITH_RELATIONS,
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
