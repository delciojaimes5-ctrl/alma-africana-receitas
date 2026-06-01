import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ message: z.string().optional(), redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar · Sabores de África" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    void navigate({ to: search.redirect ?? "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-6">Acede à comunidade Sabores de África.</p>
          {search.message && <div className="mb-4 rounded-md bg-accent/30 p-3 text-sm">{search.message}</div>}
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="password">Palavra-passe</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "A entrar…" : "Entrar"}</Button>
          </form>
          <div className="mt-4 text-sm text-center space-y-2">
            <Link to="/recuperar-conta" className="text-primary hover:underline">Esqueceste a palavra-passe?</Link>
            <div className="text-muted-foreground">Ainda não tens conta? <Link to="/criar-conta" className="text-primary font-medium hover:underline">Criar Conta</Link></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
