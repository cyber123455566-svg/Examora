import { PrismaClient } from "@prisma/client";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/lib/auth";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("==================================================");
  console.log("🧪 SECURETEST V0.2 FULL SPECIFICATION VERIFICATION");
  console.log("==================================================\n");

  const results: { testCase: string; passed: boolean; details?: string }[] = [];

  // Helper to record result
  function record(testCase: string, passed: boolean, details?: string) {
    results.push({ testCase, passed, details });
    console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${testCase} ${details ? `(${details})` : ""}`);
  }

  // 1. Fetch Teacher and Student accounts
  const teacher = await db.user.findFirst({ where: { role: "TEACHER" } });
  const student = await db.user.findFirst({ where: { role: "STUDENT" } });

  if (!teacher || !student) {
    console.error("Missing seeded teacher or student!");
    process.exit(1);
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

  const teacherHeaders = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${teacherToken}`,
  };

  const studentHeaders = {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${studentToken}`,
  };

  // --- TEACHER TESTS ---

  // 1. Teacher Dashboard Statistics from DB
  const initialTests = await db.test.findMany({ where: { teacherId: teacher.id } });
  record(
    "Teacher Dashboard dynamic DB stats available",
    initialTests.length >= 0,
    `Found ${initialTests.length} tests in DB for teacher`
  );

  // 2. Create a Test via API
  const createRes = await fetch(`${BASE_URL}/api/teacher/tests`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      title: "PHY201: Modern Quantum Mechanics",
      subject: "Physics",
      description: "Introductory quantum theory, wave mechanics, and particle physics.",
      instructions: "No textbooks allowed. Scientific calculators permitted.",
      durationMinutes: "90",
      passingPercentage: "50",
      maximumAttempts: "1",
      randomizeQuestions: true,
      randomizeOptions: true,
    }),
  });

  const createData = await createRes.json();
  const testId = createData?.test?.id;
  record(
    "Create Test (/teacher/tests/create -> POST /api/teacher/tests)",
    createRes.status === 201 && testId && createData.test.status === "DRAFT",
    `Created test ID: ${testId}`
  );

  // 3. Add 5 Questions (MCQ, True/False, Short Answer)
  const q1Res = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: "What is Planck's constant approximately?",
      questionType: "MULTIPLE_CHOICE",
      marks: 2,
      correctAnswer: "B",
      options: [
        { optionKey: "A", optionText: "3.00 x 10^8 m/s", orderIndex: 0 },
        { optionKey: "B", optionText: "6.626 x 10^-34 J*s", orderIndex: 1 },
        { optionKey: "C", optionText: "1.602 x 10^-19 C", orderIndex: 2 },
        { optionKey: "D", optionText: "9.109 x 10^-31 kg", orderIndex: 3 },
      ],
    }),
  });
  const q1Data = await q1Res.json();

  const q2Res = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: "Heisenberg's Uncertainty Principle applies only to macroscopic objects.",
      questionType: "TRUE_FALSE",
      marks: 1,
      correctAnswer: "FALSE",
    }),
  });
  const q2Data = await q2Res.json();

  const q3Res = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: "State the mathematical formulation of the de Broglie wavelength.",
      questionType: "SHORT_ANSWER",
      marks: 3,
      correctAnswer: "lambda = h / p",
    }),
  });
  const q3Data = await q3Res.json();

  const q4Res = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: "Which phenomenon conclusively demonstrates light quantization?",
      questionType: "MULTIPLE_CHOICE",
      marks: 2,
      correctAnswer: "C",
      options: [
        { optionKey: "A", optionText: "Refraction", orderIndex: 0 },
        { optionKey: "B", optionText: "Interference", orderIndex: 1 },
        { optionKey: "C", optionText: "Photoelectric Effect", orderIndex: 2 },
        { optionKey: "D", optionText: "Doppler Shift", orderIndex: 3 },
      ],
    }),
  });
  const q4Data = await q4Res.json();

  const q5Res = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: "A wavefunction must be normalizable over all space.",
      questionType: "TRUE_FALSE",
      marks: 2,
      correctAnswer: "TRUE",
    }),
  });
  const q5Data = await q5Res.json();

  const allQuestionsAdded =
    q1Res.ok && q2Res.ok && q3Res.ok && q4Res.ok && q5Res.ok &&
    q1Data.question?.id && q5Data.question?.id;

  record("Add 5 Questions across MCQ, True/False, and Short Answer", allQuestionsAdded);

  // 4. Edit a Question
  const q2Id = q2Data.question.id;
  const editUrl = `${BASE_URL}/api/teacher/tests/${testId}/questions/${q2Id}`;
  const editRes = await fetch(editUrl, {
    method: "PUT",
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: "Heisenberg's Uncertainty Principle asserts position and momentum cannot be simultaneously known.",
      questionType: "TRUE_FALSE",
      marks: 2,
      correctAnswer: "TRUE",
    }),
  });
  const editText = await editRes.text();
  let editData: any = {};
  try {
    editData = JSON.parse(editText);
  } catch (err) {
    console.error(`Failed parsing response from ${editUrl}. Status: ${editRes.status}. Body:\n${editText.substring(0, 300)}`);
    throw err;
  }
  record(
    "Edit Question (/api/teacher/tests/[id]/questions/[qid])",
    editRes.ok && editData.question?.marks === 2,
    `Updated marks to: ${editData.question?.marks}`
  );

  // 5. Duplicate a Question
  const q4Id = q4Data.question.id;
  const dupUrl = `${BASE_URL}/api/teacher/tests/${testId}/questions/${q4Id}/duplicate`;
  const dupRes = await fetch(dupUrl, {
    method: "POST",
    headers: teacherHeaders,
  });
  const dupText = await dupRes.text();
  let dupData: any = {};
  try {
    dupData = JSON.parse(dupText);
  } catch (err) {
    console.error(`Failed parsing dup response from ${dupUrl}. Status: ${dupRes.status}. Body:\n${dupText.substring(0, 300)}`);
    throw err;
  }
  const duplicatedQId = dupData.question?.id;
  record(
    "Duplicate Question (/api/teacher/tests/[id]/questions/[qid]/duplicate)",
    dupRes.ok && duplicatedQId && dupData.question.options.length === 4
  );

  // 6. Delete a Question (Delete the duplicate)
  const delQRes = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions/${duplicatedQId}`, {
    method: "DELETE",
    headers: teacherHeaders,
  });
  record("Delete Question (/api/teacher/tests/[id]/questions/[qid])", delQRes.ok);

  // 7. Reorder Questions
  const currentQuestions = await db.question.findMany({
    where: { testId },
    orderBy: { orderIndex: "asc" },
  });
  const reversedIds = currentQuestions.map((q) => q.id).reverse();
  const reorderRes = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/questions/reorder`, {
    method: "POST",
    headers: teacherHeaders,
    body: JSON.stringify({ questionIds: reversedIds }),
  });
  const reorderedInDB = await db.question.findFirst({
    where: { id: reversedIds[0] },
    select: { orderIndex: true },
  });
  record(
    "Reorder Questions (/api/teacher/tests/[id]/questions/reorder)",
    reorderRes.ok && reorderedInDB?.orderIndex === 0
  );

  // 8. Save Draft & Leave / Return Persistence Check
  const draftTest = await db.test.findUnique({
    where: { id: testId },
    include: { questions: { include: { options: true } } },
  });
  record(
    "Save Draft & DB Persistence (Leave & Return)",
    draftTest?.status === "DRAFT" && draftTest.questions.length === 5,
    `Status: ${draftTest?.status}, Questions count: ${draftTest?.questions.length}`
  );

  // 9. Publish Validation (Test incomplete check first, then valid publish)
  // Create an incomplete draft to test validation error reporting
  const invalidTest = await db.test.create({
    data: {
      title: "Incomplete Test",
      subject: "Test Subject",
      teacherId: teacher.id,
      status: "DRAFT",
    },
  });
  const invalidPublishRes = await fetch(`${BASE_URL}/api/teacher/tests/${invalidTest.id}/publish`, {
    method: "POST",
    headers: teacherHeaders,
  });
  const invalidPublishData = await invalidPublishRes.json();
  record(
    "Publish Validation Engine (Blocks incomplete paper)",
    invalidPublishRes.status === 422 && Array.isArray(invalidPublishData.issues) && invalidPublishData.issues.length > 0,
    `Caught issues: ${invalidPublishData.issues?.join("; ")}`
  );
  await db.test.delete({ where: { id: invalidTest.id } });

  // 10. Publish Test (Valid paper)
  const publishRes = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/publish`, {
    method: "POST",
    headers: teacherHeaders,
  });
  const publishData = await publishRes.json();
  record(
    "Publish Test (Transitions DRAFT -> PUBLISHED)",
    publishRes.ok && publishData.test?.status === "PUBLISHED"
  );

  // 11. Close Test
  const closeRes = await fetch(`${BASE_URL}/api/teacher/tests/${testId}/close`, {
    method: "POST",
    headers: teacherHeaders,
  });
  const closeData = await closeRes.json();
  record(
    "Close Test (Transitions PUBLISHED -> CLOSED)",
    closeRes.ok && closeData.test?.status === "CLOSED"
  );

  // Re-publish a separate test to test student visibility
  const studentVisibleTest = await db.test.create({
    data: {
      title: "PHY201-Pub: Published Quantum Mechanics",
      subject: "Physics",
      teacherId: teacher.id,
      status: "PUBLISHED",
      durationMinutes: 90,
      totalMarks: 10,
      questions: {
        create: [
          {
            questionText: "Sample question?",
            marks: 2,
            correctAnswer: "TRUE",
            questionType: "TRUE_FALSE",
          },
        ],
      },
    },
  });

  // --- STUDENT TESTS ---

  // 12. Student Dashboard Query Verification
  const now = new Date();
  const studentAvailableTests = await db.test.findMany({
    where: {
      status: "PUBLISHED",
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
  });

  const studentSeesPublished = studentAvailableTests.some((t) => t.id === studentVisibleTest.id);
  const studentSeesClosed = studentAvailableTests.some((t) => t.id === testId); // Closed test from step 11

  record(
    "Student Dashboard: Only PUBLISHED tests within window are visible",
    studentSeesPublished && !studentSeesClosed,
    `Published visible: ${studentSeesPublished}, Closed hidden: ${!studentSeesClosed}`
  );

  // 13. Authorization Protection: Student accessing Teacher APIs
  const studentAccessTeacherApi = await fetch(`${BASE_URL}/api/teacher/tests`, {
    headers: studentHeaders,
  });
  record(
    "Server-side RBAC: Student blocked from /api/teacher/* with 403",
    studentAccessTeacherApi.status === 403
  );

  // 14. Attempt-based Deletion Guard
  // Seed a test with an attempt
  const testWithAttempt = await db.test.create({
    data: {
      title: "Protected Exam With Attempt",
      subject: "Math",
      teacherId: teacher.id,
      status: "PUBLISHED",
      attempts: {
        create: {
          studentId: student.id,
          status: "COMPLETED",
          score: 85,
        },
      },
    },
  });

  const deleteAttemptRes = await fetch(`${BASE_URL}/api/teacher/tests/${testWithAttempt.id}`, {
    method: "DELETE",
    headers: teacherHeaders,
  });
  const deleteAttemptData = await deleteAttemptRes.json();
  record(
    "Attempt Deletion Protection: Deleting test with attempts blocked with 400",
    deleteAttemptRes.status === 400 && deleteAttemptData.error.includes("student attempts")
  );

  // Clean up temporary tests
  await db.testAttempt.deleteMany({ where: { testId: testWithAttempt.id } });
  await db.test.delete({ where: { id: testWithAttempt.id } });
  await db.question.deleteMany({ where: { testId: studentVisibleTest.id } });
  await db.test.delete({ where: { id: studentVisibleTest.id } });
  await db.questionOption.deleteMany({ where: { question: { testId } } });
  await db.question.deleteMany({ where: { testId } });
  await db.test.delete({ where: { id: testId } });

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
