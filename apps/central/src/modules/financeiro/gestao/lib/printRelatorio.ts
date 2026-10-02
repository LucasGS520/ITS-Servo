import { formatBRL } from "@/common/constants/pricing";

/**
 * Gera e imprime o relatório financeiro mensal no modelo do papel timbrado
 * do ITS: tabela DATA | NOME DO ALUNO | ENTRADA | SAÍDA | SALDO, resumo do
 * mês e três linhas de assinatura (Tesoureiro, Presidente, Vice-Presidente).
 * Segue o padrão de impressão do painel (window.open + document.write).
 */

export interface LinhaRelatorio {
  data: string; // dd/mm/aaaa
  nome: string; // aluno, descrição ou categoria
  entrada: number | null;
  saida: number | null;
  saldo: number; // saldo corrente
}

export interface ResumoItem {
  label: string;
  valor: number;
}

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function printRelatorioMensal(params: {
  titulo: string;
  unidadeLabel: string;
  mesLabel: string;
  linhas: LinhaRelatorio[];
  resumo: ResumoItem[];
  totalGeral: number;
}) {
  const { titulo, unidadeLabel, mesLabel, linhas, resumo, totalGeral } = params;
  const win = window.open("", "_blank");
  if (!win) return;

  const linhasHtml = linhas
    .map(
      (l) => `
        <tr>
          <td>${esc(l.data)}</td>
          <td class="nome">${esc(l.nome)}</td>
          <td class="num">${l.entrada != null ? formatBRL(l.entrada) : ""}</td>
          <td class="num">${l.saida != null ? formatBRL(l.saida) : ""}</td>
          <td class="num">${formatBRL(l.saldo)}</td>
        </tr>`,
    )
    .join("");

  const resumoHtml = resumo
    .map(
      (r) => `
        <div class="resumo-linha"><span>${esc(r.label)}:</span><strong>${formatBRL(r.valor)}</strong></div>`,
    )
    .join("");

  win.document.write(`
    <html><head>
      <title>${esc(titulo)} — ${esc(unidadeLabel)} — ${esc(mesLabel)}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; padding: 32px 40px; color: #111; }
        .cab { text-align: center; margin-bottom: 6px; }
        .cab h1 { font-size: 18px; margin: 0; letter-spacing: 0.5px; }
        .cab p { font-size: 12px; margin: 2px 0 0; }
        .titulo { font-size: 14px; font-weight: bold; margin: 18px 0 2px; }
        .titulo span { font-weight: normal; text-decoration: underline; }
        .data-ref { font-size: 13px; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #333; padding: 5px 8px; }
        th { text-transform: uppercase; font-size: 11px; }
        td.num, th.num { text-align: right; white-space: nowrap; width: 90px; }
        td.nome { width: auto; }
        tr.total td { font-weight: bold; text-transform: uppercase; }
        .resumo { margin-top: 18px; font-size: 13px; max-width: 340px; }
        .resumo-linha { display: flex; justify-content: space-between; border-bottom: 1px solid #999; padding: 4px 2px; }
        .assinaturas { display: flex; justify-content: space-between; gap: 32px; margin-top: 90px; }
        .assinatura { flex: 1; text-align: center; font-size: 12px; font-weight: bold; border-top: 1px solid #111; padding-top: 6px; text-transform: uppercase; }
        .rodape { margin-top: 40px; text-align: center; font-size: 10px; color: #777; }
        @media print { body { padding: 12px 8px; } .rodape { display: none; } }
      </style>
    </head><body>
      <div class="cab">
        <h1>INSTITUTO TEOLÓGICO SERVO</h1>
        <p>Rua Via Taboão, 603 – Jardim Santa Mônica – Barueri - SP</p>
      </div>
      <p class="titulo">${esc(titulo)} <span>${esc(unidadeLabel)}</span></p>
      <p class="data-ref">Referência: <strong>${esc(mesLabel)}</strong> &nbsp;•&nbsp; Emitido em ${new Date().toLocaleDateString("pt-BR")}</p>
      <table>
        <thead>
          <tr>
            <th style="width:80px">Data</th>
            <th>Nome do Aluno</th>
            <th class="num">Entrada</th>
            <th class="num">Saída</th>
            <th class="num">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${linhasHtml || '<tr><td colspan="5" style="text-align:center;padding:16px">Sem movimentações no mês.</td></tr>'}
          <tr class="total">
            <td colspan="4">Total Geral</td>
            <td class="num">${formatBRL(totalGeral)}</td>
          </tr>
        </tbody>
      </table>
      <div class="resumo">${resumoHtml}</div>
      <div class="assinaturas">
        <div class="assinatura">Tesoureiro</div>
        <div class="assinatura">Presidente ITS</div>
        <div class="assinatura">Vice-Presidente</div>
      </div>
      <div class="rodape">Documento gerado pela Central Operacional ITS em ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>
  `);
  win.document.close();
  win.print();
}
