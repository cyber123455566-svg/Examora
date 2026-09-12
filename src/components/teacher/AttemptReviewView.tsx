"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ShieldAlert,
  ShieldCheck,
  Save,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export interface ReviewQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | string;
  marks: number;
  correctAnswer: string;
  options?: { optionKey: string; optionText: string }[];
  studentAnswer: string | null;
  marksAwarded: number | null;
  isCorrect: boolean | null;
  evaluationStatus: "AUTOMATIC" | "PENDING" | "EVALUATED" | string;
  feedback?: string | null;
}

export interface ReviewAttemptData {
  id: string;
  status: string;
  startedAt: string;
  submittedAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  score: number | null;
  percentage: number | null;
  isPassed: boolean | null;
  evaluationStatus: string | null;
  student: {
    name: string;
    email: string;
    studentIdNumber?: string | null;
  };
  test: {
    id: string;
    title: string;
    subject: string;
    durationMinutes: number;
    totalMarks: number;
    passingPercentage: number;
    totalQuestions: number;
  };
  violations: {
    id: string;
    violationType: string;
    timestamp: string;
    metadata?: string | null;
  }[];
  questions: ReviewQuestionItem[];
}

interface AttemptReviewViewProps {
  initialData: ReviewAttemptData;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export const AttemptReviewView: React.FC<AttemptReviewViewProps> = ({
  initialData,
  currentUser,
}) => {
  const [data, setData] = useState<ReviewAttemptData>(initialData);
  const [editingMarks, setEditingMarks] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialData.questions.forEach((q) => {
      map[q.id] = q.marksAwarded ?? 0;
    });
    return map;
  });
  const [editingFeedback, setEditingFeedback] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialData.questions.forEach((q) => {
      map[q.id] = q.feedback || "";
    });
    return map;
  });
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ qid: string; text: string; error?: boolean } | null>(null);

  const isTerminated = data.status === "TERMINATED";
  const isSubmitted = data.status === "SUBMITTED";
  const isPassed =
    data.isPassed !== null && data.isPassed !== undefined
      ? data.isPassed
      : data.percentage !== null
      ? data.percentage >= data.test.passingPercentage
      : false;

  const durationUsed = (() => {
    if (!data.startedAt) return "—";
    const start = new Date(data.startedAt).getTime();
    const end = data.submittedAt
      ? new Date(data.submittedAt).getTime()
      : data.terminatedAt
      ? new Date(data.terminatedAt).getTime()
      : Date.now();
    const diffMins = Math.round((end - start) / 60000);
    return `${Math.max(1, diffMins)} mins`;
  })();

  const handleSaveEvaluation = async (questionId: string) => {
    const marks = editingMarks[questionId];
    const feedback = editingFeedback[questionId];

    setSavingQuestionId(questionId);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/teacher/attempts/${data.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          marksAwarded: Number(marks),
          feedback,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSaveMessage({ qid: questionId, text: result.error || "Failed to save marks.", error: true });
        return;
      }

      // Update local state with recalculated attempt scores
      setData((prev) => ({
        ...prev,
        score: result.score,
        percentage: result.percentage,
        isPassed: result.isPassed,
        evaluationStatus: result.evaluationStatus,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                marksAwarded: Number(marks),
                isCorrect: Number(marks) === q.marks ? true : Number(marks) > 0 ? true : false,
                evaluationStatus: "EVALUATED",
                feedback,
              }
            : q
        ),
      }));

      setSaveMessage({ qid: questionId, text: "Marks successfully updated!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Save evaluation error:", err);
      setSaveMessage({ qid: questionId, text: "Network error while saving.", error: true });
    } finally {
      setSavingQuestionId(null);
    }
  };

  return (
    <>
      <DashboardHeader
        title="Student Examination Report"
        subtitle={`Evaluation Review • ${data.student.name} (${data.test.title})`}
        role="TEACHER"
        user={currentUser}
      />

      <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/teacher/results"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Examination Results
          </Link>
          <Link
            href={`/teacher/tests/${data.test.id}/results`}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            View All Attempts for this Test &rarr;
          </Link>
        </div>

        {/* Terminated Attempt Banner */}
        {isTerminated && (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-100 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-900/60 border border-rose-700 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  ⚠ EXAMINATION TERMINATED
                </h3>
                <p className="text-xs text-rose-300 mt-1">
                  This examination attempt was prematurely terminated by the Examora browser anti-cheat proctoring engine.
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-rose-400 font-medium">Termination Reason: </span>
                    <span className="font-bold text-white uppercase">{data.terminationReason || "Violation"}</span>
                  </div>
                  {data.terminatedAt && (
                    <div>
                      <span className="text-rose-400 font-medium">Termination Time: </span>
                      <span className="font-semibold text-white">
                        {new Date(data.terminatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-rose-400 font-medium">Total Violations: </span>
                    <span className="font-semibold text-white">{data.violations.length} logged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Information Cards: Student, Test, Attempt Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Info */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <User className="w-4 h-4 text-indigo-500" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">Name</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{data.student.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">Email</span>
                <span className="text-slate-600 dark:text-slate-300">{data.student.email}</span>
              </div>
              {data.student.studentIdNumber && (
                <div>
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Student ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{data.student.studentIdNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Info */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <Clock className="w-4 h-4 text-indigo-500" />
                Test Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">Title</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{data.test.title}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">Subject & Duration</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {data.test.subject} • {data.test.durationMinutes} Minutes
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Questions</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.test.totalQuestions} Questions
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Total Marks</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.test.totalMarks} Marks
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attempt & Score Info */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <Award className="w-4 h-4 text-indigo-500" />
                Performance Record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Status</span>
                  <Badge
                    variant={isSubmitted ? "success" : isTerminated ? "danger" : "warning"}
                    size="sm"
                    className="mt-0.5"
                  >
                    {data.status}
                  </Badge>
                </div>
                {data.score !== null && (
                  <div>
                    <span className="text-[10px] uppercase font-medium text-slate-400 block">Result</span>
                    <Badge variant={isPassed ? "success" : "danger"} size="sm" className="font-bold mt-0.5">
                      {isPassed ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Score</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {data.score !== null ? data.score : "—"}{" "}
                    <span className="text-xs font-normal text-slate-400">/ {data.test.totalMarks}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Percentage</span>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {data.percentage !== null ? `${data.percentage}%` : "Pending"}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                Duration Used: <strong className="text-slate-700 dark:text-slate-200">{durationUsed}</strong>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Anti-Cheat Activity Section (Table) */}
        {data.violations.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Anti-Cheat Activity ({data.violations.length})
              </h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-rose-900/50 bg-slate-900 shadow-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Violation Type</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.violations.map((v) => {
                    let parsedDetails = v.metadata;
                    if (v.metadata && v.metadata.startsWith("{")) {
                      try {
                        const parsed = JSON.parse(v.metadata);
                        parsedDetails = parsed.reason || parsed.details || v.metadata;
                      } catch {
                        parsedDetails = v.metadata;
                      }
                    }

                    return (
                      <tr key={v.id} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(v.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-400">
                          <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-900 text-rose-300">
                            {v.violationType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {parsedDetails || "Proctoring infraction detected during active exam"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Question-by-Question Review */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Question-by-Question Review ({data.questions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Detailed audit of examinee responses compared against authorized answer keys
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {data.questions.map((q) => {
              const isShortAnswer = q.questionType === "SHORT_ANSWER";
              const isUnanswered = !q.studentAnswer || q.studentAnswer.trim().length === 0;
              const isPending = q.evaluationStatus === "PENDING";
              const isCorrect = q.isCorrect === true;

              return (
                <Card
                  key={q.id}
                  className={`border shadow-xs transition-colors ${
                    isShortAnswer && isPending
                      ? "border-amber-400/60 bg-amber-500/5 dark:bg-amber-950/10"
                      : isUnanswered
                      ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                      : isCorrect
                      ? "border-emerald-500/40 bg-white dark:bg-slate-900"
                      : "border-rose-500/40 bg-white dark:bg-slate-900"
                  }`}
                >
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                          {q.questionNumber}
                        </span>
                        <Badge variant="indigo" size="sm">
                          {q.questionType}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        {isShortAnswer && isPending ? (
                          <Badge variant="warning" size="sm" className="font-semibold">
                            Pending Manual Review
                          </Badge>
                        ) : isUnanswered ? (
                          <Badge variant="neutral" size="sm">
                            — Unanswered
                          </Badge>
                        ) : isCorrect ? (
                          <Badge variant="success" size="sm" className="font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ✓ Correct
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm" className="font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            ✗ Incorrect
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                      {q.questionText}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4 text-xs">
                    {/* Student Answer */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Student Answer
                      </span>
                      <div
                        className={`text-sm font-medium ${
                          isUnanswered
                            ? "text-slate-400 italic"
                            : isCorrect
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {isUnanswered ? "Not answered" : q.studentAnswer}
                      </div>
                    </div>

                    {/* Correct / Expected Answer (Authorized Teacher View) */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          Correct / Expected Answer
                        </span>
                        <span className="text-[10px] text-emerald-500/80 font-medium">
                          Authorized Faculty Key
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        {q.correctAnswer || "None specified"}
                      </div>
                    </div>

                    {/* Marks and Evaluation Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Marks Awarded:</span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">
                          {q.marksAwarded ?? 0} / {q.marks}
                        </strong>
                      </div>

                      {/* Manual Evaluation Controls for Short-Answer */}
                      {isShortAnswer && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <label className="text-slate-500 whitespace-nowrap">Assign Marks:</label>
                            <input
                              type="number"
                              min={0}
                              max={q.marks}
                              step={0.5}
                              value={editingMarks[q.id] ?? 0}
                              onChange={(e) =>
                                setEditingMarks({
                                  ...editingMarks,
                                  [q.id]: Math.min(q.marks, Math.max(0, parseFloat(e.target.value) || 0)),
                                })
                              }
                              className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-slate-400">/ {q.marks}</span>
                          </div>

                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={savingQuestionId === q.id}
                            onClick={() => handleSaveEvaluation(q.id)}
                            leftIcon={<Save className="w-3.5 h-3.5" />}
                            className="bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs px-3 py-1.5"
                          >
                            Save Evaluation
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Optional Feedback Input for Short-Answer */}
                    {isShortAnswer && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Teacher Feedback (Optional):</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Good concise explanation, missing second point..."
                          value={editingFeedback[q.id] ?? ""}
                          onChange={(e) =>
                            setEditingFeedback({
                              ...editingFeedback,
                              [q.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {saveMessage && saveMessage.qid === q.id && (
                      <div
                        className={`text-xs font-semibold ${
                          saveMessage.error ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {saveMessage.text}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
};
