import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  Home,
  ShoppingBag,
  MapPin,
  MoreHorizontal,
  FileText,
  Lock,
  Moon,
  Sun,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { useTheme } from "./theme-provider";

/* ─────────────────────────────────────────────────────
   ADAPTIVE GLASS STYLES — dark mode = white tint
                          light mode = dark tint
───────────────────────────────────────────────────── */
function useGlassStyles() {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  const circle: React.CSSProperties = isDark
    ? {
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)",
      }
    : {
        background: "rgba(15, 20, 50, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
      };

  const pill: React.CSSProperties = isDark
    ? {
        background: "rgba(255, 255, 255, 0.10)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.20)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.14)",
      }
    : {
        background: "rgba(15, 20, 50, 0.70)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.28)",
      };

  return { circle, pill };
}

/* ─────────────────────────────────────────────────────
   THEME TOGGLE — used inside sheet on mobile,
                  circle on desktop
───────────────────────────────────────────────────── */
function ThemeCircle() {
  const { resolved, setTheme } = useTheme();
  const { circle } = useGlassStyles();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105 shrink-0"
      style={circle}
    >
      {resolved === "dark"
        ? <Sun className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        : <Moon className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />}
    </button>
  );
}

function ThemeSheetRow() {
  const { resolved, setTheme } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      onClick={() => setTheme(next)}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-accent w-full text-left"
    >
      {resolved === "dark"
        ? <Sun className="h-4 w-4 shrink-0" />
        : <Moon className="h-4 w-4 shrink-0" />}
      {resolved === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   DESKTOP SLIDING INDICATOR
───────────────────────────────────────────────────── */
const desktopLinks = [
  { to: "/" as const, label: "Home" },
  { to: "/buy" as const, label: "Buy" },
  { to: "/track" as const, label: "Track" },
  { to: "/about" as const, label: "About" },
];

function SlidingIndicator() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { resolved } = useTheme();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const idx = desktopLinks.findIndex(({ to }) =>
      to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`)
    );
    const el = refs.current[idx];
    const container = containerRef.current;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const conRect = container.getBoundingClientRect();
    setStyle({ left: elRect.left - conRect.left, width: elRect.width, opacity: 1 });
  }, [path]);

  const activeColor = "text-white";
  const inactiveColor = "text-white/60 hover:text-white/90";

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <span
        className="pointer-events-none absolute inset-y-0 rounded-full bg-white/15 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: style.left, width: style.width, opacity: style.opacity }}
      />
      {desktopLinks.map(({ to, label }, i) => {
        const active = to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            ref={(el) => { refs.current[i] = el; }}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              active ? activeColor : inactiveColor
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN NAVBAR EXPORT
───────────────────────────────────────────────────── */
export function NavBar({ hideThemeToggle: _unused = false }: { hideThemeToggle?: boolean } = {}) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { pill, circle } = useGlassStyles();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      {/* ── TOP NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-3 pointer-events-none">

        {/* ── MOBILE: centered pill + hamburger circle right ── */}
        <div className="flex w-full items-center lg:hidden pointer-events-auto gap-2">
          {/* Centered pill — 40% shorter padding, 34% taller */}
          <div
            className="flex flex-1 items-center justify-center rounded-full"
            style={{
              ...pill,
              paddingTop: "10px",
              paddingBottom: "10px",
              paddingLeft: "14px",
              paddingRight: "14px",
            }}
          >
            <Link to="/" className="flex items-center justify-center">
              <Logo />
            </Link>
          </div>

          {/* Hamburger circle only — theme moved into sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105 shrink-0"
                style={circle}
              >
                <Menu className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm bg-background/95 backdrop-blur-xl">
              <div className="mt-8 flex flex-col gap-2">
                <MobileSheetLink to="/" label="Home" exact />
                <MobileSheetLink to="/buy" label="Buy bundles" />
                <MobileSheetLink to="/about" label="About" />
                {!loading && user ? (
                  <>
                    <MobileSheetLink to="/dashboard" label="Dashboard" />
                    <MobileSheetLink to="/orders" label="My orders" />
                    {isAdmin && <MobileSheetLink to="/admin/bundles" label="Admin" brand />}
                  </>
                ) : !loading ? (
                  <>
                    <MobileSheetLink to="/login" label="Log in" />
                    <MobileSheetLink to="/signup" label="Sign up" brand />
                  </>
                ) : null}

                {/* Theme toggle in sheet */}
                <div className="mt-2 border-t pt-2">
                  <ThemeSheetRow />
                </div>

                {/* Sign out at bottom if logged in */}
                {!loading && user && (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive transition hover:bg-accent w-full text-left"
                  >
                    <LogOut className="h-4 w-4 shrink-0" /> Sign out
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── DESKTOP: centered pill + theme circle right ── */}
        <div className="hidden lg:flex w-full items-center justify-center relative pointer-events-auto">
          {/* Centered pill */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={pill}
          >
            <Link to="/" className="shrink-0 mr-2">
              <Logo />
            </Link>
            <SlidingIndicator />
          </div>

          {/* Theme circle — absolute right so pill stays centered */}
          <div className="absolute right-0">
            <ThemeCircle />
          </div>
        </div>
      </header>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <BottomNav user={user} isAdmin={isAdmin} loading={loading} signOut={signOut} />
    </>
  );
}

/* ─────────────────────────────────────────────────────
   BOTTOM NAV
───────────────────────────────────────────────────── */
function BottomNav({
  user,
  isAdmin,
  loading,
  signOut,
}: {
  user: any;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { to: "/" as const, label: "Home", icon: Home, exact: true },
    { to: "/buy" as const, label: "Buy", icon: ShoppingBag, exact: false },
    { to: "/track" as const, label: "Track", icon: MapPin, exact: false },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      style={{
        background: "#ffffff",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -8px 32px rgba(0,0,0,0.08)",
        borderRadius: "20px 20px 0 0",
      }}
    >
      <div
        className="flex items-center justify-around px-2 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {tabs.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? path === to : path === to || path.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 px-4 py-1 min-w-[56px] transition-colors duration-150"
            >
              <Icon
                className="h-5 w-5 transition-colors duration-150"
                style={{ color: active ? "#0f1428" : "#9ca3af" }}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className="text-[10px] font-medium tracking-wide transition-colors duration-150"
                style={{ color: active ? "#0f1428" : "#9ca3af" }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Menu tab */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-4 py-1 min-w-[56px]">
              <MoreHorizontal
                className="h-5 w-5 transition-colors duration-150"
                style={{ color: menuOpen ? "#0f1428" : "#9ca3af" }}
                strokeWidth={menuOpen ? 2.2 : 1.8}
              />
              <span
                className="text-[10px] font-medium tracking-wide transition-colors duration-150"
                style={{ color: menuOpen ? "#0f1428" : "#9ca3af" }}
              >
                Menu
              </span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="rounded-t-3xl px-0 pb-0 bg-white border-0 shadow-none"
          >
            <div
              className="flex flex-col"
              style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            >
              {/* Slim pill handle */}
              <div className="flex justify-center pt-3 pb-5">
                <div className="h-1 w-10 rounded-full bg-gray-200" />
              </div>

              {/* Account or Log in */}
              {!loading && user ? (
                <BottomMenuRow
                  icon={UserIcon}
                  label="Account"
                  sublabel={user.email}
                  onPress={() => { navigate({ to: "/dashboard" }); setMenuOpen(false); }}
                />
              ) : !loading ? (
                <BottomMenuRow
                  icon={UserIcon}
                  label="Log in"
                  onPress={() => { navigate({ to: "/login" }); setMenuOpen(false); }}
                />
              ) : null}

              {!loading && user && isAdmin && (
                <BottomMenuRow
                  icon={ShieldCheck}
                  label="Admin panel"
                  onPress={() => { navigate({ to: "/admin/bundles" }); setMenuOpen(false); }}
                  accent
                />
              )}

              <div className="mx-5 my-2 border-t border-gray-100" />

              <BottomMenuRow
                icon={Lock}
                label="Privacy Policy"
                onPress={() => { navigate({ to: "/privacy" }); setMenuOpen(false); }}
              />
              <BottomMenuRow
                icon={FileText}
                label="Terms of Service"
                onPress={() => { navigate({ to: "/terms" }); setMenuOpen(false); }}
              />

              {!loading && user && (
                <>
                  <div className="mx-5 my-2 border-t border-gray-100" />
                  <BottomMenuRow
                    icon={LogOut}
                    label="Sign out"
                    onPress={() => { signOut(); setMenuOpen(false); }}
                    danger
                  />
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function BottomMenuRow({
  icon: Icon,
  label,
  sublabel,
  onPress,
  danger,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  accent?: boolean;
}) {
  const color = danger ? "#ef4444" : accent ? "hsl(var(--brand-orange))" : "#111827";
  const bg = danger ? "#fef2f2" : accent ? "hsl(var(--brand-soft))" : "#f3f4f6";
  return (
    <button
      onClick={onPress}
      className="flex items-center gap-4 px-5 py-3 w-full text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
        style={{ background: bg }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium" style={{ color }}>{label}</span>
        {sublabel && (
          <span className="text-xs text-gray-400 truncate">{sublabel}</span>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   MOBILE SHEET LINKS
───────────────────────────────────────────────────── */
function MobileSheetLink({
  to,
  label,
  exact,
  brand,
}: {
  to: "/" | "/about" | "/dashboard" | "/orders" | "/admin/bundles" | "/login" | "/signup" | "/buy";
  label: string;
  exact?: boolean;
  brand?: boolean;
}) {
  const base = "rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-accent block";
  const brandCls = brand ? "text-brand" : "";
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      activeProps={{ className: `${base} ${brandCls} bg-accent text-foreground` }}
      inactiveProps={{ className: `${base} ${brandCls}` }}
    >
      {label}
    </Link>
  );
}
