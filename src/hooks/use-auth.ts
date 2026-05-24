import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkAmAdmin } from "@/lib/admin.functions";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdmin = useServerFn(checkAmAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["am-admin", user?.id],
    queryFn: () => checkAdmin(),
    enabled: !!user,
    staleTime: 60_000,
  });

  return { user, loading, isAdmin: !!adminData?.isAdmin };
}
