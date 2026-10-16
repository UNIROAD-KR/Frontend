import { Text } from "@/components/ui/app-text";
import { SoftServiceIcon } from "@/components/soft-service-icon";
import { quickActionsByStatus } from "@/components/constants";
import ArrowRightIcon from "@/assets/icon/arrow-right.svg";
import { RecruitingCompanionSection } from "@/components/home/recruiting-companion-section";
import { BulkTradeSection } from "@/components/home/bulk-trade-section";
import { useHomeDashboard } from "@/components/home/use-home-dashboard";
import { getUsedItems, type UsedItem } from "@/src/api/usedItems";
import { Colors, fonts } from "@/constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export function HomeInfoTab({
  onGoToStatus,
}: {
  onGoToStatus: () => void;
}) {
  const { country, situationText, lifecycleStatus } = useHomeDashboard();
  const dispatchInfo = { country: country || "파견 국가 미설정" };
  const currentSituationText = situationText;
  const isReturned = lifecycleStatus === "귀국";
  const [tradeItems, setTradeItems] = useState<UsedItem[]>([]);
  useFocusEffect(useCallback(() => {
    let active = true;
    getUsedItems({ size: 3 }).then((response) => {
      if (active) setTradeItems(response.data.data.items ?? []);
    }).catch(() => { if (active) setTradeItems([]); });
    return () => { active = false; };
  }, []));
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={onGoToStatus}
        activeOpacity={0.82}
        style={{
          width: "100%",
          borderWidth: 1,
          borderColor: "#D1D6DC",
          borderRadius: 16,
          paddingVertical: 14,
          paddingRight: 12,
          paddingLeft: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text
            style={[fonts.sub3_sb_16, { color: "#506AFF", lineHeight: 24 }]}
          >
            나의 상태
          </Text>
          <Text style={[fonts.body3_r_16, { lineHeight: 24 }]}>
            {dispatchInfo.country} {currentSituationText}
          </Text>
        </View>
        <ArrowRightIcon />
      </TouchableOpacity>

      <View style={styles.sectionBlock}>
        

        <View style={styles.quickGrid}>
          {quickActionsByStatus.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.quickItem]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.86}
            >
              <SoftServiceIcon Icon={item.icon} />
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.contentSurface}>
        <View style={styles.banner}>
          <Image
            source={require("../../assets/images/middle-banner.png")}
            style={{ width: "100%", borderRadius: 16 }}
            resizeMode="contain"
          />
        </View>
        

        <View>
          <BulkTradeSection items={tradeItems} isReturned={isReturned} />
          <RecruitingCompanionSection />
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  banner: {
    width: "100%",
    height: 82,
    backgroundColor: "#1A14A5",
    borderRadius: 10,
    marginBottom: 36,
  },
  sectionBlock: {
    marginTop: 10,
  },
  contentSurface: {
    marginTop: 34,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    rowGap: 10,
  },
  quickItem: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  quickTitle: {
    ...fonts.quick,
    color: Colors.gray[11],
  },
});
