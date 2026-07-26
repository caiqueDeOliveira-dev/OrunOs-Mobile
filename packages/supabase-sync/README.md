# Orun OS — Sync Híbrido SQLite ↔ Supabase

Pacote separado, do mesmo jeito que o design system: você revisa e testa antes
de plugar no app principal. Nada aqui mexe no seu `sqlite.db` além de somar
colunas/tabelas novas.

## Modelo escolhido

**SQLite continua sendo a fonte da verdade pro dia a dia** — leitura/escrita
local, instantânea, funciona offline. Um serviço em background (`SyncService`)
roda a cada 15s (ajustável) e faz duas coisas:

1. **Push**: drena a fila `sync_queue` (tudo que você escreveu localmente) pro Supabase.
2. **Pull**: busca no Supabase o que mudou desde a última vez e atualiza o SQLite.

Resolução de conflito: **last-write-wins por `updated_at`**. Simples e
suficiente pra um app de usuário único usado de uma máquina por vez. Se um dia
você usar o Orun OS de dois computadores ao mesmo tempo, vale revisar isso
antes que vire problema de verdade.

## Segurança — leia antes de plugar

Esse sync usa a chave **`service_role`** do Supabase, que **ignora RLS por
completo**. Ela só pode existir no **processo main do Electron**, nunca no
renderer/preload, nunca em `.env` empacotado no app. Guarde ela no keychain do
SO — o mesmo mecanismo que vocês já usam pras chaves dos provedores de IA.

A migration `0002_rls.sql` habilita RLS em todas as tabelas e **não cria
nenhuma policy** — isso é de propósito. Se a chave `anon` algum dia vazar
(por exemplo, indo parar sem querer em código do renderer), ela não consegue
ler nem escrever nada, porque não existe policy liberando acesso.

## Passo a passo

> **Nota:** este pacote agora vive dentro de `orun-monorepo/packages/supabase-sync`
> (veja o README na raiz do monorepo). O passo 3 abaixo já reflete que
> `better-sqlite3` está listado como devDependency aqui (pros testes deste
> pacote rodarem sozinhos) — seu app Electron continua precisando da própria
> instalação recompilada pro Electron (`electron-rebuild`), não a daqui.

### 1. Rodar as migrations no Supabase
No SQL Editor do seu projeto Supabase (ou via CLI `supabase db push`), rode
nesta ordem:
```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
```

### 2. Atualizar o SQLite local
Rode `src/db/sqlite_sync_additions.sql` contra o seu `sqlite.db` atual. Ele só
adiciona colunas (`updated_at`, `deleted_at`, `seq`) e duas tabelas novas
(`sync_queue`, `sync_meta`) — nada é apagado ou reescrito.

> Atenção: se sua tabela `messages` já tem uma coluna com outro nome pra
> ordenação (algo derivado do fix de rowid), ajuste o `ALTER TABLE ... ADD
> COLUMN seq` pra não colidir, ou reaproveite a coluna existente.

### 3. Instalar a dependência nova
```bash
npm install @supabase/supabase-js
```
(`better-sqlite3` já deve estar no seu projeto.)

### 4. Guardar as credenciais no keychain
Em vez de `.env`, salve `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do jeito
que você já salva as chaves da Claude/OpenAI/etc — mesma função de keychain,
só com uma chave nova.

### 5. Ligar o serviço no main process
```ts
import { initSupabaseFromKeychain } from "./services/supabaseClient";
import { SyncService } from "./services/syncService";
import { db } from "./db"; // sua instância existente do better-sqlite3

const supabase = await initSupabaseFromKeychain(readSecretFromKeychain);
if (supabase) {
  const sync = new SyncService(db, supabase);
  sync.start(); // roda em background a cada 15s
}
```

### 6. Rodar o backfill — UMA VEZ, antes de ligar o sync contínuo
Sem isso, seu histórico atual (conversas, mensagens, uso) nunca chega no
Supabase sozinho — só escritas novas entram na fila automaticamente.
```ts
import { backfill } from "./services/backfill";

