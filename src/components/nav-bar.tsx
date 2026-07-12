// nav-bar.tsx
// Fix 1: Desktop pill now shows Login/Sign up (guest) or Dashboard/Admin/Sign out (authed)
// Fix 2: Mobile sheet has icon-grouped sections — Menu / Account / Settings
// Fix 3: Bottom nav uses Search icon for Track (not MapPin); "Menu" → "More"
// Fix 4: All pages gain consistent 96px top clearance (set per-page below)

import { useAuth }    from "@/hooks/use-auth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase }   from "@/integrations/supabase/client";
import {
  ShieldCheck, User as UserIcon, LogOut, Menu, Search,
  Home, ShoppingBag, MoreHorizontal, FileText, Lock,
  Moon, Sun, ChevronRight, LayoutDashboard, Package,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo }      from "./logo";
import { useTheme }  from "./theme-provider";

/* ── Glass styles ── */
function useGlassStyles() {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const pill: React.CSSProperties = isDark
    ? { background:"rgba(13,17,23,0.82)", backdropFilter:"blur(24px) saturate(1.5)", WebkitBackdropFilter:"blur(24px) saturate(1.5)", border:"1px solid rgba(0,255,255,0.12)", boxShadow:"0 4px 32px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.06)" }
    : { background:"rgba(10,16,40,0.74)",  backdropFilter:"blur(24px) saturate(1.5)", WebkitBackdropFilter:"blur(24px) saturate(1.5)", border:"1px solid rgba(255,255,255,0.10)", boxShadow:"0 4px 32px rgba(0,0,0,0.28)" };
  const circle: React.CSSProperties = isDark
    ? { background:"rgba(0,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(0,255,255,0.18)", boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }
    : { background:"rgba(10,16,40,0.70)",  backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.10)", boxShadow:"0 4px 20px rgba(0,0,0,0.30)" };
  return { pill, circle };
}

