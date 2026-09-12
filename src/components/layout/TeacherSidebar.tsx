"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  BarChart3,
  User,
  LogOut,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

interface TeacherSidebarProps {
  userName?: string;
  userEmail?: string;
  department?: string | null;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  userName = "Dr. Sarah Jenkins",
  userEmail = "teacher@examora.edu",
  department = "Faculty of Computer Science",
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const navItems = [
    {
      label: "Dashboard",
      href: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Tests",
      href: "/teacher/tests",
      icon: FileCheck,
    },
    {
      label: "Results",
      href: "/teacher/results",
      icon: BarChart3,
    },
    {
      label: "Profile",
      href: "/teacher/profile",
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
        <Link href="/teacher/dashboard" className="block group">
          <ExamoraLogo size="sm" />
          <div className="flex items-center gap-1 mt-2.5">
            <Badge variant="indigo" size="sm" className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold">
              Teacher Dashboard
            </Badge>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Management
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
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center justify-center font-semibold text-xs shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate">{department || userEmail}</p>
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
