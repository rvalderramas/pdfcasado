// Resumo do plano: quantas folhas, cadernos, páginas em branco e como imprimir.

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function describeSignatures(sizes) {
  const counts = new Map();
  for (const s of sizes) counts.set(s, (counts.get(s) || 0) + 1);
  if (counts.size === 1) return `${plural(sizes.length, 'caderno', 'cadernos')} de ${plural(sizes[0], 'folha', 'folhas')}`;
  return [...counts].map(([s, n]) => `${n} × ${plural(s, 'folha', 'folhas')}`).join(' e ');
}

export function renderSummary(root, plan, { demo, duplex }) {
  const sheets = plan.sheets.length;
  const rows = [];

  if (demo) {
    rows.push(['Exemplo', 'Livro de 16 páginas A5. Escolha um PDF para ver o seu.']);
  } else {
    const blanks = plan.blankPages ? ` + ${plural(plan.blankPages, 'em branco', 'em branco')} no final` : '';
    rows.push(['Páginas', `${plan.pageCount}${blanks}`]);
  }
  rows.push(['Cadernos', describeSignatures(plan.signatureSizes)]);
  rows.push(['Papel', `${plural(sheets, 'folha', 'folhas')}, ${plural(sheets * 2, 'página', 'páginas')} no PDF gerado`]);
  if (plan.stacks > 1) rows.push(['Corte', `cada folha rende ${plan.stacks} pilhas`]);
  rows.push([duplex ? 'Impressora' : 'Ao virar a pilha', `virar pela borda ${plan.flipEdge}`]);

  root.replaceChildren(...rows.flatMap(([term, value]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    return [dt, dd];
  }));

  if (plan.overflow) {
    const warn = document.createElement('p');
    warn.className = 'aviso';
    warn.textContent = 'Algumas páginas passam da sua metade da folha e serão cortadas. Marque "Ajustar as páginas ao papel" ou diminua o espaço central.';
    root.append(warn);
  }
}
