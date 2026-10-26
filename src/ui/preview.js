// Preview da folha impressa: desenha frente e verso em canvas, com as
// miniaturas reais das páginas, a dobra, as linhas de corte, o espaço central
// e, no modo de corte, as margens que serão removidas.

import { describePlacement } from '../core/labels.js';
import { visualInsets } from '../core/crop.js';

const COLORS = {
  sheet: '#ffffff',
  placeholder: '#e9eeec',
  placeholderInk: '#7d8b86',
  blank: '#f4f6f5',
  fold: '#d1236f',
  cut: '#0091c7',
  gutter: 'rgba(209, 35, 111, 0.16)',
  badge: 'rgba(28, 36, 34, 0.78)',
  cropShade: 'rgba(28, 36, 34, 0.55)',
};

const CAPTION_PX = 28;
const GAP_PX = 24;
const EDGE_TOLERANCE_PX = 10;

export function createPreview({ container, front, back, count, prev, next, onNavigate }) {
  let last = null;
  let frame = 0;
  const views = new Map();

  prev.addEventListener('click', () => onNavigate(-1));
  next.addEventListener('click', () => onNavigate(1));

  function draw() {
    frame = 0;
    if (!last) return;
    const { plan, sheetIndex } = last;
    const sheet = plan.sheets[sheetIndex];
    count.textContent = `Folha ${sheetIndex + 1} de ${plan.sheets.length}`;
    prev.disabled = sheetIndex === 0;
    next.disabled = sheetIndex === plan.sheets.length - 1;

    const cssW = fitSheets(container, plan.sheetW, plan.sheetH);
    for (const [canvas, side, face] of [[front, sheet.front, 'front'], [back, sheet.back, 'back']]) {
      drawSide(canvas, cssW, plan, side, face, last);
      views.set(canvas, { side, ptPerCss: plan.sheetW / cssW });
    }
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };

  return {
    render(state) {
      last = state;
      schedule();
    },
    redraw: schedule,

    // Encontra a borda de corte mais próxima de um ponto (em px do canvas).
    hitEdge(canvas, cssX, cssY) {
      const view = views.get(canvas);
      if (!view || !last?.cropMode) return null;
      const x = cssX * view.ptPerCss;
      const y = cssY * view.ptPerCss;
      const tol = EDGE_TOLERANCE_PX * view.ptPerCss;
      let best = null;
      for (const p of view.side.placements) {
        if (!p.rect) continue;
        const b = cropBox(p, last.cropPt);
        const inY = y > b.y - tol && y < b.y + b.h + tol;
        const inX = x > b.x - tol && x < b.x + b.w + tol;
        const candidates = [
          ['l', Math.abs(x - b.x), inY],
          ['r', Math.abs(x - (b.x + b.w)), inY],
          ['t', Math.abs(y - b.y), inX],
          ['b', Math.abs(y - (b.y + b.h)), inX],
        ];
        for (const [edge, dist, inside] of candidates) {
          if (inside && dist < tol && (!best || dist < best.dist)) best = { placement: p, edge, dist, ptPerCss: view.ptPerCss };
        }
      }
      return best;
    },
  };
}

// Mostra frente e verso lado a lado ou empilhados, o que deixar a folha maior.
function fitSheets(container, W, H) {
  const cw = container.clientWidth || 300;
  const ch = container.clientHeight || 300;
  const side = Math.min((cw - GAP_PX) / 2 / W, (ch - CAPTION_PX) / H);
  const stack = Math.min(cw / W, ((ch - GAP_PX) / 2 - CAPTION_PX) / H);
  container.classList.toggle('mesa__folhas--empilhadas', stack > side);
  return Math.max(Math.max(side, stack) * W, 120);
}

// Área que fica depois do corte, numa página desenhada sem corte.
function cropBox(p, cropPt) {
  const i = visualInsets(cropPt, p.side, p.rot);
  const s = p.scale;
  return { x: p.rect.x + i.l * s, y: p.rect.y + i.t * s, w: p.rect.w - (i.l + i.r) * s, h: p.rect.h - (i.t + i.b) * s };
}

function drawSide(canvas, cssW, plan, side, face, { thumbs, debug, cropMode, cropPt }) {
  const { sheetW: W, sheetH: H } = plan;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${(cssW * H) / W}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round((cssW * H * dpr) / W);

  const ctx = canvas.getContext('2d');
  const k = canvas.width / W;
  const px = dpr / k; // 1 pixel de tela em pontos
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = COLORS.sheet;
  ctx.fillRect(0, 0, W, H);

  for (const p of side.placements) drawPlacement(ctx, p, thumbs, px);
  drawGutters(ctx, side, plan.gutter);
  if (side.cells.length > 1) {
    for (const c of side.cells) dashedRect(ctx, c, COLORS.cut, px, [2, 3]);
  }
  for (const f of side.folds) dashedLine(ctx, f, COLORS.fold, px);
  if (cropMode) {
    for (const p of side.placements) if (p.rect) drawCropGuide(ctx, p, cropBox(p, cropPt), px);
  }
  for (const p of side.placements) if (p.rect) drawBadge(ctx, p, px);

  if (debug) {
    ctx.font = `${10 * px}px "Atkinson Hyperlegible", sans-serif`;
    ctx.fillStyle = COLORS.fold;
    for (const p of side.placements) {
      fitText(ctx, describePlacement(p, face), p.slot.x + 4 * px, p.slot.y + 12 * px, p.slot.w - 8 * px);
    }
  }
}

