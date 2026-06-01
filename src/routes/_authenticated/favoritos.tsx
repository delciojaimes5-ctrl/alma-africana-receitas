import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";

export const Route = createFileRoute("/_authenticated/favoritos")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["favourites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favourites").select("recipe:recipe_id(id, title, country, region, category, image_url)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []).map((f) => f.recipe).filter(Boolean) as Array<{ id: string; title: string; country: string; region: string | null; category: string; image_url: string | null }>;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1">
        <h1 className="text-3xl font-bold mb-2">Favoritos</h1>
        <p className="text-muted-foreground mb-8">Receitas que guardaste.</p>
        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Ainda não tens favoritos.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
