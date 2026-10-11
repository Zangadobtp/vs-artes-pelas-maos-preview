// Números do BI e do cronograma, sem DOM e sem rede (testado em tests/bi-logica.test.mjs).
// Datas sempre no dia LOCAL de quem usa o painel. A semana começa na segunda-feira.
import { ETAPAS, ROTULO_TIPO } from './leads-logica.js';

export const GANHOS = ['aprovado', 'em_producao', 'entregue'];
export const ABERTOS = ['novo', 'em_conversa', 'orcamento_enviado'];
const FINAIS = ['entregue', 'perdido'];

const pad = (n) => String(n).padStart(2, '0');
export const chaveDia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function somarDias(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); x.setDate(x.getDate() + n); return x; }
export function inicioSemana(d) {
  const dia = (d.getDay() + 6) % 7; // segunda = 0
  return somarDias(d, -dia);
}
const rotuloDiaMes = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const diaDoLead = (l) => chaveDia(new Date(l.criado_em));
const mesDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const mesDoLead = (l) => diaDoLead(l).slice(0, 7);
/** Dia em que o pedido foi fechado (aprovado). Registros antigos sem a data usam o dia em que chegaram. */
const diaGanho = (l) => (l.aprovado_em ? chaveDia(new Date(l.aprovado_em)) : diaDoLead(l));
const ehGanho = (l) => GANHOS.includes(l.status);
const arred = (n, casas = 1) => Math.round(n * 10 ** casas) / 10 ** casas;

export function variacao(atual, anterior) {
  if (!anterior) return null;
  return arred(((atual - anterior) / anterior) * 100) || 0;
}

/** Pedidos recebidos por semana: as últimas n, da mais antiga até a semana atual. */
export function pedidosPorSemana(leads, hoje, n = 8) {
  const primeira = somarDias(inicioSemana(hoje), -(n - 1) * 7);
  const semanas = Array.from({ length: n }, (_, i) => {
    const ini = somarDias(primeira, i * 7);
    return { inicio: chaveDia(ini), fim: chaveDia(somarDias(ini, 6)), rotulo: rotuloDiaMes(ini), total: 0 };
  });
  for (const l of leads) {
    const d = diaDoLead(l);
    const s = semanas.find((x) => d >= x.inicio && d <= x.fim);
    if (s) s.total++;
  }
  return semanas.map(({ inicio, rotulo, total }) => ({ inicio, rotulo, total }));
}

/** Mês 'AAAA-MM' até o dia 'ateDia' (períodos do mesmo tamanho). Recebidos contam pela data de chegada; aprovados e dinheiro, pela data de aprovação. */
function doMes(leads, mes, ateDia = 31) {
  const noPeriodo = (chave) => chave.slice(0, 7) === mes && Number(chave.slice(8, 10)) <= ateDia;
  const lista = leads.filter((l) => noPeriodo(diaDoLead(l)));
  const ganhos = leads.filter((l) => ehGanho(l) && noPeriodo(diaGanho(l)));
  return { recebidos: lista.length, ganhos: ganhos.length, valorFechado: arred(ganhos.reduce((s, l) => s + (Number(l.valor) || 0), 0), 2) };
}

export function resumoMes(leads, hoje) {
  const anteriorData = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1, 12);
  // Mês corrente é parcial: compara dia 1 até hoje com dia 1 até o mesmo dia do mês passado.
  const atual = doMes(leads, mesDe(hoje), hoje.getDate());
  const anterior = doMes(leads, mesDe(anteriorData), hoje.getDate());
  return { atual, anterior, variacaoRecebidos: variacao(atual.recebidos, anterior.recebidos), variacaoValor: variacao(atual.valorFechado, anterior.valorFechado) };
}

export function taxaAprovacao(leads) {
  const ganhos = leads.filter((l) => GANHOS.includes(l.status)).length;
  const perdidos = leads.filter((l) => l.status === 'perdido').length;
  return { ganhos, perdidos, taxa: ganhos + perdidos ? ganhos / (ganhos + perdidos) : null };
}

