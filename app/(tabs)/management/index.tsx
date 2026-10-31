import { Text } from "@/components/ui/app-text";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import AccountBookTab from "../../account-book-tab";
import { DepartureTab } from "@/components/management/departure-tab";
import { CalendarTab } from "@/app/calendar-tab";
import { commonStyles, fonts, Colors } from "@/constants/theme";

export default function ExploreScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const selectedTab =
    tab === "departure"
      ? "출국 준비"
      : tab === "calendar"
        ? "캘린더"
        : "지출 관리";

  return (
    <View style={{ ...commonStyles.container }}>
      <View style={{ ...commonStyles.content, paddingHorizontal: 16, flex: 0 }}>
        <View style={styles.homeTabs}>
          {(["지출 관리", "캘린더", "출국 준비"] as const).map((tab) => {
            const isSelected = selectedTab === tab;

            return (
              <Pressable
                key={tab}
                style={[styles.homeTab, isSelected && styles.selectedHomeTab]}
                onPress={() =>
                  router.setParams({
                    tab:
                      tab === "출국 준비"
                        ? "departure"
                        : tab === "캘린더"
                          ? "calendar"
                          : "expense",
                  })
                }
              >
                <Text
                  style={[
                    {
                      ...fonts.sub3_sb_16,
                      color: isSelected ? "#000000" : Colors.gray[6],
                    },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {selectedTab === "지출 관리" && <AccountBookTab embedded />}
      {selectedTab === "캘린더" && <CalendarTab />}
      {selectedTab === "출국 준비" && <DepartureTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  homeTabs: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  homeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  selectedHomeTab: {
    borderBottomColor: "#111111",
  },
  homeTabText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#8B95A1",
  },
  selectedHomeTabText: {
    color: "#111111",
  },
});
