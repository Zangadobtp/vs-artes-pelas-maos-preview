// Ajudantes de tela. Regra de segurança: dados vindos do banco NUNCA entram por innerHTML.
// Os pedidos têm texto digitado por desconhecidos; tudo é inserido como texto (textContent).

export function h(tag, props, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

export function limpar(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function aviso(texto, tipo = 'ok') {
  const caixa = document.getElementById('avisos');
  const el = h('div', { class: `aviso aviso--${tipo}`, role: tipo === 'erro' ? 'alert' : 'status' }, texto);
  caixa.append(el);
  setTimeout(() => el.remove(), tipo === 'erro' ? 7000 : 3500);
}

export const dataCurta = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
export const dataSo = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '');
export const dinheiro = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

/** Janela de confirmação. Devolve uma promessa com o resultado da função `aoConfirmar` (ou null se cancelou). */
export function dialogo({ titulo, corpo, rotuloOk = 'Confirmar', perigo = false, aoConfirmar }) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'dialogo', 'aria-labelledby': 'dlg-titulo' });
    const erro = h('p', { class: 'erro', role: 'alert' });
    const ok = h('button', { class: `btn ${perigo ? 'btn--perigo' : ''}`, type: 'submit' }, rotuloOk);
    const cancelar = h('button', { class: 'btn btn--suave', type: 'button', onclick: () => { dlg.close(); } }, 'Cancelar');
    const form = h('form', { method: 'dialog', onsubmit: async (e) => {
      e.preventDefault();
      ok.disabled = true; erro.textContent = '';
      try {
        const r = await aoConfirmar(new FormData(form));
        dlg.dataset.res = '1'; dlg.close(); resolve(r ?? true);
      } catch (x) { erro.textContent = x.message || 'Não foi possível concluir.'; ok.disabled = false; }
    } }, h('h2', { id: 'dlg-titulo' }, titulo), corpo, erro, h('div', { class: 'linha-botoes' }, cancelar, ok));
    dlg.append(form);
    dlg.addEventListener('close', () => { dlg.remove(); if (!dlg.dataset.res) resolve(null); });
    document.body.append(dlg);
    dlg.showModal();
    dlg.querySelector('input, textarea, button')?.focus();
  });
}

export const campo = (rotulo, input, dica) => {
  const id = input.id || `c-${Math.random().toString(36).slice(2, 8)}`;
  input.id = id;
  return h('div', { class: 'campo' }, h('label', { for: id }, rotulo), input, dica ? h('small', null, dica) : null);
};

/** Cria elementos SVG (o namespace é diferente do HTML). Atributos como atributos, nunca style="" (a CSP bloqueia). */
export function svg(tag, attrs, ...filhos) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs ?? {})) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const f of filhos.flat(Infinity)) if (f !== null && f !== undefined && f !== false) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

/** Substitui o conteúdo de `raiz`. Ignora null/false (Element.append(null) escreveria o texto "null"). */
export function montar(raiz, ...itens) {
  limpar(raiz);
  raiz.append(...itens.flat(Infinity).filter((i) => i !== null && i !== undefined && i !== false));
  return raiz;
}
