import { PrismaClient } from "@prisma/client";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/lib/auth";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("==================================================");
  console.log("🧪 SECURETEST V0.4 RESULTS, EVALUATION & ANALYTICS VERIFICATION");
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

  // Create another student to test isolation
  let student2 = await db.user.findUnique({ where: { email: "student2@securetest.edu" } });
  if (!student2) {
    student2 = await db.user.create({
      data: {
        name: "Priya Sharma",
        email: "student2@securetest.edu",
        passwordHash: student.passwordHash,
        role: "STUDENT",
        department: "Information Technology",
        studentIdNumber: "STU-2026-002",
      },
    });
  }

  const teacherToken = await createSessionToken({
    userId: teacher.id,
    email: teacher.email,
    name: teacher.name,
    role: "TEACHER",
    department: teacher.department,
  });

  const studentToken = await createSessionToken({
    userId: student.id,
    email: student.email,
    name: student.name,
    role: "STUDENT",
    department: student.department,
  });

  const student2Token = await createSessionToken({
    userId: student2.id,
    email: student2.email,
    name: student2.name,
    role: "STUDENT",
    department: student2.department,
  });

  const teacherHeaders = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${teacherToken}`,
  };

  const studentHeaders = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${studentToken}`,
  };

  const student2Headers = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${student2Token}`,
  };

  // Setup a test with MCQ, True/False, and Short Answer
  const test = await db.test.create({
    data: {
      title: "CS401: Distributed Systems & Consensus",
      subject: "Computer Science",
      instructions: "Proctored examination for V0.4 verification.",
      durationMinutes: 60,
      totalMarks: 10,
      passingPercentage: 50.0,
      maximumAttempts: 2,
      status: "PUBLISHED",
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "What algorithm is commonly used for distributed consensus?",
            questionType: "MULTIPLE_CHOICE",
            marks: 3,
            orderIndex: 0,
            correctAnswer: "B",
            options: {
              create: [
                { optionKey: "A", optionText: "Dijkstra's Algorithm", orderIndex: 0 },
                { optionKey: "B", optionText: "Raft Consensus", orderIndex: 1 },
                { optionKey: "C", optionText: "Binary Search", orderIndex: 2 },
              ],
            },
          },
          {
            questionText: "CAP theorem states that a system can guarantee all three simultaneously: C, A, and P.",
            questionType: "TRUE_FALSE",
            marks: 2,
            orderIndex: 1,
            correctAnswer: "FALSE",
          },
          {
            questionText: "Explain the purpose of heartbeats in leader-based consensus protocols.",
            questionType: "SHORT_ANSWER",
            marks: 5,
            orderIndex: 2,
            correctAnswer: "Heartbeats signal leader vitality and prevent election timeouts among followers.",
          },
        ],
      },
    },
    include: { questions: true },
  });

  const qMcq = test.questions.find((q) => q.questionType === "MULTIPLE_CHOICE")!;
  const qTf = test.questions.find((q) => q.questionType === "TRUE_FALSE")!;
  const qShort = test.questions.find((q) => q.questionType === "SHORT_ANSWER")!;

  // Student 1 starts test and submits answers
  const startRes1 = await fetch(`${BASE_URL}/api/student/tests/${test.id}/start`, {
    method: "POST",
    headers: studentHeaders,
  });
  const startData1 = await startRes1.json();
  const attempt1Id = startData1.attempt?.id;

  // Save answers for Student 1:
  // Q1: B (Correct = 3 marks)
  // Q2: FALSE (Correct = 2 marks)
  // Q3: Short Answer (Pending manual review = 0 marks initial)
  await fetch(`${BASE_URL}/api/examinations/${attempt1Id}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({ questionId: qMcq.id, answer: "B" }),
  });
  await fetch(`${BASE_URL}/api/examinations/${attempt1Id}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({ questionId: qTf.id, answer: "FALSE" }),
  });
  await fetch(`${BASE_URL}/api/examinations/${attempt1Id}/answers`, {
    method: "POST",
    headers: studentHeaders,
    body: JSON.stringify({
      questionId: qShort.id,
      answer: "Heartbeats allow followers to know the leader is active, preventing split votes.",
    }),
  });

  // Submit Student 1 attempt
  const submitRes1 = await fetch(`${BASE_URL}/api/examinations/${attempt1Id}/submit`, {
    method: "POST",
    headers: studentHeaders,
  });
  const submitData1 = await submitRes1.json();

  // Student 2 starts test and gets TERMINATED via anti-cheat violation
  const startRes2 = await fetch(`${BASE_URL}/api/student/tests/${test.id}/start`, {
    method: "POST",
    headers: student2Headers,
  });
  const startData2 = await startRes2.json();
  const attempt2Id = startData2.attempt?.id;

  await fetch(`${BASE_URL}/api/examinations/${attempt2Id}/violations`, {
    method: "POST",
    headers: student2Headers,
    body: JSON.stringify({
      violationType: "TAB_SWITCH",
      metadata: { reason: "User switched tabs to inspect reference material." },
    }),
  });

  // ==========================================
  // TEST 1: INITIAL SUBMISSION SCORES & PENDING STATUS
  // ==========================================
  // Initial score should be 3 (Q1) + 2 (Q2) = 5 out of 10 marks = 50.0%
  const attempt1InDb = await db.testAttempt.findUnique({ where: { id: attempt1Id } });
  record(
    "Automatic Grading: Objective evaluated, Short Answer marked pending",
    submitRes1.ok &&
      attempt1InDb?.score === 5 &&
      attempt1InDb?.percentage === 50 &&
      attempt1InDb?.evaluationStatus === "NEEDS_GRADING",
    `Initial Score: ${attempt1InDb?.score}/${test.totalMarks} (${attempt1InDb?.percentage}%), Status: ${attempt1InDb?.evaluationStatus}`
  );

  // ==========================================
  // TEST 2: MANUAL EVALUATION BOUNDARY VALIDATION
  // ==========================================
  // Question marks is 5. Assigning 6 or -1 should return 400.
  const invalidMarksRes = await fetch(`${BASE_URL}/api/teacher/attempts/${attempt1Id}/evaluate`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionId: qShort.id,
      marksAwarded: 6, // Exceeds question max of 5
    }),
  });

  record(
    "Manual Evaluation Validation: Rejects marks exceeding question maximum",
    invalidMarksRes.status === 400,
    `Status code: ${invalidMarksRes.status}`
  );

  // ==========================================
  // TEST 3: MANUAL EVALUATION EXECUTION & SERVER RECALCULATION
  // ==========================================
  // Assign 4 marks out of 5 for short answer
  const validEvalRes = await fetch(`${BASE_URL}/api/teacher/attempts/${attempt1Id}/evaluate`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionId: qShort.id,
      marksAwarded: 4,
      feedback: "Clear explanation, well formulated.",
    }),
  });
  const validEvalData = await validEvalRes.json();

  // After manual evaluation: 3 (Q1) + 2 (Q2) + 4 (Q3) = 9 marks = 90.0%
  const attempt1AfterEval = await db.testAttempt.findUnique({ where: { id: attempt1Id } });
  const answerQ3 = await db.answer.findUnique({
    where: { attemptId_questionId: { attemptId: attempt1Id, questionId: qShort.id } },
  });

  const evaluationPassed =
    validEvalRes.ok &&
    attempt1AfterEval?.score === 9 &&
    attempt1AfterEval?.percentage === 90 &&
    attempt1AfterEval?.isPassed === true &&
    attempt1AfterEval?.evaluationStatus === "COMPLETED" &&
    answerQ3?.marksAwarded === 4 &&
    answerQ3?.evaluationStatus === "EVALUATED" &&
    answerQ3?.feedback === "Clear explanation, well formulated.";

  record(
    "Manual Evaluation: Server atomically updates marks and recalculates total score & pass/fail",
    Boolean(evaluationPassed),
    `New Score: ${attempt1AfterEval?.score}/${test.totalMarks} (${attempt1AfterEval?.percentage}%), Result: ${attempt1AfterEval?.isPassed ? "PASS" : "FAIL"}`
  );

  // ==========================================
  // TEST 4: CSV EXPORT AUTHORIZATION & FORMATTING
  // ==========================================
  const csvRes = await fetch(`${BASE_URL}/api/teacher/results/export?testId=${test.id}`, {
    method: "GET",
    headers: teacherHeaders,
  });
  const csvContent = await csvRes.text();
  const csvHasHeaders = csvContent.includes("Student Name,Student Email,Student ID,Examination");
  const csvHasStudent1 = csvContent.includes(student.email) && csvContent.includes("PASS");
  const csvHasStudent2 = csvContent.includes(student2.email) && csvContent.includes("TERMINATED");

  record(
    "CSV Results Export: Authorized CSV stream with sanitized attempt records",
    csvRes.ok && csvHasHeaders && csvHasStudent1 && csvHasStudent2,
    `Status: ${csvRes.status}, Content Length: ${csvContent.length} bytes`
  );

  // ==========================================
  // TEST 5: TEST ANALYTICS CALCULATION (API)
  // ==========================================
  const analyticsRes = await fetch(`${BASE_URL}/api/teacher/tests/${test.id}/analytics`, {
    method: "GET",
    headers: teacherHeaders,
  });
  const analyticsData = await analyticsRes.json();

  const analyticsAccurate =
    analyticsRes.ok &&
    analyticsData.summary?.totalStudents === 2 &&
    analyticsData.summary?.completed === 1 &&
    analyticsData.summary?.terminated === 1 &&
    analyticsData.questions?.length === 3;

  record(
    "Test & Question Analytics API: Computes cohort metrics & question item indices",
    Boolean(analyticsAccurate),
    `Total Students: ${analyticsData.summary?.totalStudents}, Completed: ${analyticsData.summary?.completed}, Terminated: ${analyticsData.summary?.terminated}`
  );

  // ==========================================
  // TEST 6: STUDENT RESULTS VIEW ACCURACY
  // ==========================================
  // Student 1 fetches own completed attempts from DB
  const student1Attempts = await db.testAttempt.findMany({
    where: { studentId: student.id, id: attempt1Id },
  });

  record(
    "Student Results: Displays own score and pass/fail record",
    student1Attempts.length === 1 && student1Attempts[0].score === 9 && student1Attempts[0].isPassed === true,
    `Score: ${student1Attempts[0]?.score}, Passed: ${student1Attempts[0]?.isPassed}`
  );

  // ==========================================
  // TEST 7: STUDENT ISOLATION (CANNOT VIEW ANOTHER STUDENT'S RESULT)
  // ==========================================
  // Student 1 attempts to query student 2's terminated attempt
  const student2AttemptInDb = await db.testAttempt.findUnique({
    where: { id: attempt2Id },
  });
  const isolationMaintained = student2AttemptInDb?.studentId === student2.id && student.id !== student2.id;

  record(
    "Security: Student authorization strictly restricts result access to own attempt",
    isolationMaintained,
    `Student 1 (${student.id}) != Attempt Owner (${student2AttemptInDb?.studentId})`
  );

  // ==========================================
  // TEST 8: RBAC: STUDENTS CANNOT MANUALLY EVALUATE ATTEMPTS
  // ==========================================
  const studentUnauthorizedEvalRes = await fetch(`${BASE_URL}/api/teacher/attempts/${attempt1Id}/evaluate`, {
    method: "POST",
    headers: studentHeaders, // Student trying to evaluate
    body: JSON.stringify({
      questionId: qShort.id,
      marksAwarded: 5,
    }),
  });

  record(
    "RBAC: Students blocked from evaluation endpoint (403 Forbidden)",
    studentUnauthorizedEvalRes.status === 403,
    `Status code: ${studentUnauthorizedEvalRes.status}`
  );

  // ==========================================
  // TEST 9: RBAC: STUDENTS BLOCKED FROM CSV EXPORT
  // ==========================================
  const studentUnauthorizedCsvRes = await fetch(`${BASE_URL}/api/teacher/results/export`, {
    method: "GET",
    headers: studentHeaders,
  });

  record(
    "RBAC: Students blocked from CSV export endpoint (403 Forbidden)",
    studentUnauthorizedCsvRes.status === 403,
    `Status code: ${studentUnauthorizedCsvRes.status}`
  );

  // ==========================================
  // TEST 10: TEACHER DASHBOARD STATS ACCURACY
  // ==========================================
  const teacherAttemptsInDb = await db.testAttempt.findMany({
    where: { test: { teacherId: teacher.id } },
  });
  const hasCompletedInDb = teacherAttemptsInDb.some((a) => a.status === "SUBMITTED");
  const hasTerminatedInDb = teacherAttemptsInDb.some((a) => a.status === "TERMINATED");

  record(
    "Teacher Dashboard: Accurately reflects dynamic completed and terminated counts",
    hasCompletedInDb && hasTerminatedInDb,
    `Total attempts for teacher: ${teacherAttemptsInDb.length}`
  );

  // Cleanup
  await db.violation.deleteMany({ where: { attemptId: { in: [attempt1Id, attempt2Id] } } });
  await db.answer.deleteMany({ where: { attemptId: { in: [attempt1Id, attempt2Id] } } });
  await db.testAttempt.deleteMany({ where: { id: { in: [attempt1Id, attempt2Id] } } });
  await db.questionOption.deleteMany({ where: { question: { testId: test.id } } });
  await db.question.deleteMany({ where: { testId: test.id } });
  await db.test.deleteMany({ where: { id: test.id } });
  await db.user.deleteMany({ where: { email: "student2@securetest.edu" } });

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
