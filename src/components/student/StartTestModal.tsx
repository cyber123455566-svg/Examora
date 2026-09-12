"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StudentTestItem } from "./AvailableTestCard";
import {
  ShieldAlert,
  Clock,
  HelpCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface StartTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: StudentTestItem | null;
}

export const StartTestModal: React.FC<StartTestModalProps> = ({
  isOpen,
  onClose,
  test,
}) => {
  if (!test) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={test.title}
      description={`${test.subject} • Proctored Assessment Room`}
      className="max-w-xl"
    >
      <div className="space-y-5">
        {/* Test Summary Strip */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Allotted Time</span>
              <span className="font-semibold">{test.durationMinutes} Minutes</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Questions</span>
              <span className="font-semibold">{test.totalQuestions} Questions</span>
            </div>
          </div>
        </div>

        {/* Examination Room Notice */}
        <div className="p-4 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                  Proctored Examination Room
                </h4>
                <Badge variant="indigo" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300/90 mt-1.5 leading-relaxed">
                Clicking <strong>Begin Assessment</strong> will take you to the examination rules and instructions page.
              </p>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/70 mt-1">
                You will review rules and trigger full-screen proctoring mode before the countdown timer starts.
              </p>
            </div>
          </div>
        </div>

        {/* Academic Integrity Pledge */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            By proceeding, you agree to adhere to University Academic Honesty standards. Browser focus and visibility will be monitored.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="emerald"
            size="md"
            onClick={() => {
              window.location.href = `/student/tests/${test.id}`;
            }}
          >
            Proceed to Instructions
          </Button>
        </div>
      </div>
    </Modal>
  );
};
