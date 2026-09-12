/**
 * Anti-Cheat Proctoring Architecture Specifications
 * Designed for modular integration into the Student Examination Room in V0.2.
 */

export type ViolationType =
  | "TAB_SWITCH"            // User switched browser tabs (document.visibilityState === 'hidden')
  | "WINDOW_BLUR"           // Examination window lost focus (window.onblur)
  | "FULLSCREEN_EXIT"       // Examination exited forced fullscreen mode (!document.fullscreenElement)
  | "NAVIGATION_ATTEMPT"    // Attempted back/forward/refresh or external link navigation
  | "MOUSE_LEAVE"           // Cursor left active viewport boundary
  | "DEVTOOLS_OPEN"         // Browser developer console opened
  | "CLIPBOARD_ACCESS"      // Copy or paste attempted
  | "OTHER";

export type ViolationSeverity = "WARNING" | "CRITICAL" | "TERMINAL";

export interface AntiCheatEventPayload {
  attemptId: string;
  violationType: ViolationType;
  severity: ViolationSeverity;
  timestamp: string; // ISO 8601
  metadata?: {
    reason?: string;
    windowFocusState?: boolean;
    visibilityState?: string;
    isFullscreen?: boolean;
    targetUrl?: string;
    userAgent?: string;
    elapsedSeconds?: number;
  };
}

export interface AntiCheatPolicy {
  maxWarnings: number;            // E.g., 3 warnings before automatic termination
  allowFullscreenExit: boolean;   // Whether leaving fullscreen triggers violation
  disallowTabSwitch: boolean;     // Whether changing tabs logs a violation
  lockOnDevtools: boolean;        // Immediate lockout if devtools detected
  autoTerminateOnThreshold: boolean; // Flag to lock attempt automatically on server
}

export const DEFAULT_PROCTORING_POLICY: AntiCheatPolicy = {
  maxWarnings: 3,
  allowFullscreenExit: false,
  disallowTabSwitch: true,
  lockOnDevtools: true,
  autoTerminateOnThreshold: true,
};

export interface ViolationResponse {
  success: boolean;
  violationCount: number;
  remainingWarnings: number;
  isLocked: boolean;
  message: string;
}
