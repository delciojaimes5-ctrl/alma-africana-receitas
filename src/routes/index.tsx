import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChefHat, Globe2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sabores de África · Receitas tradicionais africanas" },
      { name: "description", content: "Plataforma cultural de gastronomia africana. Descobre e partilha receitas tradicionais do continente." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured-recipes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, country, region, category, image_url")
        .eq("status", "approved")
        .eq("catalogue_type", "official")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-95" />
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur mb-6">
            <ChefHat className="h-3.5 w-3.5" /> Gastronomia cultural africana
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Os sabores de África <span className="text-accent">numa só mesa</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Preserva e descobre as receitas tradicionais que atravessam gerações.
            Partilha as tuas, inspira-te com as de outros.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/catalogo-oficial">Ver Catálogo Oficial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-primary-foreground border-white/30 hover:bg-white/20">
              <Link to="/criar-conta">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Receitas em destaque</h2>
            <p className="text-muted-foreground mt-1">Do nosso catálogo oficial</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex">
            <Link to="/catalogo-oficial">Ver tudo <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Ainda sem receitas no catálogo oficial. Volta em breve!
          </div>
        )}
      </section>

      {/* About */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          {[
            { icon: Globe2, title: "Diversidade cultural", text: "Receitas de mais de 50 países, regiões e tradições do continente." },
            { icon: ChefHat, title: "Curadoria oficial", text: "Cada receita do catálogo oficial é validada pela nossa equipa." },
            { icon: Users, title: "Comunidade ativa", text: "Partilha as tuas receitas, comenta e descobre novos cozinheiros." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center md:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