export function funil(leads) {
  return ETAPAS.map((e) => ({ id: e.id, rotulo: e.rotulo, total: leads.filter((l) => l.status === e.id).length }));
}

export function valores(leads, hoje) {
  const mes = mesDe(hoje);
  const ganhosDoMes = leads.filter((l) => ehGanho(l) && diaGanho(l).slice(0, 7) === mes);
  const comValor = ganhosDoMes.filter((l) => l.valor !== null && l.valor !== undefined);
  const soma = comValor.reduce((s, l) => s + Number(l.valor), 0);
  const abertos = leads.filter((l) => ABERTOS.includes(l.status));
  return {
    fechadoMes: arred(soma, 2),
    abertoValor: arred(abertos.reduce((s, l) => s + (Number(l.valor) || 0), 0), 2),
    abertoQtd: abertos.length,
    ticketMedio: comValor.length ? arred(soma / comValor.length, 2) : null,
  };
}

function origemDe(l) {
  const o = l.origem ?? {};
  if (o.gclid) return 'Google Ads';
  const u = String(o.utm_source ?? '').toLowerCase().trim();
  if (u) {
    if (u === 'ig' || u.includes('insta')) return 'Instagram';
    if (u.includes('google')) return 'Google';
    if (u === 'fb' || u.includes('facebook')) return 'Facebook';
    if (u.includes('whats')) return 'WhatsApp';
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
  const c = String(l.como_conheceu ?? '').trim();
  if (c) {
    if (/^insta/i.test(c)) return 'Instagram';
    if (/^google/i.test(c)) return 'Google';
    if (/^indica/i.test(c)) return 'Indicação';
    if (/^outro/i.test(c)) return 'Outro';
    return c;
  }
  return 'Não informado';
}

const contar = (itens, chave) => {
  const m = new Map();
  for (const x of itens) m.set(chave(x), (m.get(chave(x)) ?? 0) + 1);
  return [...m].map(([rotulo, total]) => ({ rotulo, total })).sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
};
export const porOrigem = (leads) => contar(leads, origemDe);
export const porTipo = (leads) => contar(leads, (l) => ROTULO_TIPO[l.tipo] ?? l.tipo);

/* ---------- cronograma de entregas ---------- */
const pendente = (l) => l.data_entrega && !FINAIS.includes(l.status);

export function agruparEntregas(leads, hoje) {
  const h = chaveDia(hoje);
  const domingo = chaveDia(somarDias(inicioSemana(hoje), 6));
  const ordem = (a, b) => (a.data_entrega < b.data_entrega ? -1 : a.data_entrega > b.data_entrega ? 1 : String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  const lista = leads.filter(pendente).sort(ordem);
  return {
    atrasadas: lista.filter((l) => l.data_entrega < h),
    hoje: lista.filter((l) => l.data_entrega === h),
    semana: lista.filter((l) => l.data_entrega > h && l.data_entrega <= domingo),
    proximas: lista.filter((l) => l.data_entrega > domingo),
  };
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const nomeMes = (ano, mes0) => `${MESES[mes0]} de ${ano}`;

export function calendarioMes(ano, mes0, leads) {
  const porDia = new Map();
  for (const l of leads.filter(pendente)) porDia.set(l.data_entrega, (porDia.get(l.data_entrega) ?? 0) + 1);
  const primeiro = new Date(ano, mes0, 1, 12);
  const ultimo = new Date(ano, mes0 + 1, 0, 12);
  const fim = somarDias(inicioSemana(ultimo), 6);
  const semanas = [];
  for (let ini = inicioSemana(primeiro); ini <= fim; ini = somarDias(ini, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => {
      const d = somarDias(ini, i);
      const chave = chaveDia(d);
      return { dia: d.getDate(), chave, foraDoMes: d.getMonth() !== mes0, total: porDia.get(chave) ?? 0 };
    }));
  }
  return { semanas };
}
