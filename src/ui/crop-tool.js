// Ferramenta de corte: liga e desliga o modo de corte e permite arrastar as
// bordas das páginas no preview. O corte vale para todas as páginas.

import { cropParamForEdge } from '../core/crop.js';
import { ptToMm } from '../core/units.js';

const CURSORS = { l: 'ew-resize', r: 'ew-resize', t: 'ns-resize', b: 'ns-resize' };
const MAX_MM = 100;

export function initCropTool({ toggle, panel, done, reset, summary, canvases, preview, getCrop, onCrop, onModeChange }) {
  let active = false;
  let drag = null;

  const setActive = (value) => {
    active = value;
    toggle.setAttribute('aria-pressed', String(value));
    panel.hidden = !value;
    for (const c of canvases) c.classList.toggle('folha__canvas--corte', value);
    onModeChange(value);
  };

  toggle.addEventListener('click', () => setActive(!active));
  done.addEventListener('click', () => setActive(false));
  reset.addEventListener('click', () => {
    for (const param of ['top', 'bottom', 'inner', 'outer']) onCrop(param, 0);
  });

  for (const canvas of canvases) {
    canvas.addEventListener('pointerdown', (e) => {
      if (!active) return;
      const hit = preview.hitEdge(canvas, e.offsetX, e.offsetY);
      if (!hit) return;
      const param = cropParamForEdge(hit.edge, hit.placement.side, hit.placement.rot);
      drag = { canvas, edge: hit.edge, param, x: e.offsetX, y: e.offsetY, start: getCrop()[param], scale: hit.placement.scale, ptPerCss: hit.ptPerCss };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!active) return;
      if (!drag) {
        const hit = preview.hitEdge(canvas, e.offsetX, e.offsetY);
        canvas.style.cursor = hit ? CURSORS[hit.edge] : '';
        return;
      }
      // Arrastar para dentro da página aumenta o corte daquela borda.
      const dx = (e.offsetX - drag.x) * drag.ptPerCss;
      const dy = (e.offsetY - drag.y) * drag.ptPerCss;
      const moved = { l: dx, r: -dx, t: dy, b: -dy }[drag.edge];
      const mm = drag.start + ptToMm(moved / drag.scale);
      onCrop(drag.param, Math.min(MAX_MM, Math.max(0, Math.round(mm * 2) / 2)));
    });

    const end = () => { drag = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  return {
    isActive: () => active,
    updateSummary(crop) {
      const parts = [['topo', crop.top], ['base', crop.bottom], ['dobra', crop.inner], ['fora', crop.outer]]
        .filter(([, v]) => v > 0)
        .map(([name, v]) => `${name} ${String(v).replace('.', ',')}`);
      summary.textContent = parts.length ? `${parts.join(', ')} mm` : 'sem corte';
    },
  };
}
