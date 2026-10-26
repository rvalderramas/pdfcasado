import { sideInsets } from './crop.js';

// Geometria da folha impressa. Coordenadas em pontos, origem no canto superior
// esquerdo, y crescendo para baixo. Rotação em graus no sentido horário,
// indicando para onde aponta o topo da página (0 = cima, 180 = baixo).

// Escolhe a orientação do papel e a grade de duplas que deixam as páginas
// o maior possível. Girar o papel equivale a girar as duplas, então as duplas
// ficam sempre na horizontal, com a dobra na vertical.
export function chooseGrid(paper, refPage, spreadsPerSide) {
  const orientations = [
    { w: paper.h, h: paper.w },
    { w: paper.w, h: paper.h },
  ];
  let best = null;
  for (const sheet of orientations) {
    for (let rows = 1; rows <= spreadsPerSide; rows++) {
      if (spreadsPerSide % rows) continue;
      const cols = spreadsPerSide / rows;
      const fit = Math.min(sheet.w / cols / (2 * refPage.w), sheet.h / rows / refPage.h);
      if (!best || fit > best.fit + 1e-9) best = { fit, rows, cols, sheetW: sheet.w, sheetH: sheet.h };
    }
  }
  return best;
}

export function cellRects(grid) {
  const w = grid.sheetW / grid.cols;
  const h = grid.sheetH / grid.rows;
  const cells = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) cells.push({ x: c * w, y: r * h, w, h });
  }
  return cells;
}

// Posiciona as duas páginas de uma dupla dentro de uma célula.
// O espaço central (gutter) é medido a partir da dobra: positivo afasta as
// páginas, negativo aproxima (a parte que passa da dobra é cortada).
// O corte (crop) remove margens da página original antes de ajustá-la.
//
// Cada página devolve:
//   rect  área visível (já cortada) na folha
//   full  página original inteira na mesma escala (o que é desenhado)
//   clip  recorte aplicado ao desenho: área visível limitada à sua metade
export function placeSpread(cell, pages, pageSizes, { gutter, scale, crop }) {
  const half = cell.w / 2;
  const fold = cell.x + half;
  const availW = Math.max(half - Math.max(gutter, 0) / 2, 1);

  return pages.map((page, side) => {
    const isLeft = side === 0;
    const slot = { x: cell.x + (isLeft ? 0 : half), y: cell.y, w: half, h: cell.h };
    if (page === null) return { page, side, rot: 0, slot, rect: null };

    const size = pageSizes[page];
    const ins = sideInsets(crop, side);
    const visW = Math.max(size.w - ins.l - ins.r, size.w * 0.1);
    const visH = Math.max(size.h - ins.t - ins.b, size.h * 0.1);
    const s = scale ? Math.min(availW / visW, cell.h / visH) : 1;
    const w = visW * s;
    const h = visH * s;
    const rect = { x: isLeft ? fold - gutter / 2 - w : fold + gutter / 2, y: cell.y + (cell.h - h) / 2, w, h };

    return {
      page,
      side,
      rot: 0,
      scale: s,
      slot,
      rect,
      full: { x: rect.x - ins.l * s, y: rect.y - ins.t * s, w: size.w * s, h: size.h * s },
      clip: intersect(rect, slot),
      // Passa da borda externa, de cima ou de baixo (a dobra não conta).
      clipped: (isLeft ? rect.x < slot.x - 0.5 : rect.x + w > slot.x + slot.w + 0.5) || h > cell.h + 0.5,
    };
  });
}

function intersect(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x),
    h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y),
  };
}

export const foldLine = (cell) => ({ x1: cell.x + cell.w / 2, y1: cell.y, x2: cell.x + cell.w / 2, y2: cell.y + cell.h });

export const mirrorCell = (cell, sheetW) => ({ ...cell, x: sheetW - cell.x - cell.w });

const rotRect = (r, W, H) => r && { x: W - r.x - r.w, y: H - r.y - r.h, w: r.w, h: r.h };

// Gira um lado inteiro da folha em 180 graus.
export function rotateSide180(side, W, H) {
  return {
    cells: side.cells.map((c) => rotRect(c, W, H)),
    folds: side.folds.map((f) => ({ x1: W - f.x1, y1: H - f.y1, x2: W - f.x2, y2: H - f.y2 })),
    placements: side.placements.map((p) => ({
      ...p,
      rot: (p.rot + 180) % 360,
      slot: rotRect(p.slot, W, H),
      rect: rotRect(p.rect, W, H),
      full: rotRect(p.full, W, H),
      clip: rotRect(p.clip, W, H),
    })),
  };
}
