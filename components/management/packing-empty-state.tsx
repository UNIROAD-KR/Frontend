import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";

export function PackingEmptyState({ onAdd, disabled }: { onAdd: () => void; disabled: boolean }) {
  return (
    <Pressable style={styles.container} onPress={onAdd} disabled={disabled} accessibilityRole="button" accessibilityLabel="첫 준비물 추가하기">
      <View style={styles.preview} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.row}>
          <Text style={styles.category}>나의 카테고리</Text>
          <Text style={styles.count}>0/2</Text>
          <Ionicons name="chevron-up" size={16} color={Colors.gray[5]} />
        </View>
        {["여권 챙기기", "충전기 챙기기"].map(title => (
          <View key={title} style={styles.row}>
            <View style={styles.checkbox} />
            <Text style={styles.example}>{title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>나만의 짐싸기 목록을 만들어보세요</Text>
        <Text style={styles.description}>카테고리별로 준비물을 모으고, 챙길 때마다 체크해요.</Text>
      </View>
      <View style={styles.action}>
        <Ionicons name="add" size={18} color={Colors.primary.default} />
        <Text style={styles.actionText}>첫 준비물 추가하기</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: { minHeight: 260, alignItems: "center", justifyContent: "flex-start", paddingTop: 12, paddingBottom: 28, paddingHorizontal: 20, gap: 22 },
  preview: { width: "100%", maxWidth: 300, borderWidth: 1, borderStyle: "dashed", borderColor: Colors.gray[4], borderRadius: 14, backgroundColor: Colors.gray[1], padding: 18, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  category: { ...fonts.sub4_sb_14, color: Colors.gray[6], flex: 1 },
  count: { ...fonts.caption5_r_13, color: Colors.gray[5] },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderStyle: "dashed", borderColor: Colors.gray[5], borderRadius: 5 },
  example: { ...fonts.body2_m_14, color: Colors.gray[5] },
  copy: { alignItems: "center", gap: 6 },
  title: { ...fonts.sub4_sb_14, color: Colors.gray[8], textAlign: "center" },
  description: { ...fonts.caption5_r_13, color: Colors.gray[6], textAlign: "center" },
  action: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 44 },
  actionText: { ...fonts.caption4_m_12, color: Colors.primary.default },
});
