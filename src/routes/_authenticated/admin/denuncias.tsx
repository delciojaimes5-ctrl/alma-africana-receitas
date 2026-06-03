import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/denuncias")({
  component: Page,
});

type Status = "pending" | "resolved" | "dismissed";

const LABELS: Record<string, string> = {
  recipe: "Receita",
  comment: "Comentário",
  profile: "Perfil",
};

function Page() {
  const [tab, setTab] = useState<Status>("pending");
  const qc = useQueryClient();

  const { data: reports } = useQuery({
    queryKey: ["admin-reports", tab],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, target_type, target_id, reason, status, admin_notes, created_at, reporter_id")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const resolve = async (id: string, status: "resolved" | "dismissed") => {
    const { error } = await supabase
      .from("reports")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "resolved" ? "Denúncia resolvida." : "Denúncia descartada.");
    void qc.invalidateQueries({ queryKey: ["admin-reports"] });
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Denúncias</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
          <TabsTrigger value="dismissed">Descartadas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{LABELS[r.target_type] ?? r.target_type}</Badge>
                      <code className="text-xs text-muted-foreground">{r.target_id.slice(0, 8)}…</code>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-PT")}</span>
                    </div>
                    {tab === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void resolve(r.id, "resolved")}><Check className="h-4 w-4 mr-1" />Resolver</Button>
                        <Button size="sm" variant="outline" onClick={() => void resolve(r.id, "dismissed")}><X className="h-4 w-4 mr-1" />Descartar</Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{r.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Sem denúncias neste estado.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
