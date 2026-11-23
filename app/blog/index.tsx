import SearchIcon from "@/assets/icon/search-icon.svg";
import SortIcon from "@/assets/icon/sort.svg";
import { ExploreMySchoolInfo } from "@/components/home/explore-my-school-info";
import { ExplorePartnerSchools } from "@/components/home/explore-partner-schools";
import VisaGuideScreen from "@/components/home/visa-guide";
import ScholarshipInfoScreen from "@/components/home/scholarship-info";
import { Text, TextInput } from "@/components/ui/app-text";
import { AppBackButton } from "@/components/ui/app-back-button";
import { Colors, fonts } from "@/constants/theme";
import { getBlogPosts, type BlogPostSummary } from "@/src/api/blog";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = ["지원·합격", "파견교 정보", "국가별 출국", "장학금·비용", "내 학교 정보"] as const;
const articleTab = tabs[0];
const partnerSchoolTab = tabs[1];
const departureTab = tabs[2];
const scholarshipTab = tabs[3];
const mySchoolTab = tabs[4];

export default function ExploreListScreen() {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = tabs.find((item) => item === tab) ?? articleTab;
  const tabScroll = useRef<ScrollView>(null);
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();
  const visiblePosts = posts.filter((post) =>
    post.title.toLowerCase().includes(keyword) ||
    post.summary?.toLowerCase().includes(keyword),
  );

  const loadPosts = useCallback(async (cursorId?: number) => {
    try {
      if (cursorId === undefined) {
        setLoading(true);
        setLoadFailed(false);
      } else {
        setLoadingMore(true);
        setLoadMoreFailed(false);
      }

      const response = await getBlogPosts({ cursorId });
      const page = response.data.data;
      setPosts((current) =>
        cursorId === undefined ? page.items : [...current, ...page.items],
      );
      setNextCursorId(page.nextCursorId ?? null);
      setHasNext(page.hasNext);
    } catch (error: any) {
      console.error("블로그 목록 조회 실패:", error.response?.data || error.message);
      if (cursorId === undefined) {
        setLoadFailed(true);
      } else {
        setLoadMoreFailed(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AppBackButton fallbackHref="/home" />
        <Text style={styles.headerTitle}>탐색 리스트</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={tabScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabs}
        keyboardShouldPersistTaps="handled"
      >
        {tabs.map((tab) => {
          const selected = tab === selectedTab;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onLayout={tab === initialTab && initialTab !== articleTab ? (event) => {
                tabScroll.current?.scrollTo({
                  x: Math.max(0, event.nativeEvent.layout.x - 16),
                  animated: false,
                });
              } : undefined}
              onPress={() => {
                setSelectedTab(tab);
                setQuery("");
              }}
              style={[styles.tab, selected && styles.activeTab]}
            >
              <Text style={[styles.tabText, selected && styles.activeTabText]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {selectedTab === articleTab && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              accessibilityLabel="키워드로 검색"
              placeholder="키워드로 검색"
              placeholderTextColor={Colors.gray[6]}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <SearchIcon />
          </View>
          <View
            style={styles.sortButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel="정렬"
            accessibilityState={{ disabled: true }}
          >
            <SortIcon />
          </View>
        </View>
      )}

      {selectedTab === partnerSchoolTab ? (
        <ExplorePartnerSchools />
      ) : selectedTab === departureTab ? (
        <VisaGuideScreen embedded />
      ) : selectedTab === scholarshipTab ? (
        <ScholarshipInfoScreen embedded />
      ) : (
        <ScrollView
          key={selectedTab}
          contentContainerStyle={[
            styles.content,
            selectedTab === mySchoolTab && styles.schoolContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selectedTab === mySchoolTab ? (
            <ExploreMySchoolInfo />
          ) : selectedTab !== articleTab ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>등록된 아티클이 없어요.</Text>
            </View>
          ) : loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={Colors.primary.default} />
            </View>
          ) : loadFailed ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>블로그 목록을 불러오지 못했어요.</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadPosts()}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>공개된 블로그 글이 없어요.</Text>
            </View>
          ) : (
            <>
              {visiblePosts.length === 0 && (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>불러온 아티클 중 검색 결과가 없어요.</Text>
                </View>
              )}
              {visiblePosts.map((post) => (
                <Pressable
                  key={post.id}
                  style={styles.postCard}
                  onPress={() =>
                    router.push({
                      pathname: "/blog/[slug]",
                      params: { slug: post.slug },
                    })
                  }
                >
                  <View style={styles.postText}>
                    <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
                    <View style={styles.meta}>
                      <Text style={styles.tag}>임시태그</Text>
                      <Text style={styles.date}>
                        {post.publishedAt?.slice(0, 16).replaceAll("-", ". ").replace("T", "  ")}
                      </Text>
                    </View>
                  </View>
                  {post.thumbnailUrl ? (
                    <Image source={{ uri: post.thumbnailUrl }} style={styles.thumbnail} />
                  ) : null}
                </Pressable>
              ))}

              {hasNext && nextCursorId !== null && (
                <View>
                  {loadMoreFailed && (
                    <Text style={styles.loadMoreError}>
                      다음 글을 불러오지 못했어요.
                    </Text>
                  )}
                  <Pressable
                    style={styles.moreButton}
                    onPress={() => void loadPosts(nextCursorId)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color={Colors.primary.default} />
                    ) : (
                      <Text style={styles.moreText}>
                        {loadMoreFailed ? "다시 시도" : "더 보기"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.common.white },
  header: {
    minHeight: 64,
    paddingBottom: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { ...fonts.sub3_sb_16, color: Colors.gray[10] },
  headerSpacer: { width: 34 },
  tabScroll: { flexGrow: 0, flexShrink: 0 },
  tabs: { paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: Colors.gray[10] },
  tabText: { ...fonts.sub4_sb_14, color: Colors.gray[6] },
  activeTabText: { color: Colors.gray[10] },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    backgroundColor: Colors.common.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    ...fonts.body3_r_16,
    flex: 1,
    lineHeight: undefined,
    color: Colors.common.black,
    padding: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  sortButton: {
    width: 52,
    height: 52,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#E2E5E9",
    backgroundColor: Colors.common.white,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 24 },
  schoolContent: { paddingTop: 18 },
  stateBox: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 14 },
  stateText: { ...fonts.body2_m_14, color: Colors.gray[7] },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.primary.default,
  },
  retryText: { ...fonts.body4_r_14, color: Colors.common.white },
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  thumbnail: { width: 80, height: 80, borderRadius: 8, backgroundColor: Colors.gray[3] },
  postText: { flex: 1, gap: 8 },
  title: { ...fonts.sub3_sb_16, color: Colors.gray[9] },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  tag: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
    backgroundColor: "#EAF3FF",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  date: { ...fonts.body2_m_14, color: Colors.gray[6] },
  moreButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 9,
    backgroundColor: Colors.common.white,
  },
  moreText: { ...fonts.body2_m_14, color: Colors.gray[8] },
  loadMoreError: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
    textAlign: "center",
    marginBottom: 8,
  },
});
