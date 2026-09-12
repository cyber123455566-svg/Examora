"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, ShieldCheck, FileText, CheckCircle2, Clock, HelpCircle } from "lucide-react";

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTestModal: React.FC<CreateTestModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Examination"
      description="Examora Examination Studio & Question Authoring Engine"
      className="max-w-xl"
    >
      <div className="space-y-5">
        {/* V0.1 Notice Banner */}
        <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                V0.1 Architecture Milestone
              </h4>
              <Badge variant="indigo" size="sm">
                V0.2 Preview
              </Badge>
            </div>
            <p className="text-xs text-indigo-700/90 dark:text-indigo-300/80 mt-1 leading-relaxed">
              Database models for <code className="font-mono font-semibold">Test</code>, <code className="font-mono font-semibold">Question</code>, and <code className="font-mono font-semibold">Violation</code> are fully provisioned. The live interactive Question Studio and WYSIWYG editor will be activated in <strong>V0.2</strong>.
            </p>
          </div>
        </div>

        {/* Feature Roadmap Preview */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Supported Capabilities in V0.2
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Multi-format Questions
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  MCQ, Multi-select, True/False & Short Answer
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Automated Timers
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Strict countdowns & auto-submission on expiry
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Proctoring Config
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tab-switch limits, fullscreen enforcement
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Instant Grading
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automated gradebooks & question analysis
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Got it, Return to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
};
