import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch user's favorites
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get("userId");

    if (!userIdStr) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const items = await prisma.userFavorite.findMany({
      where: { userId },
      include: { perfume: true },
    });
    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    console.error("Favorites GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST: Safely add perfume to favorites (Upserting with parsed types)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Defensive parsing: Convert potential string IDs from client to integer
    const userId = typeof body.userId === "string" ? parseInt(body.userId, 10) : Number(body.userId);
    const { perfumeId } = body;

    if (!userId || isNaN(userId) || !perfumeId) {
      return NextResponse.json(
        { error: "Invalid or missing userId or perfumeId", received: { userId, perfumeId } }, 
        { status: 400 }
      );
    }

    const entry = await prisma.userFavorite.upsert({
      where: {
        userId_perfumeId: {
          userId,
          perfumeId,
        },
      },
      update: {}, // Keep existing record if already favorited
      create: {
        userId,
        perfumeId,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error: any) {
    console.error("Favorites POST API Database Error:", error);
    return NextResponse.json({ error: error.message || "Database execution failed" }, { status: 500 });
  }
}

// DELETE: Safely remove from favorites
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? parseInt(body.userId, 10) : Number(body.userId);
    const { perfumeId } = body;

    if (!userId || isNaN(userId) || !perfumeId) {
      return NextResponse.json({ error: "Invalid or missing parameters" }, { status: 400 });
    }

    await prisma.userFavorite.delete({
      where: {
        userId_perfumeId: {
          userId,
          perfumeId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Removed from favorites" }, { status: 200 });
  } catch (error: any) {
    console.error("Favorites DELETE API Database Error:", error);
    return NextResponse.json({ error: error.message || "Database deletion failed" }, { status: 500 });
  }
}
