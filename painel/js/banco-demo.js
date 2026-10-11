// Banco de DEMONSTRAÇÃO em memória, só para a prévia pública do painel (dados 100% fictícios).
// Imita o pedaço da API do Supabase que o painel usa. Não existe segurança aqui, e é de propósito:
// este código só vai para a prévia, nunca para o painel real (veja scripts/gerar-preview.mjs).

const FINAIS_GANHO = ['aprovado', 'em_producao', 'entregue'];
const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clone = (x) => (x === undefined ? x : structuredClone(x));
const uuid = () => globalThis.crypto.randomUUID();

/* Pedidos fictícios, sempre relativos a "hoje" para o Resumo e a Agenda parecerem vivos.
   [nome, tipo, dias atrás que chegou, status, valor, entrega (dias a partir de hoje), origem, como conheceu] */
const PEDIDOS = [
  ['Mariana Costa', 'caderneta', 0, 'novo', null, null, 'ig', 'Instagram'],
  ['Rafael Lima', 'festa', 1, 'novo', null, null, 'gclid', null],
  ['Beatriz Souza', 'agenda', 2, 'em_conversa', null, null, 'ig', 'Instagram'],
  ['Lucas Almeida', 'empresa', 3, 'orcamento_enviado', 1800, null, 'none', 'Indicação de amigo ou familiar'],
  ['Camila Rocha', 'caderneta', 4, 'aprovado', 95, 5, 'ig', 'Instagram'],
  ['Gustavo Ribeiro', 'brinde', 5, 'em_producao', 240, 2, 'gclid', null],
  ['Fernanda Dias', 'feltro', 6, 'aprovado', 130, 9, 'none', 'Indicação de amigo ou familiar'],
  ['Thiago Martins', 'festa', 8, 'em_producao', 420, 0, 'ig', 'Instagram'],
  ['Juliana Pires', 'caderneta', 9, 'entregue', 90, -4, 'ig', 'Instagram'],
  ['Paulo Henrique', 'empresa', 10, 'aprovado', 2600, 12, 'gclid', null],
  ['Carolina Matos', 'agenda', 12, 'em_producao', 150, -2, 'none', 'Google'],
  ['Bruno Cardoso', 'caderneta', 14, 'perdido', 85, null, 'ig', 'Instagram'],
  ['Aline Barros', 'festa', 16, 'entregue', 380, -9, 'gclid', null],
  ['Diego Nunes', 'brinde', 18, 'orcamento_enviado', 310, null, 'ig', 'Instagram'],
  ['Patrícia Lopes', 'caderneta', 20, 'entregue', 95, -12, 'none', 'Indicação de amigo ou familiar'],
  ['Rodrigo Teixeira', 'empresa', 22, 'aprovado', 1450, 16, 'gclid', null],
  ['Larissa Moura', 'feltro', 24, 'entregue', 120, -16, 'ig', 'Instagram'],
  ['Felipe Araújo', 'caderneta', 26, 'perdido', null, null, 'none', 'Outro'],
  ['Amanda Freitas', 'festa', 28, 'entregue', 450, -20, 'ig', 'Instagram'],
  ['Vinícius Gomes', 'agenda', 31, 'em_conversa', null, null, 'gclid', null],
  ['Renata Campos', 'caderneta', 33, 'entregue', 100, -24, 'none', 'Indicação de amigo ou familiar'],
  ['Eduardo Pinto', 'brinde', 36, 'entregue', 220, -27, 'ig', 'Instagram'],
  ['Tatiane Melo', 'festa', 39, 'perdido', 500, null, 'gclid', null],
  ['Leandro Rezende', 'empresa', 42, 'entregue', 3100, -30, 'none', 'Google'],
  ['Débora Cunha', 'caderneta', 45, 'entregue', 90, -34, 'ig', 'Instagram'],
  ['Marcelo Vieira', 'feltro', 49, 'entregue', 140, -38, 'none', 'Indicação de amigo ou familiar'],
  ['Priscila Santos', 'agenda', 53, 'entregue', 160, -41, 'ig', 'Instagram'],
  ['Hugo Barbosa', 'caderneta', 57, 'entregue', 95, -45, 'gclid', null],
];

