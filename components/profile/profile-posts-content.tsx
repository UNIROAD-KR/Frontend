import LikedPostsEmptyInfoIcon from "@/assets/icon/profile/liked-posts-empty-info.svg";
import { Text } from "@/components/ui/app-text";
import { SortSheet } from "@/components/ui/sort-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  formatDate,
  formatPrice,
  postTicketTabs,
  type ListCard,
  type PostCommunityTab,
  type PostSortMode,
  type PostTicketTab,
  type ProfileListCategory,
} from "./profile-post-types";
import EmptyState from "../ui/empty-state";

const CATEGORY_TABS: { key: ProfileListCategory; label: string }[] = [
  { key: "free", label: "커뮤니티" },
  { key: "used", label: "중고거래" },
  { key: "ticket", label: "티켓양도" },
];

const SORT_OPTIONS: { key: PostSortMode; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "oldest", label: "오래된순" },
];

export type ProfilePostsContentProps = {
  selectedCategory: ProfileListCategory;
  onSelectCategory: (category: ProfileListCategory) => void;
  communityTab: PostCommunityTab;
  onSelectCommunityTab: (tab: PostCommunityTab) => void;
  ticketTab: PostTicketTab;
  onSelectTicketTab: (tab: PostTicketTab) => void;
  sortMode: PostSortMode;
  sortOpen: boolean;
  onToggleSort: () => void;
  onSelectSort: (mode: PostSortMode) => void;
  items: ListCard[];
  loading: boolean;
};

