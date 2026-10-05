import { Text } from "@/components/ui/app-text";
import { Pressable, StyleSheet, View } from "react-native";

type Props = { error?: string; title?: string; description?: string; onRetry?: () => void };
export function MarketEmptyState({ error, title, description, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{error ? "목록을 불러오지 못했어요" : title}</Text>
      <Text style={styles.description}>{error || description}</Text>
      {error && onRetry && <Pressable style={styles.retry} onPress={onRetry}><Text style={styles.retryText}>다시 시도</Text></Pressable>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { minHeight: 220, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: "700", color: "#111111", marginBottom: 8 },
  description: { fontSize: 13, lineHeight: 20, color: "#777777", textAlign: "center" },
  retry: { marginTop: 16, minWidth: 96, height: 38, borderRadius: 19, backgroundColor: "#102BE0", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  retryText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
