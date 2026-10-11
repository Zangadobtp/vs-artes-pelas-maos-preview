/** "Decoração & Festa!" -> "decoracao-festa" (a mesma regra do banco: ^[a-z0-9]+(-[a-z0-9]+)*$, até 40). */
export function gerarSlug(nome) {
  const s = String(nome ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return s || 'categoria';
}

export function slugUnico(base, existentes) {
  if (!existentes.includes(base)) return base;
  let n = 2;
  while (existentes.includes(`${base.slice(0, 36)}-${n}`)) n++;
  return `${base.slice(0, 36)}-${n}`;
}
