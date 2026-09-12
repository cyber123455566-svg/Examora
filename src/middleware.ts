import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, UserRole } from "@/lib/auth";

const JWT_SECRET = process.env.AUTH_SECRET || "securetest-super-secret-jwt-encryption-key-2026-v01-academic-portal";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

async function verifyEdgeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = sessionCookie?.value ? await verifyEdgeToken(sessionCookie.value) : null;

  // 1. Unauthenticated users trying to access protected teacher or student routes
  if (pathname.startsWith("/teacher") || pathname.startsWith("/student")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Role-based isolation: Prevent Student from accessing Teacher routes
  if (pathname.startsWith("/teacher")) {
    if (session && session.role !== "TEACHER") {
      // Unauthorized role attempt: Redirect to student's own dashboard
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
  }

  // 3. Role-based isolation: Prevent Teacher from accessing Student routes
  if (pathname.startsWith("/student")) {
    if (session && session.role !== "STUDENT") {
      // Unauthorized role attempt: Redirect to teacher's own dashboard
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }
  }

  // 4. Already authenticated users visiting /login or root /
  if (pathname === "/login" || pathname === "/") {
    if (session) {
      if (session.role === "TEACHER") {
        return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
      } else if (session.role === "STUDENT") {
        return NextResponse.redirect(new URL("/student/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
