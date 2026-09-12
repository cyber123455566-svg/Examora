import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, studentIdNumber, email, phone, password, confirmPassword } = body;

    // 1. Required field validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!studentIdNumber || typeof studentIdNumber !== "string" || !studentIdNumber.trim()) {
      return NextResponse.json(
        { error: "Student ID / Register number is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Password policy validation
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
    const trimmedStudentId = studentIdNumber.trim().toUpperCase();
    const trimmedPhone = phone && typeof phone === "string" ? phone.trim() : null;

    // 3. Database uniqueness validations
    const existingEmail = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email address is already registered." },
        { status: 400 }
      );
    }

    const existingStudentId = await db.user.findUnique({
      where: { studentIdNumber: trimmedStudentId },
    });

    if (existingStudentId) {
      return NextResponse.json(
        { error: "Student ID is already registered." },
        { status: 400 }
      );
    }

    // 4. Secure Password Hashing
    const passwordHash = await hashPassword(password);

    // 5. Create user strictly as STUDENT
    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        studentIdNumber: trimmedStudentId,
        phone: trimmedPhone,
        passwordHash,
        role: "STUDENT", // Server-enforced role
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
        studentIdNumber: user.studentIdNumber,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error: any) {
    console.error("Student registration error:", error);

    // Handle Prisma unique constraint collision fallback
    if (error.code === "P2002") {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes("email")) {
        return NextResponse.json({ error: "Email address is already registered." }, { status: 400 });
      }
      if (Array.isArray(target) && target.includes("studentIdNumber")) {
        return NextResponse.json({ error: "Student ID is already registered." }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Registration failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}
