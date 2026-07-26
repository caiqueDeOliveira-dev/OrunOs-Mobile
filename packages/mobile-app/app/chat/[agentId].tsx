import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../src/theme/tokens";
import { useChat } from "../../src/hooks";
import { MessageBubble, ChatInput } from "../../src/components/chat";
import { EmptyState } from "../../src/components/ui";
import { t } from "../../src/i18n";

const PAGE_SIZE = 30;

export default function AgentChatScreen() {
  const { colors } = useTheme();
  const { headerPadding, keyboardOffset } = useSafeArea();
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { messages, sending, loading, error, hasMore, send, loadMore: hookLoadMore } = useChat({ agentId });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

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

  const agentName = agentId
    ? agentId.charAt(0).toUpperCase() + agentId.slice(1)
    : "Agente";

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgBase }]}>
        <ActivityIndicator color={colors.accent} />
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
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Text style={[styles.backText, { color: colors.accent }]}>{t("common.back")}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{agentName}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <FlatList
        ref={flatListRef}
        data={displayedMessages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          hasMore ? (
            <Pressable
              onPress={loadMore}
              style={[styles.loadMoreButton, { borderColor: colors.surfaceBorder + "14" }]}
              accessibilityRole="button"
              accessibilityLabel={t("common.loadMore")}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                  {t("common.loadMore")} ({messages.length - displayCount})
                </Text>
              )}
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title={t("chat.empty")}
            message={t("chat.startConversation", { agentName })}
          />
        }
        renderItem={({ item }) => <MessageBubble message={item} agentName={agentName} />}
      />

      {error && (
        <Text style={[styles.errorBanner, { color: colors.warning, backgroundColor: colors.bgOverlay }]}>
          {error}
        </Text>
      )}

      <ChatInput onSend={send} sending={sending} placeholder={t("chat.talkToAgent", { agentName })} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    minWidth: 70,
  },
  backText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  messageList: {
    padding: SPACING.lg,
    gap: SPACING.md,
    flexGrow: 1,
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  errorBanner: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
});
