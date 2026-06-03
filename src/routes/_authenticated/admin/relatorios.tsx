import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: Page,
});

function Page() {
  const { data: stats } = useQuery({
    queryKey: ["admin-report-stats"],
    queryFn: async () => {
      const [recipes, users, likes, reports] = await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("recipe_likes").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
      ]);
      return {
        recipes: recipes.count ?? 0,
        users: users.count ?? 0,
        likes: likes.count ?? 0,
        reports: reports.count ?? 0,
      };
    },
  });

  const exportRecipes = async (fmt: "pdf" | "xlsx") => {
    const { data } = await supabase
      .from("recipes")
      .select("title, country, category, status, catalogue_type, created_at, user_id")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((r) => ({
      Título: r.title,
      País: r.country,
      Categoria: r.category,
      Estado: r.status,
      Catálogo: r.catalogue_type,
      Criada: new Date(r.created_at).toLocaleDateString("pt-PT"),
    }));
    if (fmt === "xlsx") return exportToExcel(rows, "receitas", "Receitas");
    exportToPDF(
      "Relatório de Receitas",
      ["Título", "País", "Categoria", "Estado", "Catálogo", "Criada"],
      rows.map((r) => [r.Título, r.País, r.Categoria, r.Estado, r.Catálogo, r.Criada]),
      "receitas",
    );
  };

  const exportUsers = async (fmt: "pdf" | "xlsx") => {
    const { data } = await supabase
      .from("profiles")
      .select("username, full_name, is_suspended, created_at")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((u) => ({
      Username: u.username,
      Nome: u.full_name,
      Estado: u.is_suspended ? "Suspenso" : "Activo",
      Registado: new Date(u.created_at).toLocaleDateString("pt-PT"),
    }));
    if (fmt === "xlsx") return exportToExcel(rows, "utilizadores", "Utilizadores");
    exportToPDF(
      "Relatório de Utilizadores",
      ["Username", "Nome", "Estado", "Registado"],
      rows.map((u) => [u.Username, u.Nome, u.Estado, u.Registado]),
      "utilizadores",
    );
  };

  const exportReports = async (fmt: "pdf" | "xlsx") => {
    const { data } = await supabase
      .from("reports")
      .select("target_type, target_id, reason, status, created_at")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((r) => ({
      Tipo: r.target_type,
      Alvo: r.target_id.slice(0, 8),
      Motivo: r.reason,
      Estado: r.status,
      Data: new Date(r.created_at).toLocaleDateString("pt-PT"),
    }));
    if (fmt === "xlsx") return exportToExcel(rows, "denuncias", "Denúncias");
    exportToPDF(
      "Relatório de Denúncias",
      ["Tipo", "Alvo", "Motivo", "Estado", "Data"],
      rows.map((r) => [r.Tipo, r.Alvo, r.Motivo, r.Estado, r.Data]),
      "denuncias",
    );
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Relatórios</h1>
      <p className="text-muted-foreground mb-6">Exporta dados da plataforma em PDF ou Excel.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Receitas" value={stats?.recipes ?? 0} />
        <Stat label="Utilizadores" value={stats?.users ?? 0} />
        <Stat label="Gostos" value={stats?.likes ?? 0} />
        <Stat label="Denúncias" value={stats?.reports ?? 0} />
      </div>

      <div className="space-y-4">
        <ReportCard title="Receitas" description="Todas as receitas com estado, país e categoria." onPdf={() => void exportRecipes("pdf")} onXlsx={() => void exportRecipes("xlsx")} />
        <ReportCard title="Utilizadores" description="Lista completa de utilizadores registados." onPdf={() => void exportUsers("pdf")} onXlsx={() => void exportUsers("xlsx")} />
        <ReportCard title="Denúncias" description="Histórico de denúncias submetidas pela comunidade." onPdf={() => void exportReports("pdf")} onXlsx={() => void exportReports("xlsx")} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function ReportCard({ title, description, onPdf, onXlsx }: { title: string; description: string; onPdf: () => void; onXlsx: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-xl border border-border bg-card">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPdf}><FileText className="h-4 w-4 mr-1" />PDF</Button>
        <Button onClick={onXlsx}><FileSpreadsheet className="h-4 w-4 mr-1" />Excel</Button>
      </div>
    </div>
  );
}
