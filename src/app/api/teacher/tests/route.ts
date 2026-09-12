import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const searchQuery = searchParams.get("search");

  const whereClause: any = {
    teacherId: session.userId,
  };

  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim();
    whereClause.OR = [
      { title: { contains: q } },
      { subject: { contains: q } },
    ];
  }

  const tests = await db.test.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tests });
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      subject,
      description,
      instructions,
      durationMinutes,
      passingPercentage,
      maximumAttempts,
      startAt,
      endAt,
      randomizeQuestions,
      randomizeOptions,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Test Title is required." }, { status: 400 });
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: "Duration must be a positive integer." }, { status: 400 });
    }

    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }

    const newTest = await db.test.create({
      data: {
        title: title.trim(),
        subject: subject.trim(),
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        durationMinutes: duration,
        passingPercentage: passingPercentage ? parseFloat(passingPercentage) : 40.0,
        maximumAttempts: maximumAttempts ? parseInt(maximumAttempts, 10) : 1,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        status: "DRAFT",
        randomizeQuestions: Boolean(randomizeQuestions),
        randomizeOptions: Boolean(randomizeOptions),
        teacherId: session.userId,
      },
    });

    return NextResponse.json({ success: true, test: newTest }, { status: 201 });
  } catch (error) {
    console.error("Create test error:", error);
    return NextResponse.json({ error: "Failed to create examination." }, { status: 500 });
  }
}
