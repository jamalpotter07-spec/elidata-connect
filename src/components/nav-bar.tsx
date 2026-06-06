import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, User as UserIcon, LogOut, LayoutDashboard, Menu, Shield, RefreshCw, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-provider";

const infoSlides = [
  { icon: Wallet, title: "Eli Data Resales", body: "Fast MTN, Telecel and AT bundles at reseller rates." },
  { icon: RefreshCw, title: "Tracked orders", body: "Every purchase gets live status and cleaner follow-up." },
  { icon: Shield, title: "Refund support", body: "Failed deliveries are reviewed and refunded professionally." },
];

function NavTab({ to, label }: { to: "/" | "/about" | "/dashboard"; label: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      className={`relative rounded-md px-3 py-2 text-sm transition ${
        active ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`pointer-events-none absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-[hsl(var(--brand-navy-2))] to-[hsl(var(--brand-orange))] transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
}

export function NavBar() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <Link to="/" className="shrink-0 flex items-center">
            <Logo />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex">
            <NavTab to="/" label="Bundles" />
            <NavTab to="/about" label="About" />

            {!loading && user ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground lg:flex"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/bundles"
                    className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft hover:text-foreground"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><UserIcon className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled className="text-xs">{user.email}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>My orders</DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin/bundles" })}>
                        Manage prices
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !loading ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            ) : null}
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm">
                <div className="mt-8 flex flex-col gap-2">
                  <Link to="/" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent">
                    Bundles
                  </Link>
                  <Link to="/about" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent">
                    About
                  </Link>
                  {!loading && user ? (
                    <>
                      <Link to="/dashboard" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent">
                        Dashboard
                      </Link>
                      <Link to="/orders" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent">
                        My orders
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/bundles" className="rounded-md px-3 py-3 text-sm font-medium text-brand hover:bg-brand-soft">
                          Admin
                        </Link>
                      )}
                      <Button variant="ghost" className="justify-start px-3" onClick={signOut}>
                        <LogOut className="h-4 w-4" /> Sign out
                      </Button>
                    </>
                  ) : !loading ? (
                    <>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/login">Log in</Link>
                      </Button>
                      <Button className="justify-start bg-brand text-brand-foreground hover:bg-brand/90" asChild>
                        <Link to="/signup">Sign up</Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <InfoStrip />

      </div>
    </header>
  );
}

function InfoStrip() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % infoSlides.length), 4500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative h-12 overflow-hidden border-t border-brand-line/60">
      {infoSlides.map((slide, i) => {
        const Icon = slide.icon;
        const active = i === idx;
        return (
          <div
            key={slide.title}
            aria-hidden={!active}
            className={`absolute inset-0 flex items-center gap-3 px-1 transition-all duration-500 ease-out ${
              active ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{slide.title}</div>
              <div className="truncate text-xs text-muted-foreground">{slide.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
