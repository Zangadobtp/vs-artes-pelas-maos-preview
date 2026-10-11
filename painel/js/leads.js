// CRM: quadro por etapa, lista, ficha do pedido, anotações, WhatsApp e exportação.
// Todo texto de pedido vem de desconhecidos: só entra na tela como texto (h/textContent), nunca como HTML.
import { supa } from './supa.js';
import { h, limpar, aviso, dataCurta, dataSo, dinheiro, campo } from './ui.js';
import { ETAPAS, ROTULO_TIPO, rotuloEtapa, MODELOS_ROTULO, modeloMensagem, numeroWhatsapp, paraCsv } from './leads-logica.js';
import { confirmarComCodigo } from './confirmar.js';

let visao = 'quadro';

function telefone(d) {
  const s = String(d ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return s.length === 11 ? `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}` : s.length === 10 ? `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6)}` : s;
}
const bonito = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const FINAIS = ['entregue', 'perdido'];
const hojeLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** Selo "Entrega 20/12" no cartão; vermelho quando já passou do dia. */
function seloEntrega(l) {
  if (!l.data_entrega || FINAIS.includes(l.status)) return null;
  const atrasada = l.data_entrega < hojeLocal();
  return h('span', { class: atrasada ? 'selo selo--atraso' : 'selo' }, `${atrasada ? 'Atrasada · ' : 'Entrega '}${dataSo(l.data_entrega)}`);
}

export async function telaPedidos(raiz) {
  limpar(raiz).append(h('p', { class: 'muted' }, 'Carregando…'));
  const { data: leads, error } = await supa.from('leads').select('*').order('criado_em', { ascending: false }).limit(500);
  if (error) { limpar(raiz).append(h('p', { class: 'erro' }, 'Não foi possível carregar os pedidos.')); return; }
  const recarregar = () => telaPedidos(raiz);

  function exportar() {
    const csv = `﻿${paraCsv(leads)}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = h('a', { href: url, download: `pedidos-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const cartaoPedido = (l) => h('button', { class: 'pedido', type: 'button', onclick: () => abrirFicha(l, recarregar) },
    h('strong', null, l.nome),
    h('span', null, ROTULO_TIPO[l.tipo] ?? l.tipo),
    h('span', { class: 'meta' }, `${dataCurta(l.criado_em)}${l.valor ? ` · ${dinheiro(l.valor)}` : ''}`),
    seloEntrega(l));

  const quadro = () => h('div', { class: 'quadro' }, ETAPAS.map((e) => {
    const itens = leads.filter((l) => l.status === e.id);
    return h('section', { class: 'coluna', 'aria-label': e.rotulo },
      h('h3', null, e.rotulo, h('span', null, itens.length)),
      itens.length ? itens.map(cartaoPedido) : h('p', { class: 'muted m03' }, '—'));
  }));

  const lista = () => leads.length
    ? h('div', { class: 'cartao-lista' }, leads.map((l) => h('button', { class: 'linha pedido linha-pedido', type: 'button', onclick: () => abrirFicha(l) },
        h('div', { class: 'info' }, h('strong', null, l.nome), h('span', { class: 'muted' }, `${ROTULO_TIPO[l.tipo] ?? l.tipo} · ${dataCurta(l.criado_em)}`)),
        h('span', { class: 'etiqueta' }, rotuloEtapa(l.status)))))
    : h('div', { class: 'cartao-lista' }, h('p', { class: 'vazio' }, 'Nenhum pedido ainda.'));

  function trocarVisao(v) { visao = v; recarregar(); }

  limpar(raiz).append(
    h('div', { class: 'cabeca' }, h('h2', null, 'Pedidos'),
      h('div', { class: 'acoes-linha' },
        h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: recarregar }, 'Atualizar'),
        h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: exportar, disabled: !leads.length }, 'Exportar planilha'))),
    h('div', { class: 'subabas' },
      h('button', { type: 'button', 'aria-pressed': String(visao === 'quadro'), onclick: () => trocarVisao('quadro') }, 'Quadro'),
      h('button', { type: 'button', 'aria-pressed': String(visao === 'lista'), onclick: () => trocarVisao('lista') }, 'Lista')),
    visao === 'quadro' ? quadro() : lista());

}

