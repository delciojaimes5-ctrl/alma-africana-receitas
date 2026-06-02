import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, BookmarkPlus, MapPin, Clock, Users as UsersIcon, ChefHat, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/receita/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*, profiles:user_id(username, full_name, avatar_url)")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: ingredients } = useQuery({
    queryKey: ["ingredients", id],
    queryFn: async () => {
      const { data } = await supabase.from("ingredients").select("*").eq("recipe_id", id).order("order_index");
      return data ?? [];
    },
  });

  const { data: steps } = useQuery({
    queryKey: ["steps", id],
    queryFn: async () => {
      const { data } = await supabase.from("steps").select("*").eq("recipe_id", id).order("step_number");
      return data ?? [];
    },
  });

  const { data: likes } = useQuery({
    queryKey: ["recipe-likes", id, user?.id ?? "anon"],
    queryFn: async () => {
      const [{ count }, mine] = await Promise.all([
        supabase.from("recipe_likes").select("id", { count: "exact", head: true }).eq("recipe_id", id),
        user ? supabase.from("recipe_likes").select("id").eq("recipe_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return { count: count ?? 0, liked: !!mine.data };
    },
  });

  const { data: favourited } = useQuery({
    queryKey: ["favourite", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("favourites").select("id").eq("recipe_id", id).eq("user_id", user.id).maybeSingle();
      return !!data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, profiles:user_id(username, full_name, avatar_url)")
        .eq("recipe_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) return <div className="min-h-screen"><Navbar /><div className="container mx-auto px-4 py-12 text-center text-muted-foreground">A carregar…</div></div>;
  if (!recipe) return <div className="min-h-screen"><Navbar /><div className="container mx-auto px-4 py-12 text-center">Receita não encontrada.</div></div>;

  const isOwn = user?.id === recipe.user_id;

  const toggleLike = async () => {
    if (!user) return void navigate({ to: "/login" });
    if (isOwn) return toast.error("Não podes dar gosto à tua própria receita.");
    if (likes?.liked) {
      await supabase.from("recipe_likes").delete().eq("recipe_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("recipe_likes").insert({ recipe_id: id, user_id: user.id });
    }
    void qc.invalidateQueries({ queryKey: ["recipe-likes", id] });
  };

  const toggleFav = async () => {
    if (!user) return void navigate({ to: "/login" });
    if (favourited) {
      await supabase.from("favourites").delete().eq("recipe_id", id).eq("user_id", user.id);
      toast.success("Removido dos favoritos");
    } else {
      await supabase.from("favourites").insert({ recipe_id: id, user_id: user.id });
      toast.success("Adicionado aos favoritos");
    }
    void qc.invalidateQueries({ queryKey: ["favourite", id, user.id] });
  };

  const submitComment = async () => {
    if (!user) return void navigate({ to: "/login" });
    const text = comment.trim();
    if (!text) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({ recipe_id: id, user_id: user.id, content: text });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setComment("");
    void qc.invalidateQueries({ queryKey: ["comments", id] });
  };

  const author = (recipe.profiles as unknown) as { username: string; full_name: string; avatar_url: string | null } | null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <article className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted mb-6 shadow-[var(--shadow-card)]">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[image:var(--gradient-warm)] flex items-center justify-center text-primary-foreground text-6xl font-bold">
              {recipe.title.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">{recipe.category}</span>
          <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{recipe.country}{recipe.region ? ` · ${recipe.region}` : ""}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">{recipe.title}</h1>
        <p className="text-muted-foreground mb-6">{recipe.description}</p>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border mb-6">
          <div className="flex items-center gap-4 text-sm">
            {recipe.prep_time && <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" />{recipe.prep_time} min</span>}
            {recipe.servings && <span className="flex items-center gap-1"><UsersIcon className="h-4 w-4 text-primary" />{recipe.servings} pessoas</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={likes?.liked ? "default" : "outline"} onClick={toggleLike} disabled={isOwn} title={isOwn ? "Não podes dar gosto à tua receita" : ""}>
              <Heart className={`h-4 w-4 mr-1 ${likes?.liked ? "fill-current" : ""}`} />{likes?.count ?? 0}
            </Button>
            <Button size="sm" variant={favourited ? "default" : "outline"} onClick={toggleFav}>
              <BookmarkPlus className="h-4 w-4 mr-1" />{favourited ? "Guardado" : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Author */}
        {author && (
          <Link to="/perfil/$username" params={{ username: author.username }} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border mb-8 hover:border-primary transition">
            <Avatar className="h-12 w-12 border-2 border-accent/50">
              <AvatarImage src={author.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">{author.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{author.full_name}</div>
              <div className="text-sm text-muted-foreground">@{author.username}</div>
            </div>
          </Link>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ChefHat className="h-5 w-5 text-primary" />Ingredientes</h2>
            <ul className="space-y-2">
              {ingredients?.map((ing) => (
                <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  <span><strong>{ing.quantity ?? ""} {ing.unit ?? ""}</strong> {ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Preparação</h2>
            <ol className="space-y-4">
              {steps?.map((s) => (
                <li key={s.id} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{s.step_number}</span>
                  <p className="text-sm pt-1">{s.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {recipe.youtube_video_id && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Vídeo</h2>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${recipe.youtube_video_id}`}
                title="Vídeo da receita"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {/* Comments */}
        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Comentários ({comments?.length ?? 0})</h2>
          {user ? (
            <div className="mb-6 space-y-2">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Partilha a tua opinião…" maxLength={1000} rows={3} />
              <div className="flex justify-end">
                <Button onClick={submitComment} disabled={submitting || !comment.trim()}>Publicar</Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg bg-muted p-4 text-sm text-center">
              <Link to="/login" className="text-primary font-medium hover:underline">Inicia sessão</Link> para comentar e dar gosto.
            </div>
          )}
          <div className="space-y-4">
            {comments?.map((c) => {
              const p = (c.profiles as unknown) as { username: string; full_name: string; avatar_url: string | null } | null;
              return (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{p?.full_name.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg bg-card border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1">@{p?.username}</div>
                    <p className="text-sm">{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </article>
      <Footer />
    </div>
  );
}
