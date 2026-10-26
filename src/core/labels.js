// Textos curtos que identificam cada posição da folha (modo de conferência e preview).

export const FACE_NAMES = { front: 'Frente', back: 'Verso' };

export function describePlacement(p, face) {
  const page = p.page === null ? 'Em branco' : `Pág. ${p.page + 1}`;
  return `Caderno ${p.signature + 1} · Folha ${p.sheet + 1} · ${FACE_NAMES[face]} · ${page} · Pilha ${p.stack + 1}`;
}