await backfill(db, supabase, (p) => {
  console.log(`${p.table}: ${p.pushed}/${p.total}`);
});
// só depois disso: sync.start()
```
Roda em lotes de 500, então funciona mesmo com muito histórico. Ao final,
marca `sync_meta` como "já sincronizado até agora" pra evitar que o primeiro
pull tente rebaixar tudo que acabou de subir.

### 7. Enfileirar as escritas existentes
Em cada lugar do seu código que hoje faz `INSERT`/`UPDATE` direto no SQLite
(conversas, mensagens, uso de provedor, TTS, automações), some uma chamada ao
outbox logo depois:
```ts
db.prepare("INSERT INTO messages (...) VALUES (...)").run(...);
enqueueUpsert(db, "messages", message.id, message);
```
Pra deleção, troque hard delete por soft delete (`UPDATE ... SET deleted_at = ...`)
e chame `enqueueDelete` — assim o outro lado do sync sabe que precisa remover
também, em vez de simplesmente nunca mais ver a linha.

**Importante:** suas queries de leitura existentes (listar conversas, listar
mensagens) precisam continuar filtrando `WHERE deleted_at IS NULL` — isso não
mudou com o sync, mas vale confirmar que já é assim, porque uma deleção agora
é sempre "soft" (a linha continua existindo, só marcada).

## Retry, backoff e itens presos

Falhas de rede não travam a fila mais. Cada item que falha ganha um atraso
exponencial antes de tentar de novo (15s → 30s → 1min → ... até 1h de teto).
Depois de 8 tentativas, o item vira um **dead letter** — para de tentar
sozinho, mas fica visível:
```ts
const stuck = sync.getDeadLetters(); // pra mostrar num badge no Developer/Settings
sync.retryFailed(); // zera tentativas de tudo que falhou, ex: botão "Tentar de novo"
```

## Edge Function `ai-relay` — chat funcionando sem o PC ligado

`supabase/functions/ai-relay/` — roda nos servidores do Supabase (Deno), não
no seu PC. É o que permite o app mobile (`packages/mobile-app`) conversar
com o Hampton com o desktop completamente desligado: em vez do celular
chamar o Electron main process, ele chama essa função, que guarda a
mensagem, chama o provedor de IA configurado pro agente, grava a resposta —
tudo na nuvem. Quando o desktop ligar de novo, o `SyncService` já documentado
acima puxa essas mensagens novas normalmente.

**Providers cobertos**: Claude nativo + qualquer provedor compatível com a
API da OpenAI (OpenAI, OpenRouter, Groq, GitHub Models). **Ollama fica de
fora de propósito** — é inferência local, não tem endpoint de nuvem pra
chamar; um agente configurado com Ollama recebe um erro claro em vez de
falhar silenciosamente (`validateAgentIsUsable` em `logic.ts`).

A lógica pura (validação de request, montagem de histórico, seleção de
provedor) fica em `logic.ts` e tem 17 testes Vitest — o `index.ts` em si
(que usa `Deno.serve`/`Deno.env`/`jsr:` imports) só roda em runtime Deno de
verdade, então não tem cobertura de teste automatizada; valide com
`supabase functions serve ai-relay` contra um Supabase local antes de
confiar em produção.

Deploy:
```bash
supabase functions deploy ai-relay
supabase secrets set ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GROQ_API_KEY=...
```

## Realtime (opcional)

Por padrão o sync é só polling (a cada 15s, nos dois sentidos). Pra reduzir a
latência quando você realmente usar de duas máquinas ao mesmo tempo:
```ts
sync.enableRealtime();
```
Isso assina mudanças via websocket e dispara um pull imediato pra tabela que
mudou. O polling continua rodando de qualquer jeito — Realtime só encurta o
caminho comum, não substitui a rede de segurança. Precisa habilitar Realtime
por tabela no Supabase também (Dashboard → Database → Replication, ou o
`alter publication` comentado no fim do `0001_schema.sql`).

## O que NÃO está incluso (de propósito)

- **Auth de usuário real** — como é single-user, optamos pela chave
  `service_role` isolada no main process em vez de Supabase Auth. Se um dia
  vocês tiverem múltiplos usuários de verdade, isso muda.
- **Resolução de conflito por campo** — last-write-wins é por linha inteira,
  não por campo. Suficiente pro uso atual.
- **Criptografia do banco** — continua valendo o limite já documentado no
  README principal do Orun OS: nem o SQLite local nem o Postgres remoto estão
  criptografados em repouso por padrão aqui (Supabase criptografa em trânsito
  e o disco a nível de infraestrutura, mas não há criptografia de aplicação
  adicional configurada neste pacote).
- **Vacuum de tombstones antigos** — linhas deletadas ficam pra sempre como
  `deleted_at` preenchido, tanto no SQLite quanto no Supabase. Não é
  problema de espaço no seu volume de uso, mas se um dia incomodar, dá pra
  rodar uma limpeza periódica (`DELETE ... WHERE deleted_at < now() - interval '90 days'`).

## Correções desta rodada

- **Ordem de push por dependência**: antes, a fila era drenada estritamente
  na ordem em que os itens foram enfileirados. Se uma `message` chegasse à
  fila antes (ou fosse reprocessada antes) da sua `conversation` pai, o
  Supabase rejeitava por causa da foreign key. Agora o push reordena o lote
  por prioridade de tabela (`agents` → `conversations` → o resto) antes de
  enviar, sem mudar a ordem de itens da mesma tabela entre si.
- **`nextMessageSeq(db, conversationId)`** (`outbox.ts`) — gera o próximo
  `seq` de forma segura. Antes eu só dizia "você precisa de uma coluna seq"
  sem dar um jeito de gerar ela sem risco de colisão (duas mensagens
  simultâneas pegando o mesmo número e violando o `UNIQUE(conversation_id, seq)`
  do schema).

## Validação de payload de IPC (segurança)

**Por que isso importa**: mesmo com `contextIsolation: true` e sem
`nodeIntegration` no renderer, o processo main não deveria confiar
cegamente no formato do que chega via `ipcMain.handle`. Um bug em outro
lugar do app (ex: renderizar conteúdo de mensagem do WhatsApp sem
sanitização) poderia, em teoria, influenciar o que um handler recebe.

`src/services/ipcSchemas.ts` — schemas Zod pra validar o payload **antes**
dele chegar no `SyncService`/SQLite:
```ts
ipcMain.handle("sync:enqueueUpsert", (_event, payload) => {
  const parsed = enqueueUpsertPayloadSchema.parse(payload); // lança erro se inválido
  enqueueUpsert(db, parsed.table, parsed.recordId, parsed.row);
});
```
Rejeita: nome de tabela fora da lista permitida, `recordId` vazio ou
absurdamente longo, payload de linha maior que 200KB (em vez de truncar
silenciosamente), `role` de mensagem fora do enum esperado. 11 testes cobrindo
casos válidos e hostis.

## Recomendações de produção (não dá pra implementar sem o seu Supabase/Electron reais)

Isso aqui é orientação, não código pronto — preciso do seu ambiente real pra
qualquer um destes virar uma tarefa concreta:

- **Backup do Supabase**: confirma que Point-in-Time Recovery (ou ao menos
  backup diário automático) está ligado no seu projeto. Agora que o Postgres
  é fonte de verdade cross-device, uma migration mal escrita rodada por
  engano pode apagar histórico de verdade — sem PITR, não tem volta.
- **Retenção de `usage_events`**: cresce uma linha por chamada de provedor,
  sem parar. Antes que a tabela fique grande, vale um job periódico (cron do
  Supabase, ou um `DELETE`/agregação rodada pelo próprio Orun OS) resumindo
  ou arquivando linhas antigas.
- **Criptografia do campo `content` de mensagens**: antes, tudo era só
  local. Agora mensagens (potencialmente com conteúdo sensível vindo do
  WhatsApp) vivem na nuvem também. Se isso incomodar, dá pra criptografar
  `content` no cliente antes do upsert (a chave fica só no keychain local,
  nunca sobe pro Supabase) — o servidor nunca vê o texto em claro. Isso muda
  a tabela pra guardar um blob cifrado em vez de texto pesquisável.
- **Monorepo de verdade**: hoje `design-system` e `supabase-sync` são
  dependências `file:` manuais. Com 2+ pacotes internos, pnpm workspaces ou
  Turborepo evita dor de cabeça de versionamento quando os três projetos
  crescerem juntos.

## Testes (Vitest — de verdade agora, não mais scripts descartáveis)

```bash
npm install
npm test
```

**31 testes em 5 arquivos, versionados de verdade** (`src/test/helpers.ts`
tem um banco SQLite em memória + um cliente Supabase fake reutilizável entre
eles). Antes desta rodada, tudo isso tinha sido validado só com scripts
`node -e "..."` executados ao vivo e descartados — funcionava, mas ninguém
ia saber se quebrasse depois de uma mudança no schema. Agora fica no repo:

- `outbox.test.ts` (6) — `enqueueUpsert`/`enqueueDelete` gravam certo, `nextMessageSeq` incrementa por conversa e não vaza entre conversas diferentes
- `syncService.push.test.ts` (4) — push básico, ordem por dependência de tabela, backoff exponencial não retenta antes da hora, dead letter após 8 tentativas + `retryFailed()`
- `syncService.pull.test.ts` (6) — upsert de linha nova, `null` vira `NULL` de verdade (não a string `"null"`), last-write-wins nos dois sentidos, paginação de 1200 linhas em 3 páginas num ciclo, bookmark de `sync_meta` correto entre ciclos
- `backfill.test.ts` (4) — 1300 linhas em lotes de 500, callback de progresso, bookmark final de `sync_meta`, erro do Supabase propaga como exceção em vez de falhar silenciosamente
- `ipcSchemas.test.ts` (11) — payloads válidos passam, payloads hostis/malformados (tabela fora da lista, `recordId` vazio/gigante, linha >200KB, `role` fora do enum) são rejeitados

Rodei `npx tsc --noEmit` e `npm test` antes de fechar esta rodada — ambos limpos.

Isso NÃO substitui testar contra um Supabase real. O que ainda falta validar lá:
```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_rls.sql
```
e revisar o `syncService.ts`/`backfill.ts` com o schema real das suas tabelas
(os nomes de coluna aqui são inferidos do que já documentamos sobre o projeto
— confira contra o seu `sqlite.db` de verdade antes de rodar em produção).

## CI (GitHub Actions)

`.github/workflows/ci.yml` roda `tsc --noEmit` + `npm test` a cada push/PR
que toque nesta pasta — assume que o pacote vive em `orun-supabase-sync/` na
raiz do repo (ajusta `working-directory` e `paths` se o caminho mudar). Não
roda migrations contra um Supabase real; só valida a lógica do engine contra
SQLite em memória + cliente fake.
