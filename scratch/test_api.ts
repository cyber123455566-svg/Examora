import { PrismaClient } from "@prisma/client";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/lib/auth";

const db = new PrismaClient();

async function run() {
  const teacher = await db.user.findFirst({
    where: { email: "teacher@securetest.edu" },
  });

  if (!teacher) {
    console.error("Teacher not found");
    return;
  }

  const test = await db.test.findFirst({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: "desc" },
  });

  if (!test) {
    console.error("Test not found");
    return;
  }

  console.log(`Using Teacher: ${teacher.name} (${teacher.id})`);
  console.log(`Using Test: ${test.title} (${test.id})`);

  const token = await createSessionToken({
    userId: teacher.id,
    email: teacher.email,
    name: teacher.name,
    role: "TEACHER",
    department: teacher.department,
  });

  const url = `http://localhost:3000/api/teacher/tests/${test.id}/questions`;
  console.log(`Posting to: ${url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify({
      questionText: "Which organelle is primarily responsible for cellular ATP generation?",
      questionType: "MULTIPLE_CHOICE",
      marks: 2,
      correctAnswer: "A",
      options: [
        { optionKey: "A", optionText: "Mitochondria", orderIndex: 0 },
        { optionKey: "B", optionText: "Ribosome", orderIndex: 1 },
        { optionKey: "C", optionText: "Endoplasmic Reticulum", orderIndex: 2 },
        { optionKey: "D", optionText: "Golgi Apparatus", orderIndex: 3 },
      ],
    }),
  });

  const createdData = JSON.parse(await res.text());
  const newQuestionId = createdData.question.id;
  console.log("New question ID:", newQuestionId);

  const putUrl = `http://localhost:3000/api/teacher/tests/${test.id}/questions/${newQuestionId}`;
  console.log(`Putting to: ${putUrl}`);
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify({
      questionText: "Updated question text!",
      questionType: "MULTIPLE_CHOICE",
      marks: 3,
      correctAnswer: "B",
      options: [
        { optionKey: "A", optionText: "Opt A", orderIndex: 0 },
        { optionKey: "B", optionText: "Opt B", orderIndex: 1 },
      ],
    }),
  });

  console.log("PUT Response Status:", putRes.status);
  console.log("PUT Response Body:", await putRes.text());

  await db.$disconnect();
}

run();
