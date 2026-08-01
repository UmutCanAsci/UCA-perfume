/**
 * src/app/api/auth/signup/route.ts
 * ────────────────────────────────
 * Route Handler: POST /api/auth/signup
 *
 * Accepts { username, email, password } in the request body.
 * Hashes the password with bcryptjs, then writes a new row to the
 * `users` table via Prisma.
 *
 * Prisma User model fields (schema.prisma):
 *   id           Int      @id @default(autoincrement())
 *   username     String   @unique @db.VarChar(60)
 *   email        String   @unique @db.VarChar(255)
 *   passwordHash String   @db.VarChar(255)
 *   createdAt    DateTime @default(now())
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ─── Type for the expected request body ──────────────────────────────────────

interface SignUpBody {
  username: string;
  email: string;
  password: string;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse and validate the request body
  let body: SignUpBody;
  try {
    body = (await req.json()) as SignUpBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { username, email, password } = body;

  if (!username?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "username, email, and password are all required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  // 2. Hash the password — bcryptjs is pure JS, no native bindings needed
  const SALT_ROUNDS = 12;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Write the new user row to MySQL via Prisma
  try {
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      },
      // Only return safe fields — never return passwordHash to the client
      select: {
        id:        true,
        username:  true,
        email:     true,
        role:      true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Prisma unique constraint violation (P2002) → username or email already taken
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const field = (err.meta?.target as string[] | undefined)?.[0] ?? "field";
      return NextResponse.json(
        { error: `That ${field} is already registered.` },
        { status: 409 }
      );
    }

    console.error("[/api/auth/signup] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected server error occurred. Please try again." },
      { status: 500 }
    );
  }
}