/* ── Theme helpers ── */
function ThemeCircle() {
  const { resolved, setTheme } = useTheme();
  const { circle } = useGlassStyles();
  return (
    <button onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 shrink-0"
      style={circle}>
      {resolved === "dark"
        ? <Sun  className="h-4 w-4 text-white" strokeWidth={2.5} />
        : <Moon className="h-4 w-4 text-white" strokeWidth={2.5} />}
    </button>
  );
}
function ThemeSheetRow() {
  const { resolved, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-accent w-full text-left">
      {resolved === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {resolved === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

/* ── Desktop sliding indicator ── */
const NAV_LINKS = [
  { to:"/"      as const, label:"Home"  },
  { to:"/buy"   as const, label:"Buy"   },
  { to:"/track" as const, label:"Track" },
  { to:"/about" as const, label:"About" },
];

function SlidingIndicator() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left:0, width:0, opacity:0 });

  useEffect(() => {
    const idx = NAV_LINKS.findIndex(({ to }) =>
      to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`)
    );
    const el  = refs.current[idx];
    const con = containerRef.current;
    if (!el || !con) return;
    const er = el.getBoundingClientRect(), cr = con.getBoundingClientRect();
    setStyle({ left: er.left - cr.left, width: er.width, opacity: 1 });
  }, [path]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-0.5">
      <span className="pointer-events-none absolute inset-y-0 rounded-full transition-all duration-300"
        style={{ left:style.left, width:style.width, opacity:style.opacity, background:"rgba(0,255,255,0.10)", border:"1px solid rgba(0,255,255,0.18)" }} />
      {NAV_LINKS.map(({ to, label }, i) => {
        const active = to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
        return (
          <Link key={to} to={to} ref={(el) => { refs.current[i] = el; }}
            className="relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200"
            style={{ color: active ? "#00ffff" : "rgba(255,255,255,0.60)" }}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/* ── Desktop auth area ── */
function DesktopAuth({ user, isAdmin, loading, signOut }: { user:any; isAdmin:boolean; loading:boolean; signOut:()=>void }) {
  if (loading) return <div className="h-8 w-24 rounded-full animate-pulse" style={{ background:"rgba(255,255,255,0.08)" }} />;
  if (!user) return (
    <div className="flex items-center gap-2">
      <Link to="/login"
        className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all hover:opacity-80"
        style={{ color:"rgba(255,255,255,0.80)", border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.06)" }}>
        Log in
      </Link>
      <Link to="/signup"
        className="rounded-full px-4 py-1.5 text-sm font-bold transition-all hover:opacity-90"
        style={{ background:"linear-gradient(90deg,#e65100,#f37d01)", color:"#ffffff", boxShadow:"0 2px 12px rgba(230,81,0,0.30)" }}>
        Sign up
      </Link>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link to="/admin/bundles"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
          style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.30)", color:"#fca5a5" }}>
          <ShieldCheck className="h-3 w-3" />Admin
        </Link>
      )}
      <Link to="/dashboard"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-80"
        style={{ color:"rgba(255,255,255,0.80)", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)" }}>
        <LayoutDashboard className="h-3.5 w-3.5" />Dashboard
      </Link>
      <button onClick={signOut}
        className="flex items-center justify-center h-8 w-8 rounded-full transition-all hover:opacity-80"
        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.55)" }}
        title="Sign out" aria-label="Sign out">
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Main export ── */
export function NavBar({ hideThemeToggle: _unused = false }: { hideThemeToggle?: boolean } = {}) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { pill, circle } = useGlassStyles();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to:"/" }); };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-3 pointer-events-none">

        {/* ── MOBILE top bar ── */}
        <div className="flex w-full items-center lg:hidden pointer-events-auto gap-2">
          <div className="flex flex-1 items-center justify-center rounded-full"
            style={{ ...pill, padding:"10px 14px" }}>
            <Link to="/" className="flex items-center justify-center"><Logo /></Link>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button aria-label="Open menu"
                className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105 shrink-0"
                style={circle}>
                <Menu className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[82vw] max-w-xs border-0 p-0"
              style={{ background:"rgba(13,17,23,0.97)", backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)" }}>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <Logo />
                {user && <p className="text-[11px] text-white/40 truncate ml-1">{user.email}</p>}
              </div>

              <div className="flex flex-col px-3 py-4 gap-1 overflow-y-auto" style={{ maxHeight:"calc(100svh - 80px)" }}>

                {/* Menu */}
                <SectionLabel label="Menu" />
                <SheetRow to="/"      label="Home"        Icon={Home}          onPress={() => setMobileOpen(false)} />
                <SheetRow to="/buy"   label="Buy bundles" Icon={ShoppingBag}   onPress={() => setMobileOpen(false)} />
                <SheetRow to="/track" label="Track order" Icon={Search}        onPress={() => setMobileOpen(false)} />
                <SheetRow to="/about" label="About"       Icon={FileText}      onPress={() => setMobileOpen(false)} />

                {/* Account */}
                <Divider />
                {!loading && !user ? (
                  <>
                    <SectionLabel label="Account" />
                    <SheetRow to="/login"  label="Log in"  Icon={UserIcon} onPress={() => setMobileOpen(false)} />
                    <SheetRow to="/signup" label="Sign up" Icon={UserIcon} accent onPress={() => setMobileOpen(false)} />
                  </>
                ) : !loading && user ? (
                  <>
                    <SectionLabel label="Account" />
                    <SheetRow to="/dashboard" label="Dashboard" Icon={LayoutDashboard} onPress={() => setMobileOpen(false)} />
                    <SheetRow to="/orders"    label="My orders" Icon={Package}         onPress={() => setMobileOpen(false)} />
                    {isAdmin && <SheetRow to="/admin/bundles" label="Admin panel" Icon={ShieldCheck} accent onPress={() => setMobileOpen(false)} />}
                  </>
                ) : null}

                {/* Settings */}
                <Divider />
                <SectionLabel label="Settings" />
                <ThemeSheetRow />
                <SheetRow to="/privacy" label="Privacy Policy"   Icon={Lock}     onPress={() => setMobileOpen(false)} />
                <SheetRow to="/terms"   label="Terms of Service" Icon={FileText} onPress={() => setMobileOpen(false)} />

                {/* Sign out */}
                {!loading && user && (
                  <>
                    <Divider />
                    <button onClick={() => { signOut(); setMobileOpen(false); }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium w-full text-left transition hover:bg-white/5"
                      style={{ color:"#f87171" }}>
                      <LogOut className="h-4 w-4 shrink-0" style={{ color:"#f87171" }} />
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── DESKTOP pill ── */}
        <div className="hidden lg:flex w-full items-center justify-between pointer-events-auto gap-3">
          {/* Left: logo + nav */}
          <div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={pill}>
            <Link to="/" className="shrink-0 mr-2"><Logo /></Link>
            <SlidingIndicator />
          </div>
          {/* Right: auth + theme */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full px-4 py-2" style={pill}>
              <DesktopAuth user={user} isAdmin={isAdmin} loading={loading} signOut={signOut} />
            </div>
            <ThemeCircle />
          </div>
        </div>

      </header>

      <BottomNav user={user} isAdmin={isAdmin} loading={loading} signOut={signOut} />
    </>
  );
}

/* ── Bottom nav ── */
function BottomNav({ user, isAdmin, loading, signOut }: { user:any; isAdmin:boolean; loading:boolean; signOut:()=>void }) {
  const path = useRouterState({ select:(s) => s.location.pathname });
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const TABS = [
    { to:"/"     as const, label:"Home",  Icon:Home,        exact:true  },
    { to:"/buy"  as const, label:"Buy",   Icon:ShoppingBag, exact:false },
    { to:"/track"as const, label:"Track", Icon:Search,      exact:false },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      style={{
        background:"rgba(255,255,255,0.94)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        boxShadow:"0 -1px 0 rgba(0,0,0,0.06),0 -8px 32px rgba(0,0,0,0.08)",
        borderRadius:"20px 20px 0 0", borderTop:"1px solid rgba(0,0,0,0.06)",
      }}>
      <div className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom:"max(10px, env(safe-area-inset-bottom))" }}>

        {TABS.map(({ to, label, Icon, exact }) => {
          const active = exact ? path === to : path === to || path.startsWith(`${to}/`);
          return (
            <Link key={to} to={to}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 min-w-[56px] rounded-xl transition-all active:scale-95">
              <Icon className="h-5 w-5 transition-colors" style={{ color:active?"#e65100":"#9ca3af" }} strokeWidth={active?2.2:1.8} />
              <span className="text-[10px] font-semibold tracking-wide" style={{ color:active?"#e65100":"#9ca3af" }}>{label}</span>
            </Link>
          );
        })}

        {/* More sheet */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-4 py-1.5 min-w-[56px] rounded-xl active:scale-95">
              <MoreHorizontal className="h-5 w-5" style={{ color:menuOpen?"#e65100":"#9ca3af" }} strokeWidth={menuOpen?2.2:1.8} />
              <span className="text-[10px] font-semibold tracking-wide" style={{ color:menuOpen?"#e65100":"#9ca3af" }}>More</span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-0 border-0 shadow-xl" style={{ background:"#ffffff" }}>
            <div className="flex flex-col" style={{ paddingBottom:"max(24px, env(safe-area-inset-bottom))" }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="h-1 w-10 rounded-full bg-gray-200" />
              </div>

              {/* Account */}
              {!loading && !user ? (
                <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                  <button onClick={() => { navigate({ to:"/login" }); setMenuOpen(false); }}
                    className="rounded-2xl py-3 text-sm font-semibold active:scale-95 transition"
                    style={{ background:"#f3f4f6",color:"#111" }}>Log in</button>
                  <button onClick={() => { navigate({ to:"/signup" }); setMenuOpen(false); }}
                    className="rounded-2xl py-3 text-sm font-bold active:scale-95 transition"
                    style={{ background:"linear-gradient(90deg,#e65100,#f37d01)",color:"#fff" }}>Sign up</button>
                </div>
              ) : !loading && user ? (
                <>
                  <BottomRow icon={LayoutDashboard} label="Dashboard" sublabel={user.email} onPress={() => { navigate({ to:"/dashboard" }); setMenuOpen(false); }} />
                  <BottomRow icon={Package} label="My orders" onPress={() => { navigate({ to:"/orders" }); setMenuOpen(false); }} />
                  {isAdmin && <BottomRow icon={ShieldCheck} label="Admin panel" onPress={() => { navigate({ to:"/admin/bundles" }); setMenuOpen(false); }} accent />}
                </>
              ) : null}

              <div className="mx-4 my-2 border-t border-gray-100" />
              <BottomRow icon={Lock}     label="Privacy Policy"   onPress={() => { navigate({ to:"/privacy" }); setMenuOpen(false); }} />
              <BottomRow icon={FileText} label="Terms of Service" onPress={() => { navigate({ to:"/terms" });   setMenuOpen(false); }} />

              {!loading && user && (
                <>
                  <div className="mx-4 my-2 border-t border-gray-100" />
                  <BottomRow icon={LogOut} label="Sign out" onPress={() => { signOut(); setMenuOpen(false); }} danger />
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

/* ── Small helpers ── */
function SectionLabel({ label }: { label: string }) {
  return <p className="px-3 pb-1 pt-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">{label}</p>;
}
function Divider() {
  return <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)",margin:"6px 0" }} />;
}
function SheetRow({ to, label, Icon, accent, onPress }: { to:string; label:string; Icon:React.ElementType; accent?:boolean; onPress:()=>void }) {
  const color = accent ? "#e65100" : undefined;
  return (
    <Link to={to as any} onClick={onPress}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-white/5 w-full"
      style={{ color }}>
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      {label}
      <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-30" />
    </Link>
  );
}
function BottomRow({ icon:Icon, label, sublabel, onPress, danger, accent }: { icon:React.ElementType; label:string; sublabel?:string; onPress:()=>void; danger?:boolean; accent?:boolean }) {
  const color = danger?"#ef4444":accent?"#e65100":"#111827";
  const bg    = danger?"#fef2f2":accent?"rgba(230,81,0,0.08)":"#f3f4f6";
  return (
    <button onClick={onPress} className="flex items-center gap-4 px-5 py-3 w-full text-left hover:bg-gray-50 active:bg-gray-100 active:scale-[0.99] transition-colors">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ background:bg }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        {sublabel && <span className="text-xs text-gray-400 truncate">{sublabel}</span>}
      </div>
    </button>
  );
}
