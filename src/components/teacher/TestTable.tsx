import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Clock, HelpCircle, Eye, Edit3, MoreVertical } from "lucide-react";

export interface TestItem {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  status: string;
  createdAt: string | Date;
}

interface TestTableProps {
  tests: TestItem[];
  onActionClick?: (test: TestItem) => void;
}

export const TestTable: React.FC<TestTableProps> = ({ tests, onActionClick }) => {
  if (tests.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No examinations found</h4>
        <p className="text-xs text-slate-500 mt-1">Get started by creating your first examination.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="py-3.5 px-5">Examination Title</th>
            <th className="py-3.5 px-4">Subject</th>
            <th className="py-3.5 px-4">Questions</th>
            <th className="py-3.5 px-4">Duration</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {tests.map((test) => (
            <tr
              key={test.id}
              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="py-4 px-5">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {test.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ID: {test.id.slice(0, 8)}...
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                  variant={test.status === "PUBLISHED" ? "success" : "warning"}
                  size="sm"
                  className="font-medium"
                >
                  {test.status}
                </Badge>
              </td>
              <td className="py-4 px-5 text-right">
                <button
                  onClick={() => onActionClick && onActionClick(test)}
                  className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
