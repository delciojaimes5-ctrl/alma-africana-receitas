import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    void supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
      .then(() => qc.invalidateQueries({ queryKey: ["notifications", user.id] }));
  }, [user, qc]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Bell className="h-6 w-6 text-primary" />Notificações</h1>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((n) => (
              <div key={n.id} className={`p-4 rounded-xl border ${n.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
                <div className="font-semibold">{n.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                {n.link && <Link to={n.link as string} className="text-sm text-primary hover:underline mt-2 inline-block">Abrir →</Link>}
                <div className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString("pt-PT")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Sem notificações.</div>
        )}
      </main>
      <Footer />
    </div>
  );
}
