import { Text } from "@/components/ui/app-text";
import { useHomeDashboard } from "@/components/home/use-home-dashboard";
import { flags } from "@/components/market/MarketCountrySheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const formatDate = (value: string) =>
  value ? value.slice(0, 10).replaceAll("-", ". ") : "미설정";
const dayBadge = (value: string) => {
  const target = new Date(value);
  if (!value || Number.isNaN(target.getTime())) return "미설정";
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  return days === 0 ? "D-Day" : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
};

export function HomeStatusTab() {
  const data = useHomeDashboard();
  const dispatched = data.lifecycleStatus === "파견 중";
  const preparing = data.lifecycleStatus === "출국 준비 중";
  const returned = data.lifecycleStatus === "귀국";
  const targetDate = dispatched
    ? data.dispatchStartDate
    : preparing
      ? data.departureDate
      : data.applicationDeadline;
  const dateLabel = dispatched
    ? "파견 시작일"
    : preparing
      ? "출국일"
      : "마감일";
  const title = dispatched
    ? "파견 진행 중"
    : preparing
      ? "출국 준비 중"
      : returned
        ? "귀국 완료"
        : "파견 지원 준비 중";
  const verificationTitle = data.verified
    ? "교환학생 인증 완료"
    : data.pending
      ? "교환학생 인증 검토 중"
      : "교환학생 인증이 필요해요";
  const verificationDescription = data.verified
    ? "인증이 완료되어 안전한 교환학생으로 표시됨"
    : data.pending
      ? "제출하신 인증 서류를 확인하고 있어요"
      : "교환학생 인증을 진행해주세요";
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Pressable
        style={styles.summary}
        onPress={() => router.push("/profile-card")}
        accessibilityRole="button"
      >
        <Text style={styles.eyebrow}>{data.lifecycleStatus}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>
            {[data.country, title].filter(Boolean).join(" ")}
          </Text>
          {!returned && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dayBadge(targetDate)}</Text>
            </View>
          )}
        </View>
        {!returned && (
          <Text style={styles.description}>
            {dateLabel} {formatDate(targetDate)}
          </Text>
        )}
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>교환학생 인증</Text>
        <Pressable
          style={[styles.verification, data.verified && styles.verified]}
          accessibilityRole="button"
          onPress={() => router.push("/verification")}
        >
          <View
            style={[
              styles.verificationIcon,
              data.verified && styles.verifiedIcon,
            ]}
          >
            <Ionicons
              name={
                data.verified
                  ? "checkmark-circle-outline"
                  : data.pending
                    ? "timer-outline"
                    : "shield-checkmark-outline"
              }
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.body}>
            <Text style={[styles.cardTitle, data.verified && styles.white]}>
              {verificationTitle}
            </Text>
            <Text
              style={[styles.caption, data.verified && styles.verifiedCaption]}
            >
              {verificationDescription}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={data.verified ? "#FFFFFF" : Colors.gray[7]}
          />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>파견교 설정</Text>
        <Pressable
          style={[styles.school, !data.university && styles.unsetSchool]}
          accessibilityRole="button"
          onPress={() => router.push("/home/profile-edit")}
        >
          <Text
            numberOfLines={1}
            style={[styles.cardTitle, !data.university && styles.muted]}
          >
            {data.university || "파견교를 설정해주세요"}
          </Text>
          <View style={[styles.badge, !data.university && styles.unsetBadge]}>
            <Text style={[styles.badgeText, !data.university && styles.muted]}>
              {data.university ? "설정됨" : "미설정"}
            </Text>
          </View>
          <View style={styles.spacer} />
          <Ionicons name="chevron-forward" size={18} color={Colors.gray[7]} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>출국 준비</Text>
        <Pressable
          style={styles.preparation}
          accessibilityRole="button"
          onPress={() => router.push("/home/departure-checklist")}
        >
          <View style={styles.preparationIcon}>
            {data.departureDate && flags[data.country] ? (
              <Text style={styles.flag}>{flags[data.country]}</Text>
            ) : (
              <Ionicons
                name="information-circle"
                size={24}
                color={Colors.gray[5]}
              />
            )}
          </View>
          <View style={styles.body}>
            <Text style={styles.eyebrow}>준비 중인 일정</Text>
            <Text style={styles.cardTitle}>
              {data.departureDate
                ? `${data.country ? `${data.country} ` : ""}출국 준비`
                : "준비 중인 일정이 없습니다"}
            </Text>
            <Text style={styles.caption}>
              {data.departureDate
                ? `출국일 ${formatDate(data.departureDate)}`
                : "유니로드와 출국 준비 해봐요!"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[8]} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  summary: {
    padding: 20,
    minHeight: 122,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F2042",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  eyebrow: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: { ...fonts.sub3_sb_16, color: Colors.common.black, flex: 1 },
  description: { ...fonts.caption5_r_13, color: Colors.gray[7] },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: "#EAF3FF",
  },
  badgeText: { ...fonts.caption4_m_12, color: Colors.primary.default },
  section: { marginTop: 32 },
  sectionTitle: {
    ...fonts.sub1_sb_18,
    color: Colors.common.black,
    marginBottom: 8,
  },
  verification: {
    padding: 14,
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    backgroundColor: "#FFFFFF",
  },
  verified: { backgroundColor: Colors.gray[11], borderColor: Colors.gray[11] },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedIcon: { backgroundColor: Colors.gray[9] },
  body: { flex: 1, minWidth: 0 },
  cardTitle: { ...fonts.sub3_sb_16, color: Colors.common.black, flexShrink: 1 },
  caption: { ...fonts.caption6_r_12, color: Colors.gray[7], marginTop: 5 },
  white: { color: "#FFFFFF" },
  verifiedCaption: { color: Colors.gray[5] },
  school: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[3],
  },
  unsetSchool: { backgroundColor: Colors.gray[1] },
  unsetBadge: { backgroundColor: Colors.gray[2] },
  muted: { color: Colors.gray[6] },
  spacer: { flex: 1 },
  preparation: {
    padding: 16,
    minHeight: 100,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F2042",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  preparationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray[2],
  },
  flag: { fontSize: 28 },
});
