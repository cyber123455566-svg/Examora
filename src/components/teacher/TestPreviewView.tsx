"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { PublishValidationModal } from "@/components/teacher/PublishValidationModal";
import {
  ArrowLeft,
  Send,
  Eye,
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Option {
  id?: string;
  optionKey: string;
  optionText: string;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  marks: number;
  orderIndex: number;
  correctAnswer: string;
  options: Option[];
}

interface TestData {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  instructions?: string | null;
  durationMinutes: number;
  totalMarks: number;
  status: string;
  questions: Question[];
}

interface TestPreviewViewProps {
  test: TestData;
}

export const TestPreviewView: React.FC<TestPreviewViewProps> = ({ test }) => {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const currentQuestion = test.questions[currentIndex];

  const handleSelectOption = (questionId: string, answer: string) => {
    // Local state only for interactive preview experience
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answer,
    });
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const res = await fetch(`/api/teacher/tests/${test.id}/publish`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.issues && Array.isArray(data.issues)) {
          setValidationErrors(data.issues);
          setIsValidationModalOpen(true);
        } else {
          alert(data.error || "Failed to publish test.");
        }
        return;
      }

      setPublishSuccess(true);
      setTimeout(() => {
        router.push(`/teacher/tests`);
      }, 1500);
    } catch (err) {
      console.error("Publish error:", err);
      alert("Network error.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Preview Control Header */}
      <header className="bg-slate-950/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/teacher/tests/${test.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Edit
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{test.title}</span>
                <Badge variant="warning" size="sm">
                  Examinee Preview Mode
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {test.subject} • {test.durationMinutes} Minutes • Total Marks: {test.totalMarks}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {test.status !== "PUBLISHED" && (
              <Button
                variant="emerald"
                size="sm"
                isLoading={isPublishing}
                onClick={handlePublish}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Publish Test
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Preview Notice Banner */}
      <div className="bg-amber-950/40 border-b border-amber-900/60 py-2.5 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Teacher Preview Mode:</strong> Interactive navigation is enabled for review. No student attempts or answers are persisted to the database. Anti-cheat proctoring sensors are disabled.
          </span>
        </div>
      </div>

      {publishSuccess && (
        <div className="bg-emerald-950/60 border-b border-emerald-800 py-3 px-6 text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Examination successfully published! Redirecting to test management...
        </div>
      )}

      {/* Main Examination View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {!test.questions || test.questions.length === 0 || !currentQuestion ? (
          <div className="p-12 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No questions in this examination</h3>
            <p className="text-xs text-slate-400 mt-1">Return to the editor to add questions.</p>
            <div className="mt-4">
              <Link href={`/teacher/tests/${test.id}/edit`}>
                <Button variant="primary" size="sm">
                  Go to Question Builder
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Question Progress and Header Strip */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-white">
                  Question {currentIndex + 1} of {test.questions.length}
                </span>
                <Badge variant="indigo" size="sm">
                  {currentQuestion.questionType ? currentQuestion.questionType.replace("_", " ") : "Question"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-emerald-400">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                </span>
                <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Timer (Disabled in Preview)</span>
                </div>
              </div>
            </div>

            {/* Question Display Card */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
              <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQuestion.questionText}
              </div>

              {/* Multiple Choice Options */}
              {currentQuestion.questionType === "MULTIPLE_CHOICE" && (
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === opt.optionKey;
                    return (
                      <div
                        key={opt.optionKey}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.optionKey)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-950/30 text-white"
                            : "border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {opt.optionKey}
                        </div>
                        <span className="text-sm font-medium">{opt.optionText}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True / False Options */}
              {currentQuestion.questionType === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {["TRUE", "FALSE"].map((val) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.id, val)}
                        className={`p-5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                          isSelected
                            ? val === "TRUE"
                              ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                              : "border-rose-500 bg-rose-950/40 text-rose-300"
                            : "border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer Option */}
              {currentQuestion.questionType === "SHORT_ANSWER" && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs text-slate-400 font-medium">Your Response:</label>
                  <input
                    type="text"
                    placeholder="Type your response here..."
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Correct Answer reveal hint for teacher */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Teacher Key: Configured Correct Answer:</span>
                <span className="font-bold text-indigo-400">{currentQuestion.correctAnswer}</span>
              </div>
            </div>

            {/* Stepper Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous Question
              </Button>

              {/* Quick Jump Buttons */}
              <div className="hidden md:flex items-center gap-1.5">
                {test.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentIndex === idx
                        ? "bg-indigo-600 text-white shadow-xs"
                        : selectedAnswers[q.id]
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="md"
                disabled={currentIndex === test.questions.length - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next Question
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Examora Examination Preview Engine
      </footer>

      {/* Validation Modal */}
      <PublishValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        errors={validationErrors}
      />
    </div>
  );
};
