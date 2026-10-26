// Configurações: preenche as opções, mantém os campos em sincronia e converte
// o formulário num objeto. Alguns campos ficam fora do <form> (na barra de
// ferramentas do preview) e se ligam a ele pelo atributo form="config".

import { PAPER_GROUPS, CUSTOM_PAPER_ID, findPaper } from '../core/papers.js';

const DEFAULT_PAPER = 'A4';
const GUTTER = { min: -30, max: 50 };
const CROP_FIELDS = { top: 'cropTop', bottom: 'cropBottom', inner: 'cropInner', outer: 'cropOuter' };

export function initSettings(form, onChange) {
  fillPapers(form.paper);

  const range = document.getElementById('espaco');
  const gutter = form.elements.gutter;
  range.addEventListener('input', () => { gutter.value = range.value; });
  gutter.addEventListener('input', () => { range.value = gutter.value; });

  // Botões − e + ao lado do espaço central.
  for (const button of document.querySelectorAll('[data-passo]')) {
    button.addEventListener('click', () => {
      const value = number(gutter, 0, GUTTER.min, GUTTER.max) + Number(button.dataset.passo);
      gutter.value = Math.min(GUTTER.max, Math.max(GUTTER.min, value));
      gutter.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  document.addEventListener('input', (e) => {
    if (e.target.form !== form) return;
    syncFields(form);
    onChange(readSettings(form));
  });

  syncFields(form);
  return readSettings(form);
}

// Atualiza um campo de corte por código (ao arrastar no preview).
export function setCropField(form, param, mm) {
  const input = form.elements[CROP_FIELDS[param]];
  input.value = mm;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillPapers(select) {
  for (const group of PAPER_GROUPS) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    for (const p of group.papers) {
      optgroup.append(new Option(`${p.label}${p.label.includes('mm') ? '' : ` (${fmt(p.w)} × ${fmt(p.h)} mm)`}`, p.id));
    }
    select.append(optgroup);
  }
  select.append(new Option('Personalizado…', CUSTOM_PAPER_ID));
  select.value = DEFAULT_PAPER;
}

const fmt = (mm) => String(Math.round(mm * 10) / 10).replace('.', ',');

function syncFields(form) {
  form.querySelector('#papel-personalizado').hidden = form.paper.value !== CUSTOM_PAPER_ID;
  form.sheetsPerSignature.disabled = form.booklet.checked;
}

function number(input, fallback, min, max) {
  const value = parseFloat(input.value);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function readSettings(form) {
  const f = form.elements;
  const custom = f.paper.value === CUSTOM_PAPER_ID;
  const paper = custom
    ? { w: number(f.customW, 210, 20, 3000), h: number(f.customH, 297, 20, 3000) }
    : findPaper(f.paper.value);

  return {
    paper: { w: paper.w, h: paper.h },
    duplex: f.duplex.value === 'true',
    alternateRotation: f.alternateRotation.checked,
    pagesPerSide: Number(f.pagesPerSide.value),
    scale: f.scale.checked,
    gutter: number(f.gutter, 0, GUTTER.min, GUTTER.max),
    crop: Object.fromEntries(Object.entries(CROP_FIELDS).map(([key, name]) => [key, number(f[name], 0, 0, 100)])),
    booklet: f.booklet.checked,
    sheetsPerSignature: Math.round(number(f.sheetsPerSignature, 4, 1, 64)),
    rightToLeft: f.rightToLeft.checked,
    debug: f.debug.checked,
  };
}
