// Ponto de entrada: liga o formulário, o arquivo, o preview e a geração do PDF.

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { buildPlan } from './core/imposition.js';
import { mmToPt } from './core/units.js';
import { loadPdf, PdfLoadError } from './pdf/loader.js';
import { ThumbnailCache } from './pdf/thumbnails.js';
import { generatePdf } from './pdf/generator.js';
import { initSettings } from './ui/settings.js';
import { initDropzone } from './ui/dropzone.js';
import { createPreview } from './ui/preview.js';
import { renderSummary } from './ui/summary.js';
import { showResult, hideResult } from './ui/result.js';

const $ = (id) => document.getElementById(id);
const form = $('config');
const button = $('gerar');
const resultRoot = $('resultado');

// Livro de exemplo mostrado antes de escolher um arquivo: 16 páginas A5.
const DEMO_SIZES = Array.from({ length: 16 }, () => ({ w: mmToPt(148), h: mmToPt(210) }));

const state = {
  source: null,
  thumbs: null,
  settings: null,
  plan: null,
  sheetIndex: 0,
};

const preview = createPreview({
  front: $('canvas-frente'),
  back: $('canvas-verso'),
  count: $('folha-contagem'),
  prev: $('folha-anterior'),
  next: $('folha-proxima'),
  onNavigate(step) {
    state.sheetIndex = Math.min(state.plan.sheets.length - 1, Math.max(0, state.sheetIndex + step));
    refresh();
  },
});

function refresh() {
  state.plan = buildPlan(state.source?.pageSizes ?? DEMO_SIZES, state.settings);
  state.sheetIndex = Math.min(state.sheetIndex, state.plan.sheets.length - 1);
  preview.render({ plan: state.plan, sheetIndex: state.sheetIndex, thumbs: state.thumbs, debug: state.settings.debug });
  renderSummary($('resumo'), state.plan, { demo: !state.source, duplex: state.settings.duplex });
}

state.settings = initSettings(form, (settings) => {
  state.settings = settings;
  hideResult(resultRoot);
  refresh();
});

const dropzone = initDropzone($('soltar'), $('arquivo'), async (file) => {
  try {
    const source = await loadPdf(file);
    state.source?.viewer.destroy();
    state.source = source;
    state.thumbs = new ThumbnailCache(source.viewer, () => preview.redraw());
    state.sheetIndex = 0;
    dropzone.showFile({ name: source.name, pages: source.pageSizes.length });
    button.disabled = false;
    hideResult(resultRoot);
    refresh();
  } catch (err) {
    dropzone.showError(err instanceof PdfLoadError ? err.message : 'Não foi possível abrir este arquivo.');
    console.error(err);
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.source) return;
  button.disabled = true;
  button.textContent = 'Gerando…';
  await new Promise((r) => setTimeout(r, 30)); // deixa o navegador mostrar o estado
  try {
    const bytes = await generatePdf(state.source.doc, state.plan, { debug: state.settings.debug });
    showResult(resultRoot, bytes, state.source.name, state.plan, state.settings);
  } catch (err) {
    dropzone.showError('Não foi possível gerar o PDF. Tente de novo ou use outro arquivo.');
    console.error(err);
  } finally {
    button.disabled = false;
    button.textContent = 'Gerar PDF';
  }
});

new ResizeObserver(() => preview.redraw()).observe(document.querySelector('.mesa__folhas'));
document.fonts?.ready.then(() => preview.redraw());

refresh();
