import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      staffId,
      email,
      department,
      phone,
      password,
      confirmPassword,
      staffRegistrationCode,
    } = body;

    // 1. Validate Staff Registration Code server-side FIRST
    const expectedStaffCode = process.env.STAFF_REGISTRATION_CODE || "SECURE-STAFF-2026";
    if (
      !staffRegistrationCode ||
      typeof staffRegistrationCode !== "string" ||
      staffRegistrationCode.trim() !== expectedStaffCode
    ) {
      return NextResponse.json(
        { error: "Invalid staff registration code." },
        { status: 403 }
      );
    }

    // 2. Required field validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!staffId || typeof staffId !== "string" || !staffId.trim()) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    if (!department || typeof department !== "string" || !department.trim()) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Official email address is required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid official email address." },
        { status: 400 }
      );
    }

    // 3. Password policy validation
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedStaffId = staffId.trim();
    const trimmedDepartment = department.trim();
    const trimmedPhone = phone && typeof phone === "string" ? phone.trim() : null;

    // 4. Database uniqueness validations
    const existingEmail = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email address is already registered." },
        { status: 400 }
      );
    }

    const existingStaffId = await db.user.findUnique({
      where: { staffId: trimmedStaffId },
    });

    if (existingStaffId) {
      return NextResponse.json(
        { error: "Staff ID is already registered." },
        { status: 400 }
      );
    }

    // 5. Secure Password Hashing
    const passwordHash = await hashPassword(password);

    // 6. Create user strictly as TEACHER
    // Server enforces role: TEACHER, ignoring any user-supplied role
    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        staffId: trimmedStaffId,
        department: trimmedDepartment,
        phone: trimmedPhone,
        passwordHash,
        role: "TEACHER", // Server-enforced role
        accountStatus: "ACTIVE",
        emailVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please proceed to login.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        staffId: user.staffId,
        department: user.department,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error: any) {
    console.error("Staff registration error:", error);

    // Handle Prisma unique constraint collision fallback
    if (error.code === "P2002") {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes("email")) {
        return NextResponse.json({ error: "Email address is already registered." }, { status: 400 });
      }
      if (Array.isArray(target) && target.includes("staffId")) {
        return NextResponse.json({ error: "Staff ID is already registered." }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Registration failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}
