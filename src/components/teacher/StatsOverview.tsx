import React from "react";
import { BookOpenCheck, FileText, CheckCircle2, Users, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface StatsOverviewProps {
  totalTests: number;
  draftTests?: number;
  publishedTests: number;
  totalAttempts: number;
  completedAttempts?: number;
  terminatedAttempts?: number;
  averageScore?: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalTests,
  draftTests = 0,
  publishedTests,
  totalAttempts,
  completedAttempts = 0,
  terminatedAttempts = 0,
  averageScore = 0,
}) => {
  const stats = [
    {
      label: "Total Tests",
      value: totalTests,
      subtext: `${publishedTests} published`,
      icon: BookOpenCheck,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/60 dark:border-indigo-800/60",
    },
    {
      label: "Total Attempts",
      value: totalAttempts.toLocaleString(),
      subtext: "Student examinees",
      icon: Users,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/60",
    },
    {
      label: "Completed",
      value: completedAttempts,
      subtext: "Submitted papers",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/60",
    },
    {
      label: "Terminated",
      value: terminatedAttempts,
      subtext: "Integrity violations",
      icon: FileText,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-800/60",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} hoverEffect className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </span>
              </div>
              <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {stat.subtext}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
