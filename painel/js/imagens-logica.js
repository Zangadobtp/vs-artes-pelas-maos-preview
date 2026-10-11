// Regras puras sobre imagens (sem DOM), testadas em Node.

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Tipo real do arquivo pelos primeiros bytes. A extensão e o tipo declarado pelo navegador não valem nada. */
export function tipoPelaAssinatura(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return 'image/png';
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

export function nomeAleatorio(tipo) {
  if (!Object.hasOwn(EXT, tipo)) throw new Error(`Tipo não permitido: ${tipo}`);
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  const hex = [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `produtos/${hex}.${EXT[tipo]}`;
}

export function medidasRedimensionadas(largura, altura, maximo) {
  const maior = Math.max(largura, altura);
  if (maior <= maximo) return { largura, altura };
  const k = maximo / maior;
  return { largura: Math.round(largura * k), altura: Math.round(altura * k) };
}
