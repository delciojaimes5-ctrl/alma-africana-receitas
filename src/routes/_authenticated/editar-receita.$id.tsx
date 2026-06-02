import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractYouTubeId } from "@/lib/youtube";
import { cleanText, capitalizeFirst, hasOffensiveWords } from "@/lib/recipe-utils";

export const Route = createFileRoute("/_authenticated/editar-receita/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", country: "", region: "", category: "", prep_time: "", servings: "", youtube_url: "" });
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string; unit: string }[]>([{ name: "", quantity: "", unit: "" }]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("name").order("name")).data ?? [] });
  const { data: countries } = useQuery({ queryKey: ["countries"], queryFn: async () => (await supabase.from("countries").select("name, region").order("name")).data ?? [] });

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe-edit", id],
    queryFn: async () => {
      const [{ data: r }, { data: ing }, { data: st }] = await Promise.all([
        supabase.from("recipes").select("*").eq("id", id).maybeSingle(),
        supabase.from("ingredients").select("*").eq("recipe_id", id).order("order_index"),
        supabase.from("steps").select("*").eq("recipe_id", id).order("step_number"),
      ]);
      return { r, ing: ing ?? [], st: st ?? [] };
    },
  });

  useEffect(() => {
    if (!recipe?.r) return;
    const r = recipe.r;
    setForm({
      title: r.title, description: r.description, country: r.country, region: r.region ?? "", category: r.category,
      prep_time: r.prep_time?.toString() ?? "", servings: r.servings?.toString() ?? "", youtube_url: r.youtube_url ?? "",
    });
    setCurrentImage(r.image_url);
    if (recipe.ing.length) setIngredients(recipe.ing.map((i) => ({ name: i.name, quantity: i.quantity ?? "", unit: i.unit ?? "" })));
    if (recipe.st.length) setSteps(recipe.st.map((s) => s.description));
  }, [recipe]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">A carregar…</div>;
  if (!recipe?.r) return <div className="min-h-screen"><Navbar /><div className="container mx-auto p-12 text-center">Receita não encontrada.</div></div>;
  if (recipe.r.user_id !== user?.id && !isAdmin) return <div className="min-h-screen"><Navbar /><div className="container mx-auto p-12 text-center">Sem permissão.</div></div>;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = capitalizeFirst(form.title);
    const desc = cleanText(form.description);
    if (hasOffensiveWords(title) || hasOffensiveWords(desc)) return toast.error("Texto contém palavras ofensivas.");
    const videoId = form.youtube_url ? extractYouTubeId(form.youtube_url) : null;
    if (form.youtube_url && !videoId) return toast.error("URL do YouTube inválido.");

    const cleanIngredients = ingredients.filter((i) => i.name.trim());
    const cleanSteps = steps.map(cleanText).filter(Boolean);
    if (cleanIngredients.length === 0) return toast.error("Adiciona pelo menos um ingrediente.");
    if (cleanSteps.length === 0) return toast.error("Adiciona pelo menos um passo.");

    setLoading(true);
    let imageUrl: string | null = currentImage;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("recipe-images").upload(path, imageFile);
      if (upErr) { setLoading(false); return toast.error("Erro ao enviar imagem"); }
      imageUrl = supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
    }

    const region = countries?.find((c) => c.name === form.country)?.region ?? null;
    const newStatus = isAdmin && recipe?.r && recipe.r.user_id !== user?.id ? recipe.r.status : "pending";
    const { error } = await supabase.from("recipes").update({
      title, description: desc, country: form.country, region, category: form.category,
      prep_time: form.prep_time ? parseInt(form.prep_time) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      youtube_url: form.youtube_url || null, youtube_video_id: videoId,
      image_url: imageUrl, status: newStatus,
    }).eq("id", id);

    if (error) { setLoading(false); return toast.error(error.message); }

    await Promise.all([
      supabase.from("ingredients").delete().eq("recipe_id", id),
      supabase.from("steps").delete().eq("recipe_id", id),
    ]);
    await Promise.all([
      supabase.from("ingredients").insert(cleanIngredients.map((i, idx) => ({
        recipe_id: id, name: capitalizeFirst(i.name), quantity: i.quantity || null, unit: i.unit || null, order_index: idx,
      }))),
      supabase.from("steps").insert(cleanSteps.map((s, idx) => ({
        recipe_id: id, step_number: idx + 1, description: capitalizeFirst(s),
      }))),
    ]);

    setLoading(false);
    toast.success("Receita atualizada!");
    void navigate({ to: "/minhas-receitas" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Editar Receita</h1>
        <p className="text-muted-foreground mb-8">Ao guardar, a receita volta para revisão.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div><Label>Título</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>País</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>{countries?.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>{categories?.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tempo (min)</Label><Input type="number" value={form.prep_time} onChange={(e) => setForm({ ...form, prep_time: e.target.value })} /></div>
            <div><Label>Doses</Label><Input type="number" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} /></div>
          </div>
          <div><Label>URL YouTube</Label><Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} /></div>
          <div>
            <Label>Foto da receita</Label>
            {currentImage && <img src={currentImage} alt="" className="h-32 rounded-lg mt-2 mb-2 object-cover" />}
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label>Ingredientes</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setIngredients([...ingredients, { name: "", quantity: "", unit: "" }])}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_auto] gap-2">
                  <Input placeholder="Ingrediente" value={ing.name} onChange={(e) => { const c = [...ingredients]; c[i].name = e.target.value; setIngredients(c); }} />
                  <Input placeholder="Qtd" value={ing.quantity} onChange={(e) => { const c = [...ingredients]; c[i].quantity = e.target.value; setIngredients(c); }} />
                  <Input placeholder="Unid" value={ing.unit} onChange={(e) => { const c = [...ingredients]; c[i].unit = e.target.value; setIngredients(c); }} />
                  <Button type="button" size="icon" variant="ghost" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label>Passos</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setSteps([...steps, ""])}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">{i + 1}</span>
                  <Textarea value={s} onChange={(e) => { const c = [...steps]; c[i] = e.target.value; setSteps(c); }} rows={2} />
                  <Button type="button" size="icon" variant="ghost" onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "A guardar…" : "Guardar alterações"}</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
