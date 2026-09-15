import { fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type MonthlyManagementCardProps = {
  balance: number;
  totalIncome: number;
  onPressCharge: () => void;
};

const formatAmount = (amount: number) =>
  amount.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function MonthlyManagementCard({
  balance,
  totalIncome,
  onPressCharge,
}: MonthlyManagementCardProps) {
  return (
    <View style={styles.container}>
      <Text style={fonts.title5_b_20}>이번 달 관리</Text>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text
              style={[fonts.caption1_sb_13, { color: "#FFF", marginBottom: 2 }]}
            >
              이번 달 관리
            </Text>
            <View style={styles.amountRow}>
              <Text style={[fonts.title3_b_24, { color: "#FFF" }]}>
                {formatAmount(balance)}
              </Text>
              <Text style={[fonts.body1_m_16, { color: "#B1B8C1" }]}>
                {" "}
                / {formatAmount(totalIncome)}
              </Text>
            </View>
          </View>
          <Pressable style={styles.chargeButton} onPress={onPressCharge}>
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={[fonts.sub4_sb_14, { color: "#FFF", marginRight: 4 }]}>
              등록하기
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  card: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#252C37",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chargeButton: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 2,
    backgroundColor: "#191F28",
    alignItems: "center",
    justifyContent: "center",
  },
});
