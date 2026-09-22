import { Text } from '@/components/ui/app-text';
import { fonts } from "@/constants/theme";
import { StyleSheet, View } from "react-native";
import MinusRedIcon from "../../assets/icon/minus-red.svg";
import PlusBlueIcon from "../../assets/icon/plus-blue.svg";

type MonthlySummaryProps = {
  month: number;
  totalIncome: number;
  totalExpense: number;
};

const formatAmount = (amount: number) =>
  amount.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function MonthlySummary({
  month,
  totalIncome,
  totalExpense,
}: MonthlySummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={fonts.title5_b_20}>{month}월 요약</Text>
      <View style={styles.row}>
        <View style={styles.chip}>
          <View style={styles.labelRow}>
            <PlusBlueIcon />
            <Text style={fonts.body2_m_14}>수입</Text>
          </View>
          <Text style={fonts.sub4_sb_14}>{formatAmount(totalIncome)}</Text>
        </View>
        <View style={styles.chip}>
          <View style={styles.labelRow}>
            <MinusRedIcon />
            <Text style={fonts.body2_m_14}>지출</Text>
          </View>
          <Text style={fonts.sub4_sb_14}>{formatAmount(totalExpense)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 0,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E1E4E9",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
