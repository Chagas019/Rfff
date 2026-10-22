# CLAUDE.md

Responda em português. Seja objetivo.

## Projeto
GRID F1: plataforma interativa da temporada 2026 de Fórmula 1, feita com React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React e React Router. Testes com Vitest + Testing Library.

- `npm run dev`: servidor local
- `npm run lint`: typecheck (`tsc -b --noEmit`)
- `npm test`: testes
- `npm run build`: build de produção (publicado na Vercel)

Código em `src/` (`components/`, `pages/`, `games/`, `hooks/`, `services/`, `data/`, `types/`, `utils/`). Siga a estrutura e o estilo que já existem.

## Regras gerais
- **Economia**: leia só os arquivos necessários, busque antes de abrir, não releia o que já está no contexto e faça a menor mudança que resolve. Respostas curtas: o que mudou, onde e como verificar.
- **Investigue antes de alterar**: reproduza o erro e encontre a causa raiz. Nada de `any`, `@ts-ignore`, `try/catch` vazio ou teste desabilitado para "passar".
- **Reaproveite** componentes, hooks, tokens e estilos existentes. Não crie arquivos, abstrações nem dependências que a tarefa não pede; nunca instale biblioteca sem avisar.
- **Design**: nada de layout genérico ou com cara de template. Hierarquia clara, escala de espaçamento e tipográfica, estados completos (hover, foco, carregando, vazio, erro) e responsivo de 360px a ultrawide.
- **Movimento**: anime só `transform`/`opacity` e respeite `prefers-reduced-motion`.
- **Acessibilidade**: HTML semântico, teclado, foco visível e contraste AA.
- **Performance**: imagens otimizadas com dimensões, divisão de código por rota e nada pesado no carregamento inicial.
- **Segurança**: nenhum segredo no código; variáveis `VITE_*` são públicas.
- **Antes de concluir**: rode `npm run lint` e `npm test` (e `npm run build` se mexer em configuração ou dependências).

## Skills (`.claude/skills/`)
Carregue a skill relevante para a tarefa:

| Área | Skills |
|---|---|
| Design | `premium-ui-ux`, `creative-web-designer`, `anti-generic-design`, `art-direction`, `design-system-tokens`, `responsive-layout` |
| 3D e movimento | `web-3d-experience`, `realistic-materials`, `motion-design-engineer` |
| Engenharia | `frontend-architect`, `clean-components`, `root-cause-debugging`, `backend-api-design`, `database-modeling`, `security-audit` |
| Qualidade | `token-efficiency`, `performance-engineer`, `qa-testing`, `accessibility-audit`, `seo-optimization` |

Ter uma skill não instala bibliotecas nem configura integrações: confira o `package.json` e a documentação antes de usar uma ferramenta.
