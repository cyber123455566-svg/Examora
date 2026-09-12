"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  Building2,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

interface RegisterViewProps {
  initialRole?: "STUDENT" | "STAFF";
}

interface RegistrationSuccessData {
  name: string;
  email: string;
  role: string;
  idNumber: string;
}

export function RegisterView({ initialRole = "STUDENT" }: RegisterViewProps) {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "STAFF">(initialRole);

  // Form states
  const [name, setName] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [staffId, setStaffId] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [staffRegistrationCode, setStaffRegistrationCode] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Validation
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);

  // Password Policy calculations
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleRoleChange = (newRole: "STUDENT" | "STAFF") => {
    if (newRole !== role) {
      setRole(newRole);
      setGeneralError(null);
      setFieldErrors({});
    }
  };

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Full name is required.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (role === "STUDENT") {
      if (!studentIdNumber.trim()) {
        errors.studentIdNumber = "Student ID / Register number is required.";
      }
    } else {
      if (!staffId.trim()) {
        errors.staffId = "Staff ID is required.";
      }
      if (!department.trim()) {
        errors.department = "Department is required.";
      }
      if (!staffRegistrationCode.trim()) {
        errors.staffRegistrationCode = "Staff registration code is required.";
      }
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (!isPasswordValid) {
      errors.password =
        "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, and a number.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateClientSide()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint =
        role === "STUDENT" ? "/api/register/student" : "/api/register/staff";

      const payload =
        role === "STUDENT"
          ? {
              name: name.trim(),
              studentIdNumber: studentIdNumber.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim() || undefined,
              password,
              confirmPassword,
            }
          : {
              name: name.trim(),
              staffId: staffId.trim(),
              email: email.trim().toLowerCase(),
              department: department.trim(),
              phone: phone.trim() || undefined,
              password,
              confirmPassword,
              staffRegistrationCode: staffRegistrationCode.trim(),
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg: string = data.error || "Registration failed. Please review the details.";

        // Map backend errors to specific fields when applicable
        const newFieldErrors: Record<string, string> = {};
        if (errorMsg.toLowerCase().includes("email")) {
          newFieldErrors.email = errorMsg;
        } else if (errorMsg.toLowerCase().includes("student id")) {
          newFieldErrors.studentIdNumber = errorMsg;
        } else if (errorMsg.toLowerCase().includes("staff id")) {
          newFieldErrors.staffId = errorMsg;
        } else if (errorMsg.toLowerCase().includes("registration code")) {
          newFieldErrors.staffRegistrationCode = errorMsg;
        } else if (errorMsg.toLowerCase().includes("password")) {
          newFieldErrors.password = errorMsg;
        }

        setFieldErrors(newFieldErrors);
        setGeneralError(errorMsg);
        return;
      }

      // Registration successful!
      setSuccessData({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        idNumber: data.user.studentIdNumber || data.user.staffId || "N/A",
      });
    } catch (err) {
      console.error("Registration error:", err);
      setGeneralError("Network connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // SUCCESS VIEW
  // ----------------------------------------------------
  if (successData) {
    return (
      <div className="bg-slate-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl p-8 backdrop-blur-xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Registration successful.
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Your {successData.role === "TEACHER" ? "Staff" : "Student"} account has been securely created.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Account Name:</span>
            <span className="text-white font-medium">{successData.name}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Registered Email:</span>
            <span className="text-slate-300 font-mono">{successData.email}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Assigned Role:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {successData.role}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">{successData.role === "TEACHER" ? "Staff ID:" : "Student ID:"}</span>
            <span className="text-slate-300 font-mono">{successData.idNumber}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full font-semibold shadow-lg shadow-indigo-600/30"
          onClick={() => router.push("/login?registered=true")}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  // ----------------------------------------------------
  // REGISTRATION FORM VIEW
  // ----------------------------------------------------
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
      <div className="flex flex-col items-center text-center mb-6">
        <ExamoraLogo size="lg" showTagline={true} className="flex-col !gap-2 items-center text-center" textClassName="text-center" />
        <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
          Create your account
        </h1>
        <p className="text-xs text-slate-400 mt-1.5">
          Select your institutional role to begin registration
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="mb-6">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
          Who are you?
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            id="role-tab-student"
            onClick={() => handleRoleChange("STUDENT")}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              role === "STUDENT"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student
          </button>

          <button
            type="button"
            id="role-tab-staff"
            onClick={() => handleRoleChange("STAFF")}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              role === "STAFF"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Staff
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {generalError && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{generalError}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Input
          id="register-fullname"
          label="Full Name"
          type="text"
          placeholder={role === "STUDENT" ? "e.g. Jane Doe" : "e.g. Dr. Jane Smith"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="name"
          disabled={isLoading}
          required
        />

        {/* Dynamic Fields based on Role */}
        {role === "STUDENT" ? (
          <Input
            id="register-student-id"
            label="Student ID / Register Number"
            type="text"
            placeholder="e.g. RCAS2025BCY001"
            value={studentIdNumber}
            onChange={(e) => setStudentIdNumber(e.target.value)}
            error={fieldErrors.studentIdNumber}
            leftIcon={<KeyRound className="w-4 h-4" />}
            disabled={isLoading}
            required
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="register-staff-id"
                label="Staff ID"
                type="text"
                placeholder="e.g. STF-CS-010"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                error={fieldErrors.staffId}
                leftIcon={<KeyRound className="w-4 h-4" />}
                disabled={isLoading}
                required
              />

              <Input
                id="register-department"
                label="Department"
                type="text"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                error={fieldErrors.department}
                leftIcon={<Building2 className="w-4 h-4" />}
                disabled={isLoading}
                required
              />
            </div>

            <Input
              id="register-staff-code"
              label="Staff Registration Code"
              type="password"
              placeholder="Institutional security passkey"
              value={staffRegistrationCode}
              onChange={(e) => setStaffRegistrationCode(e.target.value)}
              error={fieldErrors.staffRegistrationCode}
              helperText="Authorized code issued by institutional administrator"
              leftIcon={<ShieldCheck className="w-4 h-4 text-amber-400" />}
              disabled={isLoading}
              required
            />
          </>
        )}

        {/* Email */}
        <Input
          id="register-email"
          label={role === "STUDENT" ? "Email Address" : "Official Email"}
          type="email"
          placeholder={role === "STUDENT" ? "student@examora.edu" : "staff@examora.edu"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          disabled={isLoading}
          required
        />

        {/* Phone (Optional) */}
        <Input
          id="register-phone"
          label="Phone Number (Optional)"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4" />}
          autoComplete="tel"
          disabled={isLoading}
        />

        {/* Password */}
        <div>
          <Input
            id="register-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-200 transition-colors p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="new-password"
            disabled={isLoading}
            required
          />

          {/* Password Policy Tracker */}
          {password.length > 0 && (
            <div className="mt-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] space-y-1">
              <div className="font-medium text-slate-400 mb-1">Password Requirements:</div>
              <div className="grid grid-cols-2 gap-1">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                  {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  8+ characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase ? "text-emerald-400" : "text-slate-500"}`}>
                  {hasUpperCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  Uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowerCase ? "text-emerald-400" : "text-slate-500"}`}>
                  {hasLowerCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  Lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                  {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  At least 1 number
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          id="register-confirm-password"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="hover:text-slate-200 transition-colors p-1 cursor-pointer"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="new-password"
          disabled={isLoading}
          required
        />

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            id="register-submit-button"
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-semibold shadow-lg shadow-indigo-600/30"
            disabled={isLoading}
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            CREATE ACCOUNT
          </Button>
        </div>

        {/* Navigation back to Login */}
        <div className="text-center pt-3 space-y-1.5">
          <p className="text-xs text-slate-400">
            {role === "STUDENT" ? "Already registered? " : "Already registered? "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors cursor-pointer"
            >
              {role === "STUDENT" ? "Student Login" : "Staff Login"}
            </Link>
          </p>
          <div>
            <Link
              href="/login"
              className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
