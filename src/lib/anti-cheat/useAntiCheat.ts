"use client";

import { useEffect, useRef, useCallback } from "react";
import { ViolationType } from "./types";

interface UseAntiCheatOptions {
  attemptId: string;
  isActive: boolean; // Only active when student is actively taking the exam
  onViolation: (type: ViolationType, reason: string) => Promise<void> | void;
}

const isFullscreenActive = (): boolean => {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
  );
};

export function useAntiCheat({
  attemptId,
  isActive,
  onViolation,
}: UseAntiCheatOptions) {
  const isTriggeredRef = useRef<boolean>(false);
  const mountedTimeRef = useRef<number>(Date.now());
  const lastFullscreenTransitionRef = useRef<number>(Date.now());
  const hasEnteredFullscreenRef = useRef<boolean>(isFullscreenActive());

  const triggerViolation = useCallback(
    async (type: ViolationType, reason: string) => {
      if (isTriggeredRef.current || !isActive) return;

      // Allow 1s after initial mount or fullscreen toggle for browser window focus to settle
      if (type === "WINDOW_BLUR") {
        if (Date.now() - mountedTimeRef.current < 1200 || Date.now() - lastFullscreenTransitionRef.current < 1200) {
          console.warn(`[AntiCheat] Ignored window blur during transition settlement.`);
          return;
        }
      }

      isTriggeredRef.current = true;
      console.warn(`[AntiCheat Alert] Violation detected: ${type} - ${reason}`);

      try {
        await onViolation(type, reason);
      } catch (err) {
        console.error("Error executing onViolation callback:", err);
      }
    },
    [isActive, onViolation]
  );

  useEffect(() => {
    if (!isActive) {
      isTriggeredRef.current = false;
      return;
    }

    mountedTimeRef.current = Date.now();
    if (isFullscreenActive()) {
      hasEnteredFullscreenRef.current = true;
    }

    // 1. Tab Visibility monitoring (Page Visibility API)
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        triggerViolation(
          "TAB_SWITCH",
          "Student switched browser tabs or minimized the examination window."
        );
      }
    };

    // 2. Window Focus/Blur monitoring
    const handleWindowBlur = () => {
      triggerViolation(
        "WINDOW_BLUR",
        "The examination window lost active application focus."
      );
    };

    // 3. Fullscreen exit monitoring
    const handleFullscreenChange = () => {
      lastFullscreenTransitionRef.current = Date.now();
      const inFullscreen = isFullscreenActive();
      if (inFullscreen) {
        hasEnteredFullscreenRef.current = true;
      } else if (hasEnteredFullscreenRef.current) {
        // Was in fullscreen and exited
        triggerViolation(
          "FULLSCREEN_EXIT",
          "Examination was exited from mandatory fullscreen mode."
        );
      }
    };

    // 4. Page hide monitoring
    const handlePageHide = () => {
      triggerViolation(
        "TAB_SWITCH",
        "Examination page was navigated away or hidden."
      );
    };

    // 5. Navigation attempt monitoring (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      triggerViolation(
        "NAVIGATION_ATTEMPT",
        "Student attempted to navigate away or close the examination."
      );
      e.preventDefault();
      e.returnValue = "Leaving this examination will result in immediate termination.";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActive, triggerViolation]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (typeof document === "undefined") return false;
      const elem = document.documentElement as any;

      if (!isFullscreenActive()) {
        lastFullscreenTransitionRef.current = Date.now();
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        hasEnteredFullscreenRef.current = true;
        return true;
      }
      return true;
    } catch (err) {
      console.warn("Fullscreen request was not granted by browser:", err);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (typeof document !== "undefined" && isFullscreenActive()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Error exiting fullscreen:", err);
    }
  }, []);

  return {
    enterFullscreen,
    exitFullscreen,
    isFullscreenActive,
  };
}
