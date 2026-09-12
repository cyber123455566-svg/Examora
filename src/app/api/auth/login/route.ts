import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required fields." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Look up user by email
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.accountStatus === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact an administrator." },
        { status: 403 }
      );
    }

    if (user.accountStatus === "PENDING") {
      return NextResponse.json(
        { error: "Your account registration is pending approval. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Verify hashed password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Create session JWT token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "TEACHER" | "STUDENT",
      department: user.department,
      studentIdNumber: user.studentIdNumber,
    });

    const redirectUrl =
      user.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";

    const response = NextResponse.json(
      {
        success: true,
        message: "Authentication successful.",
        redirectUrl,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          studentIdNumber: user.studentIdNumber,
          staffId: user.staffId,
          accountStatus: user.accountStatus,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
