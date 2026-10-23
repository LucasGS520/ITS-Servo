import logoIts from "@/common/assets/logo-its.jpeg";

export interface DocumentoRelatorio {
  titulo: string;
  periodo: string;
  endereco: string;
  enderecoEm?: "sede" | "nucleo";
  colunas: string[];
  linhas: string[][];
  resumo: { rotulo: string; valor: string }[];
  observacoes?: string[];
  financeiro?: boolean;
}

const esc = (valor: string) => String(valor).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function formatarReferencia(mesOuAno: string): string {
  if (/^\d{4}-\d{2}$/.test(mesOuAno)) {
    const [ano, mes] = mesOuAno.split("-").map(Number);
    if (mes >= 1 && mes <= 12) return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  }
  return /^\d{4}$/.test(mesOuAno) ? `Ano de ${mesOuAno}` : mesOuAno;
}

export function imprimirRelatorio(doc: DocumentoRelatorio): boolean {
  const janela = window.open("", "_blank");
  if (!janela) return false;
  const cabecalho = doc.colunas.map(c => `<th>${esc(c)}</th>`).join("");
  const linhas = doc.linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const resumo = doc.resumo.map(r => `<div class="item"><span>${esc(r.rotulo)}</span><strong>${esc(r.valor)}</strong></div>`).join("");
  const assinaturas = doc.financeiro ? `<div class="assinaturas">${["1º Tesoureiro", "2º Tesoureiro", "Presidente ITS", "Vice-Presidente"].map(a => `<div>${a}</div>`).join("")}</div>` : "";
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(doc.titulo)} — ${esc(doc.periodo)}</title><style>
    @page { size: A4 ${doc.colunas.length > 6 ? "landscape" : "portrait"}; margin: 15mm; }
    body { font-family: Arial, sans-serif; color: #14203a; font-size: 11px; }
    header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #f36a21; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { width: 66px; height: 66px; object-fit: contain; flex: none; }
    .instituto { color: #20459c; font-size: 17px; font-weight: 700; margin: 0 0 5px; }
    .endereco { color: #475569; line-height: 1.4; }
    h1 { color: #20459c; font-size: 16px; margin: 12px 0 4px; }
    .sub { color: #475569; margin: 4px 0; } table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th,td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
    th { color: #20459c; background: #edf2fb; } tr:nth-child(even) { background: #f8faff; }
    .resumo { max-width: 430px; margin-top: 20px; } .item { display: flex; justify-content: space-between; border-bottom: 1px solid #dbe4f2; padding: 5px 0; gap: 20px; }
    .item strong { color: #20459c; } .assinaturas { display: flex; gap: 18px; margin-top: 70px; break-inside: avoid; }
    .assinaturas div { flex: 1; border-top: 1px solid #20459c; text-align: center; padding-top: 6px; font-weight: bold; font-size: 10px; }
  </style></head><body><header><img class="logo" src="${esc(new URL(logoIts, window.location.href).href)}" alt="Logo do ITS"><div><div class="instituto">INSTITUTO TEOLÓGICO SERVO</div><div class="endereco">${esc(doc.endereco)}</div></div></header>
  <h1>${esc(doc.titulo)}</h1><p class="sub">Referência: ${esc(formatarReferencia(doc.periodo))}</p>
  <table><thead><tr>${cabecalho}</tr></thead><tbody>${linhas || `<tr><td colspan="${doc.colunas.length}">Nenhum registro para o período.</td></tr>`}</tbody></table>
  <div class="resumo">${resumo}</div>${assinaturas}
  </body></html>`);
  janela.document.close();
  const logo = janela.document.querySelector<HTMLImageElement>(".logo");
  const imprimir = () => { janela.focus(); janela.print(); };
  if (logo?.complete) imprimir();
  else if (logo) { logo.addEventListener("load", imprimir, { once: true }); logo.addEventListener("error", imprimir, { once: true }); }
  else imprimir();
  return true;
}
