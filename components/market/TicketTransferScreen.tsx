import { Text } from "@/components/ui/app-text";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { MarketEmptyState } from "./MarketEmptyState";

export type TicketListing = {
  id: number;
  country: string;
  time: string;
  region: string;
  category: string;
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
  onRetry: () => void;
};
const BLUE = "#102BE0";
export function TicketTransferScreen({
  items,
  error,
  loadingMore,
  onRetry,
}: Props) {
  if (error) return <MarketEmptyState error={error} onRetry={onRetry} />;
  if (!items.length)
    return (
      <MarketEmptyState
        title="등록한 티켓이 아직 없어요"
        description="첫 티켓 양도글을 기다리고 있어요."
      />
    );
  return (
    <View style={styles.ticketList}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.ticketCard}
          onPress={() =>
            router.push({
              pathname: "/market/ticket-preview",
              params: { id: String(item.id) },
            } as any)
          }
        >
          <View style={styles.ticketMetaRow}>
            <Image
              source={require("../../assets/images/ticket_profile.png")}
              style={styles.ticketProfileIcon}
            />

            <Text style={styles.ticketMeta}>
              {item.country} 파견생 · {item.time}
            </Text>

            <View style={styles.ticketTag}>
              <Text style={styles.ticketTagText}>{item.region}</Text>
            </View>

            <View style={styles.ticketTag}>
              <Text style={styles.ticketTagText}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.ticketTitleRow}>
            <Text style={styles.ticketTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View style={styles.ticketInfoRow}>
            <View style={styles.ticketInfoItem}>
              <Image
                source={require("../../assets/images/ticket_date.png")}
                style={styles.ticketInfoIcon}
              />
              <Text style={styles.ticketInfo}>{item.date}</Text>
            </View>

            <View style={styles.ticketInfoItem}>
              <Image
                source={require("../../assets/images/count_ticket.png")}
                style={styles.ticketInfoIcon}
              />
              <Text style={styles.ticketInfo}>{item.count}</Text>
            </View>
          </View>

          <View style={styles.ticketPriceRow}>
            <Text style={styles.ticketPrice}>{item.price}</Text>

            {item.originalPrice.length > 0 && (
              <Text style={styles.ticketOriginalPrice}>
                원가 {item.originalPrice}
              </Text>
            )}
          </View>

          <View style={styles.ticketLikeRow}>
            <Text style={styles.ticketLike}>스크랩 {item.scraps}</Text>
          </View>
        </Pressable>
      ))}
      {loadingMore && (
        <View style={styles.ticketLoadingMore}>
          <ActivityIndicator color={BLUE} />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  ticketProfileIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    resizeMode: "cover",
    marginRight: 6,
  },
  ticketInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketInfoIcon: {
    width: 13,
    height: 13,
    resizeMode: "contain",
    marginRight: 4,
  },
  ticketList: {
    marginTop: 0,
  },
  ticketLoadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  ticketCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  ticketMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 6,
    marginBottom: 9,
  },
  ticketMeta: {
    flex: 1,
    minWidth: 120,
    fontSize: 10,
    color: "#777777",
  },
  ticketTag: {
    paddingHorizontal: 9,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  ticketTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555555",
  },
  ticketTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: "#111111",
  },
  ticketInfoRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 9,
  },
  ticketInfo: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
  },
  ticketPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    marginRight: 8,
  },
  ticketOriginalPrice: {
    fontSize: 12,
    color: "#B8B8B8",
    textDecorationLine: "line-through",
  },
  ticketLikeRow: {
    alignItems: "flex-end",
    marginTop: -8,
  },
  ticketLike: {
    fontSize: 12,
    color: "#555555",
  },
});
