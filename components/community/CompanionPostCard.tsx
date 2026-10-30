import { Text } from "@/components/ui/app-text";
import { CountryFlag } from "@/components/ui/country-flag";
import { Colors, fonts } from "@/constants/theme";
import type { CompanionPostResponse } from "@/src/api/companion";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const formatCompanionPeriod = (startDate?: string, endDate?: string) => {
  const formatDate = (value?: string) =>
    value ? value.slice(0, 10).replaceAll("-", ". ") : "";
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start) {
    return "";
  }

  return start === end || !end ? start : `${start} - ${end}`;
};

const getCompanionStatusText = (status: CompanionPostResponse["status"]) =>
  status === "RECRUITING" ? "모집 중" : "모집완료";

export function CompanionPostCard({
  post,
  onPress,
  style,
}: {
  post: CompanionPostResponse;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable style={[styles.companionCard, style]} onPress={onPress}>
      <View style={styles.companionCountry}>
        <View style={styles.companionFlagBox}>
          <CountryFlag country={post.country} width={40} height={30} />
        </View>
        <Text style={styles.companionCountryName} numberOfLines={2}>
          {post.country}
        </Text>
      </View>

      <View style={styles.companionBody}>
        <Text style={styles.companionTitle} numberOfLines={1}>
          {post.title}
        </Text>
        <View style={{ flexDirection: "column", gap: 4 }}>
          <View style={styles.companionInfoRow}>
            <Text style={styles.companionInfoLabel}>일정</Text>
            <Text style={styles.companionInfoValue}>
              {formatCompanionPeriod(post.startDate, post.endDate)}
            </Text>
          </View>
          <View style={styles.companionInfoRow}>
            <Text style={styles.companionInfoLabel}>성별</Text>
            <Text style={styles.companionInfoValue}>{post.genderRatio}</Text>
          </View>
          <View style={styles.companionInfoRow}>
            <Text style={styles.companionInfoLabel}>인원</Text>
            <Text style={styles.companionInfoValue}>
              {post.currentParticipants}/{post.capacity}명
            </Text>
            <View
              style={[
                styles.smallStatus,
                post.status === "COMPLETED" && styles.smallStatusDone,
              ]}
            >
              <Text
                style={[
                  styles.smallStatusText,
                  post.status === "COMPLETED" && styles.smallStatusDoneText,
                ]}
              >
                {getCompanionStatusText(post.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  companionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  companionCountry: {
    width: 70,
    alignItems: "center",
    marginRight: 14,
    paddingTop: 3,
  },
  companionFlagBox: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  companionCountryName: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#4E5968",
    textAlign: "center",
  },
  companionBody: {
    flex: 1,
    minWidth: 0,
  },
  companionTitle: {
    ...fonts.sub3_sb_16,
    color: Colors.gray[10],
    marginBottom: 4,
  },
  smallStatus: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "#EAF3FF",
  },
  smallStatusDone: {
    backgroundColor: "#F0F2F6",
  },
  smallStatusText: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
  },
  smallStatusDoneText: {
    color: "#6B7684",
  },
  companionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companionInfoLabel: {
    ...fonts.caption4_m_12,
    color: Colors.gray[8],
  },
  companionInfoValue: {
    ...fonts.caption4_m_12,
    color: Colors.gray[6],
  },
});
