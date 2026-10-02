import * as React from "react";

/** Breakpoint em pixels para determinar se o dispositivo é móvel */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook que detecta se o dispositivo é móvel com base no tamanho da janela.
 * 
 * Monitora mudanças no tamanho da janela usando Media Queries e atualiza
 * o estado quando a largura da janela muda.
 * 
 * Retorna true se o dispositivo é considerado móvel (largura < 768px), false caso contrário
 */
export function useIsMobile() {
  // Estado para armazenar se o dispositivo é móvel ou não
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Cria uma media query para detectar mudanças no tamanho da janela
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Callback executado quando o tamanho da janela muda
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Adiciona listener para mudanças na media query
    mql.addEventListener("change", onChange);
    
    // Define o estado inicial com base no tamanho atual da janela
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Limpa o listener ao desmontar o componente
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Retorna o valor booleano (converte undefined para false)
  return !!isMobile;
}
