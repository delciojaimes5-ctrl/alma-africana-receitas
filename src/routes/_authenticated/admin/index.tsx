import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, BookOpen, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pending, approved, users, likes] = await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("recipe_likes").select("id", { count: "exact", head: true }),
      ]);
      return { pending: pending.count ?? 0, approved: approved.count ?? 0, users: users.count ?? 0, likes: likes.count ?? 0 };
    },
  });

  const cards = [
    { label: "Receitas pendentes", value: data?.pending ?? 0, icon: Clock, to: "/admin/pendentes", color: "text-amber-600" },
    { label: "Receitas aprovadas", value: data?.approved ?? 0, icon: BookOpen, to: "/admin/catalogo", color: "text-emerald-600" },
    { label: "Utilizadores", value: data?.users ?? 0, icon: Users, to: "/admin/utilizadores", color: "text-blue-600" },
    { label: "Gostos totais", value: data?.likes ?? 0, icon: Heart, to: "/admin/pendentes", color: "text-rose-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-1">Painel de Administração</h1>
      <p className="text-muted-foreground mb-8">Visão geral da plataforma.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition">
            <c.icon className={`h-5 w-5 mb-3 ${c.color}`} />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
