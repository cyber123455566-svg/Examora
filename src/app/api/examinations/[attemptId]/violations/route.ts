import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { ViolationType } from "@/lib/anti-cheat/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Student role required." }, { status: 403 });
  }

  const { attemptId } = await context.params;

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.studentId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: Attempt does not belong to user." }, { status: 403 });
  }

  // If already finalized (SUBMITTED, TERMINATED, EXPIRED), return current state without error (prevents race conditions)
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({
      success: true,
      alreadyFinalized: true,
      status: attempt.status,
      terminationReason: attempt.terminationReason,
      terminatedAt: attempt.terminatedAt,
    });
  }

  try {
    let body: any = {};
    try {
      const rawText = await request.text();
      if (rawText && rawText.trim()) {
        body = JSON.parse(rawText);
      }
    } catch {
      body = {};
    }

    const violationType: ViolationType = body.violationType || "TAB_SWITCH";
    const reason: string =
      body.metadata?.reason || body.reason || `Anti-cheat violation detected: ${violationType}`;

    const now = new Date();

    // Atomic update: only terminate if status is currently IN_PROGRESS
    const updateResult = await db.testAttempt.updateMany({
      where: {
        id: attemptId,
        status: "IN_PROGRESS",
      },
      data: {
        status: "TERMINATED",
        terminatedAt: now,
        completedAt: now,
        terminationReason: reason,
        violationCount: { increment: 1 },
      },
    });

    if (updateResult.count > 0) {
      // Record in Violation table
      await db.violation.create({
        data: {
          attemptId,
          violationType,
          severity: "CRITICAL",
          metadata: JSON.stringify(body.metadata || {}),
          timestamp: now,
          detectedAt: now,
        },
      });
    }

    const finalAttempt = await db.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        violationCount: true,
        terminationReason: true,
        terminatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      isTerminated: true,
      attempt: finalAttempt,
    });
  } catch (error) {
    console.error("Violation logging error:", error);
    return NextResponse.json({ error: "Failed to record violation." }, { status: 500 });
  }
}