const CAMPOS = {
  caderneta: (n) => ({ nome_capa: n.split(' ')[0], tema: 'fadinha', cores: 'lilás e rosa' }),
  agenda: (n) => ({ nome_capa: `Agenda de ${n.split(' ')[0]}`, tema: 'floral', ano: '2027' }),
  festa: (n) => ({ tema: 'patinhos', nome_festa: `${n.split(' ')[0]}, 3 anos`, itens: 'topo de bolo e centro de mesa' }),
  feltro: () => ({ peca: 'um ganso de feltro', cores: 'creme com laço rosa' }),
  brinde: () => ({ item: 'chaveiro abridor', texto: 'Obrigado!', qtd: '30' }),
  empresa: () => ({ empresa: 'Empresa Exemplo Ltda', item: 'canetas e chaveiros', qtd: '100', logo: 'Sim, vou enviar' }),
};
const ROTULO = { caderneta: 'Caderneta de vacinação ou saúde', agenda: 'Agenda, caderno ou diário', festa: 'Festa e decoração', feltro: 'Arte em feltro', brinde: 'Brindes e gravação a laser', empresa: 'Brindes para empresa' };

export function criarBanco({ hoje = new Date(), grupos = [], produtos = [] } = {}) {
  const dia = (offset, h = 12) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + offset, h, 0, 0);
  const agora = hoje.toISOString();

  const categorias = grupos.map((g, i) => ({ id: uuid(), slug: g.slug, nome: g.nome, ordem: i, visivel: true, criado_em: agora }));
  const idDaCategoria = Object.fromEntries(categorias.map((c) => [c.slug, c.id]));
  const prod = produtos.map((p, i) => ({
    id: uuid(), categoria_id: idDaCategoria[p.grupo], titulo: p.titulo, descricao: p.desc, imagem_path: `produtos/${p.img}.jpg`,
    alt: p.alt, tipo_pedido: p.tipo, publicado: true, ordem: i, criado_em: agora, atualizado_em: agora,
  }));

  const leads = PEDIDOS.map(([nome, tipo, atras, status, valor, entrega, origem, como], i) => {
    const criado = dia(-atras, 9 + (i % 8));
    const ganho = FINAIS_GANHO.includes(status);
    const aprovado = ganho ? new Date(Math.min(criado.getTime() + (1 + (i % 3)) * 86400000, hoje.getTime())) : null;
    const campos = CAMPOS[tipo](nome);
    return {
      id: uuid(), criado_em: criado.toISOString(), atualizado_em: criado.toISOString(), tipo, peca_ref: i % 3 === 0 ? 'Caderneta de vacinação · Fadinha' : null,
      nome, whatsapp: `719000000${String(i).padStart(2, '0')}`.slice(0, 11), como_conheceu: como, detalhes: i % 4 === 0 ? 'Quero para presente, preciso até o fim do mês.' : null,
      campos, mensagem: `Olá, Viviane! Vim pelo site e quero um orçamento.\n\n*Pedido:* ${ROTULO[tipo]}\n\nMeu nome é ${nome}.`,
      status, valor, aprovado_em: aprovado ? aprovado.toISOString() : null,
      data_entrega: entrega === null ? null : chave(dia(entrega)),
      origem: origem === 'ig' ? { utm_source: 'ig' } : origem === 'gclid' ? { gclid: 'DEMO-gclid' } : {},
      pagina: '/', consentimento_em: criado.toISOString(),
    };
  });

  return { hoje, tabelas: { leads, lead_eventos: [], categorias, produtos: prod, auditoria: [] } };
}

/* gatilhos do banco real que o painel e o BI esperam */
function aplicarGatilhos(tabela, antes, linha) {
  if (tabela === 'leads' && 'status' in linha || (tabela === 'leads' && !antes)) {
    linha.aprovado_em = FINAIS_GANHO.includes(linha.status) ? (linha.aprovado_em ?? new Date().toISOString()) : null;
  }
  if (tabela === 'leads') linha.atualizado_em = new Date().toISOString();
}

