// Gera o PDF final a partir do plano de imposição, usando pdf-lib.
// As páginas originais são copiadas como vetor, sem perda de qualidade.

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { describePlacement } from '../core/labels.js';

const GRAY = rgb(0.55, 0.55, 0.55);
const RED = rgb(0.85, 0.1, 0.35);

export async function generatePdf(source, plan, { debug }) {
  const out = await PDFDocument.create();
  const srcPages = source.getPages();
  const font = debug ? await out.embedFont(StandardFonts.Helvetica) : null;
  const embedded = new Map();
  const { sheetW: W, sheetH: H } = plan;

  const embed = async (i) => {
    if (!embedded.has(i)) {
      const page = srcPages[i];
      const box = page.getCropBox();
      embedded.set(i, await out.embedPage(page, {
        left: box.x, bottom: box.y, right: box.x + box.width, top: box.y + box.height,
      }));
    }
    return embedded.get(i);
  };

  for (const { sheet, face } of plan.outputOrder) {
    const side = plan.sheets[sheet][face];
    const page = out.addPage([W, H]);

    for (const p of side.placements) {
      if (p.rect) await drawSourcePage(page, await embed(p.page), srcPages[p.page], p, H);
    }
    if (debug) drawDebug(page, side, face, font, H);
  }

  return out.save();
}

function drawSourcePage(page, emb, srcPage, p, H) {
  const rot = (p.rot + normalize(srcPage.getRotation().angle)) % 360;
  const sideways = rot === 90 || rot === 270;
  const w = sideways ? p.rect.h : p.rect.w;
  const h = sideways ? p.rect.w : p.rect.h;
  const x0 = p.rect.x;
  const y0 = H - p.rect.y - p.rect.h;
  // pdf-lib gira em torno do canto inferior esquerdo, no sentido anti-horário.
  const origin = {
    0: [x0, y0],
    90: [x0, y0 + w],
    180: [x0 + w, y0 + h],
    270: [x0 + h, y0],
  }[rot];
  page.drawPage(emb, { x: origin[0], y: origin[1], width: w, height: h, rotate: degrees(-rot) });
}

function drawDebug(page, side, face, font, H) {
  const flip = (y) => H - y;
  for (const c of side.cells) {
    page.drawRectangle({ x: c.x, y: flip(c.y + c.h), width: c.w, height: c.h, borderColor: GRAY, borderWidth: 0.5 });
  }
  for (const f of side.folds) {
    page.drawLine({ start: { x: f.x1, y: flip(f.y1) }, end: { x: f.x2, y: flip(f.y2) }, color: GRAY, thickness: 0.5, dashArray: [4, 3] });
  }
  for (const p of side.placements) {
    if (p.rect) {
      page.drawRectangle({ x: p.rect.x, y: flip(p.rect.y + p.rect.h), width: p.rect.w, height: p.rect.h, borderColor: RED, borderWidth: 0.6 });
    }
    page.drawText(describePlacement(p, face), { x: p.slot.x + 6, y: flip(p.slot.y) - 12, size: 7, font, color: RED });
  }
}

const normalize = (angle) => ((angle % 360) + 360) % 360;