function drawPlacement(ctx, p, thumbs, px) {
  if (!p.rect) {
    ctx.fillStyle = COLORS.blank;
    ctx.fillRect(p.slot.x, p.slot.y, p.slot.w, p.slot.h);
    centeredText(ctx, 'em branco', p.slot, COLORS.placeholderInk, 11 * px, 0);
    return;
  }
  const { x, y, w, h } = p.full;
  const thumb = thumbs?.get(p.page);
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.clip.x, p.clip.y, p.clip.w, p.clip.h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((p.rot * Math.PI) / 180);
  if (thumb) {
    ctx.drawImage(thumb, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = COLORS.placeholder;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  if (!thumb) centeredText(ctx, String(p.page + 1), p.clip, COLORS.placeholderInk, Math.min(p.clip.w, p.clip.h) * 0.28, p.rot);
}

// Número da página, sempre legível, no canto externo de baixo.
function drawBadge(ctx, p, px) {
  const label = String(p.page + 1);
  ctx.font = `bold ${10 * px}px "Atkinson Hyperlegible", sans-serif`;
  const bw = ctx.measureText(label).width + 10 * px;
  const bh = 16 * px;
  const outerLeft = (p.side === 0) !== (p.rot === 180);
  const bx = outerLeft ? p.clip.x + 4 * px : p.clip.x + p.clip.w - bw - 4 * px;
  const by = p.clip.y + p.clip.h - bh - 4 * px;
  ctx.fillStyle = COLORS.badge;
  ctx.fillRect(bx, by, bw, bh);
  labelText(ctx, label, bx + bw / 2, by + bh / 2 + px, '#fff');
}

function drawCropGuide(ctx, p, box, px) {
  const r = p.rect;
  ctx.fillStyle = COLORS.cropShade;
  ctx.fillRect(r.x, r.y, r.w, box.y - r.y);
  ctx.fillRect(r.x, box.y + box.h, r.w, r.y + r.h - box.y - box.h);
  ctx.fillRect(r.x, box.y, box.x - r.x, box.h);
  ctx.fillRect(box.x + box.w, box.y, r.x + r.w - box.x - box.w, box.h);

  ctx.save();
  ctx.strokeStyle = COLORS.cut;
  ctx.lineWidth = 2 * px;
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();

  // Alças no meio de cada borda.
  const hl = 22 * px;
  const ht = 6 * px;
  ctx.fillStyle = COLORS.cut;
  ctx.fillRect(box.x + box.w / 2 - hl / 2, box.y - ht / 2, hl, ht);
  ctx.fillRect(box.x + box.w / 2 - hl / 2, box.y + box.h - ht / 2, hl, ht);
  ctx.fillRect(box.x - ht / 2, box.y + box.h / 2 - hl / 2, ht, hl);
  ctx.fillRect(box.x + box.w - ht / 2, box.y + box.h / 2 - hl / 2, ht, hl);
}

// Faixa entre as duas páginas de cada dupla. O valor aparece na barra de
// ferramentas; aqui só a área. Negativo: as páginas avançam sobre a dobra.
function drawGutters(ctx, side, gutter) {
  if (gutter === 0) return;
  const g = Math.abs(gutter);
  ctx.fillStyle = COLORS.gutter;
  for (const f of side.folds) ctx.fillRect(f.x1 - g / 2, Math.min(f.y1, f.y2), g, Math.abs(f.y2 - f.y1));
}

function labelText(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function dashedLine(ctx, f, color, px) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * px;
  ctx.setLineDash([6 * px, 4 * px]);
  ctx.beginPath();
  ctx.moveTo(f.x1, f.y1);
  ctx.lineTo(f.x2, f.y2);
  ctx.stroke();
  ctx.restore();
}

function dashedRect(ctx, r, color, px, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * px;
  ctx.setLineDash(dash.map((d) => d * px));
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

function centeredText(ctx, text, r, color, size, rot) {
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.font = `${size}px "Young Serif", serif`;
  labelText(ctx, text, 0, 0, color);
  ctx.restore();
}

function fitText(ctx, text, x, y, maxW) {
  let t = text;
  while (t.length > 3 && ctx.measureText(t).width > maxW) t = t.slice(0, -2);
  ctx.fillText(t === text ? t : `${t}…`, x, y);
}
