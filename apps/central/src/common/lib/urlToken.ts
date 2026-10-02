/**
 * Lê um parâmetro do FRAGMENT da URL (#a=b&c=d), com fallback para a query
 * string. O token de autosserviço vive no fragment para não trafegar em
 * Referer nem em logs de servidor; a query segue aceita para compatibilidade
 * com links antigos já enviados por e-mail.
 */
export function paramFromUrl(name: string): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hash.get(name) ?? new URLSearchParams(window.location.search).get(name);
}
