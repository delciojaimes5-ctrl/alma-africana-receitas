import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Clock, Users, FolderTree, Bell, ArrowLeft, Flag, FileBarChart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pendentes", label: "Receitas pendentes", icon: Clock },
  { to: "/admin/denuncias", label: "Denúncias", icon: Flag },
  { to: "/admin/utilizadores", label: "Utilizadores", icon: Users },
  { to: "/admin/catalogo", label: "Categorias & Países", icon: FolderTree },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
];

function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">A carregar…</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-60 shrink-0 bg-card border-r border-border min-h-screen p-4 hidden md:block">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2">Administração</div>
        <nav className="space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b border-border bg-card p-3 flex gap-2 overflow-x-auto">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`shrink-0 px-3 py-1.5 rounded-md text-xs ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="p-6 md:p-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
