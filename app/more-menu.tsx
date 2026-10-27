import { Text } from "@/components/ui/app-text";
import { SoftServiceIcon } from "@/components/soft-service-icon";
import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import { quickActionsByStatus } from "@/components/constants";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ServiceTitle = (typeof quickActionsByStatus)[number]["title"];
const serviceGroups: { title: string; items: { key: ServiceTitle; title: string; description: string }[] }[] = [
  { title: "마켓", items: [
    { key: "중고 거래", title: "중고거래", description: "교환학생 정착 물품을 한 번에 거래하기" },
    { key: "티켓 양도", title: "티켓 양도", description: "관광·여행 티켓 양도하기" },
  ] },
  { title: "커뮤니티", items: [
    { key: "자유게시판", title: "자유게시판", description: "교환학생들과 정보 나누기" },
    { key: "동행 모집", title: "동행 모집", description: "함께 여행할 교환학생 찾기" },
  ] },
  { title: "관리", items: [
    { key: "지출 관리", title: "지출 관리", description: "예산·지출 내역 한눈에 관리하기" },
    { key: "캘린더", title: "캘린더", description: "일정과 추억 기록하기" },
    { key: "출국 준비", title: "출국 준비", description: "출국·여행 준비 간편하게 확인하기" },
  ] },
  { title: "정보", items: [
    { key: "교환 정보", title: "교환학생 정보", description: "출국 준비부터 현지 생활 정보까지" },
  ] },
];

export default function MoreMenuScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <ProfileScreenHeader title="전체 서비스" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
        {serviceGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.services}>
              {group.items.map((item) => {
                const service = quickActionsByStatus.find((action) => action.title === item.key);
                if (!service) return null;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    onPress={() =>
                      item.key === "출국 준비"
                        ? router.push({
                            pathname: "/management",
                            params: { tab: "departure" },
                          })
                        : router.push(service.route)
                    }
                    style={styles.row}
                  >
                    <SoftServiceIcon Icon={service.icon} size={44} borderRadius={10} />
                    <View style={styles.body}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.description}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray[7]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.common.white },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  group: { marginBottom: 32 },
  groupTitle: { ...fonts.sub4_sb_14, color: Colors.gray[7], marginBottom: 12 },
  services: { gap: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 56, paddingVertical: 4 },
  body: { flex: 1, minWidth: 0, gap: 6 },
  title: { ...fonts.sub3_sb_16, color: Colors.common.black },
  description: { ...fonts.caption5_r_13, color: Colors.gray[7] },
});
