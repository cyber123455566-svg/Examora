"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export interface OptionItem {
  id?: string;
  optionKey: string; // "A", "B", "C", "D"
  optionText: string;
  orderIndex: number;
}

export interface ExamQuestionItem {
  id: string;
  questionText: string;
  questionType: string; // MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER
  marks: number;
  orderIndex: number;
  options: OptionItem[];
}

interface ExamQuestionViewProps {
  question: ExamQuestionItem;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: string;
  onAnswerChange: (newAnswer: string) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const ExamQuestionView: React.FC<ExamQuestionViewProps> = ({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Question Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-base sm:text-lg font-bold text-white">
            Question {questionNumber} of {totalQuestions}
          </span>
          <Badge variant="indigo" size="sm">
            {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
          </Badge>
        </div>

        <Badge variant="neutral" size="sm">
          {question.questionType.replace("_", " ")}
        </Badge>
      </div>

      {/* Question Prompt */}
      <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 shadow-xs">
        <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
          {question.questionText}
        </p>
      </div>

      {/* Interactive Answer Input Area */}
      <div className="space-y-3 pt-2">
        {question.questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = currentAnswer === opt.optionKey;
              return (
                <button
                  key={opt.optionKey}
                  type="button"
                  onClick={() => onAnswerChange(opt.optionKey)}
                  className={`w-full p-4 rounded-xl text-left border flex items-start gap-4 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 text-white shadow-md"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {opt.optionKey}
                  </div>
                  <div className="flex-1 text-sm pt-0.5 leading-relaxed">
                    {opt.optionText}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {question.questionType === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["TRUE", "FALSE"].map((choice) => {
              const isSelected = currentAnswer?.toUpperCase() === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => onAnswerChange(choice)}
                  className={`p-6 rounded-2xl text-center border font-bold text-lg transition-all cursor-pointer ${
                    isSelected
                      ? choice === "TRUE"
                        ? "bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-200 shadow-md"
                        : "bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40 text-rose-200 shadow-md"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  {choice === "TRUE" ? "True" : "False"}
                </button>
              );
            })}
          </div>
        )}

        {question.questionType === "SHORT_ANSWER" && (
          <div className="space-y-2">
            <textarea
              rows={4}
              placeholder="Type your response here..."
              value={currentAnswer || ""}
              onChange={(e) => onAnswerChange(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 italic">
              Answers will be securely evaluated and verified upon submission.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons (Previous / Next) */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <Button
          variant="outline"
          size="md"
          onClick={onPrev}
          disabled={isFirst}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="border-slate-700 hover:bg-slate-800 text-slate-200"
        >
          Previous
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onNext}
          disabled={isLast}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
