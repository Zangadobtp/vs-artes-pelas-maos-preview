// Agenda de entregas: calendário do mês + listas (atrasadas, hoje, esta semana, próximas).
import { supa } from './supa.js';
import { h, limpar, montar, dinheiro } from './ui.js';
import { abrirFichaPorId } from './leads.js';
import { agruparEntregas, calendarioMes, nomeMes, chaveDia } from './bi-logica.js';
import { ROTULO_TIPO, rotuloEtapa } from './leads-logica.js';

const COLUNAS = 'id, nome, tipo, status, valor, data_entrega, criado_em';
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const tituloMes = (a, m) => { const t = nomeMes(a, m); return t.charAt(0).toUpperCase() + t.slice(1); };
const dataBr = (chave) => chave.split('-').reverse().join('/');

let mostrado = null; // { ano, mes0 }
let diaEscolhido = null;

export async function telaAgenda(raiz) {
  limpar(raiz).append(h('p', { class: 'muted' }, 'Carregando…'));
  const { data: leads, error } = await supa.from('leads').select(COLUNAS).not('data_entrega', 'is', null).order('data_entrega').limit(1000);
  if (error) { limpar(raiz).append(h('p', { class: 'erro' }, 'Não foi possível carregar a agenda.')); return; }

  const hoje = new Date();
  if (!mostrado) mostrado = { ano: hoje.getFullYear(), mes0: hoje.getMonth() };
  const recarregar = () => telaAgenda(raiz);
  const hojeChave = chaveDia(hoje);

  const mudarMes = (delta) => {
    const d = new Date(mostrado.ano, mostrado.mes0 + delta, 1, 12);
    mostrado = { ano: d.getFullYear(), mes0: d.getMonth() }; diaEscolhido = null; recarregar();
  };
  const irParaHoje = () => { mostrado = { ano: hoje.getFullYear(), mes0: hoje.getMonth() }; diaEscolhido = hojeChave; recarregar(); };

  const linhaEntrega = (l) => {
    const atrasada = l.data_entrega < hojeChave && !['entregue', 'perdido'].includes(l.status);
    return h('button', { class: 'linha pedido linha-pedido', type: 'button', onclick: () => abrirFichaPorId(l.id, recarregar) },
      h('div', { class: 'info' },
        h('strong', null, l.nome),
        h('span', { class: 'muted' }, `${ROTULO_TIPO[l.tipo] ?? l.tipo}${l.valor ? ` · ${dinheiro(l.valor)}` : ''}`),
        h('span', { class: atrasada ? 'selo selo--atraso' : 'selo' }, `${atrasada ? 'Atrasada · ' : 'Entrega '}${dataBr(l.data_entrega)}`)),
      h('span', { class: 'etiqueta' }, rotuloEtapa(l.status)));
  };
  const bloco = (titulo, itens, classe = '') => (itens.length
    ? h('section', { class: `grafico ${classe}` }, h('h3', null, `${titulo} (${itens.length})`), h('div', { class: 'cartao-lista' }, itens.map(linhaEntrega)))
    : null);

  const cal = calendarioMes(mostrado.ano, mostrado.mes0, leads);
  const celula = (d) => {
    const rotulo = `${d.dia} de ${nomeMes(mostrado.ano, mostrado.mes0).split(' de ')[0]}${d.total ? `, ${d.total} entrega${d.total > 1 ? 's' : ''}` : ''}`;
    const classes = ['dia', d.foraDoMes ? 'dia--fora' : '', d.chave === hojeChave ? 'dia--hoje' : '', d.chave === diaEscolhido ? 'dia--escolhido' : '', d.total ? 'dia--tem' : ''].filter(Boolean).join(' ');
    return h('button', { class: classes, type: 'button', 'aria-label': d.foraDoMes ? `${d.dia} (outro mês)` : rotulo, 'aria-pressed': String(d.chave === diaEscolhido),
      onclick: () => { diaEscolhido = diaEscolhido === d.chave ? null : d.chave; recarregar(); } },
      h('span', { class: 'dia-num' }, d.dia), d.total ? h('span', { class: 'dia-qtd' }, d.total) : null);
  };

  const grupos = agruparEntregas(leads, hoje);
  const doDia = diaEscolhido ? leads.filter((l) => l.data_entrega === diaEscolhido && !['entregue', 'perdido'].includes(l.status)) : null;
  const tudoVazio = !grupos.atrasadas.length && !grupos.hoje.length && !grupos.semana.length && !grupos.proximas.length;

  montar(raiz,
    h('div', { class: 'cabeca' }, h('h2', null, 'Agenda de entregas'), h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: irParaHoje }, 'Hoje')),
    h('div', { class: 'calendario' },
      h('div', { class: 'cal-topo' },
        h('button', { class: 'btn btn--suave btn--mini', type: 'button', 'aria-label': 'Mês anterior', onclick: () => mudarMes(-1) }, '‹'),
        h('strong', null, tituloMes(mostrado.ano, mostrado.mes0)),
        h('button', { class: 'btn btn--suave btn--mini', type: 'button', 'aria-label': 'Próximo mês', onclick: () => mudarMes(1) }, '›')),
      h('div', { class: 'cal-grade' },
        DIAS.map((d) => h('span', { class: 'cal-cab', 'aria-hidden': 'true' }, d)),
        cal.semanas.flat().map(celula)),
      h('p', { class: 'muted legenda-cal' }, 'O número no canto é a quantidade de entregas do dia. Toque num dia para ver.')),
    doDia ? h('section', { class: 'grafico' }, h('h3', null, `Dia ${dataBr(diaEscolhido)}`),
      doDia.length ? h('div', { class: 'cartao-lista' }, doDia.map(linhaEntrega)) : h('p', { class: 'muted' }, 'Nenhuma entrega neste dia.')) : null,
    bloco('Atrasadas', grupos.atrasadas, 'bloco-atraso'),
    bloco('Hoje', grupos.hoje),
    bloco('Esta semana', grupos.semana),
    bloco('Próximas', grupos.proximas),
    tudoVazio ? h('div', { class: 'cartao-lista' }, h('p', { class: 'vazio' }, 'Nenhuma entrega marcada. Defina a data de entrega na ficha do pedido (aba Pedidos).')) : null);
}
