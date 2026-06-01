import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";

export const Route = createFileRoute("/catalogo-oficial")({
  head: () => ({ meta: [{ title: "Catálogo Oficial · Sabores de África" }, { name: "description", content: "Receitas tradicionais africanas validadas pela nossa equipa." }] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["official-catalogue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, country, region, category, image_url")
        .eq("status", "approved")
        .eq("catalogue_type", "official")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-10 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Catálogo Oficial</h1>
          <p className="text-muted-foreground mt-2">Receitas tradicionais cuidadosamente selecionadas.</p>
        </header>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">A carregar…</div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Ainda sem receitas oficiais.
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
