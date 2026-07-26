# Orun OS Mobile

App Expo/React Native do Orun OS. Fala **direto com o Supabase** — não
precisa do app desktop (Electron) ligado. A chamada de IA acontece na
Edge Function `ai-relay` (dentro de `packages/supabase-sync`), não no
PC do usuário.

## Stack

- Expo SDK 52+ com Expo Router (file-based routing)
- React Native 0.76
- React 19.1.0 (mesma versão do design-system desktop)
- Zustand para state management
- Supabase JS Client (auth + realtime + Edge Functions)
- Reanimated 3 para animações
- Gesture Handler para gestures nativos

## Estrutura

```
packages/mobile-app/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Layout raiz (ThemeProvider + Auth check)
│   ├── (auth)/                 # Fluxo de autenticação
│   │   ├── _layout.tsx         # Stack auth (só mostra se não logado)
│   │   ├── sign-in.tsx         # Tela de login
│   │   ├── sign-up.tsx         # Tela de cadastro
│   │   └── onboarding.tsx      # Onboarding pós-cadastro
│   ├── (tabs)/                 # Tab navigation principal
│   │   ├── _layout.tsx         # Bottom tabs (7 tabs)
│   │   ├── index.tsx           # Home — status, ações rápidas
│   │   ├── chat.tsx            # Chat principal (Hampton)
│   │   ├── agents.tsx          # Grid de agentes
│   │   ├── memory.tsx          # Memória do Hampton
│   │   ├── automations.tsx     # Automações
│   │   ├── voice.tsx           # Interface de voz
│   │   └── settings.tsx        # Configurações + tema
│   ├── chat/
│   │   └── [agentId].tsx       # Chat individual por agente
│   ├── workspace/
│   │   └── [workspaceId].tsx   # Workspaces especializados (modal)
│   └── +not-found.tsx          # 404
├── src/
│   ├── components/
│   │   ├── ui/                 # Button, Card, Input, Avatar, Badge, Loader, EmptyState
│   │   ├── chat/               # MessageBubble, ChatInput
│   │   ├── agents/             # AgentCard
│   │   ├── camera/             # CameraCapture
│   │   ├── share/              # ShareExtensionView
│   │   └── widget/             # WidgetGrid, AutomationWidget
│   ├── hooks/                  # useChat, useOnlineStatus, useBiometricLock, useSafeArea
│   ├── stores/                 # authStore, chatStore (Zustand)
│   ├── services/               # supabaseClient, chatService, memoryService, automationsService,
│   │                           # offlineQueue, voiceService, backgroundService, notificationService,
│   │                           # securityService, analyticsService, sentryService, rateLimiter,
│   │                           # shareExtensionService
│   ├── theme/                  # tokens.ts (cores, spacing, tipografia), ThemeProvider.tsx
│   ├── types/                  # Tipos compartilhados com desktop
│   ├── i18n/                   # Traduções (PT, EN, ES, FR)
│   └── utils/                  # cn(), timeAgo(), haptics(), scaledText()
└── app.json                    # Config Expo (scheme, plugins, icons)
```

## Como rodar

```bash
cd packages/mobile-app
cp .env.example .env
# Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run start
```

Abre no Expo Go (dev) ou builda com EAS pra produção.

## Compatibilidade com Desktop

O mobile app lê/escreve as **mesmas tabelas Supabase** que o desktop
sincroniza via SyncService. Quando o desktop está online, o SyncService
puxa as conversas criadas no celular — e vice-versa.

O que é compartilhado com o desktop:
- `src/types/` — mesmos tipos (OrunAgent, ChatMessage, etc)
- `src/services/` — mesmas chamadas Supabase
- Tabelas: conversations, messages, agents, automations

O que é mobile-only:
- `src/theme/` — tema adaptado pra React Native (mesmos valores hex)
- `src/components/` — componentes redesenhados mobile-first
- `app/` — navegação Expo Router (substitui Sidebar desktop)

## Segurança

- API keys em SecureStore (iOS Keychain / Android Keystore)
- Apenas a `anon key` do Supabase — nunca `service_role`
- RLS policies garantem acesso só com sessão autenticada
- Sem tela de cadastro de propósito (app single-user)

## Funcionalidades

- [x] Login com Supabase Auth
- [x] Cadastro com Supabase Auth
- [x] Onboarding pós-cadastro
- [x] Chat com Hampton via ai-relay Edge Function
- [x] Grid de agentes com navegação por agente
- [x] Memória do Hampton
- [x] Automações
- [x] Interface de voz (Whisper STT via ai-relay)
- [x] Configurações com seleção de tema (4 temas)
- [x] Realtime — mensagens aparecem live
- [x] Status online/offline
- [x] Fila de mensagens offline
- [x] Cache de conversas para offline
- [x] i18n (PT, EN, ES, FR)
- [x] Paginação de mensagens
- [x] Indicador de digitação
- [x] Câmera para captura de fotos
- [x] Background fetch para automações
- [x] Notificações locais
- [x] Deteção de root/jailbreak
- [x] Rate limiting

## Próximos passos

- [ ] Integração real de TTS (ElevenLabs/Google TTS)
- [ ] Push notifications (expo-notifications)
- [ ] Desbloqueio biométrico (expo-local-authentication)
- [ ] Share extension (compartilhar de outros apps)
- [ ] Workspaces especializados (Developer, Designer, etc)
- [ ] Widgets (chat rápido, status de automações)
- [ ] Testes de componente (React Native Testing Library)
