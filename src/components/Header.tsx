import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoIts from "@/assets/logo-its.jpeg";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Quem Somos", path: "/quem-somos" },
  { label: "Cursos", path: "/cursos" },
  { label: "Núcleos", path: "/nucleos" },
  { label: "Metodologia", path: "/metodologia" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoIts} alt="Logo ITS" className="h-10 w-10 rounded-lg object-contain" />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight text-primary">ITS</span>
            <span className="text-[10px] leading-tight text-muted-foreground">Instituto Teológico Servo</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Button asChild variant="outline" className="ml-2">
            <Link to="/consulta">Consultar Inscrição</Link>
          </Button>
          <Button asChild className="ml-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link to="/inscricao">Inscreva-se</Link>
          </Button>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <nav className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                  location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild variant="outline" className="mt-2">
              <Link to="/consulta" onClick={() => setIsOpen(false)}>Consultar Inscrição</Link>
            </Button>
            <Button asChild className="mt-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/inscricao" onClick={() => setIsOpen(false)}>Inscreva-se</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
