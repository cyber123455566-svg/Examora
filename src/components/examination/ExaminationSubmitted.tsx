"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

interface ExaminationSubmittedProps {
  testTitle: string;
  testSubject?: string;
  submittedAt?: string | null;
  answeredCount: number;
  totalQuestions: number;
  score?: number | null;
  percentage?: number | null;
  pendingManualCount?: number;
}

export const ExaminationSubmitted: React.FC<ExaminationSubmittedProps> = ({
  testTitle,
  testSubject,
  submittedAt = new Date().toISOString(),
  answeredCount,
  totalQuestions,
  score,
  percentage,
  pendingManualCount = 0,
}) => {
  const formattedDate = submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-emerald-900/60 shadow-2xl text-center space-y-6">
        {/* Examora Brand Logo Header */}
        <div className="flex justify-center">
          <ExamoraLogo size="md" />
        </div>

        {/* Success Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-tight">
            EXAMINATION SUBMITTED
          </h1>
          <p className="text-xs text-emerald-300 font-medium">
            Your examination has been successfully submitted.
          </p>
          <p className="text-[11px] text-slate-400">
            {testTitle} {testSubject ? `• ${testSubject}` : ""}
          </p>
        </div>

        {/* Submission Details Strip */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-700/50">
            <span className="text-slate-400">Questions Answered</span>
            <span className="font-bold text-white">
              {answeredCount} / {totalQuestions}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-700/50">
            <span className="text-slate-400">Submission Timestamp</span>
            <span className="font-medium text-slate-200">
              {formattedDate}
            </span>
          </div>

          {score !== null && score !== undefined && (
            <div className="flex items-center justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Objective Score (MCQ / TF)</span>
              <span className="font-bold text-emerald-400 text-sm">
                {score} pts ({percentage}%)
              </span>
            </div>
          )}

          {pendingManualCount > 0 && (
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-[11px] text-indigo-300">
              {pendingManualCount} short-answer {pendingManualCount === 1 ? "question is" : "questions are"} pending faculty evaluation.
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Your responses have been recorded.
        </p>

        {/* Return Button */}
        <div className="pt-2">
          <Link href="/student/dashboard" className="block w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 shadow-lg shadow-emerald-600/20"
            >
              Return to Student Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
