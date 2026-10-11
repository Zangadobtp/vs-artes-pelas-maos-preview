// Preparação e envio de imagens do catálogo (parte com DOM; as regras puras estão em imagens-logica.js).
import { supa } from './supa.js';
import { tipoPelaAssinatura, nomeAleatorio, medidasRedimensionadas } from './imagens-logica.js';

const MAX_LADO = 1400;
const MAX_ENTRADA = 15 * 1024 * 1024; // lemos até 15 MB e reduzimos; o servidor ainda limita a 5 MB

/** Confere o tipo real, reduz e reencoda. Reencodar descarta metadados (GPS, câmera) e qualquer carga escondida. */
export async function prepararImagem(arquivo) {
  if (!arquivo) throw new Error('Escolha uma foto.');
  if (arquivo.size > MAX_ENTRADA) throw new Error('A foto é muito grande (máximo 15 MB).');
  const inicio = new Uint8Array(await arquivo.slice(0, 16).arrayBuffer());
  if (!tipoPelaAssinatura(inicio)) throw new Error('Use uma foto em JPG, PNG ou WebP.');

  let bitmap;
  try { bitmap = await createImageBitmap(arquivo); } catch { throw new Error('Não consegui abrir essa foto.'); }
  const { largura, altura } = medidasRedimensionadas(bitmap.width, bitmap.height, MAX_LADO);
  const tela = document.createElement('canvas');
  tela.width = largura; tela.height = altura;
  tela.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close?.();

  const webp = await new Promise((ok) => tela.toBlob(ok, 'image/webp', 0.86));
  if (webp && webp.type === 'image/webp') return { blob: webp, tipo: 'image/webp' };
  const jpg = await new Promise((ok) => tela.toBlob(ok, 'image/jpeg', 0.88));
  if (!jpg) throw new Error('Não consegui preparar a foto.');
  return { blob: jpg, tipo: 'image/jpeg' };
}

export async function enviarImagem({ blob, tipo }) {
  if (blob.size > 5 * 1024 * 1024) throw new Error('Mesmo reduzida, a foto passou de 5 MB. Escolha outra.');
  const caminho = nomeAleatorio(tipo);
  const { error } = await supa.storage.from('catalogo').upload(caminho, blob, { contentType: tipo, upsert: false, cacheControl: '31536000' });
  if (error) throw new Error('Não foi possível enviar a foto. Tente de novo.');
  return caminho;
}

export async function apagarImagem(caminho) {
  if (!caminho) return;
  await supa.storage.from('catalogo').remove([caminho]);
}
