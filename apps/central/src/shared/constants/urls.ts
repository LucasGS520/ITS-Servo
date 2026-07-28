/**
 * URL do Site Institucional (Produto A).
 *
 * A Central é operação + autosserviço; todo conteúdo institucional (home,
 * cursos, núcleos, formulário de inscrição) vive no Site. Quem cai numa rota
 * institucional aqui é redirecionado para lá.
 */
export const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:4321";

/** Redireciona o navegador para uma rota do Site Institucional. */
export const irParaSite = (path = "/") => {
  window.location.replace(`${SITE_URL}${path}`);
};
