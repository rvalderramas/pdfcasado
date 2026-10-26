// Monta o plano completo de impressão a partir dos tamanhos das páginas e das
// configurações. É a única fonte de verdade usada pelo preview e pelo gerador.

import { planSignatures } from './signatures.js';
import { chooseGrid, cellRects, placeSpread, foldLine, mirrorCell, rotateSide180 } from './layout.js';
import { mmToPt } from './units.js';

export function buildPlan(pageSizes, settings) {
  const paper = { w: mmToPt(settings.paper.w), h: mmToPt(settings.paper.h) };
  const gutter = mmToPt(settings.gutter);
  const spreadsPerSide = settings.pagesPerSide / 2;

  const book = planSignatures(pageSizes.length, settings);
  const grid = chooseGrid(paper, pageSizes[0], spreadsPerSide);
  const { sheetW: W, sheetH: H } = grid;
  const cells = cellRects(grid);
  const opts = { gutter, scale: settings.scale };

  // Cortar e empilhar: o fólio j vai para a folha j % n, na posição j / n.
  // Depois de cortar a resma, cada posição vira uma pilha já em ordem.
  const sheetCount = Math.ceil(book.folios.length / cells.length);
  const sheets = Array.from({ length: sheetCount }, (_, index) => ({
    index,
    front: { cells: [], folds: [], placements: [] },
    back: { cells: [], folds: [], placements: [] },
  }));

  book.folios.forEach((folio, j) => {
    const sheet = sheets[j % sheetCount];
    const stack = Math.floor(j / sheetCount);
    const cell = cells[stack];
    const back = mirrorCell(cell, W);
    const label = { signature: folio.signature, sheet: folio.sheet, stack };

    sheet.front.cells.push(cell);
    sheet.front.folds.push(foldLine(cell));
    placeSpread(cell, folio.front, pageSizes, opts)
      .forEach((p) => sheet.front.placements.push({ ...p, ...label }));

    sheet.back.cells.push(back);
    sheet.back.folds.push(foldLine(back));
    placeSpread(back, folio.back, pageSizes, opts)
      .forEach((p) => sheet.back.placements.push({ ...p, ...label }));
  });

  if (settings.alternateRotation) {
    sheets.forEach((s) => { s.back = rotateSide180(s.back, W, H); });
  }

  const outputOrder = settings.duplex
    ? sheets.flatMap((s) => [{ sheet: s.index, face: 'front' }, { sheet: s.index, face: 'back' }])
    : [...sheets.map((s) => ({ sheet: s.index, face: 'front' })), ...sheets.map((s) => ({ sheet: s.index, face: 'back' }))];

  // Com a folha deitada, o verso padrão equivale a virar pela borda curta.
  const landscape = W > H;
  const flipShortEdge = landscape !== settings.alternateRotation;

  // Avisa quando alguma página sai da sua metade da dupla (cortada na impressão).
  const inside = (r, s) => r.x >= s.x - 0.5 && r.y >= s.y - 0.5
    && r.x + r.w <= s.x + s.w + 0.5 && r.y + r.h <= s.y + s.h + 0.5;
  const overflow = sheets.some((s) => s.front.placements.some((p) => p.rect && !inside(p.rect, p.slot)));

  return {
    sheetW: W,
    sheetH: H,
    grid,
    gutter,
    sheets,
    outputOrder,
    stacks: Math.min(cells.length, book.folios.length),
    signatureSizes: book.sizes,
    blankPages: book.blankPages,
    pageCount: pageSizes.length,
    flipEdge: flipShortEdge ? 'curta' : 'longa',
    overflow,
  };
}
