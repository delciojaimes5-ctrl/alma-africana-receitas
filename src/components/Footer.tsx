import { ChefHat } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 mt-16">
      <div className="container mx-auto px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[image:var(--gradient-warm)] text-primary-foreground">
              <ChefHat className="h-4 w-4" />
            </div>
            <span className="font-bold">Sabores de África</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Preservamos e partilhamos as receitas tradicionais do continente africano.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Explorar</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Catálogo Oficial</li>
            <li>Comunidade</li>
            <li>Categorias</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Sobre</h4>
          <p className="text-sm text-muted-foreground">
            Uma plataforma cultural dedicada à gastronomia africana.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sabores de África · Feito com amor 🌍
      </div>
    </footer>
  );
}
