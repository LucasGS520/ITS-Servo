import { Link } from "react-router-dom";
import logoIts from "@/assets/logo-its.jpeg";
import logoCnmcb from "@/assets/logo-cnmcb.jpeg";
import logoMinisterioFamilia from "@/assets/logo-ministerio-familia.jpeg";

const Footer = () => {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Institucional */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <img src={logoIts} alt="Logo ITS" className="h-9 w-9 rounded-lg object-contain bg-primary-foreground/20" />
              <span className="font-serif text-lg font-bold">Instituto Teológico Servo</span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Formando servos fiéis para o Reino de Deus, com ensino bíblico sólido, acessível e comprometido com a edificação da Igreja.
            </p>
          </div>

          {/* Parcerias */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider">Parcerias</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={logoMinisterioFamilia} alt="Logo Assembleia de Deus Ministério Família" className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/20 p-0.5" />
                <span className="text-sm text-primary-foreground/80">Assembleia de Deus Ministério Família</span>
              </div>
              <div className="flex items-center gap-3">
                <img src={logoCnmcb} alt="Logo CNMCB" className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/20 p-0.5" />
                <span className="text-sm text-primary-foreground/80">CNMCB — Convenção Nacional dos Ministros de Cristo do Brasil</span>
              </div>
            </div>
          </div>

          {/* Links Rápidos */}
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

          {/* Contato */}
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
