# Cópia publicada do site da Comunica+Fé

Esta pasta é só a cópia já montada do site da Comunica+Fé, usada para publicar o projeto `comunica-fe` no Vercel (https://comunica-fe.vercel.app).
O código-fonte fica no repositório Chagas019/Chagas019 (`site/pagina.html`). Para atualizar, rode lá
`bash scripts/vercel-build.sh` e copie a pasta `_site` para cá.

A pasta `api/` tem as funções do servidor: `conta.mjs` (contas), `dados.mjs` (banco de dados compartilhado, num Blob privado do Vercel) e `conteudo.mjs` (Criador de conteúdo com IA). A pasta `api/_lib/` tem o código que elas dividem. Para atualizar, copie também a pasta `api/` inteira.
Como as contas e a IA funcionam está em `LOGIN.md`, no repositório Chagas019.
