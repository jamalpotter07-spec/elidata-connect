import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAmAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    try {
      const { isAdmin } = await checkAmAdmin();
      if (!isAdmin) throw redirect({ to: "/dashboard" });
    } catch (e: any) {
      if (e?.options?.to) throw e;
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
