"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PublishValidationModal } from "@/components/teacher/PublishValidationModal";
import {
  Clock,
  HelpCircle,
  Edit,
  Eye,
  Send,
  XCircle,
  Trash2,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface ManagedTestItem {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks?: number;
  totalQuestions: number;
  status: string; // DRAFT | PUBLISHED | CLOSED
  createdAt: string;
  startAt?: string | null;
  endAt?: string | null;
  attemptsCount: number;
}

interface TestManagementTableProps {
  initialTests: ManagedTestItem[];
  showCreateButton?: boolean;
}

export const TestManagementTable: React.FC<TestManagementTableProps> = ({
  initialTests,
  showCreateButton = true,
}) => {
  const router = useRouter();

  const [tests, setTests] = useState<ManagedTestItem[]>(initialTests);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter & search logic
  const filteredTests = tests.filter((t) => {
    const matchesStatus =
      filterStatus === "ALL" || t.status.toUpperCase() === filterStatus.toUpperCase();

    const matchesSearch =
      searchQuery.trim() === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Handle Publish Test
  const handlePublish = async (testId: string) => {
    try {
      setIsLoadingAction(testId);
      const res = await fetch(`/api/teacher/tests/${testId}/publish`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.issues && Array.isArray(data.issues)) {
          setValidationErrors(data.issues);
          setIsValidationModalOpen(true);
        } else {
          setFeedback({ type: "error", text: data.error || "Failed to publish test." });
        }
        return;
      }

      setTests(tests.map((t) => (t.id === testId ? { ...t, status: "PUBLISHED" } : t)));
      setFeedback({ type: "success", text: "Examination published successfully!" });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Network error while publishing." });
    } finally {
      setIsLoadingAction(null);
    }
  };

  // Handle Close Test
  const handleClose = async (testId: string) => {
    if (!confirm("Are you sure you want to close this examination? No new student attempts will be permitted.")) {
      return;
    }

    try {
      setIsLoadingAction(testId);
      const res = await fetch(`/api/teacher/tests/${testId}/close`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to close test." });
        return;
      }

      setTests(tests.map((t) => (t.id === testId ? { ...t, status: "CLOSED" } : t)));
      setFeedback({ type: "success", text: "Examination closed successfully." });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Network error while closing test." });
    } finally {
      setIsLoadingAction(null);
    }
  };

  // Handle Delete Test (with attempt protection)
  const handleDelete = async (testId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoadingAction(testId);
      const res = await fetch(`/api/teacher/tests/${testId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to delete test." });
        return;
      }

      setTests(tests.filter((t) => t.id !== testId));
      setFeedback({ type: "success", text: "Examination deleted successfully." });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Network error while deleting test." });
    } finally {
      setIsLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          {["ALL", "DRAFT", "PUBLISHED", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === status
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {status === "ALL" ? "All Tests" : status}
            </button>
          ))}
        </div>

        {/* Search Input & Create Action */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>

          {showCreateButton && (
            <Link href="/teacher/tests/create">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create New Test
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Table Container */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            No examinations match your criteria
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-5">Examination Title</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Questions</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Schedule Window</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTests.map((test) => {
                const isWorking = isLoadingAction === test.id;
                return (
                  <tr
                    key={test.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                        {test.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {test.attemptsCount} student {test.attemptsCount === 1 ? "attempt" : "attempts"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {test.subject}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {test.totalQuestions} Questions
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {test.durationMinutes} mins
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          test.status === "PUBLISHED"
                            ? "success"
                            : test.status === "CLOSED"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                        className="font-medium"
                      >
                        {test.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {test.startAt || test.endAt ? (
                        <div className="space-y-0.5 text-[11px]">
                          {test.startAt && (
                            <div>From: {new Date(test.startAt).toLocaleDateString()}</div>
                          )}
                          {test.endAt && <div>To: {new Date(test.endAt).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Immediate</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit */}
                        <Link href={`/teacher/tests/${test.id}/edit`}>
                          <button
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Questions & Settings"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>

                        {/* Preview */}
                        <Link href={`/teacher/tests/${test.id}/preview`}>
                          <button
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Preview Examinee Experience"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>

                        {/* Publish (if Draft) */}
                        {test.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublish(test.id)}
                            disabled={isWorking}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Publish Test"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* Close (if Published) */}
                        {test.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleClose(test.id)}
                            disabled={isWorking}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Close Test"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete (with student attempt protection) */}
                        <button
                          onClick={() => handleDelete(test.id, test.title)}
                          disabled={isWorking}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Examination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Validation Errors Modal */}
      <PublishValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        errors={validationErrors}
      />
    </div>
  );
};
