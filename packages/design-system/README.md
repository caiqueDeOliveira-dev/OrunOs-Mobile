# Orun OS — Design System (Fase 1 completa: fundação + 20 telas)

Pacote **separado** do app Electron principal, pra não bagunçar o que já tá funcionando.
Quando estiver validado, isso vira uma dependência local (`file:../orun-design-system`)
ou um workspace dentro do monorepo do Orun OS.

## Preview app (testado — builda de verdade)

Agora tem um app Vite de verdade dentro do pacote pra você navegar pelas 20 telas:

```bash
cd orun-design-system
npm install
npm run dev      # abre em http://localhost:5173
```

Rodei aqui antes de mandar: `npx tsc --noEmit` sem erros, `npx vite build` completou
em ~16s sem erros de import/tipo. Reinstale as dependências do seu lado (`node_modules`
não vai no zip) e `npm run dev` deve abrir direto.

**Como navegar:** o Sidebar de cada tela já troca de tela de verdade (via um
`navigationStore` global — zustand — que o `DesktopShell` usa por baixo dos panos
quando a tela não passa seu próprio `onNavigate`). Embaixo, uma barra flutuante de
dev deixa você: alternar Desktop/Mobile (Home Mobile renderiza dentro de uma moldura
de celular), abrir a Voice Mode em tela cheia, e ciclar entre os 4 temas.

## Roteamento real (react-router-dom)

Cada tela agora tem uma URL de verdade (`#/chat`, `#/settings`, `#/projects`...),
o botão voltar/avançar do navegador funciona, e o Sidebar de cada tela navega
pelo router de verdade — não é mais um switch manual de estado.

Uso de **`HashRouter`** (não `BrowserRouter`) é proposital: um app Electron
empacotado carrega de `file://`, onde a History API do `BrowserRouter` quebra
ao dar refresh/relançar. Hash routing (`#/rota`) funciona em qualquer contexto
de arquivo estático, incluindo dentro do Electron sem servidor.

`DesktopShell` deriva a tela ativa da URL atual automaticamente — você não
precisa passar `activeId` pra cada tela (o prop continua existindo como
override manual, se precisar). `idToPath()`/`pathToId()` (exportados de
`layouts/DesktopShell`) centralizam a conversão entre id de tela e rota.

## Code-splitting + ESLint (fechando pontas soltas desta rodada)

**Code-splitting real**: cada tela agora é `React.lazy` (`src/App.tsx`).
O bundle inicial caiu de ~1,24 MB pra **356 KB**. O aviso de "chunk maior que
500kB" do Vite ainda aparece, mas agora é só pro chunk do `HamptonScene`
(817 KB — Three.js é pesado por natureza), e esse chunk só carrega quando uma
tela que mostra o Hampton é aberta, não mais no carregamento inicial.

**Studio Mobile** — a última tela mobile que faltava (antes caía pra Home).

**ESLint estava quebrado**: o script `npm run lint` existia no `package.json`
desde o início, mas o ESLint nunca tinha sido instalado nem configurado —
rodar teria dado `eslint: not found`. Instalei e configurei
(`eslint.config.js`, flat config do ESLint 9 + TypeScript + React Hooks), e
rodando pela primeira vez ele **achou 2 bugs reais**:

- `AudioWaveform` chamava `Math.random()` direto durante o render (dentro de
  `useMemo` e inline no JSX) — impuro, pode gerar resultado inconsistente em
  re-renders/StrictMode. Corrigido: os valores aleatórios agora são gerados
  uma vez em `useEffect` após o mount, com um estado neutro inicial estável.
- Consequência do fix acima: `setState` síncrono dentro do `useEffect`
  disparava um aviso de possível cascata de renders — resolvido com um
  `eslint-disable` pontual e comentado, já que é randomização visual
  intencional de uma única vez, não sincronização com sistema externo.

`npm run lint` agora roda limpo: **0 erros, 6 avisos** (todos
`react-refresh/only-export-components` — arquivos que exportam componente +
constantes/hooks juntos, como `DesktopShell.tsx` e `ThemeProvider.tsx`;
afeta só a experiência de Fast Refresh no dev, não o build de produção nem o
runtime — decisão consciente de não fragmentar esses arquivos só por causa
disso).

## Mais telas mobile (Chat, Settings e Studio)

O app mobile não pode ficar só com a Home. Adicionei:

