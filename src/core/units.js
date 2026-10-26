// Conversões entre milímetros e pontos tipográficos (1 pt = 1/72 polegada).

export const MM_TO_PT = 72 / 25.4;

export const mmToPt = (mm) => mm * MM_TO_PT;
export const ptToMm = (pt) => pt / MM_TO_PT;
