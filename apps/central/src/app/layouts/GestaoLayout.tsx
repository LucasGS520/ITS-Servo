import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, DollarSign, LogOut, BookOpen, ExternalLink } from "lucide-react";
import { sairDaGestao } from "@/features/autenticacao";
import { SITE_URL } from "@/shared/constants/urls";

const navItems = [
  { to: "/painel", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/painel/inscricoes", label: "Inscrições", icon: FileText, end: false },
  { to: "/painel/financeiro", label: "Financeiro", icon: DollarSign, end: false },
];

const GestaoLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await sairDaGestao();
    navigate("/painel/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          {/* Identidade */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none text-foreground">ITS Servo</p>
              <p className="text-[10px] leading-none text-muted-foreground">Painel Operacional</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer" title="Abrir o site institucional">
                <ExternalLink className="h-4 w-4" />
                <span className="ml-1.5 hidden lg:inline">Site</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo da página */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default GestaoLayout;
