import { Text } from "@/components/ui/app-text";
import { HomeInfoTab } from "@/components/home/home-info-tab";
import { HomeStatusTab } from "@/components/home/home-status-tab";
import HomeExploreTab from "@/components/home/home-explore-tab";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [selectedHomeTab, setSelectedHomeTab] = useState<"정보" | "상태" | "탐색">("정보");
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
      <View style={styles.homeTabs}>
        {(["정보", "상태", "탐색"] as const).map((tab) => {
          const isSelected = selectedHomeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.homeTab, isSelected && styles.selectedHomeTab]}
              onPress={() => setSelectedHomeTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  {
                    fontSize: 22,
                    fontWeight: "600",
                    lineHeight: 26.4,
                    letterSpacing: -0.88,
                    color: isSelected ? "#000000" : "#8B95A1",
                  },
                ]}
              >
                {tab}
              </Text>
              {tab === "탐색" && (
                <View style={styles.customTabBadge}>
                  <Text style={styles.customTabBadgeText}>맞춤형</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>


      </View>
      <View style={styles.panel}>
        {selectedHomeTab === "정보" && (
          <HomeInfoTab onGoToStatus={() => setSelectedHomeTab("상태")} />
        )}
        {selectedHomeTab === "상태" && <HomeStatusTab />}
        {selectedHomeTab === "탐색" && <HomeExploreTab embedded />}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  tabBar: { paddingHorizontal: 20 },
  panel: { flex: 1 },
  homeTabs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  homeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  selectedHomeTab: {
    borderBottomColor: "#111111",
  },
  customTabBadge: {
    borderRadius: 6,
    backgroundColor: "#506AFF",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  customTabBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
});
