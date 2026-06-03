import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar-conta")({
  head: () => ({ meta: [{ title: "Recuperar Conta · Sabores de África" }] }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold mb-1">Recuperar Conta</h1>
          <p className="text-sm text-muted-foreground mb-6">Enviamos-te um link para definir nova palavra-passe.</p>
          {sent ? (
            <div className="rounded-md bg-success/10 text-success-foreground p-4 text-sm border border-success/30">
              Verifica o teu email — enviámos as instruções.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "A enviar…" : "Enviar instruções"}</Button>
            </form>
          )}
          <div className="mt-4 text-sm text-center"><Link to="/login" className="text-primary hover:underline">Voltar ao login</Link></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
