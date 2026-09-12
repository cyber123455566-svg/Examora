import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const tests = await p.test.findMany({
    include: {
      questions: {
        include: { options: true },
      },
      _count: {
        select: { attempts: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const attempts = await p.testAttempt.findMany({
    where: { studentId: "cmtyjp8u40006lmpwusibj50k" },
    include: { test: true, violations: true },
  });
  console.log("=== MANJU ATTEMPTS ===");
  console.log(JSON.stringify(attempts, null, 2));
}

main().finally(() => p.$disconnect());