- **`MobileShell`** (`layouts/MobileShell.tsx`) — chrome único mobile (topo +
  BottomNavigation + Drawer lateral), o equivalente mobile do `DesktopShell`.
  `HomeMobile` foi refatorada pra usar ele em vez de duplicar o chrome.
- **`ChatMobile`** — mesmo `chatStore`, `MessageBubble`, `ChatInput` e
  `HamptonScene` do Chat desktop; só a moldura muda.
- **`SettingsMobile`** — mesmo `SyncStatusPanel`, `Switch`, `Select` do
  Settings desktop, empilhados numa coluna.
- **`StudioMobile`** — mesmo hub do Studio desktop (Imagem/Vídeo/Música), em
  coluna única em vez do grid de 3 colunas do desktop.

No preview (`npm run dev`), a barra flutuante embaixo alterna Desktop/Mobile;
dentro do modo Mobile, os 4 tabs de baixo (Início/Chat/Studio/Config) já
trocam de tela de verdade.

**Bug real encontrado e corrigido nesta rodada:** elementos `position: fixed`
(BottomNavigation, FloatingButton) escapavam da moldura de celular no preview
e grudavam na borda da janela do navegador de verdade, em vez de ficar
contidos dentro do mockup. Corrigido adicionando um `transform` na moldura
(cria um "containing block" pra elementos fixed — truque de CSS conhecido).
Também corrigi um bug de layout onde o composer do Chat Mobile teria rolado
pra fora de vista, porque o `MobileShell` antigo forçava scroll em todo
mundo; agora cada tela controla seu próprio scroll interno.

## Error Boundary + retry de chunk (robustez do lazy-loading)

Depois de converter as telas pra `React.lazy` na rodada anterior, faltava
tratar o caso de falha: se um chunk não carrega (deploy novo com hash de
arquivo diferente, antivírus bloqueando, offline no meio da navegação), o
app quebrava sem fallback.

- **`lazyWithRetry`** (`utils/lazyWithRetry.ts`) — substitui todo `React.lazy`
  direto. `React.lazy` cacheia a promise rejeitada **pra sempre**, então um
  retry ingênuo (só limpar estado local) falharia nas mesmas condições
  instantaneamente. A solução real: na primeira falha, recarrega a página
  uma única vez (via uma flag em `sessionStorage`, pra não entrar em loop se
  o problema for persistente) — cobre o caso comum de "chunk antigo depois
  de um deploy". A flag é limpa a cada mount bem-sucedido (`main.tsx`), pra
  um deploy futuro ter sua própria tentativa.
- **`ErrorBoundary`** — envolve tanto as rotas desktop quanto o preview
  mobile. Pega qualquer erro de render (não só chunk), mostra uma tela de
  fallback com o erro e um botão "Tentar de novo", em vez do app sumir sem
  explicação.

Ambos com testes reais: `lazyWithRetry` testado com dependências injetadas
(sem depender de `window.location.reload` de verdade), incluindo o caso "já
tentou uma vez, não tenta de novo, deixa o erro passar".

## Testes de componente (Vitest + Testing Library)

```bash
npm run test        # roda uma vez
npm run test:watch  # modo watch
```

46 testes em 11 arquivos, todos passando — cobrindo os componentes mais usados
(`Button`, `Switch`, `Badge`, `Avatar`, `StatusChip`), o `chatStore` (streaming
mockado com fake timers), o `MobileShell` (troca de tab, abrir/fechar drawer,
callback de item de menu), o **`ErrorBoundary`** e o **`lazyWithRetry`**
(retry-uma-vez sem depender de `window` de verdade) e, principalmente, o
**`DesktopShell` integrado com roteamento de verdade** (`MemoryRouter`):
confirma que o Sidebar destaca o item certo a partir da URL sem precisar de
`activeId` manual, que clicar no Sidebar de fato muda a URL, e que passar
`activeId` explícito ainda funciona como override. Também cobre o
`SyncStatusPanel` — contadores zerados antes de qualquer dado chegar, botão
"Tentar de novo" só aparece com dead letters, e o callback `onRetryFailed` é
chamado corretamente.

## CI (GitHub Actions)

`.github/workflows/ci.yml` roda `typecheck` + `lint` + `test` + `build` a
cada push/PR que toque nesta pasta. Assume que o pacote vive em
`orun-design-system/` na raiz do repo — se você dobrar isso pra dentro do
monorepo principal do Orun OS em outro caminho, ajusta o `working-directory`
e os filtros `paths` no topo do arquivo. Não está ligado ao pipeline de
build de instaladores (Windows/macOS/Linux) que já existe no projeto
principal — são workflows separados de propósito.

