import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/catalogo")({
  component: Page,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Page() {
  const qc = useQueryClient();
  const [newCat, setNewCat] = useState("");
  const [newCountry, setNewCountry] = useState({ name: "", region: "" });

  const { data: categories } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [] });
  const { data: countries } = useQuery({ queryKey: ["admin-countries"], queryFn: async () => (await supabase.from("countries").select("*").order("name")).data ?? [] });

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCat.trim(), slug: slugify(newCat) });
    if (error) return toast.error(error.message);
    setNewCat(""); toast.success("Categoria criada.");
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };
  const delCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };
  const addCountry = async () => {
    if (!newCountry.name.trim() || !newCountry.region.trim()) return;
    const { error } = await supabase.from("countries").insert(newCountry);
    if (error) return toast.error(error.message);
    setNewCountry({ name: "", region: "" }); toast.success("País criado.");
    void qc.invalidateQueries({ queryKey: ["admin-countries"] });
  };
  const delCountry = async (id: string) => {
    const { error } = await supabase.from("countries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["admin-countries"] });
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Categorias & Países</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-semibold mb-3">Categorias</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nova categoria" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <Button onClick={addCategory}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {categories?.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded border border-border bg-card text-sm">
                <span>{c.name}</span>
                <Button size="icon" variant="ghost" onClick={() => void delCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-semibold mb-3">Países</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nome" value={newCountry.name} onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })} />
            <Input placeholder="Região" value={newCountry.region} onChange={(e) => setNewCountry({ ...newCountry, region: e.target.value })} />
            <Button onClick={addCountry}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {countries?.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded border border-border bg-card text-sm">
                <span>{c.name} <span className="text-muted-foreground text-xs">· {c.region}</span></span>
                <Button size="icon" variant="ghost" onClick={() => void delCountry(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
