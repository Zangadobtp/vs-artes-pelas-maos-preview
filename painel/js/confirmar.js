// Ações que apagam dados pedem o código do autenticador de novo.
import { h, dialogo, campo } from './ui.js';
import { verificarCodigo } from './auth.js';

export function confirmarComCodigo({ titulo, texto, rotuloOk = 'Apagar' }) {
  const input = h('input', { name: 'codigo', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', pattern: '[0-9]{6}', required: true });
  return dialogo({
    titulo,
    rotuloOk,
    perigo: true,
    corpo: h('div', null, h('p', null, texto), campo('Código do app autenticador', input, '6 números que aparecem no seu celular')),
    aoConfirmar: async (fd) => { await verificarCodigo(fd.get('codigo')); return true; },
  });
}
