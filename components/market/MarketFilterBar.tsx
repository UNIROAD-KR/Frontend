import { Text } from "@/components/ui/app-text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

/** Visual placeholders until country selection, filtering and sorting are connected. */
export function MarketFilterBar() {
  return (
    <View style={styles.row}>
      <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={[styles.button, styles.country]}>
        <Text numberOfLines={1} style={styles.placeholder}>국가 및 지역 선택</Text>
        <Ionicons name="chevron-down" size={18} color="#17191D" />
      </Pressable>
      <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.button}>
        <Text style={styles.label}>필터</Text><Ionicons name="options-outline" size={18} color="#17191D" />
      </Pressable>
      <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.button}>
        <Text style={styles.label}>정렬</Text><Ionicons name="swap-vertical" size={18} color="#17191D" />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, marginBottom: 12 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 46, borderRadius: 24, borderWidth: 1, borderColor: "#E2E5E9", paddingHorizontal: 12 },
  country: { flex: 1, justifyContent: "space-between", minWidth: 0, paddingHorizontal: 14 },
  placeholder: { flexShrink: 1, fontSize: 13, color: "#8B95A1" },
  label: { fontSize: 14, color: "#17191D" },
});
