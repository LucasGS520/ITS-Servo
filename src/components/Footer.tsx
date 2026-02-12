import { Link } from "react-router-dom";
import logoIts from "@/assets/logo-its.jpeg";

const Footer = () => {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Institutional */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src={logoIts} alt="Logo ITS" className="h-9 w-9 rounded-lg object-contain bg-primary-foreground/20" />
              <span className="font-serif text-lg font-bold">ITS</span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Instituto Teológico Servo — Formando servos fiéis para o Reino de Deus, com ensino bíblico sólido e acessível.
            </p>
            <p className="mt-3 text-sm text-primary-foreground/70">
              Mantido pela Assembleia de Deus — Ministério Família
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Início", path: "/" },
                { label: "Quem Somos", path: "/quem-somos" },
                { label: "Cursos", path: "/cursos" },
                { label: "Núcleos", path: "/nucleos" },
                { label: "Metodologia", path: "/metodologia" },
                { label: "Inscrição", path: "/inscricao" },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider">Contato</h3>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <p>WhatsApp: (11) 99999-0000</p>
              <p>Email: contato@its.edu.br</p>
              <p>São Paulo — SP, Brasil</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Instituto Teológico Servo. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
