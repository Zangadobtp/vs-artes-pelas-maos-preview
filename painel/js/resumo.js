// Resumo (BI): números do mês, funil, pedidos por semana, origem e tipo.
// Uma cor só (a da marca) em todos os gráficos; todo valor aparece escrito, e cada gráfico tem tabela.
import { supa } from './supa.js';
import { h, svg, limpar, montar, dinheiro } from './ui.js';
import { abrirFichaPorId } from './leads.js';
import { resumoMes, taxaAprovacao, funil, valores, pedidosPorSemana, porOrigem, porTipo, agruparEntregas, nomeMes } from './bi-logica.js';

const COLUNAS = 'id, nome, tipo, status, valor, data_entrega, criado_em, aprovado_em, origem, como_conheceu';
const pct = (n) => `${String(Math.round(n * 100))}%`;
const nf = (n) => Number(n).toLocaleString('pt-BR');

function textoVariacao(v, base) {
  if (v === null) return { seta: '', texto: `sem dados de ${base} para comparar` };
  if (v === 0) return { seta: '=', texto: `igual ao mesmo período de ${base}` };
  return { seta: v > 0 ? '▲' : '▼', texto: `${v > 0 ? '+' : ''}${String(v).replace('.', ',')}% sobre o mesmo período de ${base}` };
}

function tile(rotulo, valor, apoio, extra) {
  return h('div', { class: 'kpi' }, h('span', { class: 'kpi-rotulo' }, rotulo), h('strong', { class: 'kpi-valor' }, valor), apoio ? h('span', { class: 'kpi-apoio' }, apoio) : null, extra ?? null);
}

/** Barras horizontais em HTML: rótulo, barra, valor escrito. Largura definida por propriedade CSS (permitido pela CSP). */
function barrasH(itens, { vazio = 'Sem dados ainda.' } = {}) {
  if (!itens.length || itens.every((i) => i.total === 0)) return h('p', { class: 'muted' }, vazio);
  const max = Math.max(...itens.map((i) => i.total), 1);
  return h('ul', { class: 'barras-h' }, itens.map((i) => {
    const preenche = h('span', { class: i.neutra ? 'preenche preenche--neutra' : 'preenche' });
    preenche.style.setProperty('--w', `${Math.max((i.total / max) * 100, i.total ? 2 : 0)}%`);
    return h('li', null, h('span', { class: 'rot' }, i.rotulo), h('span', { class: 'trilho', 'aria-hidden': 'true' }, preenche), h('span', { class: 'val' }, nf(i.total)));
  }));
}

/** Pedidos por semana: colunas em SVG com o número em cima; a semana atual é a última. */
function graficoSemanas(semanas) {
  const L = 320, A = 150, base = 120, esq = 8, larg = (L - esq * 2) / semanas.length, max = Math.max(...semanas.map((s) => s.total), 1);
  const barras = semanas.map((s, i) => {
    const alt = s.total ? Math.max((s.total / max) * (base - 24), 4) : 0;
    const x = esq + i * larg + larg * 0.2, w = larg * 0.6;
    return svg('g', null,
      alt ? svg('rect', { x, y: base - alt, width: w, height: alt, rx: 4, class: i === semanas.length - 1 ? 'col col--atual' : 'col' }) : svg('rect', { x, y: base - 2, width: w, height: 2, class: 'col col--zero' }),
      svg('text', { x: x + w / 2, y: base - alt - 5, 'text-anchor': 'middle', class: 'g-val' }, nf(s.total)),
      svg('text', { x: x + w / 2, y: base + 15, 'text-anchor': 'middle', class: i === semanas.length - 1 ? 'g-eixo g-eixo--forte' : 'g-eixo' }, s.rotulo));
  });
  return svg('svg', { viewBox: `0 0 ${L} ${A}`, class: 'g-semanas', role: 'img', 'aria-label': `Pedidos por semana nas últimas ${semanas.length} semanas: ${semanas.map((s) => `semana de ${s.rotulo}, ${s.total}`).join('; ')}` },
    svg('line', { x1: esq, x2: L - esq, y1: base, y2: base, class: 'g-base' }), barras);
}

