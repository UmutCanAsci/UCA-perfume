/**
 * src/app/api/perfume/[id]/route.ts
 * ──────────────────────────────────
 * Route Handlers: GET | PUT | DELETE /api/perfume/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteLayer, SeasonEnum, OccasionEnum } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const rawPerfume = await prisma.perfume.findUnique({
      where: { id },
      include: {
        notes: {
          include: { note: true },
        },
        seasons: true,
        occasions: true,
        olfactoryProfile: true,
        reviews: {
          include:  { user: true },
          orderBy:  { createdAt: "desc" },
        },
      },
    });

    if (!rawPerfume) {
      return NextResponse.json({ error: "Perfume not found" }, { status: 404 });
    }

    const notesTr = (layer: NoteLayer): string[] =>
      (rawPerfume.notes || [])
        .filter((n) => n.layer === layer)
        .map((n) => n.note.nameTr);

    const notesEn = (layer: NoteLayer): string[] =>
      (rawPerfume.notes || [])
        .filter((n) => n.layer === layer)
        .map((n) => n.note.nameEn);

    const profile = rawPerfume.olfactoryProfile;
    const seasons = (rawPerfume.seasons || []).map((s) => s.season);
    const occasions = (rawPerfume.occasions || []).map((o) => o.occasion);

    const shaped = {
      id:               rawPerfume.id,
      name:             rawPerfume.name,
      brand:            rawPerfume.brand,
      concentration:    rawPerfume.concentration,
      gender:           rawPerfume.gender,
      mainDescription:  rawPerfume.mainDescriptionTr,
      description:      rawPerfume.mainDescriptionTr,
      description_tr:   rawPerfume.mainDescriptionTr,
      description_en:   rawPerfume.mainDescriptionEn ?? rawPerfume.mainDescriptionTr,

      notes: {
        bas:     notesTr(NoteLayer.TOP),
        kalp:    notesTr(NoteLayer.HEART),
        dip:     notesTr(NoteLayer.BASE),
        top:     notesEn(NoteLayer.TOP),
        mid:     notesEn(NoteLayer.HEART),
        base:    notesEn(NoteLayer.BASE),
        top_tr:  notesTr(NoteLayer.TOP),
        top_en:  notesEn(NoteLayer.TOP),
        mid_tr:  notesTr(NoteLayer.HEART),
        mid_en:  notesEn(NoteLayer.HEART),
        base_tr: notesTr(NoteLayer.BASE),
        base_en: notesEn(NoteLayer.BASE),
      },

      olfactoryProfile: profile
        ? { Floral: profile.floral, Woody: profile.woody, Spicy: profile.spicy, Fresh: profile.fresh, Sweet: profile.sweet }
        : { Floral: 0, Woody: 0, Spicy: 0, Fresh: 0, Sweet: 0 },

      seasons,
      occasions,
      seasonalFit:  seasons,
      occasionFit:  occasions,

      rating:       5.0,
      yearReleased: 2024,
      sillage:      "MODERATE",
      longevity:    "LONG-LASTING",

      reviews: rawPerfume.reviews.map((r) => ({
        id:      String(r.id),
        user:    r.user?.username ?? "Anonymous",
        rating:  r.rating,
        comment: r.comment,
        date:    r.createdAt.toISOString().split("T")[0],
      })),
    };

    return NextResponse.json(shaped);
  } catch (err) {
    console.error("[GET /api/perfume/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT /api/perfume/:id ─────────────────────────────────────────────────────

interface NoteLayer3 {
  topEn: string[];
  topTr: string[];
  midEn: string[];
  midTr: string[];
  baseEn: string[];
  baseTr: string[];
}

interface PutBody {
  name: string;
  brand: string;
  gender: string;
  concentration: string;
  descriptionEn: string;
  descriptionTr: string;
  notes: NoteLayer3;
  olfactoryProfile: { Floral: number; Woody: number; Spicy: number; Fresh: number; Sweet: number };
  seasons: SeasonEnum[];
  occasions: OccasionEnum[];
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body: PutBody = await req.json();

    // 1. Update scalar Perfume row
    await prisma.perfume.update({
      where: { id },
      data: {
        name:               body.name,
        brand:              body.brand,
        concentration:      body.concentration,
        gender:             body.gender,
        mainDescriptionEn:  body.descriptionEn,
        mainDescriptionTr:  body.descriptionTr,
      },
    });

    // 2. Seasons & Occasions
    if (Array.isArray(body.seasons)) {
      await prisma.perfumeSeason.deleteMany({ where: { perfumeId: id } });
      await prisma.perfumeSeason.createMany({
        data: body.seasons.map((season) => ({ perfumeId: id, season })),
        skipDuplicates: true,
      });
    }

    if (Array.isArray(body.occasions)) {
      await prisma.perfumeOccasion.deleteMany({ where: { perfumeId: id } });
      await prisma.perfumeOccasion.createMany({
        data: body.occasions.map((occasion) => ({ perfumeId: id, occasion })),
        skipDuplicates: true,
      });
    }

    // 3. Delete all existing notes then recreate
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
      update: {
        floral: body.olfactoryProfile.Floral,
        woody:  body.olfactoryProfile.Woody,
        spicy:  body.olfactoryProfile.Spicy,
        fresh:  body.olfactoryProfile.Fresh,
        sweet:  body.olfactoryProfile.Sweet,
      },
      create: {
        perfumeId: id,
        floral: body.olfactoryProfile.Floral,
        woody:  body.olfactoryProfile.Woody,
        spicy:  body.olfactoryProfile.Spicy,
        fresh:  body.olfactoryProfile.Fresh,
        sweet:  body.olfactoryProfile.Sweet,
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[PUT /api/perfume/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/perfume/:id ──────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.perfume.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ success: true, id, note: "already_deleted" });
    }
    console.error("[DELETE /api/perfume/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
