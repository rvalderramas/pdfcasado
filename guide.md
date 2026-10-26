# Guia do projeto

Leia este arquivo antes de mexer no código. Ele diz onde cada coisa está e por quê.

## Estrutura

```
index.html              Estrutura da página e todos os textos fixos
public/favicon.svg      Ícone
src/main.js             Liga as peças: estado, formulário, arquivo, preview e geração
src/core/               Lógica pura, sem DOM e sem bibliotecas (testável no Node)
  papers.js             Lista de tamanhos de papel em mm
  units.js              Conversão mm ↔ pontos
  signatures.js         Divide o livro em cadernos e define as páginas de cada folha
  layout.js             Geometria: grade na folha, posição das páginas, espaço central, giro do verso
  imposition.js         Junta tudo num "plano" único usado pelo preview e pelo gerador
  labels.js             Textos do modo de conferência
src/pdf/                Tudo que toca em bibliotecas de PDF
  loader.js             Abre o arquivo (pdf-lib para dados, pdf.js para imagens) e valida
  thumbnails.js         Renderiza e guarda miniaturas sob demanda
  generator.js          Gera o PDF final com pdf-lib
src/ui/                 Um arquivo por componente de interface
  settings.js           Formulário de opções → objeto de configurações
  dropzone.js           Área de arrastar e soltar
  preview.js            Desenho da folha no canvas
  summary.js            Resumo abaixo do preview
  result.js             Download e instruções
src/styles/
  tokens.css            Cores, fontes e espaçamentos (mude aqui primeiro)
  base.css              Estrutura da página
  components.css        Um bloco por componente, variações com --modificador
```

## Decisões

- **Um único plano para preview e PDF.** `buildPlan` calcula a posição de cada página uma vez. O preview e o gerador só desenham esse plano, então o que aparece na tela é o que sai no arquivo.
- **Coordenadas.** O plano usa pontos (1/72 pol.), origem no canto superior esquerdo e y para baixo. O gerador converte para o sistema do PDF (y para cima) na hora de desenhar.
- **Duplas sempre na horizontal.** Em vez de girar as duplas como o Book Binder, o site gira o papel (retrato ou paisagem), o que dá o mesmo resultado com menos código. A borda de virada indicada no resumo leva isso em conta.
- **Verso.** Por padrão, o verso é o espelho horizontal da frente (virar a folha pela lateral da página do PDF). "Girar o verso em 180°" equivale a virar pela outra borda.
- **Cortar e empilhar.** Com mais de uma dupla por lado, o fólio j vai para a folha j mod n, na posição j div n. Assim cada posição, depois do corte, vira uma pilha já em ordem.
- **Espaço central.** Medido a partir da dobra. Com "ajustar ao papel" ligado, as páginas diminuem para caber; desligado, mantêm o tamanho e podem passar da borda (o resumo avisa).
- **Rotação gravada no PDF.** Páginas com rotação interna aparecem como no leitor de PDF; o gerador soma essa rotação ao desenhar.
- **Miniaturas.** Renderizadas só para a folha visível, com no máximo 48 em memória.

## Convenções

- Classes em português no padrão bloco__elemento--modificador (`.botao--primario`, `.mesa__barra`).
- Textos de interface em português, frases curtas, sem caixa alta.
- Lógica nova de imposição vai em `src/core`, nunca na interface.
