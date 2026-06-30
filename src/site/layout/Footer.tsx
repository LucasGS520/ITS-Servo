import { Link } from "react-router-dom";
import logoIts from "@/assets/logo-its.jpeg";
import logoCnmcb from "@/assets/logo-cnmcb.jpeg";
import logoMinisterioFamilia from "@/assets/logo-ministerio-familia.jpeg";

/**
 * Footer do site com informações institucionais, parcerias e links rápidos.
 * 
 * Componente que exibe:
 * - Seção Institucional: Logotipo e apresentação do Instituto Teológico Servo
 * - Seção Parcerias: Logos e nomes dos parceiros institucionais
 * - Seção Links Rápidos: Navegação para principais páginas do site
 * - Seção Contato: Informações de comunicação (WhatsApp, Email e Localização)
 * - Copyright: Informações de direitos autorais com ano atualizado dinamicamente
 */
const Footer = () => {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-12">
        {/* Grade principal com 4 colunas em telas médias e maiores */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* ========== SEÇÃO INSTITUCIONAL ========== */}
          <div className="md:col-span-1">
            {/* Header com logotipo e nome da instituição */}
            <div className="mb-4 flex items-center gap-2">
              <img 
                src={logoIts} 
                alt="Logo ITS" 
                className="h-9 w-9 rounded-lg object-contain bg-primary-foreground/20" 
              />
              <span className="font-serif text-lg font-bold">Instituto Teológico Servo</span>
            </div>
            
            {/* Descrição da missão e valores da instituição */}
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Formando servos fiéis para o Reino de Deus, com ensino bíblico sólido, acessível e comprometido com a edificação da Igreja.
            </p>
          </div>

          {/* ========== SEÇÃO PARCERIAS ========== */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider">Parcerias</h3>
            <div className="space-y-4">
              {/* Parceria: Assembleia de Deus Ministério Família */}
              <div className="flex items-center gap-3">
                <img 
                  src={logoMinisterioFamilia} 
                  alt="Logo Assembleia de Deus Ministério Família" 
                  className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/20 p-0.5" 
                />
                <span className="text-sm text-primary-foreground/80">Assembleia de Deus Ministério Família</span>
              </div>
              
              {/* Parceria: CNMCB */}
              <div className="flex items-center gap-3">
                <img 
                  src={logoCnmcb} 
                  alt="Logo CNMCB" 
                  className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/20 p-0.5" 
                />
                <span className="text-sm text-primary-foreground/80">CNMCB — Convenção Nacional dos Ministros de Cristo do Brasil</span>
              </div>
            </div>
          </div>

          {/* ========== SEÇÃO LINKS RÁPIDOS ========== */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              {/* Array de links de navegação principais */}
              {[
                { label: "Início", path: "/" },
                { label: "Quem Somos", path: "/quem-somos" },
                { label: "Cursos", path: "/cursos" },
                { label: "Núcleos", path: "/nucleos" },
                { label: "Metodologia", path: "/metodologia" },
                { label: "Inscrição", path: "/inscricao" },
                { label: "Consultar Inscrição", path: "/consulta" },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ========== SEÇÃO CONTATO ========== */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider">Contato</h3>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              {/* WhatsApp */}
              <p>WhatsApp: (11) 97229-4009</p>
              {/* Email institucional */}
              <p>Email: institutoteologicoits@gmail.com</p>
              {/* Localização geográfica */}
              <p>São Paulo — SP, Brasil</p>
            </div>
          </div>
        </div>

        {/* ========== SEÇÃO COPYRIGHT ========== */}
        <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/60">
          {/* Exibe o ano atual dinamicamente */}
          © {new Date().getFullYear()} Instituto Teológico Servo. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
