import { supa, urlImagem } from './supa.js';
import { h, limpar, aviso, dialogo, campo } from './ui.js';
import { prepararImagem, enviarImagem, apagarImagem } from './imagens.js';
import { confirmarComCodigo } from './confirmar.js';
import { ROTULO_TIPO } from './leads-logica.js';

export async function telaProdutos(raiz, filtro = 'todas') {
  limpar(raiz).append(h('p', { class: 'muted' }, 'Carregando…'));
  const [{ data: cats, error: e1 }, { data: prods, error: e2 }] = await Promise.all([
    supa.from('categorias').select('id, nome, ordem').order('ordem'),
    supa.from('produtos').select('id, categoria_id, titulo, descricao, imagem_path, alt, tipo_pedido, publicado, ordem').order('ordem'),
  ]);
  if (e1 || e2) { limpar(raiz).append(h('p', { class: 'erro' }, 'Não foi possível carregar os produtos.')); return; }
  const nomeCat = Object.fromEntries(cats.map((c) => [c.id, c.nome]));
  const recarregar = (f = filtro) => telaProdutos(raiz, f);

  function formulario(p) {
    const titulo = h('input', { name: 'titulo', value: p?.titulo ?? '', maxlength: '80', required: true, autocomplete: 'off' });
    const desc = h('textarea', { name: 'descricao', maxlength: '200' }, p?.descricao ?? '');
    const alt = h('input', { name: 'alt', value: p?.alt ?? '', maxlength: '200', autocomplete: 'off' });
    const cat = h('select', { name: 'categoria_id', required: true }, cats.map((c) => h('option', { value: c.id, selected: p ? c.id === p.categoria_id : false }, c.nome)));
    const tipo = h('select', { name: 'tipo_pedido' }, Object.entries(ROTULO_TIPO).map(([v, r]) => h('option', { value: v, selected: v === (p?.tipo_pedido ?? 'outro') }, r)));
    const foto = h('input', { name: 'foto', type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    const pub = h('input', { name: 'publicado', type: 'checkbox', checked: p ? p.publicado : true });
    return h('div', null,
      p ? h('img', { class: 'miniatura foto-grande', src: urlImagem(p.imagem_path), alt: p.alt || p.titulo }) : null,
      campo(p ? 'Trocar a foto (opcional)' : 'Foto', foto, 'JPG, PNG ou WebP. O painel reduz o tamanho sozinho.'),
      campo('Título', titulo),
      campo('Descrição curta', desc, 'Uma frase. Sem preço.'),
      campo('Texto alternativo da foto', alt, 'Descreve a foto para quem não enxerga e para o Google.'),
      h('div', { class: 'cols2' }, campo('Categoria', cat), campo('Tipo de pedido', tipo, 'Muda os campos do orçamento')),
      h('div', { class: 'campo campo--check' }, pub, h('label', { for: (pub.id = 'pub-' + Math.random().toString(36).slice(2, 7)) }, 'Mostrar no site')));
  }

  async function salvar(fd, existente) {
    const titulo = String(fd.get('titulo')).trim();
    const descricao = String(fd.get('descricao')).trim();
    const alt = String(fd.get('alt')).trim();
    if (!titulo) throw new Error('Escreva um título.');
    if (descricao.length > 200) throw new Error('A descrição passou de 200 letras.');
    const arquivo = fd.get('foto');
    const temArquivo = arquivo && arquivo.size > 0;
    if (!existente && !temArquivo) throw new Error('Escolha uma foto.');

    let novoCaminho = null;
    if (temArquivo) novoCaminho = await enviarImagem(await prepararImagem(arquivo));

    const dados = {
      titulo, descricao, alt,
      categoria_id: fd.get('categoria_id'),
      tipo_pedido: fd.get('tipo_pedido'),
      publicado: fd.get('publicado') === 'on',
      imagem_path: novoCaminho ?? existente.imagem_path,
    };
    const { error } = existente
      ? await supa.from('produtos').update(dados).eq('id', existente.id)
      : await supa.from('produtos').insert({ ...dados, ordem: (prods.reduce((m, x) => Math.max(m, x.ordem), -1)) + 1 });
    if (error) { if (novoCaminho) await apagarImagem(novoCaminho); throw new Error('Não foi possível salvar.'); }
    if (existente && novoCaminho) await apagarImagem(existente.imagem_path);
  }

  async function abrir(p) {
    if (!cats.length) { aviso('Crie uma categoria antes.', 'erro'); return; }
    const r = await dialogo({ titulo: p ? 'Editar produto' : 'Novo produto', rotuloOk: 'Salvar', corpo: formulario(p), aoConfirmar: (fd) => salvar(fd, p) });
    if (r) aviso('Produto salvo.');
    recarregar();
  }

  async function alternar(p) {
    const { error } = await supa.from('produtos').update({ publicado: !p.publicado }).eq('id', p.id);
    aviso(error ? 'Não foi possível alterar.' : (p.publicado ? 'Produto escondido do site.' : 'Produto publicado.'), error ? 'erro' : 'ok');
    recarregar();
  }

  async function apagar(p) {
    const ok = await confirmarComCodigo({ titulo: `Apagar “${p.titulo}”?`, texto: 'O produto e a foto serão removidos do site.' });
    if (!ok) return;
    const { error } = await supa.from('produtos').delete().eq('id', p.id);
    if (!error) await apagarImagem(p.imagem_path);
    aviso(error ? 'Não foi possível apagar.' : 'Produto apagado.', error ? 'erro' : 'ok');
    recarregar();
  }

  const seletor = h('select', { 'aria-label': 'Filtrar por categoria', onchange: (e) => recarregar(e.target.value), class: 'seletor' },
    h('option', { value: 'todas' }, 'Todas as categorias'),
    cats.map((c) => h('option', { value: c.id, selected: c.id === filtro }, c.nome)));
  const visiveis = prods.filter((p) => filtro === 'todas' || p.categoria_id === filtro);

  limpar(raiz).append(
    h('div', { class: 'cabeca' }, h('h2', null, 'Produtos'), h('button', { class: 'btn', type: 'button', onclick: () => abrir(null) }, '+ Novo produto')),
    h('div', { class: 'mb1' }, seletor),
    visiveis.length
      ? h('div', { class: 'cartao-lista' }, visiveis.map((p) => h('div', { class: 'linha' },
          h('img', { class: 'miniatura', src: urlImagem(p.imagem_path), alt: p.alt || p.titulo, loading: 'lazy' }),
          h('div', { class: 'info' },
            h('strong', null, p.titulo),
            h('span', { class: 'muted' }, nomeCat[p.categoria_id] ?? ''),
            h('span', { class: p.publicado ? 'etiqueta' : 'etiqueta etiqueta--off' }, p.publicado ? 'No site' : 'Escondido')),
          h('div', { class: 'acoes' },
            h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: () => abrir(p) }, 'Editar'),
            h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: () => alternar(p) }, p.publicado ? 'Esconder' : 'Publicar'),
            h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: () => apagar(p) }, 'Apagar')))))
      : h('div', { class: 'cartao-lista' }, h('p', { class: 'vazio' }, 'Nenhum produto aqui ainda.')));
}
