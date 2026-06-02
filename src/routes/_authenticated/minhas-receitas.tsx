import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/minhas-receitas")({
  component: Page,
});

const STATUS_LABEL: Record<string, string> = { pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada" };
const STATUS_COLOR: Record<string, string> = { pending: "bg-accent/30 text-accent-foreground", approved: "bg-success/20 text-success", rejected: "bg-destructive/20 text-destructive" };

function Page() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-recipes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("recipes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold">Minhas Receitas</h1><p className="text-muted-foreground mt-1">Acompanha o estado das tuas receitas.</p></div>
          <Button asChild><Link to="/publicar-receita">Publicar nova</Link></Button>
        </div>
        {data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <Link to="/receita/$id" params={{ id: r.id }} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[image:var(--gradient-warm)]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.country} · {r.category}</div>
                  </div>
                </Link>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                <Button asChild size="sm" variant="outline"><Link to="/editar-receita/$id" params={{ id: r.id }}>Editar</Link></Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Ainda não publicaste nenhuma receita.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
