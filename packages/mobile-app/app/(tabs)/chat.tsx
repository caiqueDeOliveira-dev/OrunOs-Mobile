import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../src/theme/tokens";
import { useChat } from "../../src/hooks";
import { MessageBubble, ChatInput } from "../../src/components/chat";
import { CameraCapture } from "../../src/components/camera/CameraCapture";
import { ProviderPicker } from "../../src/components/ProviderPicker";
import { EmptyState, NeonBackground } from "../../src/components/ui";
import { scheduleLocalNotification } from "../../src/services/notificationService";
import { checkRateLimit, getRateLimitRemaining } from "../../src/services/rateLimiter";
import { t } from "../../src/i18n";
import type { ChatMessage } from "../../src/types";

export default function ChatScreen() {
  const { colors } = useTheme();
  const { headerPadding, keyboardOffset } = useSafeArea();
  const { agentId } = useLocalSearchParams<{ agentId?: string }>();
  const [retryKey, setRetryKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [typingAgent, setTypingAgent] = useState(false);
  const [providerVisible, setProviderVisible] = useState(false);
  const [currentProvider, setCurrentProvider] = useState("groq");
  const [currentModel, setCurrentModel] = useState("llama-3.3-70b-versatile");
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentAgentId = agentId || "hampton";
  const userScrolledUpRef = useRef(false);

  const { messages, sending, loading, error, isOnline, queuedCount, hasMore, send, loadMore: hookLoadMore } = useChat({
    agentId: currentAgentId,
    conversationId: retryKey > 0 ? undefined : undefined,
  });

  const visibleError = error && error !== dismissedError ? error : null;

  // Reset dismissed error when a new error appears
  useEffect(() => {
    if (error) setDismissedError(null);
  }, [error]);

  const handleSend = useCallback(async (text: string) => {
    if (!checkRateLimit("chat-send")) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (text.trim() === "/provider") {
      setProviderVisible(true);
      return;
    }

    setDismissedError(null);
    setTypingAgent(true);
    try {
      await send(text);
    } finally {
      setTypingAgent(false);
    }
  }, [send]);

  function handleCameraCapture(uri: string) {
    // In production, upload the image and send as a message
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scheduleLocalNotification("Foto capturada", "Imagem pronta para envio.");
  }

  // Auto-scroll to the newest message only when it actually changes (send or reply)
  // and the user is at the bottom. Loading history prepends older messages without
  // changing the newest id, so it never yanks the scroll position up/down.
  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
    if (lastId !== null && lastId !== lastMessageIdRef.current && !userScrolledUpRef.current) {
      const t = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 60);
      lastMessageIdRef.current = lastId;
      return () => clearTimeout(t);
    }
    lastMessageIdRef.current = lastId;
  }, [messages]);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number }; contentSize: { height: number } } }) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    userScrolledUpRef.current = distanceFromBottom > 120;
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    Haptics.selectionAsync();
    setLoadingMore(true);
    try {
      await hookLoadMore();
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, hookLoadMore]);

  function handleMessageLongPress(message: ChatMessage) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "",
      message.content.length > 80 ? message.content.slice(0, 80) + "..." : message.content,
      [
        {
          text: t("common.copy"),
          onPress: async () => {
            await Clipboard.setStringAsync(message.content);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
        ...(message.role === "assistant"
          ? [
              {
                text: t("chat.resend"),
                onPress: () => {
                  Haptics.selectionAsync();
                  send(message.content);
                },
              },
            ]
          : []),
        { text: t("common.cancel"), style: "cancel" as const },
      ]
    );
  }

  if (loading) {
    return (
      <NeonBackground>
        <View style={[styles.center, {}]}>
          <ActivityIndicator color={colors.accentGlow} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t("chat.loading")}</Text>
        </View>
      </NeonBackground>
    );
  }

  if (error && messages.length === 0) {
    return (
      <NeonBackground>
        <View style={[styles.center, {}]}>
          <EmptyState
            title={t("chat.error.load")}
            message={error}
            actionLabel={t("common.retry")}
            onAction={() => setRetryKey((k) => k + 1)}
          />
        </View>
      </NeonBackground>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: "transparent" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <NeonBackground>
        <View
          style={[
            styles.header,
            headerPadding,
            {
              backgroundColor: "rgba(10,4,20,0.55)",
              borderBottomColor: NEON.glow.red + "40",
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hampton</Text>
            <View style={styles.headerStatusRow}>
              <View style={[styles.headerDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{t("chat.online")}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setProviderVisible(true)}
            style={[
              styles.providerButton,
              {
                backgroundColor: colors.accent + "22",
                borderColor: NEON.glow.red + "55",
              },
            ]}
          >
            <Text style={[styles.providerButtonText, { color: colors.accentGlow }]}>
              ⚡ {currentModel.split("/").pop()}
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.flatList}
          contentContainerStyle={styles.messageList}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            {queuedCount > 0 && (
              <View style={[styles.offlineBanner, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "30" }]}>
                <Text style={[styles.offlineText, { color: colors.warning }]}>
                  ⏳ {t("chat.messagesQueued", { count: String(queuedCount) })}
                </Text>
              </View>
            )}
            {!isOnline && (
              <View style={[styles.offlineBanner, { backgroundColor: colors.danger + "15", borderColor: colors.danger + "30" }]}>
                <Text style={[styles.offlineText, { color: colors.danger }]}>
                  {t("chat.offlineQueueNotice")}
                </Text>
              </View>
            )}
            {hasMore ? (
              <Pressable
                onPress={loadMore}
                style={[styles.loadMoreButton, { borderColor: colors.surfaceBorder + "14" }]}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                    {t("common.loadMore")}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title={t("chat.empty")}
            message={t("chat.emptyHint")}
          />
        }
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            agentName="Hampton"
            onLongPress={handleMessageLongPress}
          />
        )}
        ListFooterComponent={
          typingAgent ? (
            <View style={styles.typingRow}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={[styles.typingText, { color: colors.textMuted }]}>
                {t("chat.typing")}
              </Text>
            </View>
          ) : null
        }
      />

      {visibleError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.danger + "15", borderColor: colors.danger + "30" }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{visibleError}</Text>
          <Pressable
            onPress={() => setDismissedError(error)}
            style={[styles.errorDismiss, { backgroundColor: colors.danger + "20" }]}
          >
            <Text style={[styles.errorDismissText, { color: colors.danger }]}>✕</Text>
          </Pressable>
        </View>
      )}

      <ChatInput
        onSend={handleSend}
        sending={sending}
        onCamera={() => setCameraVisible(true)}
        placeholder={t("chat.placeholder")}
      />

      <CameraCapture
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handleCameraCapture}
      />

      <ProviderPicker
        visible={providerVisible}
        onClose={() => setProviderVisible(false)}
        agentId={currentAgentId}
        onProviderChanged={(provider, model) => {
          setCurrentProvider(provider);
          setCurrentModel(model);
        }}
      />
      </NeonBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatList: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.sm },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { alignItems: "flex-start" },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2,
  },
  providerButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  providerButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  messageList: {
    padding: SPACING.lg,
    gap: SPACING.md,
    flexGrow: 1,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  typingText: {
    fontSize: TYPOGRAPHY.sm,
    fontStyle: "italic",
  },
  offlineBanner: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  offlineText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: 8,
  },
  errorText: {
    fontSize: TYPOGRAPHY.xs,
    flex: 1,
    marginRight: SPACING.sm,
  },
  errorDismiss: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  errorDismissText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
});
