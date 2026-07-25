/**
 * src/app/api/perfume/[id]/route.ts
 * ──────────────────────────────────
 * Route Handlers: GET | PUT | DELETE /api/perfume/:id
 *
 * GET  — Returns a fully-shaped perfume payload with bilingual notes,
 *         olfactory profile, and user reviews.
 * PUT  — Full update: replaces all scalar fields, recreates all note rows,
 *         and upserts the olfactory profile. Cascade-safe.
 * DELETE — Removes the perfume and all related rows via Prisma cascade.
 *
 * Relations included:
 *   • notes            — PerfumeNote rows grouped by layer, with _tr / _en fields
 *   • olfactoryProfile — five-axis sensory weights
 *   • reviews          — user reviews with author username
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteLayer, Concentration, Gender } from "@/generated/prisma/client";

// ─── Shared enum helpers ──────────────────────────────────────────────────────

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const rawPerfume = await prisma.perfume.findUnique({
      where: { id },
      include: {
        notes:            true,
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

    // ── Enum → display string ─────────────────────────────────────────────────
    const CONCENTRATION_DISPLAY: Record<string, string> = {
      EAU_DE_PARFUM:   "Eau de Parfum",
      EXTRAIT:         "Extrait de Parfum",
      EAU_DE_TOILETTE: "Eau de Toilette",
    };

    // ── Note helpers (bilingual) ──────────────────────────────────────────────
    const notesTr = (layer: NoteLayer): string[] =>
      rawPerfume.notes.filter((n) => n.layer === layer).map((n) => n.noteNameTr);

    const notesEn = (layer: NoteLayer): string[] =>
      rawPerfume.notes.filter((n) => n.layer === layer).map((n) => n.noteNameEn);

    const profile = rawPerfume.olfactoryProfile;

    // ── Season / Occasion (stored as comma-separated English strings) ─────────
    const seasons   = rawPerfume.seasons.split(",").map((s) => s.trim()).filter(Boolean);
    const occasions = rawPerfume.occasions.split(",").map((s) => s.trim()).filter(Boolean);

    // ── Enum → canonical key (frontend handles display via translateRaw) ──────
    const concentrationKey = String(rawPerfume.concentration);

    const shaped = {
      id:            rawPerfume.id,
      name:          rawPerfume.name,
      brand:         rawPerfume.brand,
      concentration: concentrationKey,
      gender:        rawPerfume.gender,

      mainDescription:  rawPerfume.mainDescriptionTr,
      description:      rawPerfume.mainDescriptionTr,
      description_tr:   rawPerfume.mainDescriptionTr,
      description_en:   rawPerfume.mainDescriptionEn,

      // Bilingual note arrays — client picks the right language at render time
      notes: {
        // Turkish (DB storage layer)
        bas:  notesTr(NoteLayer.bas),
        kalp: notesTr(NoteLayer.kalp),
        dip:  notesTr(NoteLayer.dip),
        // English aliases
        top:  notesEn(NoteLayer.bas),
        mid:  notesEn(NoteLayer.kalp),
        base: notesEn(NoteLayer.dip),
        // Explicit bilingual fields for language-aware rendering
        top_tr:  notesTr(NoteLayer.bas),
        top_en:  notesEn(NoteLayer.bas),
        mid_tr:  notesTr(NoteLayer.kalp),
        mid_en:  notesEn(NoteLayer.kalp),
        base_tr: notesTr(NoteLayer.dip),
        base_en: notesEn(NoteLayer.dip),
      },

      olfactoryProfile: profile
        ? { Floral: profile.floral, Woody: profile.woody, Spicy: profile.spicy, Fresh: profile.fresh, Sweet: profile.sweet }
        : { Floral: 0, Woody: 0, Spicy: 0, Fresh: 0, Sweet: 0 },

      // Season / Occasion from DB columns — no longer hardcoded
      seasons,
      occasions,
      seasonalFit:  seasons,   // backward compat alias
      occasionFit:  occasions, // backward compat alias

      rating:       5.0,
      yearReleased: 2024,
      // Return canonical keys — frontend translateRaw() resolves to active locale
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
// Full update: replaces all scalar fields, deletes + recreates all note rows,
// and upserts the five-axis olfactory profile. Body shape mirrors the admin form.

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
  seasons: string;
  occasions: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body: PutBody = await req.json();

    const concentration = toConcentrationEnum(body.concentration);
    const gender = toGenderEnum(body.gender);

    // 1. Update scalar Perfume row
    await prisma.perfume.update({
      where: { id },
      data: {
        name:               body.name,
        brand:              body.brand,
        concentration,
        gender,
        mainDescriptionEn:  body.descriptionEn,
        mainDescriptionTr:  body.descriptionTr,
        seasons:            body.seasons,
        occasions:          body.occasions,
      },
    });

    // 2. Delete all existing notes then recreate (idempotent, cleanest approach)
    await prisma.perfumeNote.deleteMany({ where: { perfumeId: id } });

    const noteRows: Array<{ perfumeId: string; noteNameEn: string; noteNameTr: string; layer: NoteLayer }> = [
      ...body.notes.topEn.map((en, i) => ({
        perfumeId: id,
        noteNameEn: en,
        noteNameTr: body.notes.topTr[i] ?? en,
        layer: NoteLayer.bas,
      })),
      ...body.notes.midEn.map((en, i) => ({
        perfumeId: id,
        noteNameEn: en,
        noteNameTr: body.notes.midTr[i] ?? en,
        layer: NoteLayer.kalp,
      })),
      ...body.notes.baseEn.map((en, i) => ({
        perfumeId: id,
        noteNameEn: en,
        noteNameTr: body.notes.baseTr[i] ?? en,
        layer: NoteLayer.dip,
      })),
    ];

    if (noteRows.length > 0) {
      await prisma.perfumeNote.createMany({ data: noteRows });
    }

    // 3. Upsert olfactory profile
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
// Removes the Perfume row; cascade rules in schema.prisma automatically delete
// PerfumeNote, OlfactoryProfile, UserWardrobe, and Review rows.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.perfume.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    // P2025 = record not found — treat as success (already deleted)
    if (err?.code === "P2025") {
      return NextResponse.json({ success: true, id, note: "already_deleted" });
    }
    console.error("[DELETE /api/perfume/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
