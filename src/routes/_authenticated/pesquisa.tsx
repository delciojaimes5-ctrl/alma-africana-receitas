import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/pesquisa")({
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");

  const { data: recipes } = useQuery({
    queryKey: ["search-recipes", q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, country, region, category, image_url")
        .eq("status", "approved")
        .or(`title.ilike.%${q}%,country.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(30);
      return data ?? [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["search-users", q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(30);
      if (!profs) return [];
      const ids = profs.map((p) => p.id);
      const { data: counts } = await supabase.from("recipes").select("user_id").in("user_id", ids).eq("status", "approved");
      const countMap = new Map<string, number>();
      for (const c of counts ?? []) countMap.set(c.user_id, (countMap.get(c.user_id) ?? 0) + 1);
      return profs.map((p) => ({ ...p, recipe_count: countMap.get(p.id) ?? 0 }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-10 flex-1 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Pesquisar</h1>
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisa receitas ou utilizadores…" className="pl-10 h-12 text-base" />
        </div>
        <Tabs defaultValue="recipes">
          <TabsList className="mb-6">
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
          </TabsList>
          <TabsContent value="recipes">
            {q.length < 2 ? (
              <p className="text-muted-foreground text-center py-8">Escreve pelo menos 2 letras para pesquisar.</p>
            ) : recipes && recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem resultados.</p>
            )}
          </TabsContent>
          <TabsContent value="users">
            {q.length < 2 ? (
              <p className="text-muted-foreground text-center py-8">Escreve pelo menos 2 letras para pesquisar.</p>
            ) : users && users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => (
                  <Link key={u.id} to="/perfil/$username" params={{ username: u.username }} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary transition">
                    <Avatar className="h-12 w-12 border-2 border-accent/50">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">{u.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{u.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{u.recipe_count} receitas</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem resultados.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
