export interface DocumentoRelatorio {
  titulo: string;
  periodo: string;
  endereco: string;
  colunas: string[];
  linhas: string[][];
  resumo: { rotulo: string; valor: string }[];
  observacoes?: string[];
  financeiro?: boolean;
}

const esc = (valor: string) => String(valor).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function imprimirRelatorio(doc: DocumentoRelatorio): boolean {
  const janela = window.open("", "_blank");
  if (!janela) return false;
  const agora = new Date().toLocaleString("pt-BR");
  const cabecalho = doc.colunas.map(c => `<th>${esc(c)}</th>`).join("");
  const linhas = doc.linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const resumo = doc.resumo.map(r => `<div class="item"><span>${esc(r.rotulo)}</span><strong>${esc(r.valor)}</strong></div>`).join("");
  const observacoes = (doc.observacoes ?? []).map(o => `<p class="nota">${esc(o)}</p>`).join("");
  const assinaturas = doc.financeiro ? `<div class="assinaturas">${["1º Tesoureiro", "2º Tesoureiro", "Presidente ITS", "Vice-Presidente"].map(a => `<div>${a}</div>`).join("")}</div>` : "";
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(doc.titulo)}</title><style>
    @page { size: A4 ${doc.colunas.length > 6 ? "landscape" : "portrait"}; margin: 15mm; }
    body { font-family: Arial, sans-serif; color: #172032; font-size: 11px; }
    header { text-align: center; border-bottom: 2px solid #233952; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { font-size: 17px; margin: 0 0 5px; } h2 { font-size: 15px; margin: 12px 0 4px; }
    .sub { color: #475569; margin: 4px 0; } table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th,td { border: 1px solid #aeb8c5; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #e9eef5; } tr:nth-child(even) { background: #f7f9fc; }
    .resumo { max-width: 430px; margin-top: 20px; } .item { display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding: 5px 0; gap: 20px; }
    .nota { color: #775500; margin: 8px 0; } .assinaturas { display: flex; gap: 18px; margin-top: 70px; break-inside: avoid; }
    .assinaturas div { flex: 1; border-top: 1px solid #222; text-align: center; padding-top: 6px; font-weight: bold; font-size: 10px; }
    footer { margin-top: 25px; color: #64748b; font-size: 10px; }
  </style></head><body><header><h1>INSTITUTO TEOLÓGICO SERVO</h1><div>${esc(doc.endereco)}</div></header>
  <h2>${esc(doc.titulo)}</h2><p class="sub">Referência: ${esc(doc.periodo)} · Gerado em ${esc(agora)}</p>
  <table><thead><tr>${cabecalho}</tr></thead><tbody>${linhas || `<tr><td colspan="${doc.colunas.length}">Nenhum registro para o período.</td></tr>`}</tbody></table>
  <div class="resumo">${resumo}</div>${observacoes}${assinaturas}<footer>Gerado pela Central Operacional ITS em ${esc(agora)}. Dados atuais na data de geração.</footer>
  </body></html>`);
  janela.document.close();
  janela.focus();
  janela.print();
  return true;
}
