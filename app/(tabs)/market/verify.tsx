import { Text } from "@/components/ui/app-text";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";

import { AppBackButton } from "@/components/ui/app-back-button";
import { fonts, commonStyles, Colors } from "@/constants/theme";

export default function MarketVerifyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppBackButton style={styles.iconBtn} />

          <Text style={styles.headerTitle}>교환학생 인증</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>교환학생 판매자 인증</Text>
          <Text style={styles.desc}>
            허위 매물 방지를 위해 공식 서류를 제출해주세요.{"\n"}
            제출된 정보는 인증 목적으로만 사용됩니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>인증 방식 선택</Text>

        <TouchableOpacity style={styles.methodCard}>
          <Text style={styles.methodEmoji}>📷</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>서류 촬영하기</Text>
            <Text style={styles.methodSub}>카메라로 직접 촬영하기</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.methodCard}>
          <Text style={styles.methodEmoji}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>PDF 파일 첨부</Text>
            <Text style={styles.methodSub}>파일함에서 불러오기</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>ⓘ 인증 가능 서류:</Text>
          <Text style={styles.noticeText}>
            • 파견 대학 입학허가서 (Letter of Admission)
          </Text>
          <Text style={styles.noticeText}>• 재학 대학교 파견 승인서</Text>
          <Text style={styles.noticeText}>• 교환학생 비자 사본</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable style={[commonStyles.button]}>
          <Text style={styles.submitText}>제출하기 ›</Text>
        </Pressable>

        <Text style={styles.bottomNotice}>
          서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  content: {
    paddingHorizontal: 32,
    paddingTop: 34,
    paddingBottom: 180,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 44,
  },

  intro: {
    marginTop: 92,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
  },

  desc: {
    marginTop: 14,
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
  },

  sectionTitle: {
    marginTop: 54,
    marginBottom: 22,
    fontSize: 21,
    fontWeight: "900",
  },

  methodCard: {
    height: 116,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  methodEmoji: {
    fontSize: 42,
    marginRight: 28,
  },

  methodTitle: {
    ...fonts.sub1_sb_18,
  },

  methodSub: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
  },

  arrow: {
    fontSize: 44,
    color: "#D0D0D0",
  },

  noticeBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 6,
    padding: 22,
  },

  noticeTitle: {
    ...fonts.sub4_sb_14,
    color: Colors.gray[11],
    marginBottom: 8,
  },

  noticeText: {
    ...fonts.caption3_m_13,
    color: Colors.gray[8],
  },

  bottomArea: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 28,
  },

  submitText: {
    color: "#FFFFFF",
    ...fonts.sub3_sb_16,
  },

  bottomNotice: {
    marginTop: 12,
    ...fonts.caption3_m_13,
    color: Colors.gray[6],
  },
});
