import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SITE_URL, irParaSite } from "@/common/constants/urls";

/**
 * Rotas institucionais que existiam na Central antes da separação em dois
 * produtos continuam válidas como ATALHO: redirecionam para a página
 * equivalente no Site Institucional, em vez de servir conteúdo duplicado.
 */
const RedirectToSite = ({ path = "/" }: { path?: string }) => {
  useEffect(() => {
    irParaSite(path);
  }, [path]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        Redirecionando para o site do Instituto Teológico Servo…
      </p>
      <a href={`${SITE_URL}${path}`} className="text-sm text-primary underline">
        Clique aqui se não for redirecionado
      </a>
    </div>
  );
};

export default RedirectToSite;
