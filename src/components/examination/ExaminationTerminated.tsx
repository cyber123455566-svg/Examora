"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { XCircle, Lock } from "lucide-react";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

interface ExaminationTerminatedProps {
  testTitle: string;
  reason?: string | null;
  terminatedAt?: string | null;
}

export const ExaminationTerminated: React.FC<ExaminationTerminatedProps> = ({
  testTitle,
  reason = "The examination window was left during the test.",
  terminatedAt,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-900/60 shadow-2xl text-center space-y-6">
        {/* Examora Brand Logo Header */}
        <div className="flex justify-center">
          <ExamoraLogo size="md" />
        </div>

        {/* Terminated Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <XCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-tight">
            EXAMINATION TERMINATED
          </h1>
          <p className="text-xs text-rose-300 font-medium">
            Your examination has been terminated.
          </p>
          <p className="text-[11px] text-slate-400">
            {testTitle}
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-left space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block">
            Reason
          </span>
          <p className="text-xs text-rose-200 font-medium leading-relaxed">
            {reason || "The examination window was left during the test."}
          </p>
          {terminatedAt && (
            <span className="text-[10px] text-rose-400/80 block pt-1">
              Logged at: {new Date(terminatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Locked Explanatory Message */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 text-left space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Your attempt has been locked.</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Please contact your instructor if you believe this was caused by an error.
          </p>
        </div>

        {/* Exit Action */}
        <div className="pt-2">
          <Link href="/student/dashboard" className="block w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 font-bold py-3 uppercase tracking-wider"
            >
              EXIT
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
