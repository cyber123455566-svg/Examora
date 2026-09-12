import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";

export const metadata = {
  title: "Teacher Dashboard",
};

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authorization check (Defense in Depth)
  const session = await requireServerRole(["TEACHER"]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TeacherSidebar
        userName={session.name}
        userEmail={session.email}
        department={session.department}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
