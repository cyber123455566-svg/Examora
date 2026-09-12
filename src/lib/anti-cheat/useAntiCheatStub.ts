"use client";

import { useCallback, useEffect, useRef } from "react";
import { AntiCheatEventPayload, AntiCheatPolicy, DEFAULT_PROCTORING_POLICY, ViolationType } from "./types";

/**
 * Architecture Stub: useAntiCheat
 *
 * This hook establishes the architectural foundation for the real-time proctoring engine
 * to be activated in V0.2 on the Student examination screen.
 *
 * Detection Capabilities (V0.2 Roadmap):
 * 1. Document Visibility API (`visibilitychange`) -> Catches tab switching
 * 2. Window Focus/Blur (`window.onblur`) -> Catches leaving browser window
 * 3. Fullscreen Change (`fullscreenchange`) -> Catches exiting fullscreen view
 * 4. Context Menu & Copy/Paste Disabling -> Prevents unauthorized data transfer
 * 5. Navigation Trapping (`beforeunload`, popstate) -> Prevents accidental exit
 */
export function useAntiCheatStub(
  attemptId: string,
  onViolationDetected?: (event: AntiCheatEventPayload) => void,
  policy: AntiCheatPolicy = DEFAULT_PROCTORING_POLICY
) {
  const violationCountRef = useRef<number>(0);

  const logViolationStub = useCallback(
    async (type: ViolationType, reason: string) => {
      violationCountRef.current += 1;
      const event: AntiCheatEventPayload = {
        attemptId,
        violationType: type,
        severity: violationCountRef.current >= policy.maxWarnings ? "TERMINAL" : "WARNING",
        timestamp: new Date().toISOString(),
        metadata: {
          reason,
          windowFocusState: typeof document !== "undefined" ? document.hasFocus() : true,
          visibilityState: typeof document !== "undefined" ? document.visibilityState : "visible",
          isFullscreen: typeof document !== "undefined" ? !!document.fullscreenElement : false,
        },
      };

      if (onViolationDetected) {
        onViolationDetected(event);
      }

      // In V0.2, this will dispatch a POST to /api/examinations/[attemptId]/violations
      console.log(`[AntiCheat Arch Stub] Event queued: ${type} - ${reason}`);
    },
    [attemptId, onViolationDetected, policy.maxWarnings]
  );

  useEffect(() => {
    // Note: Event listeners are disabled in V0.1 per specifications.
    // In V0.2, listener registration will occur here.
    return () => {
      // Cleanup listeners
    };
  }, [logViolationStub]);

  return {
    isProctoringActive: false, // Flag indicating V0.1 architectural readiness
    policy,
    logViolationStub,
  };
}
