// Área de arrastar e soltar do arquivo PDF.

export function initDropzone(root, input, onFile) {
  input.addEventListener('change', () => {
    if (input.files[0]) onFile(input.files[0]);
    input.value = '';
  });

  for (const type of ['dragenter', 'dragover']) {
    root.addEventListener(type, (e) => {
      e.preventDefault();
      root.classList.add('soltar--ativo');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    root.addEventListener(type, (e) => {
      e.preventDefault();
      root.classList.remove('soltar--ativo');
    });
  }
  root.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  });

  const empty = root.querySelector('.soltar__vazio');
  const full = root.querySelector('.soltar__cheio');
  const error = document.getElementById('arquivo-erro');

  return {
    showFile({ name, pages }) {
      root.querySelector('#arquivo-nome').textContent = name;
      root.querySelector('#arquivo-info').textContent = `${pages} ${pages === 1 ? 'página' : 'páginas'}`;
      empty.hidden = true;
      full.hidden = false;
      root.classList.add('soltar--cheio');
      error.hidden = true;
    },
    showError(message) {
      error.textContent = message;
      error.hidden = false;
    },
  };
}
