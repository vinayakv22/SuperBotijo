"use client";

import { useState } from "react";

function getInitialState(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("fleetSidebarOpen");
  return stored === "true";
}

export function useFleetSidebar() {
  const [isOpen, setIsOpen] = useState(getInitialState);

  // Persist state to localStorage when it changes
  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem("fleetSidebarOpen", String(newValue));
      return newValue;
    });
  };

  return { isOpen, toggleSidebar };
}
