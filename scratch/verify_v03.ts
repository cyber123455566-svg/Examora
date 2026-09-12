import { PrismaClient } from "@prisma/client";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/lib/auth";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("==================================================");
  console.log("🧪 SECURETEST V0.3 STUDENT EXAM & ANTI-CHEAT VERIFICATION");
  console.log("==================================================\n");

  const results: { testCase: string; passed: boolean; details?: string }[] = [];

  function record(testCase: string, passed: boolean, details?: string) {
    results.push({ testCase, passed, details });
    console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${testCase} ${details ? `(${details})` : ""}`);
  }

  // 1. Fetch Teacher & Student
  const teacher = await db.user.findFirst({ where: { role: "TEACHER" } });
  const student = await db.user.findFirst({ where: { role: "STUDENT" } });

  if (!teacher || !student) {
    console.error("Missing seeded teacher or student!");
    process.exit(1);
  }

  const studentToken = await createSessionToken({
    userId: student.id,
    email: student.email,
    name: student.name,
    role: "STUDENT",
    department: student.department,
  });

  const teacherToken = await createSessionToken({
    userId: teacher.id,
    email: teacher.email,
    name: teacher.name,
    role: "TEACHER",
    department: teacher.department,
  });

  const studentHeaders = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${studentToken}`,
  };

  const teacherHeaders = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${teacherToken}`,
  };

  // Create a dedicated test for V0.3 testing
  const test = await db.test.create({
    data: {
      title: "CS305: Systems Programming & Concurrency",
      subject: "Computer Science",
      instructions: "Fullscreen examination. All tab switching is strictly prohibited.",
      durationMinutes: 45,
      totalMarks: 7,
      passingPercentage: 50.0,
      maximumAttempts: 1,
      status: "PUBLISHED",
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "Which system call creates a new process in POSIX Unix?",
            questionType: "MULTIPLE_CHOICE",
            marks: 2,
            correctAnswer: "A",
            orderIndex: 0,
            options: {
              create: [
                { optionKey: "A", optionText: "fork()", orderIndex: 0 },
                { optionKey: "B", optionText: "exec()", orderIndex: 1 },
                { optionKey: "C", optionText: "clone()", orderIndex: 2 },
                { optionKey: "D", optionText: "pthread_create()", orderIndex: 3 },
              ],
            },
          },
          {
            questionText: "Deadlocks can occur even when mutual exclusion is not present.",
            questionType: "TRUE_FALSE",
            marks: 2,
            correctAnswer: "FALSE",
            orderIndex: 1,
          },
          {
            questionText: "Define the term 'race condition' in multithreaded software.",
            questionType: "SHORT_ANSWER",
            marks: 3,
            correctAnswer: "An undesirable situation that occurs when a device or system attempts to perform two or more operations at the same time",
            orderIndex: 2,
          },
        ],
      },
    },
    include: {
      questions: {
        include: { options: true },
      },
    },
  });

  console.log(`Created Test: ${test.title} (${test.id}) with 3 questions.\n`);

  // ==========================================
  // TEST 1: START EXAM & SANITIZATION (NO CORRECT ANSWER LEAK)
  // ==========================================
  const startRes = await fetch(`${BASE_URL}/api/student/tests/${test.id}/start`, {
    method: "POST",
    headers: studentHeaders,
  });
  const startData = await startRes.json();
  const attemptId = startData.attempt?.id;

  const questionsLeaked = startData.questions?.some((q: any) => q.correctAnswer !== undefined);

  record(
    "Start Exam & Create Attempt (/api/student/tests/[id]/start)",
    startRes.status === 200 && attemptId && startData.attempt.status === "IN_PROGRESS",
    `Attempt ID: ${attemptId}`
  );

  record(
    "Security: Correct answers strictly stripped from student payload",
    !questionsLeaked,
    `Question count returned: ${startData.questions?.length}`
  );

  // ==========================================
  // TEST 2: ANSWER AUTOSAVE PERSISTENCE
  // ==========================================
  const q1 = test.questions.find((q) => q.questionType === "MULTIPLE_CHOICE")!;
  const q2 = test.questions.find((q) => q.questionType === "TRUE_FALSE")!;
  const q3 = test.questions.find((q) => q.questionType === "SHORT_ANSWER")!;

  const saveQ1Res = await fetch(`${BASE_URL}/api/examinations/${attemptId}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({ questionId: q1.id, answer: "A" }), // Correct answer for Q1
  });

  const saveQ2Res = await fetch(`${BASE_URL}/api/examinations/${attemptId}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({ questionId: q2.id, answer: "FALSE" }), // Correct answer for Q2
  });

  const saveQ3Res = await fetch(`${BASE_URL}/api/examinations/${attemptId}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({ questionId: q3.id, answer: "Timing dependent bug between concurrent threads" }),
  });

  const dbSavedAnswers = await db.answer.findMany({ where: { attemptId } });
  record(
    "Answer Autosave Persistence (/api/examinations/[attemptId]/answers)",
    saveQ1Res.ok && saveQ2Res.ok && saveQ3Res.ok && dbSavedAnswers.length === 3,
    `Saved in DB: ${dbSavedAnswers.length} responses`
  );

  // ==========================================
  // TEST 3: REFRESH / REOPEN RECOVERY
  // ==========================================
  const recoverRes = await fetch(`${BASE_URL}/api/student/tests/${test.id}/start`, {
    method: "POST",
    headers: studentHeaders,
  });
  const recoverData = await recoverRes.json();
  const sameAttemptReturned = recoverData.attempt?.id === attemptId;
  const recoveredAnswersCount = recoverData.savedAnswers?.length;

  record(
    "Refresh / Reopen Recovery (Restores existing attempt with saved answers)",
    recoverRes.ok && sameAttemptReturned && recoveredAnswersCount === 3,
    `Attempt ID matched: ${sameAttemptReturned}, Recovered answers: ${recoveredAnswersCount}`
  );

  // ==========================================
  // TEST 4: NORMAL SUBMISSION & AUTOMATIC EVALUATION
  // ==========================================
  const submitRes = await fetch(`${BASE_URL}/api/examinations/${attemptId}/submit`, {
    method: "POST",
    headers: studentHeaders,
  });
  const submitData = await submitRes.json();

  // Q1 (2 marks) + Q2 (2 marks) correct = 4 points. Q3 is short answer = pending (0 marks). Total possible = 7.
  // Percentage = (4 / 7) * 100 = 57.1%
  const correctAutoGrading =
    submitData.score === 4 &&
    submitData.totalMarks === 7 &&
    submitData.pendingManualCount === 1 &&
    submitData.status === "SUBMITTED";

  record(
    "Final Submission & Automatic Evaluation (/api/examinations/[attemptId]/submit)",
    submitRes.ok && correctAutoGrading,
    `Score: ${submitData.score}/${submitData.totalMarks} (${submitData.percentage}%), Pending Manual: ${submitData.pendingManualCount}`
  );

  // ==========================================
  // TEST 5: MAXIMUM ATTEMPTS ENFORCEMENT
  // ==========================================
  const duplicateStartRes = await fetch(`${BASE_URL}/api/student/tests/${test.id}/start`, {
    method: "POST",
    headers: studentHeaders,
  });
  record(
    "Duplicate / Max Attempt Protection (Blocks new attempt when max reached)",
    duplicateStartRes.status === 400,
    `Status code: ${duplicateStartRes.status}`
  );

  // ==========================================
  // TEST 6: ANTI-CHEAT VIOLATION IMMEDIATE TERMINATION
  // ==========================================
  // Create a second test with maxAttempts=2 to test violation termination
  const test2 = await db.test.create({
    data: {
      title: "CS306: Anti-Cheat Proctoring Drill",
      subject: "Cybersecurity",
      instructions: "Anti-cheat test run.",
      durationMinutes: 30,
      totalMarks: 5,
      passingPercentage: 40.0,
      maximumAttempts: 2,
      status: "PUBLISHED",
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "Sample question?",
            questionType: "TRUE_FALSE",
            marks: 5,
            correctAnswer: "TRUE",
          },
        ],
      },
    },
  });

  const startTest2Res = await fetch(`${BASE_URL}/api/student/tests/${test2.id}/start`, {
    method: "POST",
    headers: studentHeaders,
  });
  const startTest2Data = await startTest2Res.json();
  const attempt2Id = startTest2Data.attempt?.id;

  // Trigger violation (e.g. TAB_SWITCH)
  const violationRes = await fetch(`${BASE_URL}/api/examinations/${attempt2Id}/violations`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({
      violationType: "TAB_SWITCH",
      metadata: { reason: "User switched browser tabs during proctored exam." },
    }),
  });
  const violationData = await violationRes.json();

  const attempt2InDB = await db.testAttempt.findUnique({ where: { id: attempt2Id } });

  const terminationSucceeded = Boolean(
    violationRes.ok &&
    attempt2InDB?.status === "TERMINATED" &&
    attempt2InDB.terminationReason?.includes("switched browser tabs") &&
    attempt2InDB.violationCount === 1
  );

  record(
    "Anti-Cheat Violation: Immediate Termination (TAB_SWITCH -> TERMINATED)",
    terminationSucceeded,
    `Status: ${attempt2InDB?.status}, Reason: ${attempt2InDB?.terminationReason}`
  );

  // ==========================================
  // TEST 7: TERMINATED ATTEMPT LOCK (NO FURTHER ANSWERS OR SUBMISSION)
  // ==========================================
  const saveAfterTerminatedRes = await fetch(`${BASE_URL}/api/examinations/${attempt2Id}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({ questionId: "some-id", answer: "A" }),
  });

  const submitAfterTerminatedRes = await fetch(`${BASE_URL}/api/examinations/${attempt2Id}/submit`, {
    method: "POST",
    headers: studentHeaders,
  });

  record(
    "Attempt Lock: Terminated exam rejects subsequent answers & submissions",
    saveAfterTerminatedRes.status === 400 && submitAfterTerminatedRes.status === 400
  );

  // ==========================================
  // TEST 8: SERVER-SIDE AUTHORIZATION & ACCESS CONTROL
  // ==========================================
  const teacherAccessStudentExamRes = await fetch(`${BASE_URL}/api/student/tests/${test.id}/start`, {
    method: "POST",
    headers: teacherHeaders,
  });

  record(
    "RBAC: Teachers blocked from starting student exams (403 Forbidden)",
    teacherAccessStudentExamRes.status === 403
  );

  // ==========================================
  // TEST 9: TEACHER RESULTS PAGE DATA ACCURACY
  // ==========================================
  const teacherResultsAttempts = await db.testAttempt.findMany({
    where: { testId: { in: [test.id, test2.id] } },
    include: { test: true, student: true },
  });

  const hasSubmittedRecord = teacherResultsAttempts.some((a) => a.status === "SUBMITTED");
  const hasTerminatedRecord = teacherResultsAttempts.some((a) => a.status === "TERMINATED");

  record(
    "Teacher Results: Displays both SUBMITTED and TERMINATED attempt records",
    hasSubmittedRecord && hasTerminatedRecord,
    `Total test records verified: ${teacherResultsAttempts.length}`
  );

  // Clean up
  await db.violation.deleteMany({ where: { attemptId: { in: [attemptId, attempt2Id] } } });
  await db.answer.deleteMany({ where: { attemptId: { in: [attemptId, attempt2Id] } } });
  await db.testAttempt.deleteMany({ where: { id: { in: [attemptId, attempt2Id] } } });
  await db.questionOption.deleteMany({ where: { question: { testId: { in: [test.id, test2.id] } } } });
  await db.question.deleteMany({ where: { testId: { in: [test.id, test2.id] } } });
  await db.test.deleteMany({ where: { id: { in: [test.id, test2.id] } } });

  console.log("\n==================================================");
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`📊 FINAL SUMMARY: ${totalPassed} / ${results.length} PASSED`);
  console.log("==================================================");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Verification failed:", e);
  db.$disconnect();
  process.exit(1);
});
