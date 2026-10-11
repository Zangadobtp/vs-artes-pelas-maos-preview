import { supa } from './supa.js';
import { h, limpar, aviso, dialogo, campo } from './ui.js';
import { gerarSlug, slugUnico } from './texto.js';
import { confirmarComCodigo } from './confirmar.js';

export async function telaCategorias(raiz) {
  limpar(raiz).append(h('p', { class: 'muted' }, 'Carregando…'));
  const [{ data: cats, error }, { data: prods }] = await Promise.all([
    supa.from('categorias').select('id, slug, nome, ordem, visivel').order('ordem'),
    supa.from('produtos').select('categoria_id'),
  ]);
  if (error) { limpar(raiz).append(h('p', { class: 'erro' }, 'Não foi possível carregar as categorias.')); return; }
  const contagem = {};
  for (const p of prods ?? []) contagem[p.categoria_id] = (contagem[p.categoria_id] ?? 0) + 1;

  const recarregar = () => telaCategorias(raiz);

  async function mover(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= cats.length) return;
    const ordem = cats.map((c) => c.id);
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    const resultados = await Promise.all(ordem.map((id, n) => supa.from('categorias').update({ ordem: n }).eq('id', id)));
    if (resultados.some((r) => r.error)) aviso('Não foi possível reordenar.', 'erro');
    recarregar();
  }

  function formularioNome(inicial = '') {
    const nome = h('input', { name: 'nome', value: inicial, maxlength: '60', required: true, autocomplete: 'off' });
    return { nome, corpo: campo('Nome da categoria', nome, 'Aparece nos filtros do site') };
  }

  async function nova() {
    const { nome, corpo } = formularioNome();
    await dialogo({
      titulo: 'Nova categoria', rotuloOk: 'Criar', corpo,
      aoConfirmar: async (fd) => {
        const texto = String(fd.get('nome')).trim();
        if (!texto) throw new Error('Escreva um nome.');
        const slug = slugUnico(gerarSlug(texto), cats.map((c) => c.slug));
        const { error: e } = await supa.from('categorias').insert({ nome: texto, slug, ordem: cats.length, visivel: true });
        if (e) throw new Error('Não foi possível criar.');
        aviso('Categoria criada.');
      },
    });
    recarregar();
  }

  async function renomear(c) {
    const { corpo } = formularioNome(c.nome);
    const r = await dialogo({
      titulo: 'Renomear categoria', rotuloOk: 'Salvar', corpo,
      aoConfirmar: async (fd) => {
        const texto = String(fd.get('nome')).trim();
        if (!texto) throw new Error('Escreva um nome.');
        const { error: e } = await supa.from('categorias').update({ nome: texto }).eq('id', c.id);
        if (e) throw new Error('Não foi possível salvar.');
      },
    });
    if (r) aviso('Nome atualizado.');
    recarregar();
  }

  async function alternar(c) {
    const { error: e } = await supa.from('categorias').update({ visivel: !c.visivel }).eq('id', c.id);
    aviso(e ? 'Não foi possível alterar.' : (c.visivel ? 'Categoria oculta no site.' : 'Categoria visível no site.'), e ? 'erro' : 'ok');
    recarregar();
  }

  async function apagar(c) {
    const n = contagem[c.id] ?? 0;
    if (n > 0) { aviso(`“${c.nome}” tem ${n} produto(s). Mude ou apague os produtos antes.`, 'erro'); return; }
    const ok = await confirmarComCodigo({ titulo: `Apagar “${c.nome}”?`, texto: 'Essa ação não pode ser desfeita.' });
    if (!ok) return;
    const { error: e } = await supa.from('categorias').delete().eq('id', c.id);
    aviso(e ? 'Não foi possível apagar.' : 'Categoria apagada.', e ? 'erro' : 'ok');
    recarregar();
  }

  const lista = cats.length
    ? h('div', { class: 'cartao-lista' }, cats.map((c, i) => h('div', { class: 'linha' },
        h('div', { class: 'info' },
          h('strong', null, c.nome),
          h('span', { class: 'muted' }, `${contagem[c.id] ?? 0} produto(s) · ${c.slug}`),
          c.visivel ? null : h('span', { class: 'etiqueta etiqueta--off' }, 'Oculta no site')),
        h('div', { class: 'acoes' },
          h('button', { class: 'btn btn--suave btn--mini', type: 'button', 'aria-label': `Subir ${c.nome}`, disabled: i === 0, onclick: () => mover(i, -1) }, '↑'),
          h('button', { class: 'btn btn--suave btn--mini', type: 'button', 'aria-label': `Descer ${c.nome}`, disabled: i === cats.length - 1, onclick: () => mover(i, 1) }, '↓'),
          h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: () => renomear(c) }, 'Renomear'),
          h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: () => alternar(c) }, c.visivel ? 'Ocultar' : 'Mostrar'),
          h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: () => apagar(c) }, 'Apagar')))))
    : h('div', { class: 'cartao-lista' }, h('p', { class: 'vazio' }, 'Nenhuma categoria ainda.'));

  limpar(raiz).append(
    h('div', { class: 'cabeca' }, h('h2', null, 'Categorias'), h('button', { class: 'btn', type: 'button', onclick: nova }, '+ Nova categoria')),
    lista);
}
