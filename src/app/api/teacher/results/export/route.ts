import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const stringVal = String(field);
  if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return `"${stringVal}"`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized. Teacher role required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("testId") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const attempts = await db.testAttempt.findMany({
      where: {
        test: {
          teacherId: session.userId,
          ...(testId ? { id: testId } : {}),
        },
        ...(status && status !== "ALL" ? { status } : {}),
      },
      include: {
        test: true,
        student: true,
      },
      orderBy: { startedAt: "desc" },
    });

    const headers = [
      "Student Name",
      "Student Email",
      "Student ID",
      "Examination",
      "Subject",
      "Status",
      "Score",
      "Total Marks",
      "Percentage",
      "Result",
      "Started At",
      "Submitted At",
      "Violations",
      "Termination Reason",
    ];

    const rows = attempts.map((a) => {
      const result =
        a.score !== null && a.percentage !== null
          ? a.percentage >= a.test.passingPercentage
            ? "PASS"
            : "FAIL"
          : a.status === "TERMINATED"
          ? "TERMINATED"
          : "PENDING";

      return [
        escapeCsvField(a.student.name),
        escapeCsvField(a.student.email),
        escapeCsvField(a.student.studentIdNumber || "N/A"),
        escapeCsvField(a.test.title),
        escapeCsvField(a.test.subject),
        escapeCsvField(a.status),
        escapeCsvField(a.score !== null ? a.score : "—"),
        escapeCsvField(a.test.totalMarks),
        escapeCsvField(a.percentage !== null ? `${a.percentage}%` : "—"),
        escapeCsvField(result),
        escapeCsvField(new Date(a.startedAt).toISOString()),
        escapeCsvField(a.submittedAt ? new Date(a.submittedAt).toISOString() : a.terminatedAt ? new Date(a.terminatedAt).toISOString() : "—"),
        escapeCsvField(a.violationCount),
        escapeCsvField(a.terminationReason || "None"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const filename = `examination_results_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Export results CSV error:", error);
    return NextResponse.json({ error: "Failed to export results." }, { status: 500 });
  }
}
