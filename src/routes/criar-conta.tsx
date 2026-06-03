import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/criar-conta")({
  head: () => ({ meta: [{ title: "Criar Conta · Sabores de África" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", username: "", email: "", phone: "", birth_date: "",
    password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Palavras-passe não coincidem");
    if (form.password.length < 6) return toast.error("Palavra-passe muito curta (mín. 6)");
    if (!/^[a-z0-9_]{3,30}$/.test(form.username)) return toast.error("Username só permite letras minúsculas, números e _ (3-30)");

    setLoading(true);
    // Pre-check username availability
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", form.username).maybeSingle();
    if (existing) { setLoading(false); return toast.error("Username já em uso"); }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: form.full_name,
          username: form.username,
          phone: form.phone || null,
          birth_date: form.birth_date || null,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    // Supabase devolve sucesso silencioso para emails já registados, mas o array
    // `identities` vem vazio nesse caso. Detectamos para mostrar mensagem clara.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return toast.error("Este email já está registado. Tenta entrar ou recuperar a palavra-passe.");
    }
    toast.success("Conta criada! Verifica o teu email para confirmar antes de entrar.", { duration: 6000 });
    void navigate({ to: "/login", search: { message: "Confirma o teu email antes de entrar — verifica a tua caixa de entrada." } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold mb-1">Criar Conta</h1>
          <p className="text-sm text-muted-foreground mb-6">Junta-te à comunidade Sabores de África.</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <div><Label>Nome Completo</Label><Input required value={form.full_name} onChange={set("full_name")} /></div>
            <div><Label>Username</Label><Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="ex: maria_cozinha" /></div>
            <div><Label>Email</Label><Input type="email" required value={form.email} onChange={set("email")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={set("phone")} /></div>
              <div><Label>Data Nasc.</Label><Input type="date" value={form.birth_date} onChange={set("birth_date")} /></div>
            </div>
            <div><Label>Palavra-passe</Label><Input type="password" required value={form.password} onChange={set("password")} /></div>
            <div><Label>Confirmar palavra-passe</Label><Input type="password" required value={form.confirm} onChange={set("confirm")} /></div>
            <Button type="submit" className="w-full mt-4" disabled={loading}>{loading ? "A criar…" : "Criar Conta"}</Button>
          </form>
          <div className="mt-4 text-sm text-center text-muted-foreground">
            Já tens conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
