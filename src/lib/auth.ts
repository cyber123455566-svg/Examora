import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "securetest_session";
const JWT_SECRET = process.env.AUTH_SECRET || "securetest-super-secret-jwt-encryption-key-2026-v01-academic-portal";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export type UserRole = "TEACHER" | "STUDENT";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
  studentIdNumber?: string | null;
}

/**
 * Hash plaintext password using bcryptjs with 10 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plaintext password with stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign and create an encrypted JWT session token
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

/**
 * Verify session token and return decoded payload
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      department: (payload.department as string) || null,
      studentIdNumber: (payload.studentIdNumber as string) || null,
    };
  } catch {
    return null;
  }
}
