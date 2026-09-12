import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { email: "student@securetest.edu" },
    data: { studentIdNumber: "RCAS2025BCY001" },
  });
  console.log(`Updated ${updated.count} student record(s) to RCAS2025BCY001.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
