// Formulário de configurações: preenche as opções, mantém os campos em
// sincronia e converte o formulário num objeto de configurações.

import { PAPER_GROUPS, CUSTOM_PAPER_ID, findPaper } from '../core/papers.js';

const DEFAULT_PAPER = 'A4';

export function initSettings(form, onChange) {
  fillPapers(form.paper);

  const range = form.querySelector('#espaco');
  range.addEventListener('input', () => { form.gutter.value = range.value; });
  form.gutter.addEventListener('input', () => { range.value = form.gutter.value; });

  form.addEventListener('input', () => {
    syncFields(form);
    onChange(readSettings(form));
  });

  syncFields(form);
  return readSettings(form);
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
  const custom = form.paper.value === CUSTOM_PAPER_ID;
  const paper = custom
    ? { w: number(form.customW, 210, 20, 3000), h: number(form.customH, 297, 20, 3000) }
    : findPaper(form.paper.value);

  return {
    paper: { w: paper.w, h: paper.h },
    duplex: form.duplex.value === 'true',
    alternateRotation: form.alternateRotation.checked,
    pagesPerSide: Number(form.pagesPerSide.value),
    scale: form.scale.checked,
    gutter: number(form.gutter, 0, 0, 50),
    booklet: form.booklet.checked,
    sheetsPerSignature: Math.round(number(form.sheetsPerSignature, 4, 1, 64)),
    rightToLeft: form.rightToLeft.checked,
    debug: form.debug.checked,
  };
}
