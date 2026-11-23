import { Colors } from "@/constants/theme";
import { ActivityIndicator, StyleSheet } from "react-native";

export function ListLoadingIndicator({ label, compact = false }: {
  label: string;
  compact?: boolean;
}) {
  return (
    <ActivityIndicator
      color={Colors.primary.default}
      style={compact ? styles.compact : styles.list}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 48 },
  compact: { paddingVertical: 16 },
});
