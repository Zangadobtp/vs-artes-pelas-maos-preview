// Roteador do painel: decide a tela pelo estado de acesso (sem sessão, cadastrar MFA, pedir código, painel).
import { supa } from './supa.js';
import * as auth from './auth.js';
import { h, limpar, aviso, campo } from './ui.js';
import { telaPedidos } from './leads.js';
import { telaResumo } from './resumo.js';
import { telaAgenda } from './agenda.js';
import { telaCategorias } from './categorias.js';
import { telaProdutos } from './produtos.js';

const app = document.getElementById('app');
let pararInatividade = null;
let ouvinteHash = null;

const NS = 'http://www.w3.org/2000/svg';
function icone(d) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p);
  return s;
}
const ICONES = {
  resumo: 'M5 20V10 M12 20V4 M19 20v-7',
  agenda: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  pedidos: 'M4 5h16v14H4z M4 9h16 M9 5v14',
  catalogo: 'M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5',
  conta: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0',
};

function entradaShell(...conteudo) {
  return h('main', { class: 'entrada' }, h('div', { class: 'cartao' },
    h('img', { class: 'logo', src: 'assets/logo-sm.png', alt: 'VS Artes pelas Mãos' }), ...conteudo));
}

/* ---------- telas de entrada ---------- */
function telaLogin() {
  const email = h('input', { name: 'email', type: 'email', autocomplete: 'username', required: true, autocapitalize: 'none', spellcheck: 'false' });
  const senha = h('input', { name: 'senha', type: 'password', autocomplete: 'current-password', required: true });
  const erro = h('p', { class: 'erro', role: 'alert' });
  const botao = h('button', { class: 'btn w100', type: 'submit' }, 'Entrar');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault(); botao.disabled = true; erro.textContent = '';
    try { await auth.entrar(email.value, senha.value); senha.value = ''; await iniciar(); }
    catch (x) { erro.textContent = x.message; botao.disabled = false; }
  } }, campo('E-mail', email), campo('Senha', senha), erro, botao);
  limpar(app).append(entradaShell(h('h1', null, 'Painel'), h('p', { class: 'muted centro' }, 'Acesso só da Viviane.'), form));
  email.focus();
}

async function telaCadastrarMfa() {
  limpar(app).append(entradaShell(h('h1', null, 'Proteja sua conta'), h('p', null, 'Preparando…')));
  let mfa;
  try { mfa = await auth.cadastrarMfa(); } catch (x) { limpar(app).append(entradaShell(h('p', { class: 'erro' }, x.message), h('button', { class: 'btn', type: 'button', onclick: telaCadastrarMfa }, 'Tentar de novo'))); return; }
  const codigo = h('input', { name: 'codigo', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', required: true });
  const erro = h('p', { class: 'erro', role: 'alert' });
  const botao = h('button', { class: 'btn w100', type: 'submit' }, 'Ativar');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault(); botao.disabled = true; erro.textContent = '';
    try { await auth.confirmarCodigo(mfa.factorId, codigo.value); await iniciar(); }
    catch (x) { erro.textContent = x.message; botao.disabled = false; }
  } }, campo('Código de 6 números do app', codigo), erro, botao);
  limpar(app).append(entradaShell(
    h('h1', null, 'Proteja sua conta'),
    h('p', null, '1. Abra um app autenticador no celular (Google Authenticator, Microsoft Authenticator ou Authy).'),
    h('p', null, '2. Escaneie o código abaixo ou digite a chave.'),
    h('img', { class: 'qr', src: mfa.qr, alt: 'Código QR para o app autenticador' }),
    h('p', { class: 'segredo' }, mfa.segredo),
    h('p', { class: 'muted' }, '3. Digite o código que o app mostra.'),
    form,
    h('p', { class: 'muted mt1' }, 'Depois de entrar, cadastre um segundo aparelho na aba Conta. Ele é a sua reserva se perder o celular.'),
    h('button', { class: 'btn btn--suave w100 mt05', type: 'button', onclick: sairETelaLogin }, 'Cancelar')));
  codigo.focus();
}

function telaVerificarMfa() {
  const codigo = h('input', { name: 'codigo', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', required: true });
  const erro = h('p', { class: 'erro', role: 'alert' });
  const botao = h('button', { class: 'btn w100', type: 'submit' }, 'Confirmar');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault(); botao.disabled = true; erro.textContent = '';
    try { await auth.verificarCodigo(codigo.value); await iniciar(); }
    catch (x) { erro.textContent = x.message; botao.disabled = false; codigo.select(); }
  } }, campo('Código do app autenticador', codigo, '6 números que aparecem no seu celular'), erro, botao);
  limpar(app).append(entradaShell(h('h1', null, 'Quase lá'), form,
    h('button', { class: 'btn btn--suave w100 mt075', type: 'button', onclick: sairETelaLogin }, 'Sair')));
  codigo.focus();
}

async function sairETelaLogin() {
  pararInatividade?.(); pararInatividade = null;
  await auth.sair();
  telaLogin();
}

/* ---------- painel ---------- */
const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'pedidos', rotulo: 'Pedidos' },
  { id: 'agenda', rotulo: 'Agenda' },
  { id: 'catalogo', rotulo: 'Catálogo' },
  { id: 'conta', rotulo: 'Conta' },
];
let subCatalogo = 'produtos';