const PADROES = {
  leads: () => ({ status: 'novo', valor: null, aprovado_em: null, data_entrega: null, campos: {}, origem: {}, criado_em: new Date().toISOString() }),
  lead_eventos: () => ({ criado_em: new Date().toISOString() }),
  categorias: () => ({ visivel: true, ordem: 0, criado_em: new Date().toISOString() }),
  produtos: () => ({ publicado: false, ordem: 0, descricao: '', alt: '', criado_em: new Date().toISOString() }),
};

class Consulta {
  constructor(banco, tabela) {
    this.banco = banco; this.tabela = tabela; this.op = 'select'; this.filtros = []; this.ordens = []; this.max = null; this.unico = false; this.valores = null;
  }
  select() { return this; }
  insert(v) { this.op = 'insert'; this.valores = v; return this; }
  update(v) { this.op = 'update'; this.valores = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.filtros.push((r) => r[c] === v); return this; }
  not(c, op, v) { if (op === 'is' && v === null) this.filtros.push((r) => r[c] !== null && r[c] !== undefined); return this; }
  order(c, { ascending = true } = {}) { this.ordens.push([c, ascending]); return this; }
  limit(n) { this.max = n; return this; }
  single() { this.unico = true; return this; }
  then(ok, falha) { return Promise.resolve(this.executar()).then(ok, falha); }

  executar() {
    const linhas = this.banco.tabelas[this.tabela];
    if (!linhas) return { data: null, error: { message: `tabela desconhecida: ${this.tabela}` } };
    const casa = (r) => this.filtros.every((f) => f(r));
    if (this.op === 'insert') {
      const lote = Array.isArray(this.valores) ? this.valores : [this.valores];
      for (const v of lote) {
        const nova = { id: uuid(), ...PADROES[this.tabela]?.(), ...clone(v) };
        aplicarGatilhos(this.tabela, null, nova);
        linhas.push(nova);
      }
      return { data: null, error: null };
    }
    if (this.op === 'update') {
      for (const r of linhas.filter(casa)) { const antes = { ...r }; Object.assign(r, clone(this.valores)); aplicarGatilhos(this.tabela, antes, r); }
      return { data: null, error: null };
    }
    if (this.op === 'delete') {
      const ids = new Set(linhas.filter(casa).map((r) => r.id));
      this.banco.tabelas[this.tabela] = linhas.filter((r) => !ids.has(r.id));
      if (this.tabela === 'leads') this.banco.tabelas.lead_eventos = this.banco.tabelas.lead_eventos.filter((e) => !ids.has(e.lead_id));
      return { data: null, error: null };
    }
    let r = linhas.filter(casa);
    for (const [c, asc] of [...this.ordens].reverse()) r.sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1));
    if (this.max !== null) r = r.slice(0, this.max);
    if (this.unico) return r.length ? { data: clone(r[0]), error: null } : { data: null, error: { message: 'Nenhum registro encontrado' } };
    return { data: clone(r), error: null };
  }
}

export function criarCliente(banco) {
  const ok = (data = {}) => Promise.resolve({ data, error: null });
  return {
    from: (tabela) => new Consulta(banco, tabela),
    storage: { from: () => ({ upload: () => ok({ path: 'demo' }), remove: () => ok([]), list: () => ok([]) }) },
    auth: {
      getSession: () => ok({ session: { user: { id: 'demo', email: 'viviane@exemplo.com.br' } } }),
      getUser: () => ok({ user: { id: 'demo', email: 'viviane@exemplo.com.br' } }),
      signInWithPassword: () => ok({}),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      mfa: {
        getAuthenticatorAssuranceLevel: () => ok({ currentLevel: 'aal2', nextLevel: 'aal2' }),
        listFactors: () => ok({ totp: [{ id: 'demo-fator', status: 'verified' }], all: [{ id: 'demo-fator', status: 'verified' }] }),
        enroll: () => ok({ id: 'demo-fator-2', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>', secret: 'DEMONSTRACAO' } }),
        unenroll: () => ok({}),
        challengeAndVerify: ({ code }) => (/^\d{6}$/.test(String(code)) ? ok({}) : Promise.resolve({ data: null, error: { message: 'codigo invalido' } })),
      },
    },
  };
}
