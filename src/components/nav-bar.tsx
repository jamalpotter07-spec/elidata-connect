import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-provider";

export function NavBar() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className="hidden sm:inline-block px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Bundles
          </Link>
          {!loading && user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/bundles"
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--brand-orange))] hover:bg-accent"
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
              <Button size="sm" asChild className="bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))]/90 text-white">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          ) : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
