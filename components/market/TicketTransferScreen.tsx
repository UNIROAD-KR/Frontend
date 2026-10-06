import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { MarketEmptyState } from "./MarketEmptyState";
import { flags as countryFlags } from "./MarketCountrySheet";

export type TicketListing = {
  id: number;
  country: string;
  time: string;
  region: string;
  category: string;
  ticketType: string;
  title: string;
  date: string;
  count: string;
  price: string;
  originalPrice: string;
  scraps: number;
};
type Props = {
  items: TicketListing[];
  error: string;
  loadingMore: boolean;
  hasMore: boolean;
  hasActiveFilters?: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

export function TicketTransferScreen({
  items,
  error,
  loadingMore,
  hasMore,
  hasActiveFilters = false,
  onLoadMore,
  onRetry,
}: Props) {
  return (
    <View>
      {error ? (
        <MarketEmptyState error={error} onRetry={onRetry} />
      ) : (
        <>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/market/ticket-preview",
                  params: { id: String(item.id) },
                })
              }
            >
              <View style={styles.country}>
                <View style={styles.flagBox}>
                  {countryFlags[item.region] ? (
                    <Text style={styles.flag}>{countryFlags[item.region]}</Text>
                  ) : (
                    <Ionicons
                      name="globe-outline"
                      size={30}
                      color={Colors.gray[6]}
                    />
                  )}
                </View>
                <Text
                  style={[fonts.caption4_m_12, styles.countryName]}
                  numberOfLines={2}
                >
                  {item.region || "국가 미정"}
                </Text>
              </View>
              <View style={styles.info}>
                <Text
                  style={[fonts.sub3_sb_16, styles.title]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>일정</Text>
                  <Text style={styles.metaValue}>{item.date}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>유형</Text>
                  <Text style={styles.metaValue}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.prices}>
                  <Text style={[fonts.sub3_sb_16, { color: Colors.gray[11] }]}>
                    {item.price}원
                  </Text>
                  {!!item.originalPrice && (
                    <Text style={[fonts.caption3_m_13, styles.originalPrice]}>
                      {item.originalPrice}원
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
          {!items.length && !loadingMore && (
            <MarketEmptyState
              title={hasActiveFilters ? "조건에 맞는 티켓이 없어요" : "등록한 티켓이 아직 없어요"}
              description={
                hasActiveFilters
                  ? "필터 조건을 변경해보세요."
                  : "첫 티켓 양도글을 기다리고 있어요."
              }
            />
          )}
          {hasMore && !loadingMore && (
            <Pressable style={styles.loading} onPress={onLoadMore}>
              <Text
                style={[
                  fonts.body2_m_14,
                  { color: Colors.primary.default, textAlign: "center" },
                ]}
              >
                티켓 더 불러오기
              </Text>
            </Pressable>
          )}
          {loadingMore && (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.primary.default} />
            </View>
          )}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingBottom: 30,
  },
  country: { width: 48, alignItems: "center", paddingTop: 2, gap: 5 },
  flagBox: {
    width: 48,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: { fontSize: 36, lineHeight: 40, includeFontPadding: false },
  countryName: { color: Colors.gray[8], textAlign: "center" },
  info: { flex: 1, minWidth: 0 },
  title: { color: Colors.gray[10], marginBottom: 6 },
  metaRow: { flexDirection: "row", gap: 10, marginBottom: 3 },
  metaLabel: { ...fonts.caption4_m_12, color: Colors.gray[8] },
  metaValue: { ...fonts.caption4_m_12, color: Colors.gray[6], flex: 1 },
  prices: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  originalPrice: { color: Colors.gray[6], textDecorationLine: "line-through" },
  loading: { paddingVertical: 16 },
});
