# Orun OS — Monorepo

**Novo aqui ou voltando depois de um tempo? Comece por
[`GETTING_STARTED.md`](./GETTING_STARTED.md)** — checklist único, na ordem
certa, juntando os 3 READMEs num só caminho do zero até o app mobile
funcionando sem o PC ligado.

Workspace npm reunindo os pacotes compartilhados do Orun OS. Testado do zero
(`npm ci` limpo + typecheck + lint + test + build) antes de entregar.

## Estrutura

```
orun-monorepo/
├── package.json          # workspaces: ["packages/*"]
├── .github/workflows/ci.yml
└── packages/
    ├── design-system/    # @orun/design-system — componentes, temas, 20 telas (desktop) + 4 (mobile web)
    ├── supabase-sync/    # @orun/supabase-sync — engine de sync SQLite↔Supabase + Edge Function ai-relay
    └── mobile-app/       # @orun/mobile-app — app Expo/React Native, funciona sem o PC ligado
```

`mobile-app` é diferente dos outros dois: fala **direto com o Supabase**,
não passa pelo Electron. É o que permite usar o Orun de qualquer lugar, com
o PC desligado — a chamada de IA acontece na Edge Function `ai-relay`
(dentro de `supabase-sync`), não na sua máquina. Detalhes de segurança e
arquitetura em `packages/mobile-app/README.md`.

Quando o app Electron principal (o `orun-os` de verdade, com Baileys, n8n,
node-cron etc.) entrar aqui, ele vira um quarto workspace —
`packages/app` (ou o nome que fizer sentido) — e passa a importar os outros
como `"@orun/design-system": "workspace:*"` em vez de `file:../...`.

## Comandos (rodam nos três pacotes de uma vez)

```bash
npm install       # uma instalação só, na raiz — resolve os três workspaces
npm run typecheck # tsc --noEmit nos três
npm run typecheck:edge-logic # tsc --noEmit só na lógica pura da Edge Function (Deno não entra no typecheck normal)
npm run lint      # eslint (só design-system tem lint configurado)
npm run test      # vitest + jest — 116 testes no total (46 design-system + 22 mobile-app + 48 supabase-sync)
npm run build     # vite build (só design-system tem build de artefato; mobile-app builda via `expo build`/EAS, fora deste comando)
```

Cada script usa `--workspaces --if-present`, então um pacote sem aquele
script é pulado sem quebrar o comando.

Pra rodar comando só num pacote específico:
```bash
npm run test --workspace=@orun/design-system
npm run test --workspace=@orun/supabase-sync
npm run test --workspace=@orun/mobile-app
npm run typecheck --workspace=@orun/mobile-app
```

## CI

Um workflow só (`.github/workflows/ci.yml`) — `npm ci` na raiz, depois os
comandos acima. Não roda o app mobile de ponta a ponta (precisa de
simulador/dispositivo, fora do escopo de um runner de CI padrão) nem
substitui o pipeline de build de instaladores (Windows/macOS/Linux) que já
existe no projeto principal.

## Nota sobre versão do React entre workspaces

`design-system` e `mobile-app` precisam declarar a **mesma versão exata** de
`react` (hoje `19.1.0` nos dois). Duas cópias de React na árvore quebram os
testes de componente do `mobile-app` (React Native Testing Library) de um
jeito confuso ("Cannot read properties of null, reading 'useRef'"). Se um
dia atualizar o React de um pacote, atualiza do outro junto. Detalhes de
como isso foi descoberto e corrigido em `packages/mobile-app/README.md`.

## Nota sobre `better-sqlite3`

`packages/supabase-sync` declara `better-sqlite3` como **devDependency** (pra
rodar os próprios testes) e também como **peerDependency** (documentando que
quem consome o pacote de verdade — o app Electron — deve trazer sua própria
versão). Isso importa porque `better-sqlite3` é um módulo nativo compilado:
a versão que o app Electron usa em produção precisa ser recompilada contra o
Node/Electron ABI certo (via `electron-rebuild` ou similar) — a versão
instalada aqui no monorepo é só pra rodar os testes em Node puro, não é a
mesma binária que vai rodar dentro do Electron empacotado.

## Cada pacote tem seu próprio README

- [`packages/design-system/README.md`](./packages/design-system/README.md) — componentes, temas, telas, testes, roteamento
- [`packages/supabase-sync/README.md`](./packages/supabase-sync/README.md) — schema, engine de sync, segurança, testes, Edge Function
- [`packages/mobile-app/README.md`](./packages/mobile-app/README.md) — app Expo, arquitetura independente do PC, passo a passo de deploy
