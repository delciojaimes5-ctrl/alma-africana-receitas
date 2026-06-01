import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/perfil/editar")({
  component: Page,
});

function Page() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", bio: "", avatar_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name, bio: profile.bio ?? "", avatar_url: profile.avatar_url ?? "" });
  }, [profile]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    let avatar = form.avatar_url;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) { setLoading(false); return toast.error(error.message); }
      avatar = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("profiles").update({ full_name: form.full_name, bio: form.bio, avatar_url: avatar }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Perfil atualizado!");
    void navigate({ to: "/perfil/$username", params: { username: profile?.username ?? "" } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-xl">
        <h1 className="text-3xl font-bold mb-6">Editar Perfil</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><Label>Nome Completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} /></div>
          <div><Label>Avatar</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <Button type="submit" disabled={loading}>{loading ? "A guardar…" : "Guardar"}</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
