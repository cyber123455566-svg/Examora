import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { CreateTestForm } from "@/components/teacher/CreateTestForm";

export default async function CreateTestPage() {
  const session = await requireServerRole(["TEACHER"]);

  return (
    <>
      <DashboardHeader
        title="Create New Examination"
        subtitle="Configure assessment metadata, duration, marks, and proctoring settings"
        role="TEACHER"
        user={session}
      />
      <main className="p-8 max-w-5xl space-y-6">
        <CreateTestForm />
      </main>
    </>
  );
}