export function ProfilePostsContent({
  selectedCategory,
  onSelectCategory,
  communityTab,
  onSelectCommunityTab,
  ticketTab,
  onSelectTicketTab,
  sortMode,
  sortOpen,
  onToggleSort,
  onSelectSort,
  items,
  loading,
  emptyTitle,
  emptyText,
}: ProfilePostsContentProps & { emptyTitle: string; emptyText: string }) {
  return (
    <>
      <View style={styles.primaryTabs}>
        {CATEGORY_TABS.map((tab) => {
          const active = selectedCategory === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={[styles.primaryTab, active && styles.primaryTabActive]}
              onPress={() => onSelectCategory(tab.key)}
            >
              <Text
                style={[
                  styles.primaryTabText,
                  active && styles.primaryTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.countText}>
          전체 <Text style={styles.countNumber}>{items.length}</Text>개
        </Text>
        <Pressable style={styles.sortButton} onPress={onToggleSort}>
          <Text style={styles.sortText}>{sortLabel(sortMode)}</Text>
          <Ionicons name="chevron-down" size={16} color="#7A8491" />
        </Pressable>
      </View>

      <SortSheet
        visible={sortOpen}
        value={sortMode}
        options={SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
        onClose={onToggleSort}
        onSelect={onSelectSort}
      />

      {selectedCategory === "free" ? (
        <View style={styles.filterRow}>
          {[
            { key: "free" as const, label: "자유게시판" },
            { key: "companion" as const, label: "동행 모집" },
          ].map((tab) => (
            <FilterChip
              key={tab.key}
              label={tab.label}
              active={communityTab === tab.key}
              onPress={() => onSelectCommunityTab(tab.key)}
            />
          ))}
        </View>
      ) : null}

      {selectedCategory === "ticket" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ticketFilters}
        >
          {postTicketTabs.map((tab) => (
            <FilterChip
              key={tab.key}
              label={tab.label}
              active={ticketTab === tab.key}
              onPress={() => onSelectTicketTab(tab.key)}
            />
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#18202B" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyText} />
      ) : (
        <View>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={
                selectedCategory === "free"
                  ? styles.communityRow
                  : selectedCategory === "used"
                    ? styles.usedRow
                    : styles.ticketRow
              }
              onPress={() => item.route && router.push(item.route as any)}
            >
              {selectedCategory === "free" ? (
                <CommunityPostCard item={item} />
              ) : selectedCategory === "used" ? (
                <UsedPostCard item={item} />
              ) : (
                <TicketPostCard item={item} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CommunityPostCard({ item }: { item: ListCard }) {
  const categoryLabel = item.postCategory
    ? ((
        {
          WORRY: "고민글",
          CHAT: "사담글",
          QUESTION: "질문글",
        } as Record<string, string>
      )[item.postCategory] ?? item.postCategory)
    : undefined;
  const metadata = [
    item.authorName,
    [item.country, item.postStatus].filter(Boolean).join(" "),
    typeof item.commentCount === "number"
      ? `댓글 ${item.commentCount}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <View style={styles.communityCopy}>
        <Text style={styles.communityTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.communityPreview} numberOfLines={1}>
          {item.subtitle || "게시글 본문입니다."}
        </Text>
        {item.category === "free" ? (
          <View style={styles.communityFooter}>
            {categoryLabel && (
              <View style={styles.categoryTag}>
                <Text
                  style={[
                    fonts.caption4_m_12,
                    { color: Colors.primary.default, letterSpacing: 0 },
                  ]}
                >
                  {categoryLabel}
                </Text>
              </View>
            )}
            <Text style={styles.communityMeta} numberOfLines={1}>
              좋아요 {item.likeCount ?? 0} · 댓글 {item.commentCount ?? 0}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.communityMeta, { marginTop: 8 }]}
            numberOfLines={1}
          >
            {metadata || item.meta}
          </Text>
        )}
      </View>
      <PostThumbnail uri={item.imageUrl} style={styles.communityThumbnail} />
    </>
  );
}

function UsedPostCard({ item }: { item: ListCard }) {
  const price =
    typeof item.price === "number"
      ? formatPrice(item.price)
      : item.price || item.meta.split(" · ")[0] || "가격 미정";

  return (
    <>
      <View style={styles.usedThumbnailWrap}>
        <PostThumbnail uri={item.imageUrl} style={styles.usedThumbnail} />
        {item.status === "COMPLETED" ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>거래 완료</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.usedCopy}>
        <Text style={styles.usedTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.usedMeta} numberOfLines={1}>
          거래 {item.country || "정보 없음"}
        </Text>
        <Text style={styles.usedMeta} numberOfLines={1}>
          장소 {item.region || item.subtitle || "정보 없음"}
        </Text>
        <Text style={styles.usedPrice}>{price}</Text>
      </View>
    </>
  );
}

function TicketPostCard({ item }: { item: ListCard }) {
  const transferPrice =
    typeof item.price === "number"
      ? formatPrice(item.price)
      : item.price || item.meta.split(" · ")[1] || "가격 미정";

  return (
    <>
      <View style={styles.flagBox}>
        <Text style={styles.flag}>{countryFlag(item.country)}</Text>
        <Text style={styles.countryName} numberOfLines={1}>
          {item.country || "국가"}
        </Text>
      </View>
      <View style={styles.ticketCopy}>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.ticketMeta} numberOfLines={1}>
          일시{" "}
          {[formatDate(item.eventDate), item.eventTime]
            .filter(Boolean)
            .join(" ")}
        </Text>
        <Text style={styles.ticketMeta} numberOfLines={1}>
          유형 {ticketTypeLabel(item.ticketType)}
        </Text>
        <View style={styles.ticketPriceRow}>
          <Text style={styles.ticketPrice}>{transferPrice}</Text>
          {item.originalPrice ? (
            <Text style={styles.ticketOriginalPrice}>
              {formatPrice(item.originalPrice)}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );
}

function PostThumbnail({ uri, style }: { uri?: string; style: object }) {
  return uri ? (
    <Image source={{ uri }} style={style} resizeMode="cover" />
  ) : (
    <View style={[style, styles.thumbnailPlaceholder]} />
  );
}

function sortLabel(mode: PostSortMode) {
  return SORT_OPTIONS.find((option) => option.key === mode)?.label ?? "최신순";
}

function ticketTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    TOUR: "관광 티켓",
    CONCERT: "콘서트·공연",
    TRAIN: "기차표",
    FLIGHT: "항공권",
    ACCOMMODATION: "숙박",
  };

  return (type && labels[type]) || type || "티켓 양도";
}

function countryFlag(country?: string) {
  const flags: Record<string, string> = {
    대한민국: "🇰🇷",
    한국: "🇰🇷",
    일본: "🇯🇵",
    터키: "🇹🇷",
    독일: "🇩🇪",
    프랑스: "🇫🇷",
    스페인: "🇪🇸",
    이탈리아: "🇮🇹",
    미국: "🇺🇸",
    영국: "🇬🇧",
  };

  return flags[country || ""] || "🌐";
}

const styles = StyleSheet.create({
  primaryTabs: { height: 48, flexDirection: "row", alignItems: "stretch" },
  primaryTab: {
    paddingHorizontal: 12,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  primaryTabActive: {
    borderBottomColor: Colors.gray[11],
  },
  primaryTabText: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[6],
  },
  primaryTabTextActive: {
    color: Colors.gray[11],
  },
  toolbar: {
    minHeight: 52,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  countText: {
    ...fonts.title6_sb_20,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  countNumber: {
    color: Colors.primary.default,
  },
  sortButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 8,
  },
  sortText: {
    ...fonts.body2_m_14,
    letterSpacing: 0,
    color: Colors.gray[7],
  },
  filterRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  ticketFilters: {
    gap: 8,
    paddingBottom: 12,
    paddingRight: 16,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: 20,
    backgroundColor: Colors.gray[1],
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: Colors.gray[11],
  },
  filterChipText: {
    ...fonts.body2_m_14,
    letterSpacing: 0,
    color: Colors.gray[7],
  },
  filterChipTextActive: {
    color: Colors.common.white,
  },
  loadingBox: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 58,
  },
  emptyTitle: {
    marginTop: 12,
    ...fonts.sub1_sb_18,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  emptyText: {
    marginTop: 8,
    ...fonts.body2_m_14,
    letterSpacing: 0,
    color: Colors.gray[6],
    textAlign: "center",
  },
  communityRow: {
    minHeight: 104,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  communityCopy: { flex: 1, minWidth: 0 },
  communityTitle: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  communityPreview: {
    ...fonts.body4_r_14,
    letterSpacing: 0,
    color: Colors.gray[6],
    marginTop: 4,
  },
  communityMeta: {
    ...fonts.caption3_m_13,
    letterSpacing: 0,
    color: Colors.gray[8],
    flexShrink: 1,
  },
  communityThumbnail: { width: 76, height: 76, borderRadius: 8 },
  thumbnailPlaceholder: {
    backgroundColor: Colors.gray[3],
  },
  communityFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  categoryTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: `${Colors.primary.default}14`,
  },
  usedRow: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  usedThumbnailWrap: {
    width: 96,
    height: 96,
  },
  usedThumbnail: {
    width: 96,
    height: 96,
    borderRadius: 6,
  },
  completedBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    borderRadius: 4,
    backgroundColor: Colors.gray[11],
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  completedBadgeText: {
    ...fonts.caption4_m_12,
    letterSpacing: 0,
    color: Colors.common.white,
  },
  usedCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  usedTitle: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  usedMeta: {
    marginTop: 5,
    ...fonts.caption4_m_12,
    letterSpacing: 0,
    color: Colors.gray[7],
  },
  usedPrice: {
    marginTop: 6,
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  ticketRow: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flagBox: {
    width: 46,
    alignItems: "center",
  },
  flag: {
    fontSize: 26,
  },
  countryName: {
    marginTop: 4,
    ...fonts.caption4_m_12,
    letterSpacing: 0,
    color: Colors.gray[8],
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketTitle: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  ticketMeta: {
    marginTop: 4,
    ...fonts.caption4_m_12,
    letterSpacing: 0,
    color: Colors.gray[7],
  },
  ticketPriceRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  ticketPrice: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  ticketOriginalPrice: {
    ...fonts.caption4_m_12,
    letterSpacing: 0,
    color: Colors.gray[5],
    textDecorationLine: "line-through",
  },
});
