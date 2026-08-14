import React, { useMemo } from "react";
import { Text, View, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { TYPOGRAPHY, FONT_WEIGHT, RADIUS, SPACING } from "../../theme/tokens";

interface MarkdownProps {
  content: string;
  baseStyle?: any;
}

interface Token {
  type: "text" | "bold" | "italic" | "code" | "codeblock" | "heading" | "listitem" | "link";
  content: string;
  url?: string;
  children?: Token[];
}

const ALLOWED_SCHEMES = ["http:", "https:"];

function safeOpenURL(url: string) {
  try {
    const parsed = new URL(url);
    if (ALLOWED_SCHEMES.includes(parsed.protocol)) {
      Linking.openURL(url);
    }
  } catch {
    // Invalid URL, do nothing
  }
}

function parseInline(text: string): Token[] {
  const tokens: Token[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const codeBlockMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      tokens.push({ type: "codeblock", content: codeBlockMatch[2].trim() });
      remaining = remaining.slice(codeBlockMatch[0].length);
      continue;
    }

    const inlineCodeMatch = remaining.match(/^`([^`]+)`/);
    if (inlineCodeMatch) {
      tokens.push({ type: "code", content: inlineCodeMatch[1] });
      remaining = remaining.slice(inlineCodeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push({ type: "bold", content: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      tokens.push({ type: "italic", content: italicMatch[1] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({ type: "link", content: linkMatch[1], url: linkMatch[2] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    const headingMatch = remaining.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      tokens.push({ type: "heading", content: headingMatch[1] });
      remaining = remaining.slice(headingMatch[0].length);
      continue;
    }

    const listMatch = remaining.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      tokens.push({ type: "listitem", content: listMatch[1] });
      remaining = remaining.slice(listMatch[0].length);
      continue;
    }

    const textMatch = remaining.match(/^[^`*\[\n#-]+/);
    if (textMatch) {
      tokens.push({ type: "text", content: textMatch[0] });
      remaining = remaining.slice(textMatch[0].length);
      continue;
    }

    tokens.push({ type: "text", content: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

function parseMarkdown(content: string): Token[] {
  const lines = content.split("\n");
  const tokens: Token[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: "codeblock", content: codeLines.join("\n") });
      continue;
    }

    const inlineTokens = parseInline(line);
    tokens.push(...inlineTokens);

    if (i < lines.length - 1) {
      tokens.push({ type: "text", content: "\n" });
    }
  }

  return tokens;
}

function TokenRenderer({ token, colors }: { token: Token; colors: any }) {
  switch (token.type) {
    case "bold":
      return (
        <Text style={{ fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary }}>
          {token.content}
        </Text>
      );
    case "italic":
      return (
        <Text style={{ fontStyle: "italic", color: colors.textPrimary }}>
          {token.content}
        </Text>
      );
    case "code":
      return (
        <Text
          style={{
            backgroundColor: colors.bgSunken,
            color: colors.accent,
            fontFamily: "monospace",
            fontSize: TYPOGRAPHY.sm,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 4,
          }}
        >
          {token.content}
        </Text>
      );
    case "codeblock":
      return (
        <View
          style={[
            styles.codeBlock,
            {
              backgroundColor: colors.bgSunken,
              borderColor: colors.surfaceBorder + "14",
            },
          ]}
        >
          <Text
            style={[
              styles.codeBlockText,
              {
                color: colors.textPrimary,
                fontFamily: "monospace",
              },
            ]}
          >
            {token.content}
          </Text>
        </View>
      );
    case "heading":
      return (
        <Text
          style={{
            fontSize: TYPOGRAPHY.lg,
            fontWeight: FONT_WEIGHT.bold,
            color: colors.textPrimary,
            marginTop: SPACING.sm,
          }}
        >
          {token.content}
        </Text>
      );
    case "listitem":
      return (
        <Text style={{ color: colors.textPrimary, paddingLeft: SPACING.md }}>
          {"• "}{token.content}
        </Text>
      );
    case "link":
      return (
        <Text
          style={{ color: colors.accent, textDecorationLine: "underline" }}
          onPress={() => token.url && safeOpenURL(token.url)}
          accessibilityRole="link"
          accessibilityLabel={`${token.content}, link externo`}
        >
          {token.content}
        </Text>
      );
    default:
      return <Text style={{ color: colors.textPrimary }}>{token.content}</Text>;
  }
}

export function MarkdownRenderer({ content, baseStyle }: MarkdownProps) {
  const { colors } = useTheme();
  const tokens = useMemo(() => parseMarkdown(content), [content]);

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === "codeblock") {
      elements.push(
        <View
          key={`cb-${i}`}
          style={[
            styles.codeBlock,
            {
              backgroundColor: colors.bgSunken,
              borderColor: colors.surfaceBorder + "14",
            },
          ]}
        >
          <Text
            style={[
              styles.codeBlockText,
              { color: colors.textPrimary, fontFamily: "monospace" },
            ]}
          >
            {token.content}
          </Text>
        </View>
      );
      i++;
    } else {
      const inlineTokens: React.ReactElement[] = [];
      while (i < tokens.length && tokens[i].type !== "codeblock") {
        inlineTokens.push(
          <TokenRenderer key={`t-${i}`} token={tokens[i]} colors={colors} />
        );
        i++;
      }
      elements.push(
        <Text key={`p-${i}`} style={[{ fontSize: TYPOGRAPHY.md, lineHeight: 22 }, baseStyle]}>
          {inlineTokens}
        </Text>
      );
    }
  }

  return <>{elements}</>;
}

const styles = StyleSheet.create({
  codeBlock: {
    marginVertical: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  codeBlockText: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 18,
  },
});
