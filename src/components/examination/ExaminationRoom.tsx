"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAntiCheat } from "@/lib/anti-cheat/useAntiCheat";
import { ViolationType } from "@/lib/anti-cheat/types";
import { ExamQuestionItem, ExamQuestionView } from "./ExamQuestionView";
import { QuestionNavigator } from "./QuestionNavigator";
import { SubmitConfirmationModal } from "./SubmitConfirmationModal";
import { ExaminationTerminated } from "./ExaminationTerminated";
import { ExaminationSubmitted } from "./ExaminationSubmitted";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  ShieldAlert,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Maximize2,
} from "lucide-react";

interface AttemptMeta {
  id: string;
  testId: string;
  status: string;
  startedAt: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  testTitle: string;
  testSubject: string;
}

interface ExaminationRoomProps {
  attempt: AttemptMeta;
  questions: ExamQuestionItem[];
  initialAnswers: { questionId: string; answer: string | null }[];
  initialRemainingSeconds: number;
}

export const ExaminationRoom: React.FC<ExaminationRoomProps> = ({
  attempt,
  questions,
  initialAnswers,
  initialRemainingSeconds,
}) => {
  // Convert initial answers to record
  const initialMap: Record<string, string> = {};
  initialAnswers.forEach((a) => {
    if (a.answer !== null && a.answer !== undefined) {
      initialMap[a.questionId] = a.answer;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialMap);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status screens
  const [isTerminated, setIsTerminated] = useState(attempt.status === "TERMINATED");
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(attempt.status === "SUBMITTED");
  const [submissionData, setSubmissionData] = useState<{
    score?: number | null;
    percentage?: number | null;
    submittedAt?: string;
    pendingManualCount?: number;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Track fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== "undefined"
      ? Boolean(
          document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        )
      : false
  );

  // Handle anti-cheat violation
  const handleViolationDetected = useCallback(
    async (type: ViolationType, reason: string) => {
      const payload = JSON.stringify({
        violationType: type,
        metadata: { reason, timestamp: new Date().toISOString() },
      });

      try {
        // 1. Immediate keepalive fetch so browser delivers it even during tab switch or pagehide
        fetch(`/api/examinations/${attempt.id}/violations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch((err) => console.error("Violation fetch error:", err));

        // 2. Also send via sendBeacon as synchronous redundancy
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          try {
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon(`/api/examinations/${attempt.id}/violations`, blob);
          } catch (bErr) {
            // ignore beacon failure
          }
        }

        setIsTerminated(true);
        setTerminationReason(reason);
      } catch (err) {
        console.error("Failed to process violation:", err);
        setIsTerminated(true);
        setTerminationReason(reason);
      }
    },
    [attempt.id]
  );

  // Initialize anti-cheat monitoring
  const { enterFullscreen, isFullscreenActive } = useAntiCheat({
    attemptId: attempt.id,
    isActive: !isSubmitted && !isTerminated,
    onViolation: handleViolationDetected,
  });

  // Track fullscreen state dynamically
  useEffect(() => {
    const checkFs = () => {
      setIsFullscreen(isFullscreenActive());
    };
    checkFs();

    document.addEventListener("fullscreenchange", checkFs);
    document.addEventListener("webkitfullscreenchange", checkFs);
    document.addEventListener("mozfullscreenchange", checkFs);
    document.addEventListener("MSFullscreenChange", checkFs);

    return () => {
      document.removeEventListener("fullscreenchange", checkFs);
      document.removeEventListener("webkitfullscreenchange", checkFs);
      document.removeEventListener("mozfullscreenchange", checkFs);
      document.removeEventListener("MSFullscreenChange", checkFs);
    };
  }, [isFullscreenActive]);

  // Server-synchronized countdown timer
  useEffect(() => {
    if (isSubmitted || isTerminated || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired -> trigger automatic submission
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, isTerminated, remainingSeconds]);

  // Format countdown timer (HH:MM:SS or MM:SS)
  const formatTimeRemaining = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Immediate and debounced answer autosave
  const handleAnswerChange = (questionId: string, newAnswer: string) => {
    const updated = { ...answers, [questionId]: newAnswer };
    setAnswers(updated);
    setSaveStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/examinations/${attempt.id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answer: newAnswer }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("Autosave error:", err);
        setSaveStatus("error");
      }
    }, 400);
  };

  // Submit Handler
  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);

      const finalAnswersList = Object.entries(answersRef.current).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res = await fetch(`/api/examinations/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalAnswers: finalAnswersList }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to submit examination.");
        return;
      }

      setIsSubmitted(true);
      setIsSubmitModalOpen(false);
      setSubmissionData({
        score: data.score,
        percentage: data.percentage,
        submittedAt: data.submittedAt,
        pendingManualCount: data.pendingManualCount,
      });
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Network error while submitting examination.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit when countdown hits zero
  const handleAutoSubmitOnExpiry = async () => {
    try {
      const finalAnswersList = Object.entries(answersRef.current).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res = await fetch(`/api/examinations/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalAnswers: finalAnswersList }),
      });

      const data = await res.json();
      setIsSubmitted(true);
      setSubmissionData({
        score: data.score,
        percentage: data.percentage,
        submittedAt: data.submittedAt,
        pendingManualCount: data.pendingManualCount,
      });
    } catch (err) {
      console.error("Auto submit on expiry failed:", err);
    }
  };

  // Render Termination Screen
  if (isTerminated) {
    return (
      <ExaminationTerminated
        testTitle={attempt.testTitle}
        reason={terminationReason}
      />
    );
  }

  // Render Submission Screen
  if (isSubmitted) {
    const answeredCount = Object.values(answers).filter((a) => a && a.trim().length > 0).length;
    return (
      <ExaminationSubmitted
        testTitle={attempt.testTitle}
        testSubject={attempt.testSubject}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        score={submissionData?.score}
        percentage={submissionData?.percentage}
        submittedAt={submissionData?.submittedAt}
        pendingManualCount={submissionData?.pendingManualCount}
      />
    );
  }

  const currentQuestion = questions[currentIndex] || questions[0];
  const questionIds = questions.map((q) => q.id);
  const answeredCount = Object.values(answers).filter((a) => a && a.trim().length > 0).length;
  const isTimeRunningLow = remainingSeconds <= 300; // Under 5 minutes

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative">
      {/* Mandatory Fullscreen Gate Overlay */}
      {!isFullscreen && !isSubmitted && !isTerminated && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-indigo-500/40 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/20">
              <Maximize2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Fullscreen Examination Mode Required
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                To maintain examination integrity and active proctoring, Examora requires full-screen mode at all times.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={async () => {
                const granted = await enterFullscreen();
                if (granted) {
                  setIsFullscreen(true);
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
              leftIcon={<Maximize2 className="w-4 h-4" />}
            >
              ENTER FULLSCREEN TO PROCEED
            </Button>
            <p className="text-[11px] text-amber-400/90 font-medium">
              ⚠️ Note: Switching tabs, exiting fullscreen, or minimizing will immediately terminate the examination.
            </p>
          </div>
        </div>
      )}

      {/* Top Proctored Exam Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Assessment Title & Proctoring badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 border border-indigo-400/30 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30 shrink-0">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider hidden md:inline">Examora</span>
                <span className="text-slate-600 hidden md:inline">•</span>
                <h1 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                  {attempt.testTitle}
                </h1>
                <Badge variant="success" size="sm" className="hidden sm:inline-flex">
                  Proctoring Active
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                {attempt.testSubject} • Total: {attempt.totalMarks} Marks
              </p>
            </div>
          </div>

          {/* Autosave Status, Timer & Submit Action */}
          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
            {/* Autosave feedback */}
            <div className="text-[11px] flex items-center gap-1.5 text-slate-400">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Save failed</span>
                </>
              )}
              {saveStatus === "idle" && <span>Autosave active</span>}
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-inner transition-colors ${
                isTimeRunningLow
                  ? "bg-rose-950/60 border-rose-600/80 text-rose-300 animate-pulse"
                  : "bg-slate-800/80 border-slate-700 text-slate-200"
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeRunningLow ? "text-rose-400" : "text-indigo-400"}`} />
              <span>{formatTimeRemaining(remainingSeconds)}</span>
            </div>

            {/* Submit Action */}
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-md shadow-emerald-600/20"
            >
              Submit Test
            </Button>
          </div>
        </div>
      </header>

      {/* Main Examination Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column: Question Presentation Area */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
          <ExamQuestionView
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            currentAnswer={answers[currentQuestion.id] || ""}
            onAnswerChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            isFirst={currentIndex === 0}
            isLast={currentIndex === questions.length - 1}
          />
        </div>

        {/* Right Column: Question Navigator & Session Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
            <QuestionNavigator
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              answers={answers}
              questionIds={questionIds}
              onSelectQuestion={(idx) => setCurrentIndex(idx)}
            />

            <div className="pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => enterFullscreen()}
                leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
                className="w-full text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Re-enter Fullscreen
              </Button>
            </div>
          </div>

          {/* Anti-Cheat Proctoring Strip */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Proctored Session</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Fullscreen exit or window blur will immediately terminate this examination. Answers are autosaved automatically.
            </p>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        isSubmitting={isSubmitting}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
      />
    </div>
  );
};
