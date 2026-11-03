// nav-bar.tsx
// Top bar: one frosted pill (logo, links, theme, account). It slides away while you
// scroll down and returns when you scroll up, so it never sits on top of text you are reading.
// Phone bottom: a floating frosted dock (Home, Buy, Track, More). "More" holds everything else.
// Every colour is a theme token, so both bars and the sheet read in light and dark.

import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck, User as UserIcon, LogOut, Search, Home, ShoppingBag, MoreHorizontal,
  FileText, Lock, Moon, Sun, LayoutDashboard, Package, Info,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Logo } from "./logo";
import { ThemeToggle, useTheme } from "./theme-provider";

const NAV_LINKS = [
  { to: "/" as const, label: "Home" },
  { to: "/buy" as const, label: "Buy" },
  { to: "/track" as const, label: "Track" },
  { to: "/about" as const, label: "About" },
];

function isActivePath(path: string, to: string) {
  return to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
}

/* Hide on scroll down, show on scroll up (and always at the top of the page). */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setHidden(false), [path]);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (y < 40) setHidden(false);
        else if (delta > 8) setHidden(true);
        else if (delta < -8) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return [hidden, setHidden] as const;
}

/* ── Desktop links with a sliding highlight ── */
function SlidingLinks() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const idx = NAV_LINKS.findIndex(({ to }) => isActivePath(path, to));
    const el = refs.current[idx];
    const con = containerRef.current;
    if (!el || !con) {
      setBox((b) => ({ ...b, opacity: 0 }));
      return;
    }
    const er = el.getBoundingClientRect();
    const cr = con.getBoundingClientRect();
    setBox({ left: er.left - cr.left, width: er.width, opacity: 1 });
  }, [path]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <span
        className="pointer-events-none absolute inset-y-0 rounded-full bg-accent transition-all duration-300"
        style={{ left: box.left, width: box.width, opacity: box.opacity }}
      />
      {NAV_LINKS.map(({ to, label }, i) => {
        const active = isActivePath(path, to);
        return (
          <Link
            key={to}
            to={to}
            ref={(el) => { refs.current[i] = el; }}
            className={`relative z-10 flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/* ── Desktop account area ── */
function DesktopAuth({
  user, isAdmin, loading, signOut,
}: { user: any; isAdmin: boolean; loading: boolean; signOut: () => void }) {
  if (loading) return <div className="h-11 w-28 animate-pulse rounded-full bg-muted" />;
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="btn-ghost-glass" style={{ minHeight: 44, paddingInline: "1.25rem" }}>
          Log in
        </Link>
        <Link to="/signup" className="btn-orange" style={{ minHeight: 44, paddingInline: "1.25rem" }}>
          Sign up
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          to="/admin/bundles"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-danger-soft px-4 text-sm font-semibold text-danger transition-opacity hover:opacity-80"
        >
          <ShieldCheck className="h-4 w-4" />
          Admin
        </Link>
      )}
      <Link to="/dashboard" className="btn-ghost-glass" style={{ minHeight: 44, paddingInline: "1.25rem" }}>
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <button
        onClick={signOut}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
        title="Sign out"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Main export ── */
export function NavBar({ hideThemeToggle: _unused = false }: { hideThemeToggle?: boolean } = {}) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useHideOnScroll();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3"
        style={{
          transform: hidden ? "translateY(-140%)" : "translateY(0)",
          transition: "transform 0.5s var(--ease-out)",
        }}
        onFocusCapture={() => setHidden(false)}
      >
        <div className="glass-strong pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2 lg:pl-5">
          <Link to="/" aria-label="Eli Data Resales home" className="shrink-0">
            <Logo />
          </Link>

          <div className="hidden lg:block">
            <SlidingLinks />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden lg:block">
              <DesktopAuth user={user} isAdmin={isAdmin} loading={loading} signOut={signOut} />
            </div>
            {/* Phones: one account button. Everything else lives in "More". */}
            <Link
              to={user ? "/dashboard" : "/login"}
              aria-label={user ? "Dashboard" : "Log in"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95 lg:hidden"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <Dock user={user} isAdmin={isAdmin} loading={loading} signOut={signOut} />
    </>
  );
}

/* ── Phone dock ── */
function Dock({
  user, isAdmin, loading, signOut,
}: { user: any; isAdmin: boolean; loading: boolean; signOut: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { resolved, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const TABS = [
    { to: "/" as const, label: "Home", Icon: Home },
    { to: "/buy" as const, label: "Buy", Icon: ShoppingBag },
    { to: "/track" as const, label: "Track", Icon: Search },
  ];

  const go = (to: string) => {
    setMenuOpen(false);
    navigate({ to: to as any });
  };

  const tabBase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-2 text-xs font-semibold transition-all duration-300 active:scale-95";

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 lg:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      aria-label="Main"
    >
      <div className="glass-strong pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-full p-1.5">
        {TABS.map(({ to, label, Icon }) => {
          const active = isActivePath(path, to);
          return (
            <Link
              key={to}
              to={to}
              className={`${tabBase} ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={`${tabBase} ${
                menuOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={menuOpen ? 2.4 : 2} />
              More
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl border-t px-0 pb-0 pt-2">
            <SheetDescription className="sr-only">Account, pages and settings</SheetDescription>

            <div
              className="flex max-h-[85svh] flex-col overflow-y-auto"
              style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            >
              {/* Title row leaves room for the close button on the right */}
              <div className="flex h-14 shrink-0 items-center px-5">
                <SheetTitle className="text-xl font-semibold">Menu</SheetTitle>
              </div>

              {!loading && !user && (
                <div className="grid grid-cols-2 gap-3 px-5 pb-3">
                  <button onClick={() => go("/login")} className="btn-ghost-glass">Log in</button>
                  <button onClick={() => go("/signup")} className="btn-orange">Sign up</button>
                </div>
              )}

              {!loading && user && (
                <>
                  <MoreRow Icon={LayoutDashboard} label="Dashboard" sub={user.email} onPress={() => go("/dashboard")} />
                  <MoreRow Icon={Package} label="My orders" onPress={() => go("/orders")} />
                  {isAdmin && <MoreRow Icon={ShieldCheck} label="Admin panel" tone="accent" onPress={() => go("/admin/bundles")} />}
                </>
              )}

              <Rule />
              <MoreRow Icon={Info} label="About" onPress={() => go("/about")} />
              <MoreRow Icon={Lock} label="Privacy policy" onPress={() => go("/privacy")} />
              <MoreRow Icon={FileText} label="Terms of service" onPress={() => go("/terms")} />

              <Rule />
              <MoreRow
                Icon={resolved === "dark" ? Sun : Moon}
                label={resolved === "dark" ? "Light mode" : "Dark mode"}
                onPress={() => setTheme(resolved === "dark" ? "light" : "dark")}
              />

              {!loading && user && (
                <MoreRow
                  Icon={LogOut}
                  label="Sign out"
                  tone="danger"
                  onPress={() => { setMenuOpen(false); signOut(); }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function Rule() {
  return <div className="mx-5 my-2 border-t border-border" />;
}

function MoreRow({
  Icon, label, sub, onPress, tone,
}: {
  Icon: React.ElementType;
  label: string;
  sub?: string;
  onPress: () => void;
  tone?: "accent" | "danger";
}) {
  const text = tone === "danger" ? "text-danger" : tone === "accent" ? "text-primary" : "text-foreground";
  const chip =
    tone === "danger" ? "bg-danger-soft text-danger" : tone === "accent" ? "bg-secondary text-primary" : "bg-muted text-foreground";
  return (
    <button
      onClick={onPress}
      className="flex min-h-14 w-full items-center gap-4 px-5 py-2 text-left transition-colors hover:bg-accent active:bg-accent"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chip}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`text-base font-medium ${text}`}>{label}</span>
        {sub && <span className="truncate text-sm text-muted-foreground">{sub}</span>}
      </span>
    </button>
  );
}
