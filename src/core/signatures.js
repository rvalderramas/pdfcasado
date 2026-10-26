// Divide o livro em cadernos e calcula quais páginas vão em cada folha dobrada (fólio).
//
// Um fólio é uma folha dobrada ao meio: 4 páginas (2 na frente, 2 no verso).
// Num caderno de s folhas, a folha 0 é a de fora e a última é a do miolo.
// Índices de página começam em 0; `null` significa página em branco.

export function planSignatures(pageCount, { booklet, sheetsPerSignature, rightToLeft }) {
  const totalFolios = Math.max(1, Math.ceil(pageCount / 4));
  const groups = booklet ? 1 : Math.ceil(totalFolios / sheetsPerSignature);

  // Distribui as folhas o mais igualmente possível entre os cadernos.
  const base = Math.floor(totalFolios / groups);
  const extra = totalFolios % groups;
  const sizes = Array.from({ length: groups }, (_, i) => base + (i < extra ? 1 : 0));

  const folios = [];
  let offset = 0;
  sizes.forEach((sheets, signature) => {
    const n = sheets * 4;
    const page = (local) => (offset + local < pageCount ? offset + local : null);
    for (let i = 0; i < sheets; i++) {
      const front = [page(n - 1 - 2 * i), page(2 * i)];
      const back = [page(2 * i + 1), page(n - 2 - 2 * i)];
      folios.push({
        signature,
        sheet: i,
        front: rightToLeft ? front.reverse() : front,
        back: rightToLeft ? back.reverse() : back,
      });
    }
    offset += n;
  });

  return { sizes, folios, totalPages: offset, blankPages: offset - pageCount };
}
