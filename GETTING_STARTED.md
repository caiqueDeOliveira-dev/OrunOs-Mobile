# Começando do zero — checklist único

Os 3 READMEs (`packages/*/README.md`) têm os detalhes; este arquivo só junta
os passos na **ordem certa de execução**, porque a ordem importa (o passo 4
depende do 2, o 6 depende do 5, etc.) e isso não estava consolidado em
nenhum lugar antes.

Marque conforme for fazendo. Nenhum passo é opcional na primeira vez — são
todos necessários pra chegar no "app mobile funcionando sem o PC ligado".

## Preparação

- [ ] **1. Ter um projeto Supabase criado** (você já tem, segundo nossa conversa)
- [ ] **2. Instalar dependências do monorepo inteiro**
  ```bash
  cd orun-monorepo
  npm install
  ```
- [ ] **3. Validar que tudo builda antes de mexer em produção**
  ```bash
  npm run typecheck && npm run test && npm run lint && npm run build
  ```
  Deve terminar limpo: 116 testes passando, 0 erros de lint (8 avisos esperados).

## Banco de dados (packages/supabase-sync)

- [ ] **4. Rodar as migrations no Supabase**, nesta ordem exata:
  ```bash
  psql "$SUPABASE_DB_URL" -f packages/supabase-sync/supabase/migrations/0001_schema.sql
  psql "$SUPABASE_DB_URL" -f packages/supabase-sync/supabase/migrations/0002_rls.sql
  ```
- [ ] **5. Conferir/ajustar os nomes de coluna** em `0001_schema.sql` contra o
  seu `sqlite.db` real — foram inferidos do que documentamos sobre o
  projeto, não vistos diretamente. A tabela `messages` principalmente (a
  coluna `seq` precisa existir de verdade no seu schema local).

## Sincronização desktop ↔ Supabase (packages/supabase-sync)

- [ ] **6. Rodar o script de adições no SQLite local**
  (`packages/supabase-sync/src/db/sqlite_sync_additions.sql`) contra o seu
  `sqlite.db` — só soma colunas/tabelas, não apaga nada.
- [ ] **7. Guardar as credenciais do Supabase no keychain** do seu app
  Electron (mesmo mecanismo que já guarda as chaves de IA) —
  `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **8. Ligar o `SyncService`** no main process do Electron (código de
  referência em `packages/supabase-sync/README.md`, seção "Passo a passo").
- [ ] **9. Rodar o backfill UMA VEZ** antes de deixar o sync contínuo rodando,
  senão seu histórico atual nunca sobe sozinho:
  ```ts
  import { backfill } from "@orun/supabase-sync/src/services/backfill";
  await backfill(db, supabase, (p) => console.log(p));
  ```

## Chat funcionando sem o PC (packages/supabase-sync + packages/mobile-app)

- [ ] **10. Garantir que o agente Hampton (e qualquer outro que você queira
  usar do celular) está configurado com um provedor de nuvem** — `claude`,
  `openai`, `openrouter`, `groq` ou `github` na tabela `agents`. **Não**
  `ollama` — não funciona sem o PC ligado, isso é uma limitação real, não
  um bug.
- [ ] **11. Deploy da Edge Function**
  ```bash
  cd packages/supabase-sync
  supabase functions deploy ai-relay
  supabase secrets set ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GROQ_API_KEY=...
  ```
  (só o(s) secret(s) do(s) provedor(es) que os agentes realmente usam)

## App mobile (packages/mobile-app)

- [ ] **12. Criar seu usuário no Supabase Auth** — Dashboard →
  Authentication → Users → Add user (é você, e só você; não tem tela de
  cadastro de propósito).
- [ ] **13. Configurar as variáveis de ambiente do app**
  ```bash
  cd packages/mobile-app
  cp .env.example .env
  # preenche EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
  # (a anon key, NUNCA a service_role)
  ```
- [ ] **14. Rodar**
  ```bash
  npm run start
  ```
  Abre no Expo Go ou num simulador. Faça login com a conta do passo 12.

## Verificação de que "funciona sem o PC" de verdade

- [ ] **15. Desligue o PC (ou pelo menos feche o Orun OS desktop) e teste do
  celular**: mandar mensagem no Chat, ver conversas na Memória, ligar/desligar
  uma automação. Se tudo isso responder com o PC desligado, a arquitetura
  está funcionando como desenhado.
- [ ] **16. Ligue o PC de novo** e confirme que o `SyncService` puxa as
  conversas novas que você criou do celular — é assim que os dois lados
  ficam consistentes.

## O que fica pra depois (não bloqueia o uso, mas é real)

Cada item aqui está detalhado no README do pacote correspondente — não são
segredos escondidos, só não são bloqueantes pro fluxo acima funcionar:

- Backup/PITR do Supabase ligado (`packages/supabase-sync/README.md`)
- Criptografia do campo `content` das mensagens, se isso importar pra você
- Push notification quando uma automação gerar algo importante com você fora
- Mais telas mobile (Projetos, Studio, Saúde, Finanças) seguindo o padrão já
  estabelecido em `packages/mobile-app/src/services/`
- Testes de componente pras telas `HomeScreen`/`ChatScreen`/`MemoryScreen`
  (hoje só `SignInScreen` e `AutomationsScreen` têm)
