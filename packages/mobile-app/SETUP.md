# Orun OS Mobile — Guia Completo Passo a Passo

## Índice
1. [Pré-requisitos](#1-pré-requisitos)
2. [Configuração do Projeto](#2-configuração-do-projeto)
3. [Supabase](#3-supabase)
4. [Variáveis de Ambiente](#4-variáveis-de-ambiente)
5. [Build de Desenvolvimento](#5-build-de-desenvolvimento)
6. [Share Extension (iOS)](#6-share-extension-ios)
7. [Background Fetch](#7-background-fetch)
8. [Sentry (Error Tracking)](#8-sentry-error-tracking)
9. [PostHog (Analytics)](#9-posthog-analytics)
10. [App Store / Play Store](#10-app-store--play-store)
11. [Checklist Final](#11-checklist-final)

---

## 1. Pré-requisitos

### Contas necessárias
| Serviço | URL | Custo | Obrigatório |
|---------|-----|-------|-------------|
| Supabase | https://supabase.com | Free tier | Sim |
| Apple Developer | https://developer.apple.com | $99/ano | Sim (iOS) |
| Google Play Console | https://play.google.com/console | $25 (único) | Sim (Android) |
| Sentry | https://sentry.io | Free até 5K eventos | Opcional |
| PostHog | https://posthog.com | Free até 1M eventos | Opcional |
| OpenAI | https://platform.openai.com | Pago | Para STT (voz) |

### Ferramentas no computador
```bash
# Node.js 18+ (verificar)
node --version  # deve ser >= 18

# Expo CLI
npm install -g expo-cli

# Supabase CLI
npm install -g supabase

# Xcode (apenas macOS) — necessário pra iOS
# Baixar da App Store ou developer.apple.com

# Android Studio (opcional) — necessário pra Android
# Baixar em developer.android.com
```

### Celular pra teste
- **iOS**: iPhone com iOS 15+ (via USB ou Expo Go)
- **Android**: Celular com Android 10+ (via USB ou Expo Go)

---

## 2. Configuração do Projeto

### 2.1 Clonar o repositório
```bash
git clone https://github.com/seu-usuario/orun-monorepo.git
cd orun-monorepo
```

### 2.2 Instalar dependências do mobile
```bash
cd packages/mobile-app
npm install
```

### 2.3 Verificar que tudo instalou
```bash
# Deve listar os pacotes principais
ls node_modules/expo
ls node_modules/expo-router
ls node_modules/expo-camera
ls node_modules/expo-notifications
ls node_modules/expo-background-fetch
ls node_modules/expo-task-manager
ls node_modules/expo-device
ls node_modules/expo-share-extension
ls node_modules/posthog-react-native
```

### 2.4 Typecheck (verificar que não tem erros)
```bash
npx tsc --noEmit
# Deve retornar sem erros
```

---

## 3. Supabase

### 3.1 Criar projeto (se não existir)
1. Acesse https://supabase.com → Sign Up
2. New Project → Escolha nome, senha, região
3. Anote:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbG...` (Settings → API)

### 3.2 Rodar as migrations (banco de dados)
```bash
cd packages/supabase-sync

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Rodar migrations (cria as tabelas)
supabase db push
```

### 3.3 Deploy da Edge Function (ai-relay)
```bash
# Ainda dentro de packages/supabase-sync

# Setar as chaves de API como secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# Só as que você usar — as outras podem ficar vazias

# Deploy
supabase functions deploy ai-relay
```

### 3.4 Testar o ai-relay
```bash
# Pegue seu ANON_KEY no painel do Supabase (Settings → API)
# Substitua YOUR_ANON_KEY abaixo

curl -X POST https://SEU-PROJETO.supabase.co/functions/v1/ai-relay \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "transcribe",
    "audio": "U29tZSB0ZXh0IHRlc3Q=",
    "mimeType": "audio/m4a"
  }'
# Deve retornar algo como: {"text":"Some text test"}
```

### 3.5 Criar o primeiro agent
1. No painel do Supabase → Table Editor → `agents`
2. Insert Row:
   ```
   id: hampton
   name: Hampton
   default_provider: openai
   default_model: gpt-4o
   persona_prompt: Você é Hampton, um assistente prestativo.
   ```
3. Salvar

---

## 4. Variáveis de Ambiente

### 4.1 Criar o arquivo .env
```bash
cd packages/mobile-app
cp .env.example .env
```

### 4.2 Editar o .env
```bash
# Abrir no editor de texto e preencher:

# Obrigatório — Supabase
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # copie do painel

# Opcional — Sentry (deixe vazio se não for usar)
EXPO_PUBLIC_SENTRY_DSN=

# Opcional — PostHog (deixe vazio se não for usar)
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 4.3 Verificar
```bash
# O app deve ler as variáveis automaticamente
cat .env
```

---

## 5. Build de Desenvolvimento

### 5.1 Opção A: Expo Go (mais rápido, pra testar)
```bash
cd packages/mobile-app
npx expo start
# Ler QR code com Expo Go no celular
# Limitações: não funciona background fetch, share extension, notificações push
```

### 5.2 Opção B: Development Build (recomendado)
```bash
cd packages/mobile-app

# Gerar projeto nativo
npx expo prebuild

# ─── iOS ───
npx expo run:ios
# Abre no simulador (macOS) ou instala no iPhone (via USB)

# ─── Android ───
npx expo run:android
# Abre no emulador ou instala no celular (via USB)
```

### 5.3 Verificar que roda
- [ ] Tela de login aparece
- [ ] Consegue fazer login com email/senha do Supabase
- [ ] Tabs aparecem (Home, Chat, Agents, Voice, Memory, Automations, Settings)
- [ ] Consegue enviar mensagem no Chat
- [ ] Consegue gravar áudio no Voice

---

## 6. Share Extension (iOS)

### 6.1 O que é
Permite compartilhar texto/foto de qualquer app (Safari, Fotos, WhatsApp, etc.) direto pro Orun OS.

### 6.2 Configurar
```bash
cd packages/mobile-app

# Gerar projeto nativo (se ainda não fez)
npx expo prebuild --platform ios

# Abrir no Xcode
open ios/OrunOSMobile.xcworkspace
```

### 6.3 No Xcode
1. File → New → Target → Share Extension
2. Nome: `ShareExtension`
3. Team: selecione sua Apple Developer Team
4. Bundle Identifier: `com.orun.os.ShareExtension`
5. Finish

### 6.4 Configurar App Group
1. No target principal (OrunOSMobile) → Signing & Capabilities → + Capability → App Groups
2. Criar group: `group.com.orun.os`
3. No target ShareExtension → Signing & Capabilities → + Capability → App Groups
4. Selecionar o mesmo group: `group.com.orun.os`

### 6.5 Code Signing
1. Em ambos os targets → Signing → Provisioning Profile →选择 seu profile
2. Se não tiver profile, Xcode pode criar automaticamente

### 6.6 Testar
1. Build and Run (▶️) no Xcode
2. No iPhone: abrir Safari → Compartilhar → Orun OS
3. Deve abrir o share extension com o texto da página

### 6.7 Android (não aplicável)
Share extension é feature iOS. No Android, o equivalente é "Share Intent" que já funciona via Expo.

---

## 7. Background Fetch

### 7.1 O que é
Executa automações em background, mesmo com app fechado. Verifica a cada ~15 minutos se tem automação pra rodar.

### 7.2 Configurar
Já está configurado no `app.json`:
```json
"expo-background-fetch"
```

### 7.3 No iOS (via Xcode)
1. No Xcode → target OrunOSMobile → Signing & Capabilities → + Capability → Background Modes
2. Marcar: **Background fetch** e **Background processing**

### 7.4 Testar
```bash
# No iOS Simulator
# Debug → Simulate Background Fetch
# Ou no device: Settings → Developer → Background App Refresh → ON

# Verificar logs no terminal onde roda `npx expo start`
# Deve ver: "[background] Task BACKGROUND_AUTOMATION executed"
```

### 7.5 Android
Background fetch funciona automaticamente no Android via WorkManager. Não precisa de config extra.

---

## 8. Sentry (Error Tracking)

### 8.1 Criar conta
1. Acesse https://sentry.io → Sign Up
2. Create Project → React Native
3. Escolha região mais próxima (US/EU)

### 8.2 Pegar o DSN
1. No projeto criado → Settings → Client Keys (DSN)
2. Copiar o DSN

### 8.3 Configurar
```bash
# Adicionar ao .env
echo "EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx" >> .env
```

### 8.4 Instalar pacote (opcional)
```bash
# Só se quiser Sentry completo
npx expo install @sentry/react-native
```

**Nota**: O app já funciona sem o Sentry. O `sentryService.ts` usa require dinâmico — se o pacote não estiver instalado, o Sentry não carrega.

### 8.5 Testar
```bash
# Forçar um erro pra ver se chega no Sentry
# No app → Settings → (algo que cause erro)
# Ou adicionar temporariamente:
# throw new Error("Test error");
```

---

## 9. PostHog (Analytics)

### 9.1 Criar conta
1. Acesse https://posthog.com → Sign Up
2. Criar projeto
3. Copiar Project API Key

### 9.2 Configurar
```bash
# Adicionar ao .env
echo "EXPO_PUBLIC_POSTHOG_KEY=phc_xxx" >> .env
```

### 9.3 Verificar
1. No painel do PostHog → Events
2. Deve ver eventos como:
   - `screen_view` (quando navega entre telas)
   - `chat_message_sent` (quando envia mensagem)
   - `voice_recorded` (quando grava áudio)

---

## 10. App Store / Play Store

### 10.1 Criar contas de desenvolvedor

**iOS**:
1. Acesse https://developer.apple.com
2. Enroll in Apple Developer Program ($99/ano)
3. Esperar aprovação (1-3 dias)

**Android**:
1. Acesse https://play.google.com/console
2. Pay $25 (único)
3. Conta ativada imediatamente

### 10.2 Preparar assets

**Ícones**:
- `assets/icon.png` — 1024x1024px, sem bordas arredondadas
- `assets/adaptive-icon.png` — 1024x1024px, com margem de segurança

**Screenshots** (mínimo):
- iOS: 6.7" (iPhone 15 Pro Max) — 1-3 screenshots
- Android: phone — 2-8 screenshots

**Textos**:
- Nome do app: "Orun OS" (máx 30 chars)
- Subtítulo iOS: "Seu assistente de IA pessoal" (máx 30 chars)
- Descrição: até 4000 chars
- Palavras-chave: até 100 chars (iOS)
- URL da Privacy Policy (obrigatório pra iOS)

### 10.3 Build pra produção

**iOS**:
```bash
cd packages/mobile-app
npx expo prebuild --platform ios
npx expo build:ios
# Ou via Xcode: Product → Archive → Upload
```

**Android**:
```bash
npx expo prebuild --platform android
npx expo build:android
# Ou via Android Studio: Build → Generate Signed Bundle
```

### 10.4 TestFlight (iOS)
1. Upload do build → App Store Connect → TestFlight
2. Adicionar testers externos (email)
3. Eles recebem link pra instalar via app TestFlight

### 10.5 Internal Testing (Android)
1. Upload do AAB → Play Console → Internal Testing
2. Adicionar testers por email
3. Eles recebem link pra instalar

### 10.6 Submeter pra revisão

**iOS** (mais rigoroso):
1. App Store Connect → Pre-release → iOS App → Submit for Review
2. Preencher:
   - Screenshots
   - Descrição
   - Privacy Policy URL
   - Support URL
   - Review Notes (explicar o app)
3. Esperar 1-7 dias

**Android** (mais rápido):
1. Play Console → Production → Create Release
2. Preencher:
   - Screenshots
   - Descrição
   - Privacy Policy URL
3. Submit → Esperar 1-3 dias

---

## 11. Checklist Final

### Antes do build
- [ ] `npm install` rodou sem erros
- [ ] `npx tsc --noEmit` passa com 0 erros
- [ ] `.env` criado com SUPABASE_URL e ANON_KEY
- [ ] Supabase rodou as migrations
- [ ] ai-relay deployado com transcribe
- [ ] Pelo menos 1 agent criado no Supabase

### Build de desenvolvimento
- [ ] `npx expo start` roda
- [ ] Login funciona
- [ ] Chat funciona (envia e recebe mensagens)
- [ ] Voice funciona (grava e transcreve)
- [ ] Camera funciona (tira foto)
- [ ] Settings funciona (muda tema, idioma)

### Build nativo (iOS)
- [ ] `npx expo prebuild --platform ios` gera projeto
- [ ] Xcode abre sem erros
- [ ] Code signing configurado
- [ ] App roda no simulador
- [ ] Share extension funciona
- [ ] Background fetch funciona
- [ ] Push notifications funcionam

### Build nativo (Android)
- [ ] `npx expo prebuild --platform android` gera projeto
- [ ] Android Studio abre sem erros
- [ ] Signing configurado
- [ ] App roda no emulador

### Store submission
- [ ] Ícone 1024x1024 pronto
- [ ] Screenshots prontos
- [ ] Descrição escrita
- [ ] Privacy Policy publicada
- [ ] App submetido pra revisão
- [ ] Aprovado e publicado

---

## Troubleshooting

### Erro: "expo-camera not available"
```bash
# No Expo Go, camera não funciona. Usar development build.
npx expo prebuild
npx expo run:ios
```

### Erro: "TaskManager: Task not defined"
```bash
# O task precisa ser definido antes de ser registrado
# Verificar que backgroundService.ts está importado no _layout.tsx
```

### Erro: "Cannot find module 'expo-file-system'"
```bash
npm install expo-file-system
```

### Erro: "Background fetch não roda"
```bash
# No iOS: Settings → General → Background App Refresh → ON
# No iOS Simulator: Debug → Simulate Background Fetch
```

### Erro: "Share extension não aparece"
```bash
# Verificar App Group configurado em AMBOS os targets
# Verificar Bundle Identifier correto
# Rebuild: Product → Clean Build Folder → Build
```

### Erro: "Push notification não chega"
```bash
# Verificar expo-notifications plugin no app.json
# Verificar que registerForPushNotifications roda no _layout.tsx
# Testar com expo-notifications-cli
```

### Erro: "Sentry não recebe erros"
```bash
# Verificar DSN no .env
# Verificar que sentryService.ts importa @sentry/react-native
# Forçar erro de teste
```

### Erro: "PostHog não recebe eventos"
```bash
# Verificar POSTHOG_KEY no .env
# Verificar que analyticsService.ts importa posthog-react-native
# Verificar internet no celular
```
