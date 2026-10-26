// Tamanhos de papel em milímetros, sempre como [largura, altura] em retrato.

const ISO_A = [[841, 1189], [594, 841], [420, 594], [297, 420], [210, 297], [148, 210], [105, 148], [74, 105], [52, 74], [37, 52], [26, 37]];
const ISO_B = [[1000, 1414], [707, 1000], [500, 707], [353, 500], [250, 353], [176, 250], [125, 176], [88, 125], [62, 88], [44, 62], [31, 44]];
const ISO_C = [[917, 1297], [648, 917], [458, 648], [324, 458], [229, 324], [162, 229], [114, 162], [81, 114], [57, 81], [40, 57], [28, 40]];
const RA = [[860, 1220], [610, 860], [430, 610], [305, 430], [215, 305]];
const SRA = [[900, 1280], [640, 900], [450, 640], [320, 450], [225, 320]];

const series = (prefix, list) => list.map(([w, h], i) => ({ id: `${prefix}${i}`, label: `${prefix}${i}`, w, h }));

export const PAPER_GROUPS = [
  {
    label: 'Série A',
    papers: [
      { id: '4A0', label: '4A0', w: 1682, h: 2378 },
      { id: '2A0', label: '2A0', w: 1189, h: 1682 },
      ...series('A', ISO_A),
    ],
  },
  { label: 'Série B', papers: series('B', ISO_B) },
  { label: 'Série C', papers: series('C', ISO_C) },
  { label: 'Gráfica (RA e SRA)', papers: [...series('RA', RA), ...series('SRA', SRA)] },
  {
    label: 'Formatos americanos e brasileiros',
    papers: [
      { id: 'oficio', label: 'Ofício (216 × 330 mm)', w: 216, h: 330 },
      { id: 'carta', label: 'Carta / Letter', w: 215.9, h: 279.4 },
      { id: 'legal', label: 'Legal', w: 215.9, h: 355.6 },
      { id: 'tabloide', label: 'Tabloide', w: 279.4, h: 431.8 },
      { id: 'executive', label: 'Executive', w: 184.15, h: 266.7 },
      { id: 'folio', label: 'Folio', w: 215.9, h: 330.2 },
    ],
  },
];

export const CUSTOM_PAPER_ID = 'personalizado';

const ALL = new Map(PAPER_GROUPS.flatMap((g) => g.papers).map((p) => [p.id, p]));

export function findPaper(id) {
  return ALL.get(id);
}