## Fundação

- Estrutura de pastas completa (`components`, `layouts`, `pages`, `hooks`, `services`, `animations`, `stores`, `theme`, `icons`, `assets`, `utils`, `types`)
- 4 temas via CSS variables, trocáveis em runtime sem rebuild: `dark`, `bloodred` (padrão), `premium`, `minimal`
- Tailwind config consumindo os tokens de tema
- `cn()` util, tipos compartilhados (`OrunAgent`, `Size`, `Variant`, `StatusKind`)
- `DesktopShell` (`layouts/`) — única fonte de verdade pro Sidebar + Navigation; toda tela desktop compõe dentro dele, sem duplicar layout

## Componentes (26 no total — os 23 originais + 3 adicionados por necessidade real de tela)

Button, Input, Card, GlassCard, Panel, Badge, Chip, StatusChip, Avatar, Loader,
Progress, Tooltip, Modal, Dialog, Toast (+ store), Notification, FloatingButton,
Sidebar, Drawer, Navigation, BottomNavigation, Dock, Window, ChatInput, MessageBubble.

**Adicionados durante a construção das telas** (não estavam na lista original, mas
eram necessários e agora são reutilizáveis por qualquer tela futura):
- `HamptonScene` (React Three Fiber) — núcleo 3D do Hampton, 4 moods (`idle`, `listening`, `thinking`, `speaking`)
- `AudioWaveform` — visualizador de barras animado (Voice Mode, Music Studio)
- `Switch` / `Select` — toggle e dropdown, usados em Settings, Automation, Plugin Manager, Developer
- `SyncStatusPanel` — status do sync híbrido SQLite↔Supabase (pendentes, presos, última sync, Realtime), usado igual em Developer e Settings

## As 20 telas — todas implementadas

| # | Tela | Arquivo | Destaques |
|---|------|---------|-----------|
| 1 | Home Desktop | `pages/desktop/HomeDesktop.tsx` | Dock com Hampton central, ChatInput, glow ambiente |
| 2 | Home Mobile | `pages/mobile/HomeMobile.tsx` | HamptonScene, MobileShell, atalhos de agentes |
| 3 | Chat | `pages/desktop/Chat.tsx` | Streaming mockado, mood do Hampton reage em tempo real |
| 4 | Voice Mode | `pages/desktop/VoiceMode.tsx` | Fullscreen imersivo, AudioWaveform, mic mute |
| 5 | Projects | `pages/desktop/Projects.tsx` | Kanban com Card/Chip/Badge/Progress |
| 6 | Developer | `pages/desktop/Developer.tsx` | Atribuição de modelo por agente, console de logs |
| 7 | Memory | `pages/desktop/Memory.tsx` | Busca + cards de contexto memorizado |
| 8 | Studio | `pages/desktop/Studio.tsx` | Hub pra Imagem/Vídeo/Música |
| 9 | Image Generator | `pages/desktop/ImageGenerator.tsx` | Prompt + grid de resultados + estilos |
| 10 | Video Generator | `pages/desktop/VideoGenerator.tsx` | Preview + progresso circular de render |
| 11 | Music Studio | `pages/desktop/MusicStudio.tsx` | Waveform player + faixas geradas |
| 12 | Health | `pages/desktop/Health.tsx` | Dashboard Nutricionista + Personal Trainer |
| 13 | Finance | `pages/desktop/Finance.tsx` | Custo por provedor de IA, uso de TTS |
| 14 | Automation | `pages/desktop/Automation.tsx` | n8n/WhatsApp/cron, riscos sinalizados honestamente |
| 15 | Research | `pages/desktop/Research.tsx` | Busca + lista de fontes |
| 16 | Settings | `pages/desktop/Settings.tsx` | Tema, TTS, chaves, privacidade (reflete limitações reais) |
| 17 | Profile | `pages/desktop/Profile.tsx` | Perfil do Caique + roster de 18 agentes |
| 18 | Notifications | `pages/desktop/Notifications.tsx` | Notification Center via `NotificationItem` |
| 19 | Updates | `pages/desktop/Updates.tsx` | electron-updater + changelog |
| 20 | Plugin Manager | `pages/desktop/PluginManager.tsx` | Instalar/ativar plugins, riscos sinalizados |

Todas as telas de desktop (exceto Home e Voice Mode, que são intencionalmente
diferentes) usam `<DesktopShell>` — zero duplicação de Sidebar/Navigation.

## Honestidade sobre o estado disso

