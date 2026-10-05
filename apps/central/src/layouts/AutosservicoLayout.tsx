import { Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoIts from "@/common/assets/logo-its.jpeg";
import { SITE_URL } from "@/common/constants/urls";

/**
 * Layout da superfície PÚBLICA de autosserviço da Central (pagamento e
 * consulta, ambos travados por token).
 *
 * Deliberadamente enxuto: a Central NÃO é um site institucional — todo
 * conteúdo de marketing pertence ao Produto A. O único caminho de navegação
 * daqui é voltar ao Site (link externo).
 */
const AutosservicoLayout = () => (
  <div className="flex min-h-screen flex-col">
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <a href={SITE_URL} className="flex items-center gap-2">
          <img src={logoIts} alt="Logo ITS" className="h-10 w-10 rounded-lg object-contain" />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight text-primary">ITS</span>
            <span className="text-[10px] leading-tight text-muted-foreground">Instituto Teológico Servo</span>
          </div>
        </a>
        <a
          href={SITE_URL}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </a>
      </div>
    </header>

    <main className="flex-1">
      <Outlet />
    </main>

    <footer className="border-t bg-card">
      <div className="container flex flex-col items-center gap-1 py-6 text-center text-xs text-muted-foreground">
        <p>Área de autosserviço — Instituto Teológico Servo</p>
        <p>
          Dúvidas: (11) 97229-4009 · institutoteologicoits@gmail.com ·{" "}
          <a href={SITE_URL} className="underline hover:text-primary">
            site institucional
          </a>
        </p>
      </div>
    </footer>
  </div>
);

export default AutosservicoLayout;
