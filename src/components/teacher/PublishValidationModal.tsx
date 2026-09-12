"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface PublishValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
}

export const PublishValidationModal: React.FC<PublishValidationModalProps> = ({
  isOpen,
  onClose,
  errors,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cannot Publish Examination"
      description="Please resolve the following configuration issues before publishing:"
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
              Required Adjustments ({errors.length})
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-rose-800 dark:text-rose-300/90 list-disc list-inside">
              {errors.map((err, idx) => (
                <li key={idx} className="leading-relaxed">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close and Fix Issues
          </Button>
        </div>
      </div>
    </Modal>
  );
};
