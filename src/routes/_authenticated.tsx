import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { message: "Precisas de uma conta para aceder à comunidade." } });
    } else {
      setChecked(true);
    }
  }, [user, loading, navigate]);

  if (loading || !checked) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">A carregar…</div>;
  }
  return <Outlet />;
}
