/**
 * src/app/api/auth/login/route.ts
 * ────────────────────────────────
 * Route Handler: POST /api/auth/login
 *
 * Accepts { usernameOrEmail, password } in the request body.
 * Looks up the user by username or email, then uses bcryptjs.compare()
 * to verify the password against the stored hash.
 *
 * Returns a safe user payload (no passwordHash) on success,
 * or a 401 on invalid credentials.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ─── Type for the expected request body ──────────────────────────────────────

interface LoginBody {
  usernameOrEmail: string;
  password: string;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse and validate the request body
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { usernameOrEmail, password } = body;

  if (!usernameOrEmail?.trim() || !password) {
    return NextResponse.json(
      { error: "usernameOrEmail and password are required." },
      { status: 400 }
    );
  }

  const cleanInput = usernameOrEmail.trim().toLowerCase();

  // MySQL's default utf8mb4_general_ci collation is case-insensitive, so a
  // plain equality check on `cleanInput` (already lowercased) is sufficient.
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: cleanInput },
        { email:    cleanInput },
      ],
    },
  });

  // 3. Verify password — use a constant-time comparison to prevent timing attacks.
  //    We call bcrypt.compare even when no user is found (with a dummy hash) so the
  //    response time is the same whether the username exists or not.
  const DUMMY_HASH = "$2b$12$invalidhashusedtopreventimingtattacks00000000000000000000";
  const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(password, hashToCheck);

  if (!user || !passwordMatches) {
    return NextResponse.json(
      { error: "Invalid username/email or password." },
      { status: 401 }
    );
  }

  // 4. Return safe user data — never expose passwordHash
  return NextResponse.json({
    success: true,
    user: {
      id:        user.id,
      username:  user.username,
      email:     user.email,
      role:      user.role,
      createdAt: user.createdAt,
    },
  });
}
