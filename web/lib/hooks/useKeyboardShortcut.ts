"use client";

import { useEffect, useRef, useCallback } from "react";

type KeyCombo = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

/**
 * Hook for binding keyboard shortcuts.
 * Supports single keys, modifier combos, and sequential keys (e.g., G → D).
 */
export function useKeyboardShortcut(
  combo: KeyCombo | string,
  callback: () => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Exception: allow Escape and Cmd/Ctrl+K even in inputs
        const isEscape = e.key === "Escape";
        const isCmdK =
          e.key === "k" && (e.metaKey || e.ctrlKey);
        if (!isEscape && !isCmdK) return;
      }

      if (typeof combo === "string") {
        if (e.key.toLowerCase() === combo.toLowerCase() && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          callbackRef.current();
        }
        return;
      }

      const matches =
        e.key.toLowerCase() === combo.key.toLowerCase() &&
        (combo.metaKey ? e.metaKey : true) &&
        (combo.ctrlKey ? e.ctrlKey : true) &&
        (combo.shiftKey ? e.shiftKey : true) &&
        (combo.altKey ? e.altKey : true);

      if (matches) {
        e.preventDefault();
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [combo, enabled]);
}

/**
 * Hook for sequential key combos (e.g., G then D for Dashboard).
 * Allows navigating with keyboard sequences like vim-style shortcuts.
 */
export function useSequentialShortcut(
  sequence: string[],
  callback: () => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetBuffer = useCallback(() => {
    bufferRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      bufferRef.current.push(e.key.toLowerCase());

      // Reset buffer after 800ms of inactivity
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(resetBuffer, 800);

      // Check if buffer matches the sequence
      const bufLen = bufferRef.current.length;
      const seqLen = sequence.length;

      if (bufLen > seqLen) {
        resetBuffer();
        return;
      }

      const matches = bufferRef.current.every(
        (key, i) => key === sequence[i].toLowerCase()
      );

      if (!matches) {
        resetBuffer();
        return;
      }

      if (bufLen === seqLen) {
        e.preventDefault();
        resetBuffer();
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      resetBuffer();
    };
  }, [sequence, enabled, resetBuffer]);
}
