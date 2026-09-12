import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken, SessionPayload, UserRole } from "./auth";
import { db } from "./db";

/**
 * Reads and verifies the current session from server-side cookies
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * Fetches the authenticated user directly from the database without passwordHash
 */
export async function getServerUser() {
  const session = await getServerSession();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      studentIdNumber: true,
      createdAt: true,
    },
  });
}

/**
 * Enforces server-side authentication and role-based authorization.
 * If unauthenticated, redirects to /login.
 * If authenticated but with the wrong role, redirects to their own dashboard.
 */
export async function requireServerRole(allowedRoles: UserRole[]): Promise<SessionPayload> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.role)) {
    if (session.role === "TEACHER") {
      redirect("/teacher/dashboard");
    } else if (session.role === "STUDENT") {
      redirect("/student/dashboard");
    } else {
      redirect("/login");
    }
  }

  return session;
}
