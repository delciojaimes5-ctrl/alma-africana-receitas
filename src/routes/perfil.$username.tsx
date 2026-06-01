import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/perfil/$username")({
  component: Page,
});

function Page() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      return data;
    },
  });

  const { data: recipes } = useQuery({
    queryKey: ["profile-recipes", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes").select("id, title, country, region, category, image_url")
        .eq("user_id", profile!.id).eq("status", "approved").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profileLikes } = useQuery({
    queryKey: ["profile-likes", profile?.id, user?.id ?? "anon"],
    enabled: !!profile,
    queryFn: async () => {
      const [{ count }, mine] = await Promise.all([
        supabase.from("profile_likes").select("id", { count: "exact", head: true }).eq("liked_user_id", profile!.id),
        user ? supabase.from("profile_likes").select("id").eq("liked_user_id", profile!.id).eq("liker_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return { count: count ?? 0, liked: !!mine.data };
    },
  });

  if (!profile) return <div className="min-h-screen"><Navbar /><div className="container mx-auto px-4 py-12 text-center">Utilizador não encontrado.</div></div>;

  const isOwn = user?.id === profile.id;

  const toggleProfileLike = async () => {
    if (!user || isOwn) return;
    if (profileLikes?.liked) {
      await supabase.from("profile_likes").delete().eq("liked_user_id", profile.id).eq("liker_id", user.id);
    } else {
      const { error } = await supabase.from("profile_likes").insert({ liked_user_id: profile.id, liker_id: user.id });
      if (error) return toast.error(error.message);
    }
    void qc.invalidateQueries({ queryKey: ["profile-likes", profile.id] });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] mb-8">
          <Avatar className="h-24 w-24 border-4 border-accent/40">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">{profile.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <div className="text-muted-foreground">@{profile.username}</div>
            {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            <div className="flex gap-6 mt-4 justify-center sm:justify-start text-sm">
              <div><strong className="text-lg">{recipes?.length ?? 0}</strong> <span className="text-muted-foreground">receitas</span></div>
              <div><strong className="text-lg">{profileLikes?.count ?? 0}</strong> <span className="text-muted-foreground">gostos no perfil</span></div>
            </div>
          </div>
          {user && !isOwn && (
            <Button onClick={toggleProfileLike} variant={profileLikes?.liked ? "default" : "outline"}>
              <Heart className={`h-4 w-4 mr-1 ${profileLikes?.liked ? "fill-current" : ""}`} />
              {profileLikes?.liked ? "Gostas" : "Gostar"}
            </Button>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4">Receitas publicadas</h2>
        {recipes && recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Sem receitas publicadas ainda.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
