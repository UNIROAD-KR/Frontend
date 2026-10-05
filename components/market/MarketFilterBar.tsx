import { Text } from "@/components/ui/app-text";
import { fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

export function MarketFilterBar({
  selectedCountry,
  onSelectCountry,
  onSelectSort,
}: {
  selectedCountry: string;
  onSelectCountry: () => void;
  onSelectSort: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onSelectCountry}
        accessibilityRole="button"
        accessibilityLabel="국가 및 지역 선택"
        style={[styles.button, styles.country]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.placeholder,
            selectedCountry !== "전체" && styles.label,
          ]}
        >
          {selectedCountry === "전체" ? "국가 및 지역 선택" : selectedCountry}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#17191D" />
      </Pressable>
      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        style={styles.button}
      >
        <Text style={styles.label}>필터</Text>
        <Ionicons name="options-outline" size={18} color="#17191D" />
      </Pressable>
      <Pressable
        onPress={onSelectSort}
        accessibilityRole="button"
        accessibilityLabel="정렬 선택"
        style={styles.button}
      >
        <Text style={styles.label}>정렬</Text>
        <Ionicons name="swap-vertical" size={18} color="#17191D" />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, marginBottom: 12 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E5E9",
    paddingHorizontal: 12,
  },
  country: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0,
    paddingHorizontal: 14,
  },
  placeholder: { flexShrink: 1, ...fonts.body4_r_14, color: "#8B95A1" },
  label: { fontSize: 14, color: "#17191D" },
});
