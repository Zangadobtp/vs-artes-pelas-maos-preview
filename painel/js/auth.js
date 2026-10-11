// Entrada, segundo fator (app autenticador) e saída. Nada aqui guarda senha ou código.
import { supa } from './supa.js';
import { MINUTOS_INATIVIDADE } from './config.js';

/** 'sem-sessao' | 'cadastrar-mfa' | 'verificar-mfa' | 'ok' */
export async function estadoDeAcesso() {
  const { data: s } = await supa.auth.getSession();
  if (!s.session) return 'sem-sessao';
  const { data, error } = await supa.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return 'sem-sessao';
  if (data.currentLevel === 'aal2') return 'ok';
  return data.nextLevel === 'aal2' ? 'verificar-mfa' : 'cadastrar-mfa';
}

const ERRO_GENERICO = 'E-mail, senha ou código incorretos.';

export async function entrar(email, senha) {
  const { error } = await supa.auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error) throw new Error(ERRO_GENERICO);
}

/** Cria um fator novo (ainda não ativo). Devolve o QR (SVG em data URI), a chave em texto e o id. */
export async function cadastrarMfa(apelido = 'Celular') {
  // Fatores abandonados (QR gerado e não confirmado) ocupam vaga; limpa antes.
  const { data: lista } = await supa.auth.mfa.listFactors();
  for (const f of lista?.all ?? []) {
    if (f.status === 'unverified') await supa.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supa.auth.mfa.enroll({ factorType: 'totp', friendlyName: `${apelido} ${new Date().toLocaleDateString('pt-BR')}` });
  if (error) throw new Error('Não foi possível gerar o código QR. Tente de novo.');
  return { factorId: data.id, qr: data.totp.qr_code, segredo: data.totp.secret };
}

export async function confirmarCodigo(factorId, codigo) {
  const limpo = String(codigo).replace(/\s/g, '');
  if (!/^\d{6}$/.test(limpo)) throw new Error('O código tem 6 números.');
  const { error } = await supa.auth.mfa.challengeAndVerify({ factorId, code: limpo });
  if (error) throw new Error(ERRO_GENERICO);
}

async function fatoresVerificados() {
  const { data, error } = await supa.auth.mfa.listFactors();
  if (error) throw new Error(error.name === 'AuthSessionMissingError' ? 'Sua sessão terminou. Entre de novo.' : 'Não foi possível conferir o autenticador.');
  const ids = (data.totp ?? []).map((f) => f.id); // só vêm os já verificados
  if (!ids.length) throw new Error('Nenhum autenticador ativo.');
  return ids;
}

/** Usado na tela de login e para reconfirmar antes de apagar algo.
    Aceita o código de QUALQUER autenticador cadastrado (o principal ou o de reserva). */
export async function verificarCodigo(codigo) {
  let ultimoErro;
  for (const id of await fatoresVerificados()) {
    try { await confirmarCodigo(id, codigo); return; } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro;
}
export async function quantosAutenticadores() {
  const { data } = await supa.auth.mfa.listFactors();
  return data?.totp?.length ?? 0;
}

export async function sair() {
  await supa.auth.signOut();
}

/** Sai sozinho depois de X minutos sem uso (no plano gratuito o servidor não faz isso). */
export function iniciarInatividade(aoExpirar, minutos = MINUTOS_INATIVIDADE) {
  let t;
  const reiniciar = () => { clearTimeout(t); t = setTimeout(aoExpirar, minutos * 60 * 1000); };
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
  reiniciar();
  return () => { clearTimeout(t); ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((e) => window.removeEventListener(e, reiniciar)); };
}
