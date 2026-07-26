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
import { SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../src/theme/tokens";
import { useChat } from "../../src/hooks";
import { MessageBubble, ChatInput } from "../../src/components/chat";
import { CameraCapture } from "../../src/components/camera/CameraCapture";
import { ProviderPicker } from "../../src/components/ProviderPicker";
import { EmptyState } from "../../src/components/ui";
import { scheduleLocalNotification } from "../../src/services/notificationService";
import { checkRateLimit, getRateLimitRemaining } from "../../src/services/rateLimiter";
import { t } from "../../src/i18n";
import type { ChatMessage } from "../../src/types";

const PAGE_SIZE = 30;

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
    await send(text);
    const estimatedTime = Math.min(2000 + text.length * 10, 8000);
    setTimeout(() => setTypingAgent(false), estimatedTime);
  }, [send]);

  function handleCameraCapture(uri: string) {
    // In production, upload the image and send as a message
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scheduleLocalNotification("Foto capturada", "Imagem pronta para envio.");
  }

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Show the most recent PAGE_SIZE messages initially
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const displayedMessages = messages.slice(-displayCount);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    Haptics.selectionAsync();
    setLoadingMore(true);
    try {
      const beforeCount = messages.length;
      await hookLoadMore();
      setDisplayCount((prev) => prev + (messages.length - beforeCount || PAGE_SIZE));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, hookLoadMore, messages.length]);

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
      <View style={[styles.center, { backgroundColor: colors.bgBase }]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t("chat.loading")}</Text>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgBase }]}>
        <EmptyState
          title={t("chat.error.load")}
          message={error}
          actionLabel={t("common.retry")}
          onAction={() => setRetryKey((k) => k + 1)}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bgBase }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <View
        style={[
          styles.header,
          headerPadding,
          { backgroundColor: colors.bgBase, borderBottomColor: colors.surfaceBorder + "14" },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hampton</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{t("chat.online")}</Text>
        </View>
        <Pressable
          onPress={() => setProviderVisible(true)}
          style={[styles.providerButton, { backgroundColor: colors.accent + "15" }]}
        >
          <Text style={[styles.providerButtonText, { color: colors.accent }]}>
            ⚡ {currentModel.split("/").pop()}
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayedMessages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
                    {t("common.loading")} ({messages.length - displayCount} {t("chat.remaining")})
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
