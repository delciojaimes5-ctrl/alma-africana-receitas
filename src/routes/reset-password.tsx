import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova palavra-passe · Sabores de África" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase coloca o token no hash do URL (#access_token=...&type=recovery)
    // O onAuthStateChange dispara PASSWORD_RECOVERY quando detecta.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // fallback: se já há sessão de recovery activa
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.hash.includes("type=recovery")) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Palavra-passe muito curta (mín. 6 caracteres)");
    if (password !== confirm) return toast.error("As palavras-passe não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Palavra-passe alterada com sucesso!");
    await supabase.auth.signOut();
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold mb-1">Definir nova palavra-passe</h1>
          <p className="text-sm text-muted-foreground mb-6">Escolhe uma palavra-passe forte para a tua conta.</p>
          {!ready ? (
            <div className="rounded-md bg-muted p-4 text-sm">
              A verificar o link de recuperação… Se não vieste pelo email,{" "}
              <Link to="/recuperar-conta" className="text-primary hover:underline">pede um novo link</Link>.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div><Label>Nova palavra-passe</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div><Label>Confirmar palavra-passe</Label><Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "A guardar…" : "Guardar nova palavra-passe"}</Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
