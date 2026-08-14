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
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../src/theme/tokens";
import { useChat } from "../../src/hooks";
import { MessageBubble, ChatInput } from "../../src/components/chat";
import { EmptyState, NeonBackground } from "../../src/components/ui";
import { t } from "../../src/i18n";

export default function AgentChatScreen() {
  const { colors } = useTheme();
  const { headerPadding, keyboardOffset } = useSafeArea();
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { messages, sending, loading, error, hasMore, send, loadMore: hookLoadMore } = useChat({ agentId });
  const userScrolledUpRef = useRef(false);

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

  const agentName = agentId
    ? agentId.charAt(0).toUpperCase() + agentId.slice(1)
    : "Agente";

  if (loading) {
    return (
      <NeonBackground>
        <View style={[styles.center, {}]}>
          <ActivityIndicator color={colors.accentGlow} />
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
            { backgroundColor: "rgba(10,4,20,0.55)", borderBottomColor: NEON.glow.red + "40" },
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
            <Text style={[styles.backText, { color: colors.accentGlow }]}>{t("common.back")}</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{agentName}</Text>
          </View>
          <View style={styles.backButton} />
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
            hasMore ? (
              <Pressable
                onPress={loadMore}
                style={[styles.loadMoreButton, { borderColor: NEON.glow.red + "40" }]}
                accessibilityRole="button"
                accessibilityLabel={t("common.loadMore")}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.accentGlow} size="small" />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.accentGlow }]}>
                    {t("common.loadMore")}
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
        <Text style={[styles.errorBanner, { color: colors.warning, backgroundColor: "rgba(15,7,24,0.7)" }]}>
          {error}
        </Text>
      )}

      <ChatInput onSend={send} sending={sending} placeholder={t("chat.talkToAgent", { agentName })} />
      </NeonBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatList: { flex: 1 },
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
