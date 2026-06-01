import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Heart, LogOut, Menu, Search, User as UserIcon, X, ChefHat, BookOpen, Users, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnread(count ?? 0);
    };
    void load();
    const channel = supabase.channel(`notif-${user.id}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
      () => { void load(); },
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    void router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-warm)] text-primary-foreground shadow-[var(--shadow-card)]">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Sabores de África</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/catalogo-oficial" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition" activeProps={{ className: "text-primary" }}>
            Catálogo Oficial
          </Link>
          {user && (
            <>
              <Link to="/comunidade" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition" activeProps={{ className: "text-primary" }}>
                Comunidade
              </Link>
              <Link to="/pesquisa" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition" activeProps={{ className: "text-primary" }}>
                Pesquisar
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
                <Link to="/favoritos" aria-label="Favoritos"><Heart className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="relative hidden sm:flex">
                <Link to="/notificacoes" aria-label="Notificações">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                    <Avatar className="h-9 w-9 border-2 border-accent/50">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? ""} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                        {profile?.full_name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="font-semibold">{profile?.full_name}</div>
                    <div className="text-xs text-muted-foreground">@{profile?.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil/$username" params={{ username: profile?.username ?? "" }}><UserIcon className="mr-2 h-4 w-4" />Meu Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/minhas-receitas"><BookOpen className="mr-2 h-4 w-4" />Minhas Receitas</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/publicar-receita"><PlusCircle className="mr-2 h-4 w-4" />Publicar Receita</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link to="/favoritos"><Heart className="mr-2 h-4 w-4" />Favoritos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link to="/notificacoes"><Bell className="mr-2 h-4 w-4" />Notificações {unread > 0 && `(${unread})`}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild variant="ghost"><Link to="/login">Entrar</Link></Button>
              <Button asChild><Link to="/criar-conta">Criar Conta</Link></Button>
            </div>
          )}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <Link to="/catalogo-oficial" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
              <BookOpen className="h-4 w-4" /> Catálogo Oficial
            </Link>
            {user ? (
              <>
                <Link to="/comunidade" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
                  <Users className="h-4 w-4" /> Comunidade
                </Link>
                <Link to="/pesquisa" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
                  <Search className="h-4 w-4" /> Pesquisar
                </Link>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" className="flex-1"><Link to="/login" onClick={() => setOpen(false)}>Entrar</Link></Button>
                <Button asChild className="flex-1"><Link to="/criar-conta" onClick={() => setOpen(false)}>Criar Conta</Link></Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
