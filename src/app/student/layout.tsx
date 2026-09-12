import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { StudentSidebar } from "@/components/layout/StudentSidebar";

export const metadata = {
  title: "Student Dashboard",
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authorization check (Defense in Depth: Student Portal)
  const session = await requireServerRole(["STUDENT"]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <StudentSidebar
        userName={session.name}
        userEmail={session.email}
        studentIdNumber={session.studentIdNumber}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
