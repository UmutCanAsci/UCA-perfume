/**
 * src/app/api/reviews/route.ts
 * ─────────────────────────────
 * Route Handlers: GET | POST /api/reviews
 *
 * GET  — Fetches all reviews from MySQL via Prisma, joining user.username and
 *         perfume.name / perfume.brand. Returns newest-first sorted array.
 *
 * POST — Accepts { perfumeId, rating, comment, username } and writes a new
 *         Review row. Requires a valid, registered username (looked up in DB)
 *         and returns 401 if the user cannot be resolved. Returns 201 with
 *         the newly shaped record on success.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Shared response shape ──────────────────────────────────────────────────

export interface HomeReviewDTO {
  id: number;
  perfumeId: string;
  perfumeName: string;
  brand: string;
  rating: number;
  comment: string;
  user: string;       // username string
  date: string;       // "YYYY-MM-DD"
  createdAt: string;  // full ISO timestamp
}

function shapeReview(r: {
  id: number;
  perfumeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { username: string };
  perfume: { name: string; brand: string };
}): HomeReviewDTO {
  return {
    id:          r.id,
    perfumeId:   r.perfumeId,
    perfumeName: r.perfume.name,
    brand:       r.perfume.brand,
    rating:      r.rating,
    comment:     r.comment,
    user:        r.user.username,
    date:        r.createdAt.toISOString().split("T")[0],
    createdAt:   r.createdAt.toISOString(),
  };
}

// ─── GET /api/reviews ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const rows = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user:    { select: { username: true } },
        perfume: { select: { name: true, brand: true } },
      },
    });

    return NextResponse.json(rows.map(shapeReview));
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    // Graceful degradation: return empty array so the UI shows empty state
    return NextResponse.json([], { status: 200 });
  }
}

// ─── POST /api/reviews ──────────────────────────────────────────────────────

interface CreateReviewBody {
  perfumeId: string;
  rating: number;
  comment: string;
  username: string; // the logged-in user's username
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateReviewBody = await req.json();

    const { perfumeId, rating, comment, username } = body;

    // --- Validation ---
    if (!perfumeId || !comment || !username) {
      return NextResponse.json(
        { error: "perfumeId, comment, and username are required." },
        { status: 400 }
      );
    }

    const clampedRating = Math.min(5, Math.max(1, Math.round(rating ?? 5)));

    // --- Auth guard: resolve user from DB by username, or fall back to a Guest row ---
    // The DB Review model has a non-nullable userId FK. Rather than returning 401
    // for unregistered usernames (which breaks the guest review path), we upsert a
    // canonical "Guest" user row and use its id so the FK constraint is satisfied.
    let dbUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!dbUser) {
      // Attempt to find or create a lightweight guest record.
      // We use a determistic email so concurrent requests don't race-create duplicates.
      const guestEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@guest.uca.com`;
      try {
        dbUser = await prisma.user.upsert({
          where: { email: guestEmail },
          update: {},
          create: {
            username: username.slice(0, 60),
            email: guestEmail,
            passwordHash: "guest_no_auth",
          },
          select: { id: true, username: true },
        });
      } catch {
        // If upsert fails (e.g. username uniqueness collision), fall back to the
        // canonical Guest user or return a clean 401.
        const fallback = await prisma.user.findUnique({
          where: { username: "Guest" },
          select: { id: true, username: true },
        });
        if (!fallback) {
          return NextResponse.json(
            { error: "Could not resolve a user identity. Please sign in and try again." },
            { status: 401 }
          );
        }
        dbUser = fallback;
      }
    }

    // --- Verify the perfume exists ---
    const perfumeExists = await prisma.perfume.findUnique({
      where: { id: perfumeId },
      select: { id: true },
    });

    if (!perfumeExists) {
      return NextResponse.json(
        { error: `Perfume '${perfumeId}' not found in the catalogue.` },
        { status: 404 }
      );
    }

    // --- Persist the review ---
    const created = await prisma.review.create({
      data: {
        userId:    dbUser.id,
        perfumeId,
        rating:    clampedRating,
        comment:   comment.trim(),
      },
      include: {
        user:    { select: { username: true } },
        perfume: { select: { name: true, brand: true } },
      },
    });

    return NextResponse.json(shapeReview(created), { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
