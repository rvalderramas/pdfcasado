// Corte de margens das páginas originais.
//
// O corte é definido em relação à dupla: "dobra" é a margem do lado da costura
// e "fora" é a margem externa. Para a página da esquerda, a dobra fica à
// direita; para a da direita, à esquerda. Valores em pontos.

export const NO_CROP = { top: 0, bottom: 0, inner: 0, outer: 0 };

// Margens a cortar no sistema da página como vista (l, t, r, b).
export function sideInsets(crop, side) {
  const isLeft = side === 0;
  return {
    l: isLeft ? crop.outer : crop.inner,
    r: isLeft ? crop.inner : crop.outer,
    t: crop.top,
    b: crop.bottom,
  };
}

const FLIP = { l: 'r', r: 'l', t: 'b', b: 't' };

// Margens como aparecem na folha, considerando a rotação da página (0 ou 180).
export function visualInsets(crop, side, rot) {
  const i = sideInsets(crop, side);
  return rot === 180 ? { l: i.r, r: i.l, t: i.b, b: i.t } : i;
}

// Qual parâmetro de corte corresponde a uma borda vista na folha.
export function cropParamForEdge(edge, side, rot) {
  const pageEdge = rot === 180 ? FLIP[edge] : edge;
  if (pageEdge === 't') return 'top';
  if (pageEdge === 'b') return 'bottom';
  const isLeft = side === 0;
  return (pageEdge === 'r') === isLeft ? 'inner' : 'outer';
}
