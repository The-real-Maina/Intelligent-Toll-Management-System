import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "theme";
const EVENT_NAME = "itms-theme-change";

const readStoredTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const applyTheme = (theme) => {
  // data-theme drives App.css; data-bs-theme lets Bootstrap 5.3+ follow along
  document.body.setAttribute("data-theme", theme);
  document.body.setAttribute("data-bs-theme", theme);
};

/**
 * One source of truth for light/dark mode.
 * Every component that calls this stays in sync, and the choice
 * is remembered in localStorage under the key "theme".
 */
export default function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  // Apply + persist whenever the theme changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable: ignore */
    }
  }, [theme]);

  // Keep other hook instances (and other tabs) in sync
  useEffect(() => {
    const onThemeEvent = (e) => setTheme(e.detail === "dark" ? "dark" : "light");
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setTheme(e.newValue === "dark" ? "dark" : "light");
      }
    };

    window.addEventListener(EVENT_NAME, onThemeEvent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onThemeEvent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }, [theme]);

  return { theme, isDark: theme === "dark", toggleTheme };
}