// Preview da folha impressa: desenha frente e verso num canvas, com as
// miniaturas reais das páginas, a dobra, as linhas de corte e o espaço central.

import { describePlacement } from '../core/labels.js';
import { ptToMm } from '../core/units.js';

const COLORS = {
  sheet: '#ffffff',
  placeholder: '#e9eeec',
  placeholderInk: '#7d8b86',
  blank: '#f4f6f5',
  fold: '#d1236f',
  cut: '#0091c7',
  gutter: 'rgba(209, 35, 111, 0.16)',
  badge: 'rgba(28, 36, 34, 0.78)',
};

export function createPreview({ front, back, count, prev, next, onNavigate }) {
  let last = null;
  let frame = 0;

  prev.addEventListener('click', () => onNavigate(-1));
  next.addEventListener('click', () => onNavigate(1));

  function draw() {
    frame = 0;
    if (!last) return;
    const { plan, sheetIndex, thumbs, debug } = last;
    const sheet = plan.sheets[sheetIndex];
    count.textContent = `Folha ${sheetIndex + 1} de ${plan.sheets.length}`;
    prev.disabled = sheetIndex === 0;
    next.disabled = sheetIndex === plan.sheets.length - 1;
    drawSide(front, plan, sheet.front, 'front', thumbs, debug);
    drawSide(back, plan, sheet.back, 'back', thumbs, debug);
  }

  return {
    render(state) {
      last = state;
      if (!frame) frame = requestAnimationFrame(draw);
    },
    redraw() {
      if (!frame) frame = requestAnimationFrame(draw);
    },
  };
}

function drawSide(canvas, plan, side, face, thumbs, debug) {
  const { sheetW: W, sheetH: H } = plan;
  // Ocupa a largura disponível, sem passar da altura da janela.
  const dpr = window.devicePixelRatio || 1;
  const maxH = Math.max(window.innerHeight - 260, 240);
  const cssW = Math.min(canvas.parentElement.clientWidth || 300, (maxH * W) / H);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${(cssW * H) / W}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssW * dpr * (H / W));

  const ctx = canvas.getContext('2d');
  const k = canvas.width / W;
  const px = dpr / k; // 1 pixel de tela em pontos
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = COLORS.sheet;
  ctx.fillRect(0, 0, W, H);

  for (const p of side.placements) drawPlacement(ctx, p, thumbs, px);
  drawGutters(ctx, side, plan.gutter, px);

  if (side.cells.length > 1) {
    for (const c of side.cells) dashedRect(ctx, c, COLORS.cut, px);
  }
  for (const f of side.folds) dashedLine(ctx, f, COLORS.fold, px);

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
  const { x, y, w, h } = p.rect;
  const thumb = thumbs?.get(p.page);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((p.rot * Math.PI) / 180);
  if (thumb) {
    ctx.drawImage(thumb, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = COLORS.placeholder;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  if (!thumb) centeredText(ctx, String(p.page + 1), p.rect, COLORS.placeholderInk, Math.min(w, h) * 0.28, p.rot);

  // Número da página, sempre legível, no canto inferior.
  const label = String(p.page + 1);
  ctx.font = `bold ${10 * px}px "Atkinson Hyperlegible", sans-serif`;
  const bw = ctx.measureText(label).width + 10 * px;
  const bh = 16 * px;
  const bx = x + w / 2 - bw / 2;
  const by = y + h - bh - 6 * px;
  ctx.fillStyle = COLORS.badge;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + px);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

// Faixa entre as duas páginas de cada dupla, com a medida na primeira.
function drawGutters(ctx, side, gutter, px) {
  if (gutter <= 0) return;
  side.folds.forEach((f, i) => {
    const x = f.x1 - gutter / 2;
    const y = Math.min(f.y1, f.y2);
    const h = Math.abs(f.y2 - f.y1);
    ctx.fillStyle = COLORS.gutter;
    ctx.fillRect(x, y, gutter, h);
    if (i > 0) return;
    const text = `${String(Math.round(ptToMm(gutter) * 10) / 10).replace('.', ',')} mm`;
    ctx.font = `bold ${11 * px}px "Atkinson Hyperlegible", sans-serif`;
    const tw = ctx.measureText(text).width + 10 * px;
    const th = 18 * px;
    const tx = f.x1 - tw / 2;
    const ty = y + 10 * px;
    ctx.fillStyle = COLORS.fold;
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, f.x1, ty + th / 2 + px);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  });
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

function dashedRect(ctx, r, color, px) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * px;
  ctx.setLineDash([2 * px, 3 * px]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

function centeredText(ctx, text, r, color, size, rot) {
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.font = `${size}px "Young Serif", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function fitText(ctx, text, x, y, maxW) {
  let t = text;
  while (t.length > 3 && ctx.measureText(t).width > maxW) t = t.slice(0, -2);
  ctx.fillText(t === text ? t : `${t}…`, x, y);
}
