"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Clock, HelpCircle, ArrowRight, ShieldCheck, BookOpen } from "lucide-react";

export interface StudentTestItem {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  status: string;
}

interface AvailableTestCardProps {
  test: StudentTestItem;
  onStartClick: (test: StudentTestItem) => void;
}

export const AvailableTestCard: React.FC<AvailableTestCardProps> = ({
  test,
  onStartClick,
}) => {
  return (
    <Card hoverEffect className="flex flex-col justify-between overflow-hidden">
      <CardContent className="p-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <BookOpen className="w-3 h-3" />
            {test.subject}
          </span>
          <Badge variant="success" size="sm">
            Ready to Take
          </Badge>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {test.title}
        </h3>
        {test.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {test.description}
          </p>
        )}

        {/* Test Details Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              <strong>{test.totalQuestions}</strong> Questions
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              <strong>{test.durationMinutes}</strong> Mins
            </span>
          </div>
        </div>
      </CardContent>

      {/* Footer Action */}
      <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Proctored Session</span>
        </div>
        <Button
          size="sm"
          variant="emerald"
          onClick={() => onStartClick(test)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Start Test
        </Button>
      </div>
    </Card>
  );
};
