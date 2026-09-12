"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => Promise<void>;
  isSubmitting: boolean;
  totalQuestions: number;
  answeredCount: number;
}

export const SubmitConfirmationModal: React.FC<SubmitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  isSubmitting,
  totalQuestions,
  answeredCount,
}) => {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Final Submission"
      description="Once submitted, your examination attempt will be locked and finalized."
      className="max-w-md bg-slate-900 border-slate-800 text-white"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Answered</span>
              <span className="font-bold text-sm text-white">{answeredCount} of {totalQuestions}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Unanswered</span>
              <span className="font-bold text-sm text-white">{unansweredCount} Questions</span>
            </div>
          </div>
        </div>

        {unansweredCount > 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 leading-relaxed">
            <strong>Warning:</strong> You still have <strong>{unansweredCount} unanswered</strong> {unansweredCount === 1 ? "question" : "questions"}. Unanswered questions will receive 0 marks.
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-200 leading-relaxed">
            <strong>All completed!</strong> You have provided responses for all {totalQuestions} questions.
          </div>
        )}

        <p className="text-xs text-slate-300 leading-relaxed">
          Do you want to submit your examination now?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirmSubmit}
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold"
          >
            Submit Examination
          </Button>
        </div>
      </div>
    </Modal>
  );
};
