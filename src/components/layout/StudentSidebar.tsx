"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Award,
  User,
  LogOut,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

interface StudentSidebarProps {
  userName?: string;
  userEmail?: string;
  studentIdNumber?: string | null;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  userName = "Alex Morgan",
  userEmail = "student@examora.edu",
  studentIdNumber = "RCAS2025BCY001",
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const navItems = [
    {
      label: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Available Tests",
      href: "/student/tests",
      icon: FileSpreadsheet,
    },
    {
      label: "My Results",
      href: "/student/results",
      icon: Award,
    },
    {
      label: "Profile",
      href: "/student/profile",
      icon: User,
    },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand & Portal Header */}
      <div className="p-6 border-b border-slate-800/80">
        <Link href="/student/dashboard" className="block group">
          <ExamoraLogo size="sm" />
          <div className="flex items-center gap-1 mt-2.5">
            <Badge variant="success" size="sm" className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold">
              Student Dashboard
            </Badge>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Student Portal
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Student Badge & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center justify-center font-semibold text-xs shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {studentIdNumber || userEmail}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors border border-slate-800 hover:border-rose-900/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isLoggingOut ? "Logging out..." : "Sign Out"}
        </button>
      </div>
    </aside>
  );
};