Isso é uma **Fase 1 de UI**: estrutura, composição e fluxo visual reais, com estado
local (zustand) e dados mockados onde ainda não existe integração real. Não é o
app funcionando ponta a ponta. Os pontos exatos de integração real estão marcados
em comentário no código:
- `stores/chatStore.ts` → `sendMessage` — trocar o mock por streaming real via IPC
- `Developer.tsx` → tabela de atribuição de modelo — já no formato certo pra plugar no seu backend de providers
- `Settings.tsx` → reflete as limitações reais do README (áudio não-local, banco não criptografado) em vez de fingir que já estão resolvidas

## Ligando o status de sync de verdade (Developer + Settings)

O `SyncStatusPanel` (usado nas duas telas) lê de `syncStatusStore` — hoje
começa zerado. Pra mostrar dados reais, no processo main do Electron (onde
vive o `SyncService` do pacote `orun-supabase-sync`):

```ts
// main process
ipcMain.handle("sync:getStatus", () => syncService.getSyncStatus());
ipcMain.handle("sync:retryFailed", () => syncService.retryFailed());
```
```ts
// preload.ts
contextBridge.exposeInMainWorld("orunAPI", {
  getSyncStatus: () => ipcRenderer.invoke("sync:getStatus"),
  retrySyncFailed: () => ipcRenderer.invoke("sync:retryFailed"),
});
```
```ts
// renderer, uma vez no bootstrap do app
import { useSyncStatusStore } from "@orun/design-system";

setInterval(async () => {
  const status = await window.orunAPI.getSyncStatus();
  useSyncStatusStore.getState().setStatus(status);
}, 5000);
```
E troca o `onRetryFailed` mockado no `Developer.tsx`/`Settings.tsx` por
`() => window.orunAPI.retrySyncFailed()`.

## Como plugar no projeto Electron existente

> **Nota:** este pacote agora vive dentro de `orun-monorepo/packages/design-system`
> (veja o README na raiz do monorepo). Se o seu app Electron entrar como um
> terceiro workspace ali, o passo 2 abaixo vira `"@orun/design-system": "workspace:*"`
> em vez de `file:`. Se preferir manter os dois repositórios separados por
> enquanto, os passos abaixo continuam valendo como estão.

1. Copie a pasta `design-system` pra raiz do seu monorepo, ao lado da pasta do app atual.
2. No `package.json` do app Electron:
   ```json
   "dependencies": { "@orun/design-system": "file:../design-system" }
   ```
3. Importe o CSS global uma vez no entry point: `import "@orun/design-system/src/theme/globals.css"`
4. Envolva o app com `<ThemeProvider>`.
5. O roteamento já vem pronto (`react-router-dom` + `HashRouter`) — veja `src/App.tsx` como referência de como montar as `<Routes>` no seu app real; todas as 20 telas já vêm exportadas do barrel principal (`src/index.ts`).
6. Troque telas do Figma Make export por estas, uma de cada vez, sem pressa.

## Próximos passos sugeridos (não pedidos, mas naturais a partir daqui)
- ~~Roteamento real entre as 20 telas~~ ✅ feito (react-router-dom + HashRouter)
- Ligar `chatStore` e `syncStatusStore` ao IPC real (única coisa que só dá pra fazer com o app Electron de verdade)
- ~~Extrair `Home Mobile` + demais telas mobile-específicas~~ ✅ feito (Chat, Settings, Studio mobile)
- ~~Testes de componente (Vitest + Testing Library)~~ ✅ feito (46 testes, ver seção acima)
- ~~Code-splitting / bundle inicial menor~~ ✅ feito (React.lazy por tela, 1,24MB → 356KB)
- ~~ESLint configurado e rodando~~ ✅ feito (achou e corrigiu 2 bugs reais na primeira execução)
- ~~Error Boundary + retry de chunk falho~~ ✅ feito (`ErrorBoundary` + `lazyWithRetry`)
- ~~CI rodando testes automaticamente~~ ✅ feito (`.github/workflows/ci.yml`)
- Image/Video/Music Generator mobile — Studio Mobile já linka pra eles, mas as telas em si ainda não existem
- Considerar monorepo de verdade (pnpm workspaces/Turborepo) se `design-system` e `supabase-sync` crescerem — hoje são dependências `file:` manuais

## Stack confirmada
React 18, TypeScript, Electron (host), TailwindCSS, Framer Motion, Lucide Icons,
React Three Fiber + drei + three, Zustand, TanStack Query (entra na integração de dados reais).
