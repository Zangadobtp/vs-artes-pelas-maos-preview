// PRÉVIA: cliente de demonstração, banco fictício em memória. Recarregar a página volta ao original.
import { criarBanco, criarCliente } from './banco-demo.js';
import { GRUPOS, PRODUTOS } from './catalogo-demo.js';

export const supa = criarCliente(criarBanco({ hoje: new Date(), grupos: GRUPOS, produtos: PRODUTOS }));
export const urlImagem = (path) => '../site/assets/fotos/' + path.split('/').pop();

// Os telefones da demonstração são fictícios; mesmo assim, nada de abrir o WhatsApp de verdade.
window.open = () => {
  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.textContent = 'Na demonstração, o WhatsApp não é aberto.';
  document.getElementById('avisos')?.append(aviso);
  setTimeout(() => aviso.remove(), 3500);
  return null;
};
