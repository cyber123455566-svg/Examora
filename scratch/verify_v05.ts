import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("SECURETEST V0.5 REGISTRATION & AUTH TEST SUITE");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testStudentEmail = `test.student.${timestamp}@securetest.edu`;
  const testStudentId = `RCAS2025BCY${String(timestamp).slice(-4)}`;
  const testStaffEmail = `test.staff.${timestamp}@securetest.edu`;
  const testStaffId = `STF-${timestamp}`;
  const strongPassword = "ValidPass123!";

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. STUDENT REGISTRATION
    // -------------------------------------------------------------
    console.log("--- 1. Testing Student Registration ---");

    // 1a. Valid Student Registration
    const studentRes = await fetch(`${BASE_URL}/api/register/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student Alpha",
        studentIdNumber: testStudentId,
        email: testStudentEmail,
        phone: "+15551234567",
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });

    const studentData = await studentRes.json();
    assert(studentRes.status === 200, "Student registration succeeds with 200");
    assert(studentData.user?.role === "STUDENT", "Student registration strictly assigns STUDENT role");
    assert(studentData.user?.passwordHash === undefined, "Student registration does not expose passwordHash");
    assert(studentData.user?.accountStatus === "ACTIVE", "Student account status is ACTIVE");

    // 1b. Verify in Database
    const dbStudent = await prisma.user.findUnique({ where: { email: testStudentEmail } });
    assert(dbStudent !== null, "Student user persisted in database");
    assert(dbStudent?.role === "STUDENT", "Database record has role = STUDENT");
    assert(dbStudent?.studentIdNumber === testStudentId, "Database record has correct studentIdNumber");
    assert(dbStudent?.emailVerified === false, "Database record has emailVerified = false");

    // 1c. Login with Registered Student
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: strongPassword,
      }),
    });
    const studentLoginData = await studentLoginRes.json();
    assert(studentLoginRes.status === 200, "Student can log in with new credentials");
    assert(studentLoginData.redirectUrl === "/student/dashboard", "Student login redirects to /student/dashboard");
    assert(studentLoginData.user.role === "STUDENT", "Student login session has role = STUDENT");

    // -------------------------------------------------------------
    // 2. STUDENT VALIDATION & DUPLICATE CHECKS
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Student Validation & Duplicates ---");

    // 2a. Duplicate Email
    const dupEmailRes = await fetch(`${BASE_URL}/api/register/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Another Name",
        studentIdNumber: `STU-DIFF-${timestamp}`,
        email: testStudentEmail, // duplicate
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });
    assert(dupEmailRes.status === 400, "Duplicate email registration rejected with 400");
    const dupEmailData = await dupEmailRes.json();
    assert(dupEmailData.error.includes("Email address is already registered"), "Duplicate email returns exact error message");

    // 2b. Duplicate Student ID
    const dupIdRes = await fetch(`${BASE_URL}/api/register/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Another Name",
        studentIdNumber: testStudentId, // duplicate
        email: `unique.${timestamp}@securetest.edu`,
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });
    assert(dupIdRes.status === 400, "Duplicate Student ID registration rejected with 400");
    const dupIdData = await dupIdRes.json();
    assert(dupIdData.error.includes("Student ID is already registered"), "Duplicate Student ID returns exact error message");

    // 2c. Password Policy Enforcement (no uppercase, too short)
    const weakPassRes = await fetch(`${BASE_URL}/api/register/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Weak Pass User",
        studentIdNumber: `STU-WEAK-${timestamp}`,
        email: `weak.${timestamp}@securetest.edu`,
        password: "weak",
        confirmPassword: "weak",
      }),
    });
    assert(weakPassRes.status === 400, "Weak password rejected with 400");

    // 2d. Password Mismatch
    const mismatchPassRes = await fetch(`${BASE_URL}/api/register/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Mismatch User",
        studentIdNumber: `STU-MISMATCH-${timestamp}`,
        email: `mismatch.${timestamp}@securetest.edu`,
        password: strongPassword,
        confirmPassword: "DifferentPassword123!",
      }),
    });
    assert(mismatchPassRes.status === 400, "Password mismatch rejected with 400");

    // -------------------------------------------------------------
    // 3. SECURITY: ROLE TAMPERING PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Role Tampering Protection ---");

    const tamperEmail = `tamper.${timestamp}@securetest.edu`;
    const tamperRes = await fetch(`${BASE_URL}/api/register/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Tampering Hacker",
        studentIdNumber: `STU-HACK-${timestamp}`,
        email: tamperEmail,
        role: "TEACHER", // Malicious attempt to claim TEACHER role via student endpoint
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });
    const tamperData = await tamperRes.json();
    assert(tamperRes.status === 200, "Student registration accepts valid student data");
    assert(tamperData.user?.role === "STUDENT", "Malicious role=TEACHER in body was ignored, assigned role=STUDENT");

    const dbTampered = await prisma.user.findUnique({ where: { email: tamperEmail } });
    assert(dbTampered?.role === "STUDENT", "Database record confirms role = STUDENT");

    // -------------------------------------------------------------
    // 4. STAFF REGISTRATION: INVALID CODE PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Staff Registration Security ---");

    const invalidStaffEmail = `fake.staff.${timestamp}@securetest.edu`;
    const invalidStaffRes = await fetch(`${BASE_URL}/api/register/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Fake Staff",
        staffId: `STF-FAKE-${timestamp}`,
        email: invalidStaffEmail,
        department: "Computer Science",
        staffRegistrationCode: "WRONG-CODE-123",
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });

    assert(invalidStaffRes.status === 403, "Invalid staff registration code rejected with 403");
    const invalidStaffData = await invalidStaffRes.json();
    assert(invalidStaffData.error === "Invalid staff registration code.", "Returns exact error: 'Invalid staff registration code.'");

    const dbFakeStaff = await prisma.user.findUnique({ where: { email: invalidStaffEmail } });
    assert(dbFakeStaff === null, "No user account was created in database for invalid staff code");

    // -------------------------------------------------------------
    // 5. STAFF REGISTRATION: VALID CODE
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Valid Staff Registration ---");

    const validStaffRes = await fetch(`${BASE_URL}/api/register/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Alan Turing",
        staffId: testStaffId,
        email: testStaffEmail,
        department: "Computer Science & AI",
        staffRegistrationCode: "SECURE-STAFF-2026",
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });

    const validStaffData = await validStaffRes.json();
    assert(validStaffRes.status === 200, "Valid staff registration succeeds with 200");
    assert(validStaffData.user?.role === "TEACHER", "Staff registration assigns TEACHER role");
    assert(validStaffData.user?.passwordHash === undefined, "Staff registration does not expose passwordHash");
    assert(validStaffData.user?.staffId === testStaffId, "Staff response includes staffId");

    const dbStaff = await prisma.user.findUnique({ where: { email: testStaffEmail } });
    assert(dbStaff !== null, "Staff user persisted in database");
    assert(dbStaff?.role === "TEACHER", "Database record has role = TEACHER");
    assert(dbStaff?.staffId === testStaffId, "Database record has correct staffId");
    assert(dbStaff?.department === "Computer Science & AI", "Database record has correct department");
    assert(dbStaff?.emailVerified === false, "Database record has emailVerified = false");

    // 5b. Login with Registered Staff
    const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStaffEmail,
        password: strongPassword,
      }),
    });
    const staffLoginData = await staffLoginRes.json();
    assert(staffLoginRes.status === 200, "Staff can log in with new credentials");
    assert(staffLoginData.redirectUrl === "/teacher/dashboard", "Staff login redirects to /teacher/dashboard");
    assert(staffLoginData.user.role === "TEACHER", "Staff login session has role = TEACHER");

    // 5c. Duplicate Staff ID
    const dupStaffIdRes = await fetch(`${BASE_URL}/api/register/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Another Professor",
        staffId: testStaffId, // duplicate
        email: `another.prof.${timestamp}@securetest.edu`,
        department: "Physics",
        staffRegistrationCode: "SECURE-STAFF-2026",
        password: strongPassword,
        confirmPassword: strongPassword,
      }),
    });
    assert(dupStaffIdRes.status === 400, "Duplicate Staff ID registration rejected with 400");
    const dupStaffIdData = await dupStaffIdRes.json();
    assert(dupStaffIdData.error.includes("Staff ID is already registered"), "Duplicate Staff ID returns exact error message");

    // -------------------------------------------------------------
    // 6. ACCOUNT STATUS ENFORCEMENT (SUSPENDED & PENDING)
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Account Status (SUSPENDED / PENDING) ---");

    // Create a suspended user directly in DB
    const suspendedEmail = `suspended.${timestamp}@securetest.edu`;
    await prisma.user.create({
      data: {
        name: "Suspended User",
        email: suspendedEmail,
        passwordHash: dbStudent!.passwordHash, // reuse hashed password
        role: "STUDENT",
        accountStatus: "SUSPENDED",
      },
    });

    const suspendedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: suspendedEmail,
        password: strongPassword,
      }),
    });
    assert(suspendedLoginRes.status === 403, "SUSPENDED account login blocked with 403");
    const suspendedLoginData = await suspendedLoginRes.json();
    assert(suspendedLoginData.error.includes("suspended"), "Suspended account returns suspension message");

    // Create a pending user directly in DB
    const pendingEmail = `pending.${timestamp}@securetest.edu`;
    await prisma.user.create({
      data: {
        name: "Pending User",
        email: pendingEmail,
        passwordHash: dbStudent!.passwordHash,
        role: "TEACHER",
        accountStatus: "PENDING",
      },
    });

    const pendingLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: pendingEmail,
        password: strongPassword,
      }),
    });
    assert(pendingLoginRes.status === 403, "PENDING account login blocked with 403");
    const pendingLoginData = await pendingLoginRes.json();
    assert(pendingLoginData.error.includes("pending"), "Pending account returns pending approval message");

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n--- Cleaning up temporary test accounts ---");
    const deleted = await prisma.user.deleteMany({
      where: {
        email: {
          in: [testStudentEmail, testStaffEmail, tamperEmail, suspendedEmail, pendingEmail],
        },
      },
    });
    console.log(`Cleaned up ${deleted.count} test accounts.`);

  } catch (error) {
    console.error("Test execution failed:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log(`V0.5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
