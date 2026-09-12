"use client";

import React from "react";
import { ShieldCheck, Calendar, Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: "TEACHER" | "STUDENT";
  user: {
    name: string;
    email: string;
    department?: string | null;
  };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  role,
  user,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-8 py-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Institutional Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">System Security:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
          </div>

          {/* Academic Term */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Academic Year 2026</span>
          </div>

          {/* Role Badge */}
          <Badge
            variant={role === "TEACHER" ? "indigo" : "success"}
            className="font-semibold uppercase tracking-wider text-xs"
          >
            {role === "TEACHER" ? "Faculty / Staff" : "Student Examinee"}
          </Badge>
        </div>
      </div>
    </header>
  );
};
