import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get("userId");
    if (!userIdStr) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const userId = parseInt(userIdStr, 10);
    const items = await prisma.userWardrobe.findMany({
      where: { userId },
      include: { perfume: true },
    });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Wardrobe GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === 'string' ? parseInt(body.userId, 10) : body.userId;
    const { perfumeId } = body;

    if (!userId || isNaN(userId) || !perfumeId) {
      return NextResponse.json({ error: "Invalid or missing userId/perfumeId" }, { status: 400 });
    }

    const entry = await prisma.userWardrobe.upsert({
      where: {
        userId_perfumeId: { userId, perfumeId }
      },
      update: {},
      create: { userId, perfumeId }
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error: any) {
    console.error("API POST Error Details:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === 'string' ? parseInt(body.userId, 10) : body.userId;
    const { perfumeId } = body;

    if (!userId || isNaN(userId) || !perfumeId) {
      return NextResponse.json({ error: "Invalid or missing userId/perfumeId" }, { status: 400 });
    }

    await prisma.userWardrobe.delete({
      where: { userId_perfumeId: { userId, perfumeId } },
    });
    return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("API DELETE Error Details:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
