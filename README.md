# Examora — Smart Examination & Assessment Platform

**Examora** is an institutional-grade, modern digital examination and assessment web platform built with Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, and Prisma ORM.

---

## 🌟 Key Features

* **Role-Based Access Control (RBAC):** Server-enforced role isolation for Faculty (Teacher) and Students.
* **Faculty Examination Studio:** Author examinations, draft and preview test papers, configure duration, passing mark thresholds, and availability windows.
* **Active Anti-Cheat Proctoring:**
  - Mandatory Fullscreen enforcement with real-time detection
  - Immediate tab-switch and blur detection
  - Server-authoritative state synchronization and attempt termination
* **Real-Time Autosave:** Continuous automatic answer recording with instant local caching and server synchronization.
* **Instant & Hybrid Grading Engine:** Server-side automated grading for objective questions (Multiple Choice, True/False) and workflow for faculty evaluation of short answers.
* **Comprehensive Results & Violation Monitoring:** Detailed attempt analysis including timestamps, accuracy scores, and recorded violation logs.
* **Role-Secure Registration:** Protected self-service registration for students and faculty with institutional passkey verification for staff.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secure-jwt-secret-key"
STAFF_REGISTRATION_CODE="SECURE-STAFF-2026"
```

### 3. Database Setup & Seed
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Teacher (Faculty)** | `teacher@securetest.edu` | `TeacherPass123!` |
| **Student** | `student@securetest.edu` | `StudentPass123!` |

*(One-click demo login buttons are provided on the `/login` screen for fast evaluation)*

---

## 🔒 Security Architecture

* **Server-Authoritative Evaluation:** Correct answer keys and grading logic reside strictly on the server and are never sent to the client during active examination sessions.
* **Defense in Depth:** Dual protection layer utilizing Next.js Edge Middleware route guards combined with server-component authorization assertions (`requireServerRole`).
* **Cryptographic Sessions:** Tamper-proof HTTP-only session cookies signed with HS256 JWT tokens.
