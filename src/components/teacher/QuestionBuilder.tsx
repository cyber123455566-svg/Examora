"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuestionEditor, QuestionData } from "@/components/teacher/QuestionEditor";
import { PublishValidationModal } from "@/components/teacher/PublishValidationModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ArrowLeft,
  Eye,
  Send,
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

interface TestMeta {
  id: string;
  title: string;
  subject: string;
  status: string;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questions: QuestionData[];
}

interface QuestionBuilderProps {
  initialTest: TestMeta;
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ initialTest }) => {
  const router = useRouter();

  const [test, setTest] = useState<TestMeta>(initialTest);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const activeQuestion = test.questions[selectedIndex] || null;

  const totalCalculatedMarks = test.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  // 1. Add Question
  const handleAddQuestion = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/teacher/tests/${test.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: "New examination question prompt",
          questionType: "MULTIPLE_CHOICE",
          marks: 1,
          correctAnswer: "A",
          options: [
            { optionKey: "A", optionText: "Option A", orderIndex: 0 },
            { optionKey: "B", optionText: "Option B", orderIndex: 1 },
            { optionKey: "C", optionText: "Option C", orderIndex: 2 },
            { optionKey: "D", optionText: "Option D", orderIndex: 3 },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedQuestions = [...test.questions, data.question];
        setTest({ ...test, questions: updatedQuestions, totalMarks: totalCalculatedMarks + 1 });
        setSelectedIndex(updatedQuestions.length - 1);
        setStatusMessage({ type: "success", text: "New question added." });
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to add question." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error adding question." });
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Save Active Question
  const handleSaveQuestion = async (updated: QuestionData) => {
    if (!updated.id) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/teacher/tests/${test.id}/questions/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (res.ok) {
        const nextQuestions = [...test.questions];
        nextQuestions[selectedIndex] = data.question;
        setTest({
          ...test,
          questions: nextQuestions,
          totalMarks: nextQuestions.reduce((sum, q) => sum + (q.marks || 0), 0),
        });
        setStatusMessage({ type: "success", text: "Question saved successfully." });
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to save question." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error saving question." });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Delete Question
  const handleDeleteQuestion = async (index: number) => {
    const targetQ = test.questions[index];
    if (!targetQ?.id) return;

    if (!confirm(`Are you sure you want to delete Question ${index + 1}?`)) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/teacher/tests/${test.id}/questions/${targetQ.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const nextQuestions = test.questions.filter((_, i) => i !== index);
        setTest({
          ...test,
          questions: nextQuestions,
          totalMarks: nextQuestions.reduce((sum, q) => sum + (q.marks || 0), 0),
        });
        setSelectedIndex(Math.max(0, index - 1));
        setStatusMessage({ type: "success", text: "Question removed." });
      } else {
        const data = await res.json();
        setStatusMessage({ type: "error", text: data.error || "Failed to delete question." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error deleting question." });
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Duplicate Question
  const handleDuplicateQuestion = async (index: number) => {
    const targetQ = test.questions[index];
    if (!targetQ?.id) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/teacher/tests/${test.id}/questions/${targetQ.id}/duplicate`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        const nextQuestions = [...test.questions];
        nextQuestions.splice(index + 1, 0, data.question);
        setTest({
          ...test,
          questions: nextQuestions,
          totalMarks: nextQuestions.reduce((sum, q) => sum + (q.marks || 0), 0),
        });
        setSelectedIndex(index + 1);
        setStatusMessage({ type: "success", text: "Question duplicated." });
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to duplicate question." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error duplicating question." });
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Reorder Questions (Move Up / Down)
  const handleMoveQuestion = async (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= test.questions.length) return;

    const nextQuestions = [...test.questions];
    const [moved] = nextQuestions.splice(index, 1);
    nextQuestions.splice(targetIndex, 0, moved);

    setTest({ ...test, questions: nextQuestions });
    setSelectedIndex(targetIndex);

    try {
      await fetch(`/api/teacher/tests/${test.id}/questions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: nextQuestions.map((q) => q.id) }),
      });
    } catch (err) {
      console.error("Reorder failed", err);
    }
  };

  // 6. Publish Test
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
          setStatusMessage({ type: "error", text: data.error || "Validation failed." });
        }
        return;
      }

      setTest({ ...test, status: "PUBLISHED" });
      setStatusMessage({ type: "success", text: "Examination published successfully!" });
    } catch (err) {
      console.error("Publish error:", err);
      setStatusMessage({ type: "error", text: "Network error publishing examination." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Action Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/teacher/tests">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Tests
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {test.title}
                </h1>
                <Badge
                  variant={test.status === "PUBLISHED" ? "success" : test.status === "CLOSED" ? "danger" : "warning"}
                  size="sm"
                >
                  {test.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {test.subject} • {test.durationMinutes} mins • Total Marks: <strong>{totalCalculatedMarks}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/teacher/tests">
              <Button variant="outline" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save & Exit
              </Button>
            </Link>

            <Link href={`/teacher/tests/${test.id}/preview`}>
              <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                Preview Test
              </Button>
            </Link>

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

        {/* Status Toast */}
        {statusMessage && (
          <div className="max-w-7xl mx-auto mt-3">
            <div
              className={`p-2.5 px-3 rounded-lg text-xs flex items-center justify-between animate-in fade-in ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs font-semibold underline hover:opacity-75"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Dual-Pane Question Builder Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Question List Navigator (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Questions ({test.questions.length})
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Total Marks: <strong>{totalCalculatedMarks}</strong>
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddQuestion}
              isLoading={isSaving}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Question
            </Button>
          </div>

          {/* Question List Cards */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {test.questions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                No questions added yet. Click &quot;Add Question&quot; to begin.
              </div>
            ) : (
              test.questions.map((q, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={q.id || idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Q{idx + 1}
                        </span>
                        <Badge variant="indigo" size="sm" className="text-[10px] py-0">
                          {q.questionType === "MULTIPLE_CHOICE"
                            ? "MCQ"
                            : q.questionType === "TRUE_FALSE"
                            ? "T/F"
                            : "Short"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-1">
                          {q.marks} {q.marks === 1 ? "pt" : "pts"}
                        </span>
                        {/* Reorder Buttons */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, "UP");
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-indigo-500 disabled:opacity-20 transition-colors"
                          title="Move question up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, "DOWN");
                          }}
                          disabled={idx === test.questions.length - 1}
                          className="p-1 hover:text-indigo-500 disabled:opacity-20 transition-colors"
                          title="Move question down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(idx);
                          }}
                          className="p-1 hover:text-indigo-500 transition-colors"
                          title="Duplicate question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(idx);
                          }}
                          className="p-1 hover:text-rose-500 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                      {q.questionText || "(No question prompt entered yet)"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Question Editor (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              {activeQuestion ? (
                <QuestionEditor
                  key={activeQuestion.id || selectedIndex}
                  questionNumber={selectedIndex + 1}
                  question={activeQuestion}
                  onSave={handleSaveQuestion}
                  isSaving={isSaving}
                />
              ) : (
                <div className="text-center py-16 text-slate-500 space-y-3">
                  <FileCheck className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    No Question Selected
                  </h4>
                  <p className="text-xs max-w-sm mx-auto">
                    Select a question from the left panel or click &quot;Add Question&quot; to begin editing.
                  </p>
                  <Button variant="primary" size="sm" onClick={handleAddQuestion} leftIcon={<Plus className="w-4 h-4" />}>
                    Add First Question
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Validation Errors Modal */}
      <PublishValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        errors={validationErrors}
      />
    </div>
  );
};
