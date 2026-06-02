import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldCheck, ShieldOff, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/utilizadores")({
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id, username, full_name, avatar_url, is_suspended, created_at").order("created_at", { ascending: false }).limit(100);
      if (q.length >= 2) query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return data ?? [];
    },
  });

  const isAdmin = (uid: string) => roles?.some((r) => r.user_id === uid && r.role === "admin") ?? false;

  const toggleSuspend = async (uid: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_suspended: !current }).eq("id", uid);
    if (error) return toast.error(error.message);
    toast.success(current ? "Utilizador reativado." : "Utilizador suspenso.");
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const toggleAdmin = async (uid: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Privilégios de admin removidos.");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Utilizador promovido a admin.");
    }
    void qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Utilizadores</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar por nome ou username…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="space-y-2">
        {users?.map((u) => {
          const admin = isAdmin(u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.avatar_url ?? undefined} />
                <AvatarFallback>{u.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-2">
                  {u.full_name}
                  {admin && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">ADMIN</span>}
                  {u.is_suspended && <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">SUSPENSO</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void toggleAdmin(u.id, admin)}>
                {admin ? <><ShieldOff className="h-4 w-4 mr-1" />Remover admin</> : <><ShieldCheck className="h-4 w-4 mr-1" />Tornar admin</>}
              </Button>
              <Button size="sm" variant={u.is_suspended ? "default" : "destructive"} onClick={() => void toggleSuspend(u.id, u.is_suspended)}>
                {u.is_suspended ? <><UserCheck className="h-4 w-4 mr-1" />Reativar</> : <><UserX className="h-4 w-4 mr-1" />Suspender</>}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
