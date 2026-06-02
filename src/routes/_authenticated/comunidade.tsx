import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";

export const Route = createFileRoute("/_authenticated/comunidade")({
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["community"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, country, region, category, image_url, profiles:user_id(username, full_name, avatar_url)")
        .eq("status", "approved")
        .eq("catalogue_type", "community")
        .order("created_at", { ascending: false });
      return (data ?? []).map((r) => ({ ...r, author: (r.profiles as unknown) as { username: string; full_name: string; avatar_url: string | null } | null }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-10 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Comunidade</h1>
          <p className="text-muted-foreground mt-2">Receitas partilhadas pela nossa comunidade.</p>
        </header>
        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Ainda sem receitas da comunidade. Sê o primeiro a publicar!
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
