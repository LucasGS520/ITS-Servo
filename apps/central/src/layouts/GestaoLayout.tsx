import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/common/ui/button";
import { BarChart3, BookOpen, DollarSign, Headphones, Landmark, LayoutDashboard, LogOut } from "lucide-react";
import { sairDaGestao } from "@/modules/acesso";

const navItems = [
  { to: "/painel", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/painel/atendimento", label: "Atendimento", icon: Headphones, end: false },
  { to: "/painel/financeiro", label: "Financeiro", icon: DollarSign, end: false },
  { to: "/painel/instituto", label: "Instituto", icon: Landmark, end: false },
  { to: "/painel/relatorios", label: "Relatórios", icon: BarChart3, end: false },
];

const GestaoLayout = () => {
  const navigate = useNavigate();
  const handleLogout = async () => { await sairDaGestao(); navigate("/painel/login"); };
  return <div className="flex min-h-screen flex-col bg-muted/30">
    <header className="sticky top-0 z-40 border-b bg-card shadow-sm"><div className="container flex min-h-14 items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"><BookOpen className="h-4 w-4 text-primary-foreground" /></div><div className="hidden sm:block"><p className="text-sm font-bold leading-none text-foreground">ITS Servo</p><p className="text-[10px] leading-none text-muted-foreground">Painel Operacional</p></div></div>
      <nav aria-label="Navegação da gestão" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 sm:justify-center">{navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} aria-label={label} className={({ isActive }) => `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}><Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span></NavLink>)}</nav>
      <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair do painel" className="text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /><span className="ml-1.5 hidden sm:inline">Sair</span></Button>
    </div></header>
    <main className="flex-1"><Outlet /></main>
  </div>;
};

export default GestaoLayout;
