"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, string>;
  questionIds: string[];
  onSelectQuestion: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectQuestion,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>Question Navigator</span>
        <span className="text-[11px] text-slate-500 font-normal">
          {Object.values(answers).filter((a) => a && a.trim().length > 0).length} of {totalQuestions} answered
        </span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {questionIds.map((qid, idx) => {
          const isAnswered = Boolean(answers[qid] && answers[qid].trim().length > 0);
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={qid}
              onClick={() => onSelectQuestion(idx)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isCurrent
                  ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/40 shadow-md scale-105"
                  : isAnswered
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50"
                  : "bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700/60 hover:text-slate-200"
              }`}
              title={`Question ${idx + 1} (${isAnswered ? "Answered" : "Unanswered"})`}
            >
              <span className="text-[13px] leading-tight">{idx + 1}</span>
              <span className="text-[10px] mt-0.5 opacity-90">
                {isAnswered ? <Check className="w-3 h-3 text-emerald-400" /> : <Minus className="w-3 h-3 text-slate-500" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
