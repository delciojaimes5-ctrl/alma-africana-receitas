import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Target = "recipe" | "comment" | "profile";

interface Props {
  targetType: Target;
  targetId: string;
  label?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon";
}

export function ReportButton({ targetType, targetId, label = "Denunciar", variant = "ghost", size = "sm" }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (reason.trim().length < 5) return toast.error("Descreve melhor o motivo (mín. 5 caracteres)");
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.");
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4 mr-1" />{size !== "icon" && label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Denunciar conteúdo</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">A tua denúncia será analisada pelos administradores. Descreve o motivo:</p>
        <Textarea rows={4} placeholder="Ex: conteúdo ofensivo, spam, informação incorrecta…" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={submit} disabled={loading}>{loading ? "A enviar…" : "Enviar denúncia"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
