import React from "react";
import Link from "next/link";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Award } from "lucide-react";

export const metadata = {
  title: "Results",
};

export default async function StudentResultsPage() {
  const session = await requireServerRole(["STUDENT"]);

  const attempts = await db.testAttempt.findMany({
    where: { studentId: session.userId },
    include: { test: true },
    orderBy: { startedAt: "desc" },
  });

  return (
    <>
      <DashboardHeader
        title="My Examination Results"
        subtitle="Historical transcript of completed evaluations and proctored scores"
        role="STUDENT"
        user={session}
      />

      <main className="p-8 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Official Assessment Transcripts
            </h2>
            <p className="text-xs text-slate-500">
              Grade records verified by the Examora integrity engine
            </p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500">No completed examinations recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">Examination</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {attempts.map((attempt) => {
                  const isTerminated = attempt.status === "TERMINATED";
                  const isSubmitted = attempt.status === "SUBMITTED";
                  const isPassed =
                    attempt.isPassed !== null && attempt.isPassed !== undefined
                      ? attempt.isPassed
                      : attempt.percentage !== null
                      ? attempt.percentage >= attempt.test.passingPercentage
                      : false;

                  const completionDate =
                    attempt.completedAt || attempt.submittedAt || attempt.terminatedAt || attempt.startedAt;

                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {attempt.test.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {attempt.test.subject}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(completionDate).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white text-sm">
                        {attempt.score !== null ? `${attempt.score} / ${attempt.test.totalMarks}` : "—"}
                      </td>

                      <td className="py-4 px-4 font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                        {attempt.percentage !== null ? `${attempt.percentage}%` : "Pending"}
                      </td>

                      <td className="py-4 px-4">
                        {attempt.score !== null ? (
                          <Badge variant={isPassed ? "success" : "danger"} size="sm" className="font-bold">
                            {isPassed ? "PASS" : "FAIL"}
                          </Badge>
                        ) : isTerminated ? (
                          <Badge variant="danger" size="sm">
                            TERMINATED
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            PENDING
                          </Badge>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <Badge
                          variant={isSubmitted ? "success" : isTerminated ? "danger" : "warning"}
                          size="sm"
                        >
                          {attempt.status}
                        </Badge>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/student/results/${attempt.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
