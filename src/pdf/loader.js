// Abre o PDF escolhido pelo usuário duas vezes: com pdf-lib (para ler tamanhos
// e gerar a saída) e com pdf.js (para desenhar as miniaturas do preview).

import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export class PdfLoadError extends Error {}

export async function loadPdf(file) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) throw new PdfLoadError('Escolha um arquivo .pdf.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    throw new PdfLoadError('Não foi possível ler este PDF. O arquivo pode estar corrompido.');
  }
  if (doc.isEncrypted) {
    throw new PdfLoadError('Este PDF está protegido por senha. Remova a proteção e tente de novo.');
  }

  // pdf.js transfere o buffer para o worker, por isso recebe uma cópia.
  const viewer = await pdfjs.getDocument({ data: bytes.slice() }).promise;

  return { name: file.name, doc, viewer, pageSizes: doc.getPages().map(visibleSize) };
}

// Tamanho da página como aparece na tela (considera a rotação gravada no PDF).
function visibleSize(page) {
  const box = page.getCropBox();
  const sideways = page.getRotation().angle % 180 !== 0;
  return sideways ? { w: box.height, h: box.width } : { w: box.width, h: box.height };
}
