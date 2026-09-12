"use client";

import React, { useState } from "react";
import { TestInstructionsView } from "./TestInstructionsView";
import { ExaminationRoom } from "./ExaminationRoom";
import { ExaminationTerminated } from "./ExaminationTerminated";
import { ExaminationSubmitted } from "./ExaminationSubmitted";
import { ExamQuestionItem } from "./ExamQuestionView";

interface StudentTestContainerProps {
  test: {
    id: string;
    title: string;
    subject: string;
    description?: string | null;
    instructions?: string | null;
    durationMinutes: number;
    totalMarks: number;
    passingPercentage: number;
    totalQuestions: number;
    startAt?: string | null;
    endAt?: string | null;
  };
  initialAttempt?: {
    id: string;
    testId: string;
    status: string;
    startedAt: string;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    testTitle: string;
    testSubject: string;
    score?: number | null;
    percentage?: number | null;
    submittedAt?: string | null;
    terminatedAt?: string | null;
    terminationReason?: string | null;
  } | null;
  initialQuestions?: ExamQuestionItem[];
  initialAnswers?: { questionId: string; answer: string | null }[];
  initialRemainingSeconds?: number;
}

export const StudentTestContainer: React.FC<StudentTestContainerProps> = ({
  test,
  initialAttempt,
  initialQuestions = [],
  initialAnswers = [],
  initialRemainingSeconds = 0,
}) => {
  const [attempt, setAttempt] = useState(initialAttempt || null);
  const [questions, setQuestions] = useState<ExamQuestionItem[]>(initialQuestions);
  const [answers, setAnswers] = useState(initialAnswers);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // If already submitted
  if (attempt && attempt.status === "SUBMITTED") {
    return (
      <ExaminationSubmitted
        testTitle={test.title}
        testSubject={test.subject}
        submittedAt={attempt.submittedAt}
        answeredCount={answers.length}
        totalQuestions={test.totalQuestions}
        score={attempt.score}
        percentage={attempt.percentage}
      />
    );
  }

  // If already terminated
  if (attempt && attempt.status === "TERMINATED") {
    return (
      <ExaminationTerminated
        testTitle={test.title}
        reason={attempt.terminationReason}
        terminatedAt={attempt.terminatedAt}
      />
    );
  }

  // If active attempt is in progress -> render Examination Room
  if (attempt && attempt.status === "IN_PROGRESS" && questions.length > 0) {
    return (
      <ExaminationRoom
        attempt={attempt}
        questions={questions}
        initialAnswers={answers}
        initialRemainingSeconds={remainingSeconds}
      />
    );
  }

  // Handler to start the examination
  const handleStartExam = async () => {
    // 1. Immediately request fullscreen within active user gesture
    if (typeof document !== "undefined") {
      try {
        const elem = document.documentElement as any;
        if (
          !document.fullscreenElement &&
          !(document as any).webkitFullscreenElement &&
          !(document as any).mozFullScreenElement &&
          !(document as any).msFullscreenElement
        ) {
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
          } else if (elem.mozRequestFullScreen) {
            await elem.mozRequestFullScreen();
          } else if (elem.msRequestFullscreen) {
            await elem.msRequestFullscreen();
          }
        }
      } catch (err) {
        console.warn("Fullscreen permission not granted during start click, gate overlay will prompt:", err);
      }
    }

    try {
      setIsStarting(true);
      setStartError(null);

      const res = await fetch(`/api/student/tests/${test.id}/start`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setStartError(data.error || "Failed to start examination.");
        return;
      }

      setAttempt(data.attempt);
      setQuestions(data.questions);
      setAnswers(data.savedAnswers || []);
      setRemainingSeconds(data.remainingSeconds);
    } catch (err) {
      console.error("Start exam error:", err);
      setStartError("Network error while starting examination. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // Otherwise, render the Pre-Exam Instructions View
  return (
    <TestInstructionsView
      test={test}
      onStartExam={handleStartExam}
      isStarting={isStarting}
      errorMessage={startError}
    />
  );
};
