import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;

  const test = await db.test.findUnique({
    where: { id },
    select: { id: true, teacherId: true, status: true },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  if (test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  const updatedTest = await db.test.update({
    where: { id },
    data: { status: "CLOSED" },
  });

  return NextResponse.json({
    success: true,
    message: "Examination closed. No new student attempts will be permitted.",
    test: updatedTest,
  });
}
