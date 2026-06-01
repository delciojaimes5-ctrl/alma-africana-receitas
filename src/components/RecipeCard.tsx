import { Link } from "@tanstack/react-router";
import { Heart, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface RecipeCardData {
  id: string;
  title: string;
  country: string;
  region: string | null;
  category: string;
  image_url: string | null;
  likes_count?: number;
  author?: { username: string; full_name: string; avatar_url: string | null } | null;
}

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Link
      to="/receita/$id"
      params={{ id: recipe.id }}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[image:var(--gradient-warm)] text-primary-foreground text-4xl font-bold">
            {recipe.title.charAt(0)}
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-accent/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
          {recipe.category}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{recipe.country}{recipe.region ? ` · ${recipe.region}` : ""}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          {recipe.author ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarImage src={recipe.author.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                  {recipe.author.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">@{recipe.author.username}</span>
            </div>
          ) : <span />}
          {typeof recipe.likes_count === "number" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />{recipe.likes_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
