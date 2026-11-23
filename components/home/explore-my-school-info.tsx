import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import {
  getMyUniversityExchangeInfo,
  type MyUniversityExchangeInfoResponse,
} from "@/src/api/universityExchangeInfo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

const schoolExample = {
  universityName: "서울과학기술대학교",
  phone: "02-970-6892",
  email: "studyabroad@seoultech.ac.kr",
};

export function ExploreMySchoolInfo() {
  const [info, setInfo] = useState<MyUniversityExchangeInfoResponse | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getMyUniversityExchangeInfo()
      .then(({ data }) => {
        if (!active) return;
        if (data.data?.universityName) setInfo(data.data);
        else setFailed(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (!info && !failed) {
    return (
      <ActivityIndicator style={styles.state} color={Colors.primary.default} />
    );
  }

  const school = info ?? schoolExample;
  const guides = [
    {
      title: "지원 자격 요건",
      icon: "checkmark-circle-outline",
      description: info
        ? info.eligibility?.join(" · ")
        : "직전 학기 평점 3.0 이상 및 공인 어학 성적 충족",
    },
    {
      title: "선발 일정 (연간)",
      icon: "calendar-outline",
      description: info
        ? info.schedules
            ?.map(({ title, period }) =>
              [title, period].filter(Boolean).join(" "),
            )
            .join(" · ")
        : "모집 공고 기준 1학기 파견 7월 말, 2학기 파견 1월 말",
    },
    {
      title: "필요 제출 서류",
      icon: "document-text-outline",
      description: info
        ? info.requiredDocuments?.map(({ text }) => text).join(", ")
        : "교환학생 지원 신청서, 성적증명서 및 공인 어학성적표",
    },
    {
      title: "자매결연 교환학교",
      icon: "school-outline",
      description: info
        ? info.partnerSchools?.map(({ name }) => name).join(", ")
        : "뮌헨 공과대학교, 베를린 자유대학교, UCLA, 와세다 대학교",
    },
  ] as const;

  return (
    <View style={styles.cards}>
      <View style={styles.schoolCard}>
        <Text style={styles.schoolName}>{school.universityName}</Text>
        {school.phone ? (
          <View style={styles.contact}>
            <Ionicons name="call-outline" size={16} color={Colors.gray[6]} />
            <Text style={styles.contactText}>{school.phone}</Text>
          </View>
        ) : null}
        {school.email ? (
          <View style={styles.contact}>
            <Ionicons name="mail-outline" size={16} color={Colors.gray[6]} />
            <Text style={styles.contactText}>{school.email}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.guideCard}>
        {guides.map(({ title, icon, description }) => (
          <View key={title} style={styles.guide}>
            <Ionicons name={icon} size={24} color={Colors.gray[8]} />
            <View style={styles.guideText}>
              <Text style={styles.guideTitle}>{title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {description || "등록된 정보가 없어요."}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 16 },
  schoolCard: {
    backgroundColor: Colors.common.white,
    borderRadius: 14,
    padding: 22,
    gap: 6,
    shadowColor: Colors.gray[9],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  schoolName: {
    ...fonts.title5_b_20,
    color: Colors.common.black,
    marginBottom: 8,
  },
  contact: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { ...fonts.body2_m_14, color: Colors.gray[6], flex: 1 },
  guideCard: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 32,
  },
  guide: { flexDirection: "row", alignItems: "center", gap: 18 },
  guideText: { flex: 1, gap: 6 },
  guideTitle: { ...fonts.sub3_sb_16, color: Colors.common.black },
  description: { ...fonts.body2_m_14, color: Colors.gray[7] },
  state: { minHeight: 160 },
  retry: { ...fonts.body2_m_14, color: Colors.primary.default },
});
