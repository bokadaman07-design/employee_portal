import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "employee_tracker_theme";

// Reads the persisted theme choice. Returns "light" | "dark" | null.
// null means the user has never made an explicit choice, so the first visit
// should fall back to the operating system preference.
function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

// Resolve the theme to apply on first paint: an explicit stored choice wins,
// otherwise respect the system preference.
function resolveInitialTheme() {
  return readStoredTheme() ?? (systemPrefersDark() ? "dark" : "light");
}

// Toggles the `dark` class on <html> so Tailwind's class-based dark variants
// take effect across the whole document.
function applyThemeClass(theme) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// Core theme state machine. Returns the active theme plus controls. A single
// instance should own the state (see ThemeProvider) so the document class and
// every consumer stay in sync.
export function useThemeState() {
  const [theme, setTheme] = useState(resolveInitialTheme);
  // Track whether the user has made an explicit choice yet. While they have
  // not, we keep following the live system preference.
  const [hasExplicitChoice, setHasExplicitChoice] = useState(() => readStoredTheme() !== null);

  // Keep the document class in sync with the active theme.
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Until the user picks a theme, follow live OS changes so the app respects
  // the system preference on the first visit even if it changes mid-session.
  useEffect(() => {
    if (hasExplicitChoice || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setTheme(event.matches ? "dark" : "light");
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [hasExplicitChoice]);

  const setExplicitTheme = useCallback((next) => {
    setHasExplicitChoice(true);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting is best-effort; the in-memory choice still applies.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setExplicitTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setExplicitTheme]);

  return { theme, isDark: theme === "dark", toggleTheme, setTheme: setExplicitTheme };
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const value = useThemeState();
  return createElement(ThemeContext.Provider, { value }, children);
}

// Consume the shared theme. Use this in components (e.g. the navbar toggle).
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
