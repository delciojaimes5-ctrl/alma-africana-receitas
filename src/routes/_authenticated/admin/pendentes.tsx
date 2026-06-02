import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/pendentes")({
  component: Page,
});

type Status = "pending" | "approved" | "rejected";

function Page() {
  const [tab, setTab] = useState<Status>("pending");
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<{ id: string; title: string } | null>(null);
  const [reason, setReason] = useState("");

  const { data: recipes } = useQuery({
    queryKey: ["admin-recipes", tab],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, country, category, image_url, created_at, user_id, profiles:user_id(username, full_name)")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: Status, rejection_reason?: string) => {
    const { error } = await supabase.from("recipes").update({ status, rejection_reason: rejection_reason ?? null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Receita aprovada!" : status === "rejected" ? "Receita rejeitada." : "Estado atualizado.");
    void qc.invalidateQueries({ queryKey: ["admin-recipes"] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Gestão de Receitas</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {recipes && recipes.length > 0 ? (
            <div className="space-y-3">
              {recipes.map((r) => {
                const author = (r.profiles as unknown) as { username: string; full_name: string } | null;
                return (
                  <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[image:var(--gradient-warm)]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.country} · {r.category} · por @{author?.username ?? "?"}</div>
                    </div>
                    <Button asChild variant="ghost" size="icon"><Link to="/receita/$id" params={{ id: r.id }} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>
                    {tab !== "approved" && <Button size="sm" onClick={() => void setStatus(r.id, "approved")}><Check className="h-4 w-4 mr-1" />Aprovar</Button>}
                    {tab !== "rejected" && <Button size="sm" variant="destructive" onClick={() => { setRejecting({ id: r.id, title: r.title }); setReason(""); }}><X className="h-4 w-4 mr-1" />Rejeitar</Button>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Sem receitas neste estado.</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar receita</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">A rejeitar: <strong>{rejecting?.title}</strong></p>
          <Textarea placeholder="Motivo da rejeição (visível ao autor)" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (rejecting) { void setStatus(rejecting.id, "rejected", reason || undefined); setRejecting(null); } }}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
