import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };
const ThemeCtx = createContext<Ctx | null>(null);

function applyTheme(t: Theme): "light" | "dark" {
  const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const resolved = t === "system" ? sys : t;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(stored);
    setResolved(applyTheme(stored));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const t = (localStorage.getItem("theme") as Theme) || "system";
      if (t === "system") setResolved(applyTheme("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
    setResolved(applyTheme(t));
  };

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const label = theme === "system" ? "Auto" : theme === "dark" ? "Dark" : "Light";
  return (
    <button
      onClick={() => setTheme(next)}
      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition"
      aria-label="Toggle theme"
    >
      {label}
    </button>
  );
}
