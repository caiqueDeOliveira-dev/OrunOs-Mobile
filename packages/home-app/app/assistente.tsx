// Orun Home — Assistant screen (embedded Home IA agent chat)
// Uses the shared Supabase ai-relay Edge Function — the SAME agent the
// desktop and mobile apps talk to, so history and memory are shared.

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../src/components/AppShell";
import { HomeHampton } from "../src/components/HomeHampton";
import { PageHeader, Badge } from "../src/components/ui";
import { useHomeChat } from "../src/hooks/useHomeChat";
import { useAuthStore } from "../src/stores/authStore";
import type { ChatMessage } from "../src/services/chatService";
import { P, TYPE, FW, RADIUS } from "../src/theme/premium";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
      {!isUser && (
        <View style={styles.bubbleAvatar}>
          <Ionicons name="home" size={14} color={P.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser && { color: "#fff" }]}>{message.content}</Text>
        {!isUser && message.provider && (
          <Text style={styles.bubbleMeta}>
            {message.provider} · {message.model || ""}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading, restoreSession, signIn, error: authError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const { messages, sending, loading, error, send } = useHomeChat("home-ia");

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, sending]);

  const doSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  if (authLoading) {
    return (
      <AppShell>
        <PageHeader icon="chatbubble-ellipses" title="Assistente" subtitle="Home IA" />
        <View style={styles.center}>
          <ActivityIndicator color={P.primary} />
        </View>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <PageHeader
          icon="chatbubble-ellipses"
          title="Assistente"
          subtitle="Entre para conversar com a Home IA"
          actions={<Badge tone="warn">desconectado</Badge>}
        />
        <View style={styles.authWrap}>
          <View style={styles.authCard}>
            <View style={styles.authAvatar}>
              <HomeHampton state="idle" size={120} image={require("../assets/icon.png")} />
            </View>
            <Text style={styles.authTitle}>Conecte sua conta Orun</Text>
            <Text style={styles.authSub}>
              A Home IA usa a mesma conta do desktop e do app mobile — historico e memorias compartilhados.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={P.dim}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={P.dim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {authError && <Text style={styles.authError}>{authError}</Text>}
            <Pressable style={styles.signInBtn} onPress={() => signIn(email, password)}>
              <Text style={styles.signInText}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon="chatbubble-ellipses"
        title="Assistente"
        subtitle="Home IA · Dandara"
        actions={
          <Pressable onPress={() => useAuthStore.getState().signOut()} style={styles.logoutBtn}>
            <Ionicons name="log-out" size={16} color={P.sub} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.chatWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <View style={styles.emptyAvatar}>
                  <HomeHampton state={sending ? "thinking" : "idle"} size={140} image={require("../assets/icon.png")} />
                </View>
                <Text style={styles.emptyTitle}>Fale com a Home IA</Text>
                <Text style={styles.emptySub}>
                  Pergunte: "apague a luz da sala", "tranque a porta", "qual a temperatura da casa?"
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={sending ? <ActivityIndicator color={P.primary} style={styles.sending} /> : null}
        />

        {error && (
          <View style={styles.errorBar}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Mensagem para a Home IA..."
            placeholderTextColor={P.dim}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={doSend}
            multiline
          />
          <Pressable onPress={doSend} disabled={!input.trim()} style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}>
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  authWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  authCard: {
    width: 380,
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: RADIUS.xl,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  authAvatar: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  authTitle: {
    color: P.text,
    fontSize: TYPE.lg,
    fontWeight: FW.semibold,
  },
  authSub: {
    color: P.sub,
    fontSize: TYPE.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  input: {
    width: "100%",
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.borderHi,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: P.text,
    fontSize: TYPE.sm,
  },
  authError: {
    color: P.error,
    fontSize: TYPE.xs,
  },
  signInBtn: {
    width: "100%",
    backgroundColor: P.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  signInText: {
    color: "#fff",
    fontSize: TYPE.sm,
    fontWeight: FW.semibold,
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
  },
  chatWrap: {
    flex: 1,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  chatList: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowBot: {
    justifyContent: "flex-start",
  },
  bubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
  },
  bubble: {
    maxWidth: "70%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  bubbleUser: {
    backgroundColor: P.primary,
    borderTopRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: P.card2,
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    color: P.text,
    fontSize: TYPE.sm,
    lineHeight: 20,
  },
  bubbleMeta: {
    color: P.dim,
    fontSize: 9,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyAvatar: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: P.text,
    fontSize: TYPE.lg,
    fontWeight: FW.semibold,
  },
  emptySub: {
    color: P.sub,
    fontSize: TYPE.xs,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 18,
  },
  sending: {
    marginVertical: 8,
  },
  errorBar: {
    backgroundColor: "rgba(255,75,75,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: {
    color: P.error,
    fontSize: TYPE.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.borderHi,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: P.text,
    fontSize: TYPE.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
