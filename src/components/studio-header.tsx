"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Plus } from "lucide-react";

interface StudioHeaderProps {
  onFocusComposer: () => void;
}

export function StudioHeader({ onFocusComposer }: StudioHeaderProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kinoframe-dark-mode");
    const prefersDark =
      saved !== null
        ? saved === "true"
        : window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("kinoframe-dark-mode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio-composer"
          className="font-display text-xl font-bold tracking-tight text-foreground whitespace-nowrap shrink-0"
        >
          KinoFrame
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a
            href="#studio-composer"
            className="hover:text-foreground hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Create
          </a>
          <a
            href="#reel-library"
            className="hover:text-foreground hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Reel Library
          </a>
          <a
            href="#prompt-starters"
            className="hover:text-foreground hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Starters
          </a>
        </nav>

        {/* Zone 3: Primary action + subtle theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to darkroom mode"}
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onFocusComposer}
            className="px-4 py-2 h-10 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Video</span>
          </button>
        </div>
      </div>
    </header>
  );
}