const tabela = (colunas, linhas) => h('details', { class: 'ver-tabela' }, h('summary', null, 'Ver em tabela'),
  h('table', null, h('thead', null, h('tr', null, colunas.map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, linhas.map((l) => h('tr', null, l.map((c) => h('td', null, c)))))));

export async function telaResumo(raiz) {
  limpar(raiz).append(h('p', { class: 'muted' }, 'Carregando…'));
  const { data: leads, error } = await supa.from('leads').select(COLUNAS).order('criado_em', { ascending: false }).limit(1000);
  if (error) { limpar(raiz).append(h('p', { class: 'erro' }, 'Não foi possível carregar o resumo.')); return; }
  const recarregar = () => telaResumo(raiz);
  const hoje = new Date();
  const mes = resumoMes(leads, hoje), taxa = taxaAprovacao(leads), val = valores(leads, hoje);
  const ent = agruparEntregas(leads, hoje);
  const nomeAnt = nomeMes(hoje.getFullYear(), hoje.getMonth() - 1 < 0 ? 11 : hoje.getMonth() - 1).split(' de ')[0];
  const vRec = textoVariacao(mes.variacaoRecebidos, nomeAnt), vVal = textoVariacao(mes.variacaoValor, nomeAnt);
  const semanas = pedidosPorSemana(leads, hoje, 8), etapas = funil(leads), origens = porOrigem(leads), tipos = porTipo(leads);

  const atras = ent.atrasadas.length;
  const aviso = atras
    ? h('button', { class: 'alerta-entrega', type: 'button', onclick: () => { location.hash = '#/agenda'; } },
        h('strong', null, `${atras} entrega${atras > 1 ? 's' : ''} atrasada${atras > 1 ? 's' : ''}`), h('span', null, 'Ver na agenda →'))
    : null;

  const proximos = [...ent.hoje, ...ent.semana];
  montar(raiz,
    h('div', { class: 'cabeca' }, h('div', null, h('h2', null, 'Resumo'), h('span', { class: 'muted' }, nomeMes(hoje.getFullYear(), hoje.getMonth()))),
      h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: recarregar }, 'Atualizar')),
    aviso,
    h('div', { class: 'kpis' },
      tile('Pedidos no mês', nf(mes.atual.recebidos), `${vRec.seta} ${vRec.texto}`.trim()),
      tile('Taxa de aprovação', taxa.taxa === null ? '—' : pct(taxa.taxa), taxa.taxa === null ? 'ainda sem pedidos decididos' : `${taxa.ganhos} aprovado${taxa.ganhos === 1 ? '' : 's'} e ${taxa.perdidos} perdido${taxa.perdidos === 1 ? '' : 's'}`),
      tile('Valor fechado no mês', dinheiro(val.fechadoMes) || 'R$ 0,00', `${vVal.seta} ${vVal.texto}`.trim()),
      tile('Em aberto', dinheiro(val.abertoValor) || 'R$ 0,00', `${val.abertoQtd} pedido${val.abertoQtd === 1 ? '' : 's'} em andamento`),
      tile('Ticket médio', val.ticketMedio === null ? '—' : dinheiro(val.ticketMedio), 'pedidos aprovados no mês, com valor'),
      tile('Entregas desta semana', nf(proximos.length), atras ? `${atras} atrasada${atras > 1 ? 's' : ''} além destas` : 'nenhuma atrasada')),
    h('section', { class: 'grafico' }, h('h3', null, 'Pedidos por semana'), h('p', { class: 'muted' }, 'Últimas 8 semanas, começando na segunda-feira. A última barra é a semana em andamento.'),
      graficoSemanas(semanas),
      tabela(['Semana de', 'Pedidos'], semanas.map((s) => [s.rotulo, nf(s.total)]))),
    h('section', { class: 'grafico' }, h('h3', null, 'Onde estão os pedidos'), h('p', { class: 'muted' }, 'Quantos pedidos há em cada etapa agora.'),
      barrasH(etapas.map((e) => ({ rotulo: e.rotulo, total: e.total, neutra: e.id === 'perdido' })), { vazio: 'Nenhum pedido ainda.' })),
    h('div', { class: 'duas-colunas' },
      h('section', { class: 'grafico' }, h('h3', null, 'De onde vêm'), barrasH(origens, { vazio: 'Sem pedidos ainda.' })),
      h('section', { class: 'grafico' }, h('h3', null, 'O que mais pedem'), barrasH(tipos, { vazio: 'Sem pedidos ainda.' }))),
    proximos.length ? h('section', { class: 'grafico' }, h('h3', null, 'Para entregar esta semana'),
      h('div', { class: 'cartao-lista' }, proximos.slice(0, 6).map((l) => h('button', { class: 'linha pedido linha-pedido', type: 'button', onclick: () => abrirFichaPorId(l.id, recarregar) },
        h('div', { class: 'info' }, h('strong', null, l.nome), h('span', { class: 'muted' }, l.data_entrega.split('-').reverse().join('/'))),
        h('span', { class: 'etiqueta' }, l.status.replace(/_/g, ' '))))))
      : null,
    h('p', { class: 'muted nota-bi' }, 'Pedidos recebidos contam pela data em que chegaram; pedidos aprovados e valores, pela data em que foram aprovados. O valor só aparece quando você o preenche na ficha do pedido.'));
}
