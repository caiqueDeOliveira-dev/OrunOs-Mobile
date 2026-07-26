import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { processSharedContent } from "../../services/shareExtensionService";

interface ShareExtensionProps {
  data: {
    text?: string;
    url?: string;
    images?: string[];
  };
  onComplete: () => void;
}

export function ShareExtension({ data, onComplete }: ShareExtensionProps) {
  const [text, setText] = useState(data.text ?? data.url ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(data.text ?? data.url ?? "");
  }, [data]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);

    const result = await processSharedContent({
      text: text.trim(),
      url: data.url,
      images: data.images,
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } else {
      setError(result.error ?? "Erro ao enviar");
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orun OS</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Texto compartilhado..."
        placeholderTextColor="#666"
        multiline
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, !text.trim() && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={sending || !text.trim()}
      >
        {sending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Enviar para Orun OS</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#C0001A",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#C0001A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
