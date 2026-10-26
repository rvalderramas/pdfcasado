// Mostra o PDF gerado para download, com instruções de impressão e montagem.

let currentUrl = null;

export function hideResult(root) {
  root.hidden = true;
  root.replaceChildren();
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = null;
}

export function showResult(root, bytes, sourceName, plan, { duplex }) {
  hideResult(root);
  currentUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const fileName = `${sourceName.replace(/\.pdf$/i, '')}-casado.pdf`;
  const sheets = plan.sheets.length;

  const steps = duplex
    ? [`Imprima em frente e verso, virando pela borda ${plan.flipEdge}, em tamanho real (100%, sem "ajustar à página").`]
    : [
      `Imprima as páginas 1 a ${sheets} em tamanho real (100%).`,
      `Recoloque a pilha na bandeja, virando pela borda ${plan.flipEdge}, e imprima as páginas ${sheets + 1} a ${sheets * 2}.`,
      'Na primeira vez, teste com duas folhas para conferir se cada verso cai atrás da frente certa.',
    ];
  if (plan.stacks > 1) steps.push(`Corte a pilha nas linhas de corte e junte as ${plan.stacks} pilhas em ordem, começando pela pilha 1.`);
  steps.push('Dobre cada folha ao meio, encaixe as folhas de cada caderno, uma dentro da outra, e empilhe os cadernos em ordem.');

  root.innerHTML = `
    <div class="resultado__topo">
      <p class="resultado__titulo">PDF pronto</p>
      <a class="botao botao--primario" download></a>
    </div>
    <ol class="resultado__passos"></ol>`;
  const link = root.querySelector('a');
  link.href = currentUrl;
  link.download = fileName;
  link.textContent = 'Baixar PDF';
  root.querySelector('ol').append(...steps.map((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    return li;
  }));
  root.hidden = false;
  root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
