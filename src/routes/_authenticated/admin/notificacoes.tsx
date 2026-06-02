import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: Page,
});

function Page() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const broadcast = async () => {
    if (!title.trim() || !message.trim()) return toast.error("Título e mensagem obrigatórios.");
    setSending(true);
    const { data: users } = await supabase.from("profiles").select("id");
    if (!users || users.length === 0) { setSending(false); return toast.error("Sem utilizadores."); }
    const rows = users.map((u) => ({ user_id: u.id, type: "admin_broadcast", title: title.trim(), message: message.trim() }));
    // chunk to avoid payload limits
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from("notifications").insert(rows.slice(i, i + 500));
      if (error) { setSending(false); return toast.error(error.message); }
    }
    setSending(false);
    setTitle(""); setMessage("");
    toast.success(`Notificação enviada a ${users.length} utilizadores.`);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Enviar Notificação</h1>
      <p className="text-muted-foreground mb-6">Envia uma notificação a todos os utilizadores da plataforma.</p>
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Nova funcionalidade disponível" /></div>
        <div><Label>Mensagem</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} /></div>
        <Button onClick={broadcast} disabled={sending} className="w-full"><Send className="h-4 w-4 mr-2" />{sending ? "A enviar…" : "Enviar a todos"}</Button>
      </div>
    </div>
  );
}
