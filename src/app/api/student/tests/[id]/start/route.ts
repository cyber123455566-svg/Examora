import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Student role required." }, { status: 403 });
  }

  const { id: testId } = await context.params;

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Examination not found." }, { status: 404 });
  }

  if (test.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Examination is not available for testing." }, { status: 403 });
  }

  const now = new Date();
  if (test.startAt && now < new Date(test.startAt)) {
    return NextResponse.json(
      { error: `This examination is not active yet. It will open on ${new Date(test.startAt).toLocaleString()}.` },
      { status: 403 }
    );
  }

  if (test.endAt && now > new Date(test.endAt)) {
    return NextResponse.json(
      { error: "This examination has concluded and is no longer accepting attempts." },
      { status: 403 }
    );
  }

  // 1. Check for existing active attempt (prevent duplicate attempts & allow refresh restoration)
  const existingActiveAttempt = await db.testAttempt.findFirst({
    where: {
      testId,
      studentId: session.userId,
      status: "IN_PROGRESS",
    },
    include: {
      answers: true,
    },
  });

  let attempt = existingActiveAttempt;

  if (!attempt) {
    // 2. Check maximum attempts limit
    const completedAttemptsCount = await db.testAttempt.count({
      where: {
        testId,
        studentId: session.userId,
        status: { in: ["SUBMITTED", "TERMINATED", "EXPIRED"] },
      },
    });

    if (completedAttemptsCount >= test.maximumAttempts) {
      return NextResponse.json(
        {
          error: `You have reached the maximum allowed attempts (${test.maximumAttempts}) for this examination.`,
          attemptsRecorded: completedAttemptsCount,
        },
        { status: 400 }
      );
    }

    // 3. Create new attempt
    attempt = await db.testAttempt.create({
      data: {
        testId,
        studentId: session.userId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      include: {
        answers: true,
      },
    });
  }

  // Calculate remaining seconds based on server start time & test duration
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000));
  const totalDurationSeconds = test.durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  // If time has already expired on an existing active attempt, transition to EXPIRED
  if (remainingSeconds <= 0 && attempt.status === "IN_PROGRESS") {
    await db.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "EXPIRED",
        completedAt: now,
      },
    });

    return NextResponse.json(
      {
        error: "Your allotted examination time has expired.",
        status: "EXPIRED",
        attemptId: attempt.id,
      },
      { status: 400 }
    );
  }

  // Sanitize questions: strip correctAnswer, apply randomization if configured
  let sanitizedQuestions = test.questions.map((q) => {
    let options = q.options.map((o) => ({
      id: o.id,
      optionKey: o.optionKey,
      optionText: o.optionText,
      orderIndex: o.orderIndex,
    }));

    if (test.randomizeOptions && options.length > 0) {
      // Deterministic pseudo-shuffle or random shuffle
      options = [...options].sort(() => Math.random() - 0.5);
    }

    return {
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      orderIndex: q.orderIndex,
      options,
    };
  });

  if (test.randomizeQuestions) {
    sanitizedQuestions = [...sanitizedQuestions].sort(() => Math.random() - 0.5);
  }

  const savedAnswers = attempt.answers.map((a) => ({
    questionId: a.questionId,
    answer: a.answer,
  }));

  return NextResponse.json({
    success: true,
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      durationMinutes: test.durationMinutes,
      totalQuestions: test.questions.length,
      totalMarks: test.totalMarks,
      testTitle: test.title,
      testSubject: test.subject,
      instructions: test.instructions,
    },
    questions: sanitizedQuestions,
    savedAnswers,
    serverTime: now.toISOString(),
    remainingSeconds,
  });
}
