import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SecureTest V0.2 database seeding...");

  // Clean existing records
  await prisma.violation.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const teacherPasswordHash = await bcrypt.hash("TeacherPass123!", 10);
  const studentPasswordHash = await bcrypt.hash("StudentPass123!", 10);

  // 1. Create Teacher Account
  const teacher = await prisma.user.create({
    data: {
      name: "Dr. Sarah Jenkins",
      email: "teacher@securetest.edu",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      department: "Computer Science & Engineering",
    },
  });
  console.log(`✅ Teacher created: ${teacher.name} (${teacher.email})`);

  // 2. Create Student Account
  const student = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "student@securetest.edu",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      studentIdNumber: "RCAS2025BCY001",
      department: "School of Computing",
    },
  });
  console.log(`✅ Student created: ${student.name} (${student.email})`);

  // 3. Create Sample Test 1: PUBLISHED with MCQ, True/False, and Short Answer
  const test1 = await prisma.test.create({
    data: {
      title: "CS301: Advanced Data Structures & Algorithm Design",
      subject: "Computer Science",
      description: "Midterm examination covering Balanced Search Trees, Graph Algorithms (Dijkstra, Bellman-Ford), and Dynamic Programming.",
      instructions: "Read every question carefully. For Multiple Choice questions, choose the single best option. For True/False, mark the logical validity. Do not navigate away from the testing window.",
      durationMinutes: 60,
      totalMarks: 10,
      passingPercentage: 50.0,
      maximumAttempts: 1,
      status: "PUBLISHED",
      randomizeQuestions: false,
      randomizeOptions: false,
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "What is the worst-case time complexity of searching in a Red-Black Tree with n nodes?",
            questionType: "MULTIPLE_CHOICE",
            marks: 2,
            orderIndex: 0,
            correctAnswer: "B",
            options: {
              create: [
                { optionKey: "A", optionText: "O(1)", orderIndex: 0 },
                { optionKey: "B", optionText: "O(log n)", orderIndex: 1 },
                { optionKey: "C", optionText: "O(n)", orderIndex: 2 },
                { optionKey: "D", optionText: "O(n log n)", orderIndex: 3 },
              ],
            },
          },
          {
            questionText: "Which traversal of a binary search tree visits nodes in strictly ascending sorted order?",
            questionType: "MULTIPLE_CHOICE",
            marks: 2,
            orderIndex: 1,
            correctAnswer: "B",
            options: {
              create: [
                { optionKey: "A", optionText: "Pre-order Traversal", orderIndex: 0 },
                { optionKey: "B", optionText: "In-order Traversal", orderIndex: 1 },
                { optionKey: "C", optionText: "Post-order Traversal", orderIndex: 2 },
                { optionKey: "D", optionText: "Level-order Traversal", orderIndex: 3 },
              ],
            },
          },
          {
            questionText: "Dijkstra's shortest path algorithm operates correctly on graphs containing negative edge weights.",
            questionType: "TRUE_FALSE",
            marks: 2,
            orderIndex: 2,
            correctAnswer: "FALSE",
          },
          {
            questionText: "Name the graph algorithm used to compute all-pairs shortest paths in O(V³) time.",
            questionType: "SHORT_ANSWER",
            marks: 4,
            orderIndex: 3,
            correctAnswer: "Floyd-Warshall",
          },
        ],
      },
    },
  });

  // 4. Create Sample Test 2: PUBLISHED with Student Attempts (for testing delete protection)
  const test2 = await prisma.test.create({
    data: {
      title: "MAT204: Discrete Mathematics & Probability Theory",
      subject: "Mathematics",
      description: "Proctored assessment covering Graph Theory, Permutations & Combinations, and Conditional Expectation.",
      instructions: "Calculators are permitted. Answer all questions within the 45-minute allotted window.",
      durationMinutes: 45,
      totalMarks: 15,
      passingPercentage: 40.0,
      maximumAttempts: 1,
      status: "PUBLISHED",
      randomizeQuestions: true,
      randomizeOptions: true,
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "A planar connected graph with 6 vertices and 7 edges has how many faces?",
            questionType: "MULTIPLE_CHOICE",
            marks: 5,
            orderIndex: 0,
            correctAnswer: "C",
            options: {
              create: [
                { optionKey: "A", optionText: "1", orderIndex: 0 },
                { optionKey: "B", optionText: "2", orderIndex: 1 },
                { optionKey: "C", optionText: "3", orderIndex: 2 },
                { optionKey: "D", optionText: "4", orderIndex: 3 },
              ],
            },
          },
          {
            questionText: "If events A and B are mutually exclusive, then P(A ∩ B) = P(A) * P(B).",
            questionType: "TRUE_FALSE",
            marks: 5,
            orderIndex: 1,
            correctAnswer: "FALSE",
          },
          {
            questionText: "In how many distinct ways can 5 distinct books be arranged on a single shelf?",
            questionType: "SHORT_ANSWER",
            marks: 5,
            orderIndex: 2,
            correctAnswer: "120",
          },
        ],
      },
    },
  });

  // 5. Create Sample Test 3: CLOSED (to test CLOSED status filtering)
  const test3 = await prisma.test.create({
    data: {
      title: "SEC105: Network Security & Cryptographic Protocols",
      subject: "Cybersecurity",
      description: "Comprehensive evaluation on Public Key Cryptography, Zero-Trust Architecture, and Web Exploitation mitigations.",
      instructions: "Strict proctoring was enforced during this assessment.",
      durationMinutes: 90,
      totalMarks: 20,
      passingPercentage: 60.0,
      maximumAttempts: 1,
      status: "CLOSED",
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "Which cryptographic algorithm relies on the discrete logarithm problem over elliptic curves?",
            questionType: "MULTIPLE_CHOICE",
            marks: 10,
            orderIndex: 0,
            correctAnswer: "A",
            options: {
              create: [
                { optionKey: "A", optionText: "ECDSA", orderIndex: 0 },
                { optionKey: "B", optionText: "RSA-4096", orderIndex: 1 },
                { optionKey: "C", optionText: "AES-GCM", orderIndex: 2 },
                { optionKey: "D", optionText: "SHA-256", orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 6. Create Sample Test 4: DRAFT (to test DRAFT status filtering & editing)
  await prisma.test.create({
    data: {
      title: "AI420: Foundations of Deep Learning & Neural Architectures",
      subject: "Artificial Intelligence",
      description: "Draft assessment on Multi-head Self-Attention, Positional Embeddings, and Gradient Vanishing mitigation.",
      instructions: "Ensure all mathematical formulations are clear before final submission.",
      durationMinutes: 75,
      totalMarks: 10,
      passingPercentage: 50.0,
      maximumAttempts: 1,
      status: "DRAFT",
      teacherId: teacher.id,
      questions: {
        create: [
          {
            questionText: "In the standard Transformer architecture, which mechanism allows the model to capture sequence order?",
            questionType: "MULTIPLE_CHOICE",
            marks: 5,
            orderIndex: 0,
            correctAnswer: "C",
            options: {
              create: [
                { optionKey: "A", optionText: "Recurrent feedback loops", orderIndex: 0 },
                { optionKey: "B", optionText: "Residual stream normalization", orderIndex: 1 },
                { optionKey: "C", optionText: "Positional encodings (sinusoidal or learned)", orderIndex: 2 },
                { optionKey: "D", optionText: "Batch normalization layers", orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 7. Seed completed student attempt on MAT204 for Alex Morgan
  await prisma.testAttempt.create({
    data: {
      testId: test2.id,
      studentId: student.id,
      status: "COMPLETED",
      score: 13.0,
      percentage: 86.6,
      violationCount: 0,
      startedAt: new Date(Date.now() - 86400000 * 2),
      submittedAt: new Date(Date.now() - 86400000 * 2 + 38 * 60000),
      completedAt: new Date(Date.now() - 86400000 * 2 + 38 * 60000),
    },
  });

  console.log("✨ Seeding completed successfully with complete V0.2 schema!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
