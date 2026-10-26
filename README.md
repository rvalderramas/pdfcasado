# PDF Casado

Site que transforma um PDF em cadernos prontos para imprimir, dobrar e costurar (imposição para encadernação). Tudo roda no navegador: o arquivo nunca é enviado para um servidor.

## O que já funciona

- Carregar um PDF por arrastar e soltar ou pelo seletor de arquivos.
- Tamanhos de papel das séries A, B, C, RA, SRA, formatos americanos, Ofício e papel personalizado em milímetros.
- Impressão frente e verso automática ou manual, com opção de girar o verso em 180°.
- 2, 4, 6 ou 8 páginas por lado da folha, com corte e empilhamento.
- Ajuste das páginas ao papel ou tamanho original.
- Espaço central ajustável (0 a 50 mm) entre as duas páginas de cada dupla.
- Livreto único ou cadernos com número de folhas definido, distribuindo as folhas quando a conta não fecha.
- Leitura da direita para a esquerda.
- Modo de conferência, que imprime caderno, folha, lado, página e pilha em cada posição.
- Preview com as páginas reais do PDF, frente e verso lado a lado, navegação por folha, dobra, linhas de corte e faixa do espaço central.
- Resumo com cadernos, folhas, páginas em branco e qual borda usar para virar o papel.
- Instruções de impressão e montagem junto com o botão de download.

## Como rodar no computador

Precisa do Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

Para gerar a versão de produção: `npm run build` (sai na pasta `dist`).

## Como publicar na Vercel

1. Crie um repositório no GitHub e envie esta pasta para ele.
2. Na Vercel, clique em "Add New… > Project" e importe o repositório.
3. A Vercel detecta o Vite sozinha. Mantenha as opções padrão (build `npm run build`, saída `dist`) e clique em "Deploy".

Cada novo envio para o GitHub atualiza o site publicado.

## Tecnologias

- [Vite](https://vite.dev) para desenvolvimento e build.
- [pdf-lib](https://pdf-lib.js.org) para montar o PDF final, copiando as páginas como vetor, sem perda de qualidade.
- [pdf.js](https://mozilla.github.io/pdf.js/) para desenhar as miniaturas do preview.
