import ArrowGrayIcon from "@/assets/icon/arrow-gray.svg";
import { CompanionPostCard } from "@/components/community/CompanionPostCard";
import { sortedCountries } from "@/components/market/MarketCountrySheet";
import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import {
  getCompanionPosts,
  type CompanionPostResponse,
} from "@/src/api/companion";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export function RecruitingCompanionSection() {
  const [country, setCountry] = useState("전체");
  const [posts, setPosts] = useState<CompanionPostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(false);
      const load = async () => {
        try {
          const collected = new Map<number, CompanionPostResponse>();
          const cursors = new Set<number>();
          let cursorId: number | undefined;
          while (active) {
            const response = await getCompanionPosts({ size: 50, cursorId });
            const page = response.data.data;
            for (const post of page.items ?? []) {
              if (post.status === "RECRUITING") collected.set(post.id, post);
            }
            if (
              !page.hasNext ||
              page.nextCursorId == null ||
              cursors.has(page.nextCursorId)
            )
              break;
            cursorId = page.nextCursorId;
            cursors.add(cursorId);
          }
          if (active)
            setPosts(
              [...collected.values()].sort(
                (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
              ),
            );
        } catch {
          if (active) setError(true);
        } finally {
          if (active) setLoading(false);
        }
      };
      void load();
      return () => {
        active = false;
      };
      // Retry restarts the focused screen's request and cancels its previous response.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retry]),
  );

  const countries = [
    "전체",
    ...new Set([
      ...sortedCountries,
      ...posts.map((post) => post.country).filter(Boolean),
    ]),
  ];
  const visiblePosts = posts
    .filter((post) => country === "전체" || post.country === country)
    .slice(0, 3);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>모집 중인 동행</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.more}
          onPress={() =>
            router.push({
              pathname: "/community",
              params: { tab: "companion" },
            })
          }
        >
          <Text style={styles.moreText}>전체보기</Text>
          <ArrowGrayIcon />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.countries}
      >
        {countries.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: country === item }}
            onPress={() => setCountry(item)}
            style={[styles.chip, country === item && styles.selectedChip]}
          >
            <Text
              style={[styles.chipText, country === item && styles.selectedText]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? (
        <ActivityIndicator
          style={styles.state}
          color={Colors.primary.default}
        />
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>
            동행 모집 글을 불러오지 못했어요.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRetry((value) => value + 1)}
          >
            <Text style={styles.retry}>다시 시도</Text>
          </Pressable>
        </View>
      ) : visiblePosts.length === 0 ? (
        <Text style={[styles.state, styles.stateText]}>
          해당 국가에서 모집 중인 동행이 없어요.
        </Text>
      ) : (
        <View style={styles.cards}>
          {visiblePosts.map((post) => (
            <CompanionPostCard
              key={post.id}
              post={post}
              onPress={() =>
                router.push({
                  pathname: "/community-detail",
                  params: { type: "companion", id: String(post.id) },
                })
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 28 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  heading: { fontSize: 20, fontWeight: "600", color: "#111111" },
  more: { flexDirection: "row", alignItems: "center", gap: 2 },
  moreText: { ...fonts.body2_m_14, color: Colors.gray[8] },
  countries: { gap: 8, paddingVertical: 2, paddingBottom: 14 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
  },
  selectedChip: { backgroundColor: Colors.gray[11] },
  chipText: { ...fonts.body2_m_14, color: Colors.gray[7] },
  selectedText: { color: Colors.common.white },
  cards: { gap: 24 },
  state: { paddingVertical: 24, alignItems: "center", gap: 12 },
  stateText: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
    textAlign: "center",
  },
  retry: { ...fonts.body2_m_14, color: Colors.primary.default },
});
