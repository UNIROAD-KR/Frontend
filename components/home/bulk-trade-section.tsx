import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fonts } from "../../constants/theme";
import type { UsedItem } from "../../src/api/usedItems";

const formatTradePrice = (price: number) =>
  `${price.toLocaleString("ko-KR")}원`;
const countryTabs = ["전체", "독일", "프랑스", "스페인", "체코", "캐나다"];

type BulkTradeSectionProps = {
  items: UsedItem[];
  isReturned: boolean;
};

export function BulkTradeSection({ items, isReturned }: BulkTradeSectionProps) {
  const [selectedCountry, setSelectedCountry] = useState("전체");
  const filteredItems =
    selectedCountry === "전체"
      ? items
      : items.filter(
          (item) =>
            item.country === selectedCountry ||
            item.region.includes(selectedCountry),
        );

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isReturned ? "귀국 전후 중고 판매" : "최근 올라온 일괄거래"}
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/market",
              params: { fromHome: "true" },
            } as any)
          }
        >
          <View style={styles.moreButton}>
            <Text style={styles.moreText}>전체보기</Text>
            <Ionicons name="chevron-forward" size={20} color="#4E5968" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.countryScroll}
        contentContainerStyle={styles.countryContent}
      >
        {countryTabs.map((country) => {
          const selected = selectedCountry === country;

          return (
            <Pressable
              key={country}
              style={[
                styles.countryChip,
                selected && styles.selectedCountryChip,
              ]}
              onPress={() => setSelectedCountry(country)}
            >
              <Text
                style={[
                  fonts.body2_m_14,
                  { color: selected ? "#FFFFFF" : "#6B7684" },
                ]}
              >
                {country}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View>
        {filteredItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.tradeItem,
              index === filteredItems.length - 1 && styles.lastItem,
            ]}
            onPress={() =>
              router.push({
                pathname: "/market",
                params: { fromHome: "true", openItemId: String(item.id) },
              } as any)
            }
            activeOpacity={0.84}
          >
            <View style={styles.tradeThumb}>
              <Image
                source={
                  item.thumbnailImageUrl
                    ? { uri: item.thumbnailImageUrl }
                    : require("../../assets/images/used_all.png")
                }
                style={styles.tradeImage}
              />
            </View>
            <View style={styles.tradeBody}>
              <Text style={styles.tradeTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.tradeMetaRow}>
                <Text style={styles.tradeLabel}>거래</Text>
                <Text style={styles.tradeLocation}>{item.country}</Text>
              </View>
              <View style={styles.tradeMetaRow}>
                <Text style={styles.tradeLabel}>장소</Text>
                <Text style={styles.tradeLocation}>{item.region}</Text>
              </View>
              <Text style={styles.tradePrice}>
                {formatTradePrice(item.price)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {filteredItems.length === 0 && (
          <Text style={styles.emptyText}>해당 국가의 거래 상품이 없어요.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111111",
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  moreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4E5968",
  },
  countryScroll: {
    marginBottom: 8,
  },
  countryContent: {
    gap: 10,
    paddingVertical: 2,
  },
  countryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCountryChip: {
    backgroundColor: "#191F28",
  },
  countryChipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B95A1",
  },
  selectedCountryChipText: {
    color: "#FFFFFF",
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: "center",
    fontSize: 14,
    color: "#8B95A1",
  },
  tradeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  tradeThumb: {
    width: 96,
    height: 96,
    borderRadius: 6,
    backgroundColor: "#F3F6FA",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  tradeImage: {
    width: 96,
    height: 96,
    resizeMode: "cover",
  },
  tradeBody: {
    flex: 1,
    flexDirection: "column",
    height: 96,
    justifyContent: "center",
    gap: 2,
  },
  tradeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191F28",
    marginBottom: 4,
  },
  tradeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  tradeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4E5968",
  },
  tradeLocation: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8B95A1",
  },
  tradePrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
});
