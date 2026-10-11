// Regras do CRM sem DOM e sem rede: etapas, modelos de mensagem, WhatsApp e CSV.
// Fica separado para ser testado em Node (tests/leads-logica.test.mjs).

export const ETAPAS = [
  { id: 'novo', rotulo: 'Novo' },
  { id: 'em_conversa', rotulo: 'Em conversa' },
  { id: 'orcamento_enviado', rotulo: 'Orçamento enviado' },
  { id: 'aprovado', rotulo: 'Aprovado' },
  { id: 'em_producao', rotulo: 'Em produção' },
  { id: 'entregue', rotulo: 'Entregue' },
  { id: 'perdido', rotulo: 'Perdido' },
];

export const ROTULO_TIPO = {
  caderneta: 'Caderneta',
  agenda: 'Agenda ou caderno',
  festa: 'Festa',
  feltro: 'Feltro',
  brinde: 'Brinde a laser',
  empresa: 'Empresa',
  outro: 'Outro',
};

export function rotuloEtapa(id) {
  return ETAPAS.find((e) => e.id === id)?.rotulo ?? id;
}

/** Próxima etapa do funil. Entregue e perdido são finais. */
export function proximaEtapa(id) {
  const i = ETAPAS.findIndex((e) => e.id === id);
  if (i < 0 || id === 'entregue' || id === 'perdido') return null;
  return ETAPAS[i + 1].id;
}

const MODELOS = {
  primeiro_contato: (n) =>
    `Olá, ${n}! Aqui é a Viviane, da VS Artes pelas Mãos. Recebi o seu pedido de orçamento e já vou preparar tudo com carinho. Posso te fazer algumas perguntas para acertar os detalhes?`,
  orcamento: (n) =>
    `Olá, ${n}! Segue o orçamento do seu pedido. Valor: R$ ____ . Prazo: ____ . Se estiver tudo certo, me confirma aqui que eu já começo a produção.`,
  lembrete: (n) =>
    `Oi, ${n}! Passando para saber se você conseguiu ver o orçamento. Qualquer ajuste, é só me dizer.`,
};
export const MODELOS_ROTULO = { primeiro_contato: 'Primeiro contato', orcamento: 'Enviar orçamento', lembrete: 'Lembrete' };

export function modeloMensagem(chave, nome) {
  if (!Object.hasOwn(MODELOS, chave)) throw new Error(`Modelo desconhecido: ${chave}`);
  return MODELOS[chave](nome);
}

/** Dígitos do WhatsApp prontos para wa.me, com o 55 do Brasil quando falta. */
export function numeroWhatsapp(valor) {
  const d = String(valor ?? '').replace(/\D/g, '');
  return d.length <= 11 ? `55${d}` : d;
}

const COLUNAS = ['id', 'criado_em', 'tipo', 'nome', 'whatsapp', 'status', 'aprovado_em', 'valor', 'data_entrega', 'detalhes', 'origem'];

function celula(v) {
  let s = v === null || v === undefined ? '' : typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${k}=${x}`).join('&') : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // planilhas executariam isto como fórmula
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV com ponto e vírgula (Excel em português). O chamador adiciona o BOM ao baixar. */
export function paraCsv(leads) {
  const linhas = [COLUNAS.map((c) => `"${c}"`).join(';')];
  for (const l of leads) linhas.push(COLUNAS.map((c) => celula(l[c])).join(';'));
  return linhas.join('\r\n');
}
