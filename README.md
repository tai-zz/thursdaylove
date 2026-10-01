# Certidão de Casamento 💍

Um site feito para o celular, onde a **Ana Júlia Bassani de Souza Nascimento**
assina a certidão de casamento com **João Eduardo Pinto**.

## Como funciona

1. **Abertura animada** — um envelope lacrado com o nome dela; ao tocar, o lacre
   estoura, a carta sobe e a certidão entra em cena.
2. **A certidão** — a imagem original, com os nomes e a data de hoje sendo
   "escritos" à mão sobre as linhas, um campo de cada vez.
3. **A assinatura** — ela assina com o dedo direto na tela.
4. **O "Eu aceito"** — flash, confetes, corações, vibração do celular e o carimbo
   *ASSINADO COM AMOR* batendo sobre o papel.
5. **Salvar** — gera um PNG da certidão assinada, pronto para guardar ou
   compartilhar (usa o compartilhamento nativo do celular quando disponível).

A assinatura fica guardada no próprio aparelho (`localStorage`), então, se ela
reabrir o site, a certidão continua assinada. O botão *Assinar de novo* limpa.

## Arquivos

| arquivo | o que é |
|---|---|
| `index.html` | a página |
| `styles.css` | visual e todas as animações (bordas, abertura, celebração) |
| `script.js` | assinatura, confetes, carimbo e geração do PNG |
| `assets/certidao.png` | a imagem original da certidão |
| `assets/certidao-data.js` | a mesma imagem embutida em base64, para o botão de salvar funcionar mesmo offline |

## Para abrir no celular

É um site estático, sem build e sem dependências, com o `index.html` na raiz.

Para ligar o GitHub Pages (só precisa ser feito uma vez, e só o dono do
repositório consegue — o token do GitHub Actions não tem permissão para criar o
site):

> **Settings → Pages → Source: `Deploy from a branch` → Branch:
> `claude/vibrant-clarke-5dxfvi` + `/ (root)` → Save**

Em um ou dois minutos o site fica em `https://tai-zz.github.io/thursdaylove/`.
Depois disso, todo push na branch republica sozinho.

Também funciona abrindo o `index.html` direto do aparelho — a imagem embutida em
base64 garante que o botão de salvar continue funcionando nesse caso.

## Detalhes

- Mobile first; testado em iPhone SE, iPhone 13, Pixel 5 e Galaxy S9+.
- A data é a do dia em que ela abrir o site (`new Date()`), então assina sempre
  com "hoje".
- Fontes manuscritas vêm do Google Fonts (Parisienne, Great Vibes), com
  alternativas locais caso não carreguem.
- Respeita `prefers-reduced-motion` para quem desliga animações.
