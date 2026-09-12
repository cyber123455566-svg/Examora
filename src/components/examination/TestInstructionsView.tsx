"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";
import {
  Clock,
  HelpCircle,
  Award,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
} from "lucide-react";

interface TestDetails {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  instructions?: string | null;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  totalQuestions: number;
  startAt?: string | null;
  endAt?: string | null;
}

interface TestInstructionsViewProps {
  test: TestDetails;
  onStartExam: () => Promise<void>;
  isStarting: boolean;
  errorMessage?: string | null;
}

export const TestInstructionsView: React.FC<TestInstructionsViewProps> = ({
  test,
  onStartExam,
  isStarting,
  errorMessage,
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-3xl w-full space-y-6">
        {/* Brand Bar & Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student Dashboard
          </Link>
          <ExamoraLogo size="sm" />
        </div>

        {/* Header Summary Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" size="sm">
                {test.subject}
              </Badge>
              <Badge variant="success" size="sm">
                Proctored Assessment
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {test.title}
            </h1>
            {test.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {test.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-900/50 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Allotted Time</span>
                <span className="font-semibold text-white">{test.durationMinutes} Minutes</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Questions</span>
                <span className="font-semibold text-white">{test.totalQuestions} Questions</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Marks</span>
                <span className="font-semibold text-white">{test.totalMarks} Points</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Passing Threshold</span>
                <span className="font-semibold text-white">{test.passingPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Faculty Instructions */}
        {test.instructions && (
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                Faculty Examination Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {test.instructions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Important Examination Rules */}
        <Card className="border-amber-900/40 bg-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              Important Examination Rules & Examora Proctoring Protocol
            </div>
            <CardDescription className="text-xs text-amber-300/80">
              Violations are actively tracked by the Examora browser proctoring engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>
                  <strong>Fullscreen Requirement:</strong> The examination must run in full-screen mode at all times. Exiting fullscreen records a critical violation.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>
                  <strong>No Tab Switching:</strong> Switching to another browser tab or minimizing the browser will be flagged immediately.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>
                  <strong>Window Focus:</strong> Clicking outside the examination window or moving focus away triggers immediate termination.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>
                  <strong>Immediate Termination:</strong> Any confirmed anti-cheat violation locks your examination permanently and records a zero or incomplete score.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span>
                  <strong>Real-Time Autosave:</strong> Your selected answers are saved continuously to the server as you progress.
                </span>
              </li>
            </ul>

            {/* Anti-Cheat Disclaimer */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed mt-4">
              <strong>Anti-Cheat Disclaimer:</strong> The Examora examination system monitors browser-level visibility, focus, and fullscreen state. Browser-based monitoring cannot detect every possible form of cheating, such as use of another physical device.
            </div>
          </CardContent>
        </Card>

        {/* Agreement & Start Action */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>Your examination will run in fullscreen mode.</span>
            </div>
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-indigo-500"
                disabled={isStarting}
              />
              <span>
                I understand the proctoring rules, and I acknowledge that my session will activate fullscreen mode and monitor application focus.
              </span>
            </label>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              disabled={!agreed || isStarting}
              isLoading={isStarting}
              onClick={onStartExam}
              leftIcon={<Maximize2 className="w-4 h-4" />}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 font-bold text-sm shadow-lg shadow-indigo-600/30 px-6 py-3 cursor-pointer disabled:opacity-50"
            >
              START EXAMINATION
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