async function telaConta(raiz) {
  const { data } = await supa.auth.getUser();
  const n = await auth.quantosAutenticadores();
  limpar(raiz).append(
    h('div', { class: 'cabeca' }, h('h2', null, 'Conta')),
    h('div', { class: 'bloco' }, h('h3', null, 'Você'), h('p', null, data?.user?.email ?? '')),
    h('div', { class: 'bloco' }, h('h3', null, 'Segurança'),
      h('p', null, `Autenticadores ativos: ${n}.`),
      n < 2 ? h('p', { class: 'muted' }, 'Cadastre um segundo aparelho ou app. Se você perder o celular, ele evita ficar sem acesso.') : null,
      n < 3 ? h('button', { class: 'btn btn--suave', type: 'button', onclick: () => adicionarReserva(raiz) }, 'Adicionar autenticador de reserva') : null),
    h('div', { class: 'bloco' }, h('h3', null, 'Sair'),
      h('button', { class: 'btn btn--suave', type: 'button', onclick: sairETelaLogin }, 'Sair deste aparelho'),
      h('button', { class: 'btn btn--suave ml05', type: 'button', onclick: async () => { await supa.auth.signOut({ scope: 'global' }); telaLogin(); } }, 'Sair de todos os aparelhos')));
}

async function adicionarReserva(raiz) {
  let mfa;
  try { mfa = await auth.cadastrarMfa('Reserva'); } catch (x) { aviso(x.message, 'erro'); return; }
  const codigo = h('input', { name: 'codigo', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6' });
  const erro = h('p', { class: 'erro', role: 'alert' });
  limpar(raiz).append(
    h('div', { class: 'cabeca' }, h('h2', null, 'Autenticador de reserva')),
    h('div', { class: 'bloco' },
      h('p', null, 'No segundo aparelho, abra o app autenticador e escaneie:'),
      h('img', { class: 'qr', src: mfa.qr, alt: 'Código QR do autenticador de reserva' }),
      h('p', { class: 'segredo' }, mfa.segredo),
      campo('Código de 6 números', codigo), erro,
      h('div', { class: 'linha-botoes' },
        h('button', { class: 'btn btn--suave', type: 'button', onclick: () => telaConta(raiz) }, 'Cancelar'),
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          erro.textContent = '';
          try { await auth.confirmarCodigo(mfa.factorId, codigo.value); aviso('Autenticador de reserva ativado.'); telaConta(raiz); }
          catch (x) { erro.textContent = x.message; }
        } }, 'Ativar'))));
}

function telaPainel() {
  const raiz = h('div', { class: 'conteudo', id: 'conteudo' });
  const nav = h('nav', { class: 'abas', 'aria-label': 'Seções' });

  function mostrar(id) {
    if (!ABAS.some((a) => a.id === id)) id = 'resumo';
    if (location.hash !== `#/${id}`) history.replaceState(null, '', `#/${id}`);
    for (const b of nav.querySelectorAll('button')) { if (b.dataset.aba === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
    if (id === 'resumo') telaResumo(raiz);
    else if (id === 'pedidos') telaPedidos(raiz);
    else if (id === 'agenda') telaAgenda(raiz);
    else if (id === 'conta') telaConta(raiz);
    else {
      limpar(raiz);
      const sub = h('div', { class: 'subabas' },
        h('button', { type: 'button', 'aria-pressed': String(subCatalogo === 'produtos'), onclick: () => { subCatalogo = 'produtos'; mostrar('catalogo'); } }, 'Produtos'),
        h('button', { type: 'button', 'aria-pressed': String(subCatalogo === 'categorias'), onclick: () => { subCatalogo = 'categorias'; mostrar('catalogo'); } }, 'Categorias'));
      const area = h('div');
      raiz.append(sub, area);
      (subCatalogo === 'produtos' ? telaProdutos : telaCategorias)(area);
    }
  }

  // navegação feita por outras telas (ex.: aviso de entregas atrasadas) muda só o endereço
  if (ouvinteHash) window.removeEventListener('hashchange', ouvinteHash);
  ouvinteHash = () => mostrar((location.hash || '').replace('#/', ''));
  window.addEventListener('hashchange', ouvinteHash);

  for (const a of ABAS) nav.append(h('button', { type: 'button', 'data-aba': a.id, onclick: () => mostrar(a.id) }, icone(ICONES[a.id]), a.rotulo));

  limpar(app).append(
    h('header', { class: 'topo' }, h('div', { class: 'in' },
      h('img', { src: 'assets/logo-sm.png', alt: 'VS Artes pelas Mãos' }),
      h('button', { class: 'btn btn--suave btn--mini', type: 'button', onclick: sairETelaLogin }, 'Sair'))),
    raiz, nav);
  mostrar((location.hash || '').replace('#/', '') || 'resumo');

  pararInatividade?.();
  pararInatividade = auth.iniciarInatividade(async () => { aviso('Você ficou um tempo sem usar. Entre de novo.', 'erro'); await sairETelaLogin(); });
}

async function iniciar() {
  const estado = await auth.estadoDeAcesso();
  if (estado === 'ok') telaPainel();
  else if (estado === 'verificar-mfa') telaVerificarMfa();
  else if (estado === 'cadastrar-mfa') await telaCadastrarMfa();
  else telaLogin();
}

// Sessão encerrada (sair, sair de todos os aparelhos, expirada ou derrubada em outro aparelho): volta para o login.
supa.auth.onAuthStateChange((evento) => { if (evento === 'SIGNED_OUT') { pararInatividade?.(); pararInatividade = null; telaLogin(); } });
iniciar();