/* ---------- ficha do pedido ---------- */
export async function abrirFicha(lead, aoFechar) {
  const painel = h('div', { class: 'ficha', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Pedido de ${lead.nome}` });
  const fechar = () => { document.removeEventListener('keydown', esc); painel.remove(); document.body.style.overflow = ''; aoFechar?.(); };
  const esc = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) fechar(); };
  document.addEventListener('keydown', esc);
  document.body.style.overflow = 'hidden';
  document.body.append(painel);

  async function desenhar() {
    const { data: eventos } = await supa.from('lead_eventos').select('id, criado_em, tipo, texto').eq('lead_id', lead.id).order('criado_em', { ascending: false });

    const botoesEtapa = h('div', { class: 'etapas' }, ETAPAS.map((e) => h('button', {
      type: 'button', 'aria-pressed': String(lead.status === e.id),
      onclick: async () => {
        if (lead.status === e.id) return;
        const { error: er } = await supa.from('leads').update({ status: e.id }).eq('id', lead.id);
        if (er) { aviso('Não foi possível mudar a etapa.', 'erro'); return; }
        await supa.from('lead_eventos').insert({ lead_id: lead.id, tipo: 'status', texto: `Mudou para “${e.rotulo}”` });
        lead.status = e.id; desenhar();
      } }, e.rotulo)));

    const modelo = h('select', { 'aria-label': 'Modelo de mensagem' }, Object.entries(MODELOS_ROTULO).map(([v, r]) => h('option', { value: v }, r)));
    const chamar = async () => {
      const texto = modeloMensagem(modelo.value, lead.nome.split(' ')[0]);
      await supa.from('lead_eventos').insert({ lead_id: lead.id, tipo: 'contato', texto: `Chamou no WhatsApp: ${MODELOS_ROTULO[modelo.value]}` });
      window.open(`https://wa.me/${numeroWhatsapp(lead.whatsapp)}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
      desenhar();
    };

    const valor = h('input', { name: 'valor', type: 'number', min: '0', step: '0.01', inputmode: 'decimal', value: lead.valor ?? '' });
    const entrega = h('input', { name: 'entrega', type: 'date', value: lead.data_entrega ?? '' });
    const salvarNegocio = async () => {
      const v = valor.value === '' ? null : Number(valor.value);
      if (v !== null && (!Number.isFinite(v) || v < 0)) { aviso('Valor inválido.', 'erro'); return; }
      const { error: er } = await supa.from('leads').update({ valor: v, data_entrega: entrega.value || null }).eq('id', lead.id);
      if (er) { aviso('Não foi possível salvar.', 'erro'); return; }
      lead.valor = v; lead.data_entrega = entrega.value || null; aviso('Salvo.');
    };

    const nota = h('textarea', { name: 'nota', maxlength: '2000', placeholder: 'Ex.: cliente quer em lilás, combinar prazo' });
    const addNota = async () => {
      const t = nota.value.trim(); if (!t) return;
      const { error: er } = await supa.from('lead_eventos').insert({ lead_id: lead.id, tipo: 'nota', texto: t });
      if (er) { aviso('Não foi possível salvar a anotação.', 'erro'); return; }
      desenhar();
    };

    const apagar = async () => {
      const ok = await confirmarComCodigo({ titulo: `Apagar o pedido de ${lead.nome}?`, texto: 'Os dados e as anotações deste pedido serão removidos (direito de apagar da LGPD). Não dá para desfazer.' });
      if (!ok) return;
      const { error: er } = await supa.from('leads').delete().eq('id', lead.id);
      if (er) { aviso('Não foi possível apagar.', 'erro'); return; }
      aviso('Pedido apagado.'); fechar();
    };

    const campos = Object.entries(lead.campos ?? {});
    const origem = Object.entries(lead.origem ?? {});

    limpar(painel).append(h('div', { class: 'in' },
      h('header', null,
        h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: fechar }, '← Voltar'),
        h('div', null, h('h2', null, lead.nome), h('span', { class: 'muted' }, `${ROTULO_TIPO[lead.tipo] ?? lead.tipo} · ${dataCurta(lead.criado_em)}`))),
      h('div', { class: 'bloco' }, h('h3', null, 'Etapa'), botoesEtapa),
      h('div', { class: 'bloco' }, h('h3', null, 'Contato'),
        h('p', null, telefone(lead.whatsapp)),
        h('div', { class: 'campo' }, h('label', null, 'Mensagem pronta'), modelo),
        h('button', { class: 'btn btn--wa', type: 'button', onclick: chamar }, 'Chamar no WhatsApp')),
      h('div', { class: 'bloco' }, h('h3', null, 'O que o cliente pediu'),
        h('dl', { class: 'chaves' },
          lead.peca_ref ? [h('dt', null, 'Peça'), h('dd', null, lead.peca_ref)] : null,
          campos.map(([k, v]) => [h('dt', null, bonito(k)), h('dd', null, v)]),
          lead.detalhes ? [h('dt', null, 'Detalhes'), h('dd', null, lead.detalhes)] : null,
          lead.como_conheceu ? [h('dt', null, 'Conheceu por'), h('dd', null, lead.como_conheceu)] : null,
          origem.length ? [h('dt', null, 'Origem'), h('dd', null, origem.map(([k, v]) => `${k}=${v}`).join(' · '))] : null),
        h('details', { class: 'mt075' }, h('summary', null, 'Mensagem original'), h('p', { class: 'mensagem' }, lead.mensagem))),
      h('div', { class: 'bloco' }, h('h3', null, 'Orçamento e entrega'),
        h('div', { class: 'cols2' }, campo('Valor combinado (R$)', valor), campo('Data de entrega', entrega)),
        lead.aprovado_em ? h('p', { class: 'muted' }, `Aprovado em ${dataSo(lead.aprovado_em)}`) : null,
        h('button', { class: 'btn', type: 'button', onclick: salvarNegocio }, 'Salvar')),
      h('div', { class: 'bloco' }, h('h3', null, 'Anotações e histórico'),
        campo('Nova anotação', nota),
        h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: addNota }, 'Adicionar'),
        (eventos ?? []).map((ev) => h('div', { class: 'evento' }, h('small', null, `${dataCurta(ev.criado_em)} · ${ev.tipo}`), h('span', null, ev.texto)))),
      h('div', { class: 'bloco' }, h('h3', null, 'Privacidade'),
        h('p', { class: 'muted' }, lead.consentimento_em ? `O cliente aceitou ser contatado em ${dataSo(lead.consentimento_em)}.` : 'Sem registro de aceite.'),
        h('button', { class: 'btn btn--perigo btn--mini', type: 'button', onclick: apagar }, 'Apagar este pedido'))));
  }
  desenhar();
}

/** Abre a ficha a partir de uma linha parcial (BI e Agenda carregam só algumas colunas). */
export async function abrirFichaPorId(id, aoFechar) {
  const { data, error } = await supa.from('leads').select('*').eq('id', id).single();
  if (error || !data) { aviso('Não foi possível abrir o pedido.', 'erro'); return; }
  abrirFicha(data, aoFechar);
}
