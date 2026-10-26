import { View, Text, StyleSheet } from "react-native";
import InfoCircleIcon from "@/assets/icon/info-circle.svg";
import { fonts, Colors } from "@/constants/theme";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <InfoCircleIcon width={28} height={28} color={Colors.gray[5]} />
      <Text style={styles.emptyTitle}>{title ?? "아직 컨텐츠가 없어요"}</Text>
      <Text style={styles.emptyDescription}>
        {description ?? "새로 추가해보세요"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...fonts.sub1_sb_18,
    color: Colors.common.black,
    marginTop: 10,
  },
  emptyDescription: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
    textAlign: "center",
    marginTop: 8,
  },
});
