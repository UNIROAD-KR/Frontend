import { Text } from "@/components/ui/app-text";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { MarketEmptyState } from "./MarketEmptyState";
import { Colors, fonts } from "@/constants/theme";

export type UsedMarketListing = {
  id: number;
  title: string;
  status: string;
  price: number;
  categories: string[];
  returnDate?: string;
  tradeCountry: string;
  region: string;
  priceText: string;
  imageUrl: string;
  saved: boolean;
  scraps: number;
};
type Props = {
  items: UsedMarketListing[];
  error: string;
  onRetry: () => void;
  hasActiveFilters?: boolean;
};

export function UsedMarketScreen({
  items,
  error,
  onRetry,
  hasActiveFilters = false,
}: Props) {
  if (error) return <MarketEmptyState error={error} onRetry={onRetry} />;
  if (!items.length)
    return (
      <MarketEmptyState
        title={
          hasActiveFilters
            ? "조건에 맞는 거래글이 없어요"
            : "등록한 거래글이 아직 없어요"
        }
        description={
          hasActiveFilters
            ? "필터 조건을 변경해보세요."
            : "첫 거래글을 기다리고 있어요."
        }
      />
    );
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const completed = item.status === "COMPLETED";
        return (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/market/[id]", params: { id: item.id } })
            }
          >
            <View style={styles.thumbnail}>
              {!!item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              )}
              {completed && (
                <View pointerEvents="none" style={styles.completedOverlay}>
                  <View style={styles.completedBadge}>
                    <Text
                      style={[
                        fonts.caption1_sb_13,
                        { color: Colors.common.white },
                      ]}
                    >
                      거래 완료
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Text
              numberOfLines={2}
              style={[
                fonts.sub3_sb_16,
                { marginTop: 8, marginBottom: 4 },
                { color: completed ? Colors.gray[6] : Colors.gray[11] },
              ]}
            >
              {item.title}
            </Text>
            <View style={[styles.metaRow, { marginBottom: 2 }]}>
              <Text
                style={[
                  fonts.caption4_m_12,
                  { color: completed ? Colors.gray[6] : Colors.gray[8] },
                ]}
              >
                거래
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  fonts.caption4_m_12,
                  {
                    color: completed ? Colors.gray[5] : Colors.gray[6],
                    width: 139,
                    overflow: "hidden",
                  },
                ]}
              >
                {item.tradeCountry || "미정"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text
                style={[
                  fonts.caption4_m_12,
                  { color: completed ? Colors.gray[6] : Colors.gray[8] },
                ]}
              >
                장소
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  fonts.caption4_m_12,
                  {
                    color: completed ? Colors.gray[5] : Colors.gray[6],
                    width: 139,
                    overflow: "hidden",
                  },
                ]}
              >
                {item.region || "미정"}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text
                numberOfLines={1}
                style={[
                  fonts.sub3_sb_16,
                  { color: completed ? Colors.gray[6] : Colors.gray[11] },
                ]}
              >
                {item.priceText}
              </Text>
              <View style={styles.scraps}>
                {/* <Ionicons
                  name={item.saved ? "bookmark" : "bookmark-outline"}
                  size={12}
                  color={item.saved ? "#102BE0" : "#8B95A1"}
                />
                <Text style={styles.scrapCount}>{item.scraps}</Text> */}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },
  card: { width: "49%", minWidth: 0 },
  thumbnail: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 9,
    backgroundColor: "#F0F1F3",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  completedBadge: {
    backgroundColor: Colors.gray[11],
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: "#252B35",
    marginTop: 8,
    marginBottom: 4,
    minHeight: 46,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabel: { fontSize: 12, lineHeight: 19, color: "#596579" },
  metaValue: { flex: 1, fontSize: 12, lineHeight: 19, color: "#8B95A1" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
  },
  price: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#252B35",
  },
  completedText: { color: "#8B95A1" },
  scraps: { flexDirection: "row", alignItems: "center", gap: 2 },
  scrapCount: { fontSize: 11, color: "#8B95A1" },
});
