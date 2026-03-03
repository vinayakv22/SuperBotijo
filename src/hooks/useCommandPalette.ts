"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing Command Palette state and keyboard shortcuts
 *
 * Provides:
 * - isOpen: current open/closed state
 * - open: function to open the palette
 * - close: function to close the palette
 * - toggle: function to toggle the palette
 *
 * Listens for Cmd+K (macOS) / Ctrl+K (Windows/Linux) to toggle
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (macOS) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        toggle();
      }

      // Close on Escape
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggle, close, isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
