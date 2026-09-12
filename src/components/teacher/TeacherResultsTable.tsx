"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export interface TeacherAttemptRow {
  id: string;
  testId: string;
  testTitle: string;
  testSubject: string;
  totalMarks: number;
  passingPercentage: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentIdNumber?: string | null;
  startedAt: string;
  submittedAt?: string | null;
  terminatedAt?: string | null;
  status: "IN_PROGRESS" | "SUBMITTED" | "TERMINATED" | "EXPIRED" | string;
  score: number | null;
  percentage: number | null;
  isPassed: boolean | null;
  violationCount: number;
  terminationReason?: string | null;
}

interface TeacherResultsTableProps {
  attempts: TeacherAttemptRow[];
  tests: { id: string; title: string }[];
  currentTestId?: string;
}

export const TeacherResultsTable: React.FC<TeacherResultsTableProps> = ({
  attempts,
  tests,
  currentTestId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<string>(currentTestId || "ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("LATEST");
  const [isExporting, setIsExporting] = useState(false);

  // Filter and sort attempts in-memory for instant responsiveness
  const filteredAttempts = useMemo(() => {
    const list = attempts.filter((att) => {
      // 1. Search filter
      if (searchTerm.trim().length > 0) {
        const query = searchTerm.toLowerCase();
        const matchesName = att.studentName.toLowerCase().includes(query);
        const matchesEmail = att.studentEmail.toLowerCase().includes(query);
        const matchesTitle = att.testTitle.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesTitle) {
          return false;
        }
      }

      // 2. Test filter
      if (selectedTestId !== "ALL" && att.testId !== selectedTestId) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== "ALL" && att.status !== selectedStatus) {
        return false;
      }

      // 4. Date filter
      if (selectedDateFilter !== "ALL") {
        const attemptDate = new Date(att.startedAt).getTime();
        const now = Date.now();
        if (selectedDateFilter === "TODAY") {
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          if (attemptDate < oneDayAgo) return false;
        } else if (selectedDateFilter === "WEEK") {
          const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (attemptDate < oneWeekAgo) return false;
        } else if (selectedDateFilter === "MONTH") {
          const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (attemptDate < oneMonthAgo) return false;
        }
      }

      return true;
    });

    // Sort
    return list.sort((a, b) => {
      if (sortBy === "SCORE_DESC") {
        return (b.score ?? -1) - (a.score ?? -1);
      } else if (sortBy === "SCORE_ASC") {
        return (a.score ?? 999999) - (b.score ?? 999999);
      } else if (sortBy === "SUBMITTED_TIME") {
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return timeB - timeA;
      }
      // Default: LATEST
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
  }, [attempts, searchTerm, selectedTestId, selectedStatus, selectedDateFilter, sortBy]);

  const handleExportCsv = () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (selectedTestId !== "ALL") params.set("testId", selectedTestId);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const downloadUrl = `/api/teacher/results/export${params.toString() ? `?${params.toString()}` : ""}`;
      window.open(downloadUrl, "_blank");
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, or test title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Test filter */}
          {!currentTestId && (
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Examinations</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="TERMINATED">Terminated</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Date filter */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Last 24 Hours</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">Last 30 Days</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="LATEST">Sort: Latest Started</option>
            <option value="SCORE_DESC">Sort: Highest Score</option>
            <option value="SCORE_ASC">Sort: Lowest Score</option>
            <option value="SUBMITTED_TIME">Sort: Submission Time</option>
          </select>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            isLoading={isExporting}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs font-semibold border-slate-300 dark:border-slate-700"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Results Count & Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{filteredAttempts.length}</strong> of <strong>{attempts.length}</strong> examination attempts
        </span>
      </div>

      {/* Attempts Table */}
      {filteredAttempts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">No examination attempts match the selected criteria.</p>
          {(searchTerm || selectedStatus !== "ALL" || selectedTestId !== "ALL" || selectedDateFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("ALL");
                setSelectedTestId(currentTestId || "ALL");
                setSelectedDateFilter("ALL");
              }}
              className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Student Email</th>
                <th className="py-3.5 px-4">Test Name</th>
                <th className="py-3.5 px-3">Subject</th>
                <th className="py-3.5 px-3">Started At</th>
                <th className="py-3.5 px-3">Submitted At</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Score</th>
                <th className="py-3.5 px-3">Percentage</th>
                <th className="py-3.5 px-3">Violations</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAttempts.map((att) => {
                const isTerminated = att.status === "TERMINATED";
                const isSubmitted = att.status === "SUBMITTED";
                const isExpired = att.status === "EXPIRED";
                const isInProgress = att.status === "IN_PROGRESS";

                const isPassed =
                  att.isPassed !== null && att.isPassed !== undefined
                    ? att.isPassed
                    : att.percentage !== null
                    ? att.percentage >= att.passingPercentage
                    : false;

                return (
                  <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {att.studentName}
                      </div>
                      {att.studentIdNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {att.studentIdNumber}
                        </div>
                      )}
                    </td>

                    {/* Student Email */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {att.studentEmail}
                    </td>

                    {/* Test Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {att.testTitle}
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-3 text-slate-500">
                      {att.testSubject}
                    </td>

                    {/* Started At */}
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(att.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(att.startedAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Submitted At */}
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {att.submittedAt ? (
                        <>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {new Date(att.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {new Date(att.submittedAt).toLocaleDateString()}
                          </span>
                        </>
                      ) : att.terminatedAt ? (
                        <>
                          <span className="text-rose-500 font-medium">
                            {new Date(att.terminatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="block text-[10px] text-rose-400">
                            Terminated
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">In Progress</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <Badge
                        variant={
                          isSubmitted
                            ? "success"
                            : isTerminated
                            ? "danger"
                            : isExpired
                            ? "warning"
                            : "indigo"
                        }
                        size="sm"
                        className="font-semibold"
                      >
                        {att.status}
                      </Badge>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {att.score !== null ? `${att.score} / ${att.totalMarks}` : "—"}
                    </td>

                    {/* Percentage */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {att.percentage !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {att.percentage}%
                          </span>
                          <Badge variant={isPassed ? "success" : "danger"} size="sm" className="text-[9px] px-1 py-0">
                            {isPassed ? "P" : "F"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Violations */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isTerminated ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          Terminated ({att.terminationReason || "Violation"})
                        </span>
                      ) : att.violationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {att.violationCount} {att.violationCount === 1 ? "flag" : "flags"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          Clean
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link href={`/teacher/results/${att.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
