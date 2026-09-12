"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Check, Save, RotateCcw, HelpCircle, CheckCircle2 } from "lucide-react";

export interface QuestionData {
  id?: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  marks: number;
  correctAnswer: string;
  options: { id?: string; optionKey: string; optionText: string; orderIndex: number }[];
}

interface QuestionEditorProps {
  questionNumber: number;
  question: QuestionData;
  onSave: (updated: QuestionData) => Promise<void>;
  isSaving: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questionNumber,
  question,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<QuestionData>(question);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset local state when a new question is selected
    setFormData({
      ...question,
      options:
        question.options && question.options.length > 0
          ? question.options
          : [
              { optionKey: "A", optionText: "", orderIndex: 0 },
              { optionKey: "B", optionText: "", orderIndex: 1 },
              { optionKey: "C", optionText: "", orderIndex: 2 },
              { optionKey: "D", optionText: "", orderIndex: 3 },
            ],
    });
    setErrors({});
  }, [question]);

  const handleTypeChange = (newType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") => {
    let newCorrect = formData.correctAnswer;
    if (newType === "TRUE_FALSE" && newCorrect !== "TRUE" && newCorrect !== "FALSE") {
      newCorrect = "TRUE";
    } else if (newType === "MULTIPLE_CHOICE" && !["A", "B", "C", "D"].includes(newCorrect)) {
      newCorrect = "A";
    }

    setFormData({
      ...formData,
      questionType: newType,
      correctAnswer: newCorrect,
    });
  };

  const handleOptionChange = (index: number, text: string) => {
    const nextOptions = [...formData.options];
    nextOptions[index] = { ...nextOptions[index], optionText: text };
    setFormData({ ...formData, options: nextOptions });
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.questionText.trim()) {
      errs.questionText = "Question text is required.";
    }

    if (!formData.marks || formData.marks < 1) {
      errs.marks = "Marks must be at least 1.";
    }

    if (formData.questionType === "MULTIPLE_CHOICE") {
      formData.options.forEach((opt, idx) => {
        if (!opt.optionText.trim()) {
          errs[`option_${idx}`] = `Option ${opt.optionKey} is required.`;
        }
      });
      if (!formData.correctAnswer) {
        errs.correctAnswer = "Select which option is correct.";
      }
    } else if (formData.questionType === "TRUE_FALSE") {
      if (!["TRUE", "FALSE"].includes(formData.correctAnswer)) {
        errs.correctAnswer = "Select True or False.";
      }
    } else if (formData.questionType === "SHORT_ANSWER") {
      if (!formData.correctAnswer.trim()) {
        errs.correctAnswer = "Expected answer is required.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editing Question {questionNumber}
            </h3>
            <Badge variant="indigo" size="sm">
              {formData.questionType.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure question prompt, answer options, and points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Question
          </Button>
        </div>
      </div>

      {/* Question Type Selection & Marks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Question Type *
          </label>
          <select
            value={formData.questionType}
            onChange={(e) => handleTypeChange(e.target.value as any)}
            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSaving}
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice (Single Best Answer)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short Answer (Text Matching)</option>
          </select>
        </div>

        <Input
          label="Marks / Points *"
          type="number"
          min="1"
          value={formData.marks}
          onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value, 10) || 1 })}
          error={errors.marks}
          disabled={isSaving}
        />
      </div>

      {/* Question Text Prompt */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Question Prompt *
        </label>
        <textarea
          rows={4}
          placeholder="Type the examination question prompt clearly..."
          value={formData.questionText}
          onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
          className={`block w-full rounded-lg border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
            errors.questionText
              ? "border-rose-500 focus:border-rose-500 text-rose-900 dark:text-rose-200"
              : "border-slate-300 dark:border-slate-700"
          }`}
          disabled={isSaving}
        />
        {errors.questionText && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{errors.questionText}</p>
        )}
      </div>

      {/* Type Specific Fields */}
      {formData.questionType === "MULTIPLE_CHOICE" && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Answer Options (Choose 1 correct)
            </span>
            <span className="text-[11px] text-slate-400">
              Select the radio button next to the correct answer
            </span>
          </div>

          <div className="space-y-3">
            {formData.options.map((opt, idx) => {
              const isCorrect = formData.correctAnswer === opt.optionKey;
              return (
                <div
                  key={opt.optionKey}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isCorrect
                      ? "border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  <label
                    className="flex items-center gap-2 cursor-pointer shrink-0 px-2"
                    title={`Mark Option ${opt.optionKey} as correct`}
                  >
                    <input
                      type="radio"
                      name="correctOption"
                      checked={isCorrect}
                      onChange={() => setFormData({ ...formData, correctAnswer: opt.optionKey })}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      disabled={isSaving}
                    />
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {opt.optionKey}
                    </span>
                  </label>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={`Enter text for Option ${opt.optionKey}...`}
                      value={opt.optionText}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className={`block w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors[`option_${idx}`]
                          ? "border-rose-500"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                      disabled={isSaving}
                    />
                    {errors[`option_${idx}`] && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors[`option_${idx}`]}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.correctAnswer && (
            <p className="text-xs text-rose-500">{errors.correctAnswer}</p>
          )}
        </div>
      )}

      {formData.questionType === "TRUE_FALSE" && (
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Correct Answer *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, correctAnswer: "TRUE" })}
              className={`p-4 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                formData.correctAnswer === "TRUE"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              }`}
              disabled={isSaving}
            >
              {formData.correctAnswer === "TRUE" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              TRUE
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, correctAnswer: "FALSE" })}
              className={`p-4 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                formData.correctAnswer === "FALSE"
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              }`}
              disabled={isSaving}
            >
              {formData.correctAnswer === "FALSE" && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
              FALSE
            </button>
          </div>
          {errors.correctAnswer && (
            <p className="text-xs text-rose-500">{errors.correctAnswer}</p>
          )}
        </div>
      )}

      {formData.questionType === "SHORT_ANSWER" && (
        <div className="space-y-3 pt-2">
          <Input
            label="Expected Answer *"
            placeholder="e.g., Dijkstra, Binary Search, 42"
            value={formData.correctAnswer}
            onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
            error={errors.correctAnswer}
            helperText="Provide the exact expected string answer for automated/manual grading."
            disabled={isSaving}
          />
        </div>
      )}

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Question
        </Button>
      </div>
    </form>
  );
};
