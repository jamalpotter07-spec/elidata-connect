import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Menu,
  Home,
  ShoppingBag,
  MapPin,
  MoreHorizontal,
  Settings,
  FileText,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";

/* ─────────────────────────────────────────────────────
   DESKTOP NAV — floating glass pill + profile circle
───────────────────────────────────────────────────── */

const desktopLinks = [
  { to: "/" as const, label: "Home" },
  { to: "/buy" as const, label: "Buy" },
  { to: "/track" as const, label: "Track" },
  { to: "/about" as const, label: "About" },
];

function SlidingIndicator({ links }: { links: typeof desktopLinks }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const idx = links.findIndex(({ to }) =>
      to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`)
    );
    const el = refs.current[idx];
    const container = containerRef.current;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const conRect = container.getBoundingClientRect();
    setStyle({
      left: elRect.left - conRect.left,
      width: elRect.width,
      opacity: 1,
    });
  }, [path, links]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {/* sliding background pill */}
      <span
        className="pointer-events-none absolute inset-y-0 rounded-full bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: style.left, width: style.width, opacity: style.opacity }}
      />
      {links.map(({ to, label }, i) => {
        const active =
          to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            ref={(el) => { refs.current[i] = el; }}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              active ? "text-white" : "text-white/60 hover:text-white/90"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function NavBar({ hideThemeToggle: _unused = false }: { hideThemeToggle?: boolean } = {}) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      {/* ── TOP NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 pt-3 pointer-events-none">
        {/* Floating glass pill */}
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full px-3 py-2 pr-4"
          style={{
            background: "rgba(15, 20, 40, 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Logo */}
          <Link to="/" className="shrink-0 mr-2">
            <Logo className="[&_span.text-foreground]:text-white [&_.text-muted-foreground]:text-white/50" />
          </Link>

          {/* Desktop nav links with sliding indicator */}
          <nav className="hidden lg:flex">
            <SlidingIndicator links={desktopLinks} />
          </nav>

          {/* Mobile: just logo, controls outside */}
          <div className="lg:hidden w-1" />
        </div>

        {/* Right side controls — circles */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: "rgba(15, 20, 40, 0.55)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 4px 32px rgba(0,0,0,0.28)",
                  }}
                >
                  <Menu className="h-4 w-4 text-white" />
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
                      <div className="mt-2 border-t pt-2">
                        <Button variant="ghost" className="w-full justify-start px-3 text-destructive hover:text-destructive" onClick={signOut}>
                          <LogOut className="mr-2 h-4 w-4" /> Sign out
                        </Button>
                      </div>
                    </>
                  ) : !loading ? (
                    <>
                      <div className="mt-2 border-t pt-2" />
                      <MobileSheetLink to="/login" label="Log in" />
                      <MobileSheetLink to="/signup" label="Sign up" brand />
                    </>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Profile / account circle */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:border-white/20"
                  style={{
                    background: "rgba(15, 20, 40, 0.55)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 4px 32px rgba(0,0,0,0.28)",
                  }}
                >
                  <UserIcon className="h-4 w-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-2 min-w-[180px]">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  <FileText className="mr-2 h-4 w-4" /> My orders
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/bundles" })}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Admin panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden lg:flex h-9 items-center rounded-full px-4 text-sm font-medium text-white/80 hover:text-white transition-colors"
                style={{
                  background: "rgba(15,20,40,0.55)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="hidden lg:flex h-9 items-center rounded-full px-4 text-sm font-medium text-white transition-colors"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--brand-navy-2)), hsl(var(--brand-orange)))",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                Sign up
              </Link>
              {/* mobile: just profile circle → login */}
              <Link
                to="/login"
                aria-label="Log in"
                className="lg:hidden flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: "rgba(15, 20, 40, 0.55)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.28)",
                }}
              >
                <UserIcon className="h-4 w-4 text-white" />
              </Link>
            </div>
          ) : null}
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
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/buy", label: "Buy", icon: ShoppingBag, exact: false },
    { to: "/track", label: "Track", icon: MapPin, exact: false },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      style={{
        background: "#ffffff",
        borderTop: "none",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -8px 32px rgba(0,0,0,0.08)",
        /* cohesive curve at top */
        borderRadius: "20px 20px 0 0",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-3 pb-safe-or-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
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
            <button className="flex flex-col items-center gap-1 px-4 py-1 min-w-[56px] transition-colors duration-150">
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
          <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-0 bg-white">
            <div className="px-6 pt-2 pb-1">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">More</p>
            </div>
            <div className="flex flex-col pb-safe-or-6" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
              {!loading && user ? (
                <>
                  <BottomMenuLink
                    icon={LayoutDashboard}
                    label="Dashboard"
                    onPress={() => { navigate({ to: "/dashboard" }); setMenuOpen(false); }}
                  />
                  <BottomMenuLink
                    icon={FileText}
                    label="My orders"
                    onPress={() => { navigate({ to: "/orders" }); setMenuOpen(false); }}
                  />
                  {isAdmin && (
                    <BottomMenuLink
                      icon={ShieldCheck}
                      label="Admin panel"
                      onPress={() => { navigate({ to: "/admin/bundles" }); setMenuOpen(false); }}
                      accent
                    />
                  )}
                  <BottomMenuLink
                    icon={Lock}
                    label="Privacy policy"
                    onPress={() => { navigate({ to: "/privacy" }); setMenuOpen(false); }}
                  />
                  <BottomMenuLink
                    icon={Settings}
                    label="Terms of service"
                    onPress={() => { navigate({ to: "/terms" }); setMenuOpen(false); }}
                  />
                  <div className="mx-6 my-2 border-t border-gray-100" />
                  <BottomMenuLink
                    icon={LogOut}
                    label="Sign out"
                    onPress={() => { signOut(); setMenuOpen(false); }}
                    danger
                  />
                </>
              ) : !loading ? (
                <>
                  <BottomMenuLink
                    icon={UserIcon}
                    label="Log in"
                    onPress={() => { navigate({ to: "/login" }); setMenuOpen(false); }}
                  />
                  <BottomMenuLink
                    icon={ShoppingBag}
                    label="Sign up"
                    onPress={() => { navigate({ to: "/signup" }); setMenuOpen(false); }}
                    accent
                  />
                  <BottomMenuLink
                    icon={Lock}
                    label="Privacy policy"
                    onPress={() => { navigate({ to: "/privacy" }); setMenuOpen(false); }}
                  />
                  <BottomMenuLink
                    icon={Settings}
                    label="Terms of service"
                    onPress={() => { navigate({ to: "/terms" }); setMenuOpen(false); }}
                  />
                </>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function BottomMenuLink({
  icon: Icon,
  label,
  onPress,
  danger,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  danger?: boolean;
  accent?: boolean;
}) {
  const color = danger ? "#ef4444" : accent ? "hsl(var(--brand-orange))" : "#111827";
  return (
    <button
      onClick={onPress}
      className="flex items-center gap-4 px-6 py-3.5 text-left w-full hover:bg-gray-50 transition-colors"
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color }} />
      <span className="text-sm font-medium" style={{ color }}>
        {label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   MOBILE SHEET LINKS (hamburger on desktop hidden)
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
  const base = "rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-accent";
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
