import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm }       from "react-hook-form";
import { z }             from "zod";
import { zodResolver }   from "@hookform/resolvers/zod";
import { supabase }      from "@/integrations/supabase/client";
import { lovable }       from "@/integrations/lovable";
import { Button }        from "@/components/ui/button";
import { Input }         from "@/components/ui/input";
import { Label }         from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast }         from "sonner";
import { Zap }           from "lucide-react";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1117 50%, rgba(0,102,255,0.08) 100%)" }}
    >
      {/* Aurora blobs */}
      <div className="aurora-blob pointer-events-none" style={{ width: 380, height: 380, background: "rgba(0,102,255,0.22)", top: "10%", right: "5%", position: "fixed" }} />
      <div className="aurora-blob pointer-events-none" style={{ width: 260, height: 260, background: "rgba(0,255,255,0.12)", bottom: "10%", left: "5%", animationDelay: "-9s", position: "fixed" }} />
      {/* Grid */}
      <div className="glass-grid fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      <div
        className="relative z-10 w-full max-w-sm"
        style={{ animation: "scale-in 0.55s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Glass card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background:           "rgba(13, 17, 23, 0.88)",
            backdropFilter:       "blur(32px) saturate(1.6)",
            WebkitBackdropFilter: "blur(32px) saturate(1.6)",
            border:               "1px solid rgba(0,255,255,0.12)",
            boxShadow:            "0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Electric top bar */}
          <div style={{ background: "linear-gradient(90deg, #0066ff, #00ffff)", height: "3px" }} />

          <div className="px-8 pt-8 pb-9 space-y-6">
            {/* Header */}
            <div>
              <h1
                className="text-2xl font-black text-white mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Log in
              </h1>
              <p className="text-sm text-white/45">Welcome back to Eli Data Resales</p>
            </div>

            {/* Google */}
            <button
              onClick={google}
              className="btn-ghost-glass w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs text-white/30 font-medium">or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email</Label>
                <Input
                  id="email" type="email" {...register("email")}
                  className="rounded-xl text-white placeholder:text-white/25 focus:border-cyan-500/50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff" }}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</Label>
                <Input
                  id="password" type="password" {...register("password")}
                  className="rounded-xl text-white placeholder:text-white/25"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff" }}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <button
                type="submit" disabled={busy}
                className="btn-electric sheen-btn relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 mt-2"
              >
                <Zap className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{busy ? "Logging in…" : "Log in"}</span>
              </button>
            </form>

            <div className="flex justify-between text-sm pt-1">
              <Link to="/reset-password" className="text-white/40 hover:text-white/70 transition-colors text-xs">Forgot password?</Link>
              <Link to="/signup"         className="text-xs font-semibold transition-colors" style={{ color: "#00ffff" }}>Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
