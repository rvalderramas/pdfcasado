// Ponto de entrada: liga o formulário, o arquivo, o preview e a geração do PDF.

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { buildPlan } from './core/imposition.js';
import { mmToPt } from './core/units.js';
import { loadPdf, PdfLoadError } from './pdf/loader.js';
import { ThumbnailCache } from './pdf/thumbnails.js';
import { generatePdf } from './pdf/generator.js';
import { NO_CROP } from './core/crop.js';
import { initSettings, setCropField } from './ui/settings.js';
import { initDropzone } from './ui/dropzone.js';
import { createPreview } from './ui/preview.js';
import { renderSummary } from './ui/summary.js';
import { showResult, hideResult } from './ui/result.js';
import { initCropTool } from './ui/crop-tool.js';

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
  cropMode: false,
};

const canvases = [$('canvas-frente'), $('canvas-verso')];

const preview = createPreview({
  container: $('folhas-area'),
  front: canvases[0],
  back: canvases[1],
  count: $('folha-contagem'),
  prev: $('folha-anterior'),
  next: $('folha-proxima'),
  onNavigate(step) {
    state.sheetIndex = Math.min(state.plan.sheets.length - 1, Math.max(0, state.sheetIndex + step));
    refresh();
  },
});

function refresh() {
  const sizes = state.source?.pageSizes ?? DEMO_SIZES;
  state.plan = buildPlan(sizes, state.settings);
  state.sheetIndex = Math.min(state.sheetIndex, state.plan.sheets.length - 1);

  // No modo de corte, o preview mostra a página inteira com o corte por cima;
  // ao concluir, as páginas se reajustam ao espaço liberado.
  const shown = state.cropMode ? buildPlan(sizes, { ...state.settings, crop: NO_CROP }) : state.plan;
  preview.render({
    plan: shown,
    sheetIndex: state.sheetIndex,
    thumbs: state.thumbs,
    debug: state.settings.debug,
    cropMode: state.cropMode,
    cropPt: Object.fromEntries(Object.entries(state.settings.crop).map(([k, v]) => [k, mmToPt(v)])),
  });
  renderSummary($('resumo'), state.plan, { demo: !state.source, duplex: state.settings.duplex });
  cropTool.updateSummary(state.settings.crop);
}

function setResultVisible(visible) {
  button.classList.toggle('botao--secundario', visible);
  button.classList.toggle('botao--primario', !visible);
}

const cropTool = initCropTool({
  toggle: $('cortar'),
  panel: $('corte-painel'),
  done: $('corte-concluir'),
  reset: $('corte-zerar'),
  summary: $('corte-resumo'),
  canvases,
  preview,
  getCrop: () => state.settings.crop,
  onCrop: (param, mm) => setCropField(form, param, mm),
  onModeChange(active) {
    state.cropMode = active;
    refresh();
  },
});

state.settings = initSettings(form, (settings) => {
  state.settings = settings;
  hideResult(resultRoot);
  setResultVisible(false);
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
    setResultVisible(false);
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
    setResultVisible(true);
  } catch (err) {
    dropzone.showError('Não foi possível gerar o PDF. Tente de novo ou use outro arquivo.');
    console.error(err);
  } finally {
    button.disabled = false;
    button.textContent = 'Gerar PDF';
  }
});

new ResizeObserver(() => preview.redraw()).observe($('folhas-area'));
document.fonts?.ready.then(() => preview.redraw());

refresh();
