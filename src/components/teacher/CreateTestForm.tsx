"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, ArrowLeft, Clock, Calendar, Shuffle, HelpCircle, AlertCircle, FileText, Settings, Sliders } from "lucide-react";

export function CreateTestForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    instructions: "",
    durationMinutes: "60",
    passingPercentage: "50",
    maximumAttempts: "1",
    startAt: "",
    endAt: "",
    randomizeQuestions: false,
    randomizeOptions: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.title.trim()) {
      errs.title = "Test Title is required.";
    }

    if (!formData.subject.trim()) {
      errs.subject = "Subject is required.";
    }

    const duration = parseInt(formData.durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      errs.durationMinutes = "Duration must be at least 1 minute.";
    }

    const passing = parseFloat(formData.passingPercentage);
    if (isNaN(passing) || passing < 0 || passing > 100) {
      errs.passingPercentage = "Passing percentage must be between 0 and 100.";
    }

    const attempts = parseInt(formData.maximumAttempts, 10);
    if (isNaN(attempts) || attempts < 1) {
      errs.maximumAttempts = "Maximum attempts must be at least 1.";
    }

    if (formData.startAt && formData.endAt) {
      const s = new Date(formData.startAt);
      const e = new Date(formData.endAt);
      if (e <= s) {
        errs.endAt = "End date and time must be after the start date and time.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/teacher/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to create test.");
        return;
      }

      // Route immediately to Question Builder interface
      router.push(`/teacher/tests/${data.test.id}/edit`);
    } catch (err) {
      console.error("Create test submission error:", err);
      setServerError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 1. Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Primary academic details for this examination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Examination Title *"
              placeholder="e.g., CS301: Advanced Data Structures & Algorithm Design"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              disabled={isSubmitting}
            />

            <Input
              label="Subject / Course *"
              placeholder="e.g., Computer Science, Mathematics"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              error={errors.subject}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Examination Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of test topics, chapters covered, or assessment objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Instructions for Students
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Calculators permitted. Read all questions thoroughly before answering. Do not leave the browser window..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Test Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" />
            <CardTitle>Assessment & Scheduling Settings</CardTitle>
          </div>
          <CardDescription>Timing, marks thresholds, and availability windows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Duration (Minutes) *"
              type="number"
              min="1"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              error={errors.durationMinutes}
              leftIcon={<Clock className="w-4 h-4" />}
              disabled={isSubmitting}
            />

            <Input
              label="Passing Score (%)"
              type="number"
              min="0"
              max="100"
              value={formData.passingPercentage}
              onChange={(e) => setFormData({ ...formData, passingPercentage: e.target.value })}
              error={errors.passingPercentage}
              disabled={isSubmitting}
            />

            <Input
              label="Max Attempts Allowed"
              type="number"
              min="1"
              value={formData.maximumAttempts}
              onChange={(e) => setFormData({ ...formData, maximumAttempts: e.target.value })}
              error={errors.maximumAttempts}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Available From (Start Date & Time)"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              leftIcon={<Calendar className="w-4 h-4" />}
              helperText="Optional. Leave blank for immediate availability upon publishing."
              disabled={isSubmitting}
            />

            <Input
              label="Available Until (End Date & Time)"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              error={errors.endAt}
              leftIcon={<Calendar className="w-4 h-4" />}
              helperText="Optional. Test will automatically close after this date."
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Question Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <CardTitle>Question & Option Settings</CardTitle>
          </div>
          <CardDescription>Anti-collusion and randomization options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                  Randomize Question Sequence
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Each student receives questions in a distinct randomized order
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.randomizeOptions}
                onChange={(e) => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                  Randomize Option Choices
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Multiple choice answers (A, B, C, D) are shuffled for each student
                </span>
              </div>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Test & Open Question Builder
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
