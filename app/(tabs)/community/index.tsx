import { Text, TextInput } from "@/components/ui/app-text";
import { FilterResetButton } from "@/components/ui/filter-reset-button";
import type { FreePostStatusFilter } from "../../../src/api/freePosts";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackButton } from "@/components/ui/app-back-button";
import {
  CompanionPostResponse,
  getCompanionPosts,
} from "../../../src/api/companion";
import { CompanionPostCard } from "@/components/community/CompanionPostCard";
import {
  FreePostSummaryResponse,
  getFreePosts,
} from "../../../src/api/freePosts";
import { Colors, fonts } from "@/constants/theme";
import { BLUE } from "../../../src/data/community";
import FreePostList from "@/components/community/FreePostList";
import {
  CompanionFilterSheet,
  emptyCompanionFilters,
  matchesCompanionFilters,
  type CompanionFilters,
} from "@/components/community/CompanionFilterSheet";

const communityTabs = ["자유 게시판", "동행 모집"] as const;
const boardStatusFilters: FreePostStatusFilter[] = [
  "전체",
  "고민글",
  "사담글",
  "질문글",
];
const COMMUNITY_PAGE_SIZE = 10;
const boardSortOptions = [
  { value: "popular", label: "인기순" },
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
] as const;

type CommunityTab = (typeof communityTabs)[number];
type BoardSortOrder = (typeof boardSortOptions)[number]["value"];
const companionSortOptions = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
] as const;
type CompanionSortOrder = (typeof companionSortOptions)[number]["value"];

const BoardStatusFilters = React.memo(function BoardStatusFilters({
  selectedStatus,
  onSelect,
}: {
  selectedStatus: FreePostStatusFilter;
  onSelect: (status: FreePostStatusFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.boardStatusFilterRow}
    >
      {boardStatusFilters.map((status) => {
        const selected = selectedStatus === status;
        return (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(status)}
            style={[
              styles.boardStatusFilter,
              selected && styles.boardStatusFilterSelected,
            ]}
          >
            <Text
              style={[
                fonts.body2_m_14,
                selected
                  ? styles.boardStatusFilterTextSelected
                  : styles.boardStatusFilterText,
              ]}
            >
              {status}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

export default function CommunityScreen() {
  const router = useRouter();
  const { tab, fromTab } = useLocalSearchParams<{
    tab?: string | string[];
    fromTab?: string | string[];
  }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<CommunityTab>("자유 게시판");
  const [boardKeyword, setBoardKeyword] = useState("");
  const [companionKeyword, setCompanionKeyword] = useState("");
  const [companionFilterSheetVisible, setCompanionFilterSheetVisible] =
    useState(false);
  const [companionFilters, setCompanionFilters] = useState<CompanionFilters>(
    emptyCompanionFilters,
  );
  const [selectedBoardStatus, setSelectedBoardStatus] =
    useState<FreePostStatusFilter>("전체");
  const [boardSortOrder, setBoardSortOrder] =
    useState<BoardSortOrder>("newest");
  const [companionSortOrder, setCompanionSortOrder] =
    useState<CompanionSortOrder>("newest");
  const [companionSortSheetVisible, setCompanionSortSheetVisible] =
    useState(false);
  const [boardSortSheetVisible, setBoardSortSheetVisible] = useState(false);
  const [boardPosts, setBoardPosts] = useState<FreePostSummaryResponse[]>([]);
  const [boardLoadError, setBoardLoadError] = useState(false);
  const [companionPosts, setCompanionPosts] = useState<CompanionPostResponse[]>(
    [],
  );
  const [boardNextCursorId, setBoardNextCursorId] = useState<number | null>(
    null,
  );
  const [companionNextCursorId, setCompanionNextCursorId] = useState<
    number | null
  >(null);
  const [boardHasNext, setBoardHasNext] = useState(false);
  const [companionHasNext, setCompanionHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreBoard, setLoadingMoreBoard] = useState(false);
  const [loadingMoreCompanion, setLoadingMoreCompanion] = useState(false);
  const didMountRef = useRef(false);
  const boardKeywordRef = useRef("");
  const selectedBoardStatusRef = useRef(selectedBoardStatus);
  const didMountBoardStatusRef = useRef(false);
  const isWide = width >= 768;

  const loadFreePosts = useCallback(
    async (
      cursorId?: number,
      append = false,
      keywordText = boardKeywordRef.current,
    ) => {
      const keyword = keywordText.trim();
      try {
        const freeResponse = await getFreePosts(
          {
            cursorId,
            keyword: keyword.length > 0 ? keyword : undefined,
            size: COMMUNITY_PAGE_SIZE,
          },
          selectedBoardStatusRef.current,
        );
        console.log(freeResponse.data);
        const cursorData = freeResponse.data;
        const nextItems = cursorData?.items ?? [];

        setBoardLoadError(false);
        setBoardPosts((prev) => (append ? [...prev, ...nextItems] : nextItems));
        setBoardNextCursorId(cursorData?.nextCursorId ?? null);
        setBoardHasNext(cursorData?.hasNext ?? false);
      } catch (error: any) {
        setBoardLoadError(true);
        console.log(
          "자유게시판 목록 조회 실패:",
          error.response?.data || error.message,
        );
      }
    },
    [],
  );

  const loadCompanionPosts = useCallback(
    async (cursorId?: number, append = false) => {
      try {
        const companionResponse = await getCompanionPosts({
          cursorId,
          size: COMMUNITY_PAGE_SIZE,
        });
        const cursorData = companionResponse.data.data;
        const nextItems = cursorData?.items ?? [];

        setCompanionPosts((prev) =>
          append ? [...prev, ...nextItems] : nextItems,
        );
        setCompanionNextCursorId(cursorData?.nextCursorId ?? null);
        setCompanionHasNext(cursorData?.hasNext ?? false);
      } catch (error: any) {
        console.log(
          "동행 구하기 목록 조회 실패:",
          error.response?.data || error.message,
        );
      }
    },
    [],
  );

  const loadCommunityPosts = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([loadFreePosts(), loadCompanionPosts()]);
    } finally {
      setLoading(false);
    }
  }, [loadCompanionPosts, loadFreePosts]);

  const handleLoadMoreBoard = async () => {
    if (!boardHasNext || boardNextCursorId == null || loadingMoreBoard) {
      return;
    }

    setLoadingMoreBoard(true);
    try {
      await loadFreePosts(boardNextCursorId, true, boardKeywordRef.current);
    } finally {
      setLoadingMoreBoard(false);
    }
  };

  const handleLoadMoreCompanion = async () => {
    if (
      !companionHasNext ||
      companionNextCursorId == null ||
      loadingMoreCompanion
    ) {
      return;
    }

    setLoadingMoreCompanion(true);
    try {
      await loadCompanionPosts(companionNextCursorId, true);
    } finally {
      setLoadingMoreCompanion(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCommunityPosts();
    }, [loadCommunityPosts]),
  );

  useEffect(() => {
    boardKeywordRef.current = boardKeyword.trim();

    if (!didMountRef.current) {
      didMountRef.current = true;
      return undefined;
    }

    const timer = setTimeout(() => {
      loadFreePosts(undefined, false, boardKeyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [boardKeyword, loadFreePosts]);

  useEffect(() => {
    selectedBoardStatusRef.current = selectedBoardStatus;
  }, [selectedBoardStatus]);

  useEffect(() => {
    if (!didMountBoardStatusRef.current) {
      didMountBoardStatusRef.current = true;
      return;
    }

    void loadFreePosts();
  }, [selectedBoardStatus, loadFreePosts]);

  const initialTab = Array.isArray(tab) ? tab[0] : tab;
  const openedFromTab =
    (Array.isArray(fromTab) ? fromTab[0] : fromTab) === "true";

  useEffect(() => {
    if (initialTab === "companion") {
      setActiveTab("동행 모집");
    }
  }, [initialTab]);

  const filteredBoardPosts = useMemo(() => {
    const keyword = boardKeyword.trim().toLowerCase();

    const filtered = boardPosts.filter((post) => {
      const matchesKeyword =
        keyword.length === 0 ||
        `${post.title} ${post.preview}`.toLowerCase().includes(keyword);

      return matchesKeyword;
    });
    return [...filtered].sort((a, b) => {
      const dateOrder =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (boardSortOrder === "popular") {
        return b.likeCount - a.likeCount || -dateOrder;
      }
      return boardSortOrder === "oldest" ? dateOrder : -dateOrder;
    });
  }, [boardKeyword, boardPosts, boardSortOrder]);

  const filteredCompanions = useMemo(() => {
    const keyword = companionKeyword.trim().toLowerCase();
    const filtered = companionPosts.filter((post) => {
      const matchesKeyword =
        !keyword ||
        `${post.title} ${post.country} ${post.region}`
          .toLowerCase()
          .includes(keyword);

      return matchesKeyword && matchesCompanionFilters(post, companionFilters);
    });

    return [...filtered].sort((a, b) => {
      const dateOrder =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return companionSortOrder === "oldest" ? dateOrder : -dateOrder;
    });
  }, [companionPosts, companionKeyword, companionFilters, companionSortOrder]);

  const hasCompanionFilters = useMemo(
    () =>
      (Object.keys(emptyCompanionFilters) as (keyof CompanionFilters)[]).some(
        (key) => companionFilters[key] !== emptyCompanionFilters[key],
      ),
    [companionFilters],
  );

  const handleFabPress = () => {
    router.push({
      pathname: "/community-write",
      params: { type: activeTab === "자유 게시판" ? "free" : "companion" },
    } as never);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {!openedFromTab ? (
          <AppBackButton fallbackHref="/home" style={styles.headerBackButton} />
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tradeTypeBox}>
          {communityTabs.map((tab) => {
            const active = activeTab === tab;

            return (
              <Pressable
                key={tab}
                style={[
                  styles.tradeTypeButton,
                  active && styles.tradeTypeActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    fonts.sub3_sb_16,
                    { color: Colors.gray[6] },
                    active && { color: Colors.common.black },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "자유 게시판" ? (
          <View>
            <View style={styles.boardSearchRow}>
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="키워드로 검색해보세요"
                  placeholderTextColor="#8B95A1"
                  value={boardKeyword}
                  onChangeText={setBoardKeyword}
                />
                <Ionicons name="search" size={23} color="#17191D" />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`정렬 기준: ${boardSortOptions.find((option) => option.value === boardSortOrder)?.label}`}
                onPress={() => setBoardSortSheetVisible(true)}
                style={styles.boardSortButton}
              >
                <Ionicons name="swap-vertical" size={22} color="#17191D" />
              </Pressable>
            </View>

            <BoardStatusFilters
              selectedStatus={selectedBoardStatus}
              onSelect={setSelectedBoardStatus}
            />

            <FreePostList
              data={filteredBoardPosts}
              boardKeyword={boardKeyword}
              boardLoadError={boardLoadError}
              onRetry={() => loadFreePosts(undefined, false, boardKeyword)}
            />

            {boardHasNext && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={handleLoadMoreBoard}
                disabled={loadingMoreBoard}
              >
                {loadingMoreBoard ? (
                  <ActivityIndicator color={BLUE} />
                ) : (
                  <Text style={styles.loadMoreText}>더보기</Text>
                )}
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.boardSearchRow}>
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="키워드로 검색해보세요"
                  placeholderTextColor="#8B95A1"
                  value={companionKeyword}
                  onChangeText={setCompanionKeyword}
                />
                <Ionicons name="search" size={23} color="#17191D" />
              </View>
              <View style={styles.filterButtonWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="동행 모집 필터"
                  onPress={() => setCompanionFilterSheetVisible(true)}
                  style={[
                    styles.boardSortButton,
                    hasCompanionFilters && {
                      borderColor: Colors.primary.default,
                    },
                  ]}
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={
                      hasCompanionFilters ? Colors.primary.default : "#17191D"
                    }
                  />
                </Pressable>
                {hasCompanionFilters && (
                  <FilterResetButton
                    onPress={() => setCompanionFilters(emptyCompanionFilters)}
                  />
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`정렬 기준: ${companionSortOptions.find((option) => option.value === companionSortOrder)?.label}`}
                onPress={() => setCompanionSortSheetVisible(true)}
                style={styles.boardSortButton}
              >
                <Ionicons name="swap-vertical" size={22} color="#17191D" />
              </Pressable>
            </View>

            <View style={[styles.companionList, isWide && styles.gridList]}>
              {filteredCompanions.length === 0 && (
                <View style={styles.companionEmpty}>
                  <Ionicons
                    name={
                      hasCompanionFilters ? "search-outline" : "people-outline"
                    }
                    size={40}
                    color={Colors.gray[5]}
                  />
                  <Text style={styles.companionEmptyTitle}>
                    {hasCompanionFilters
                      ? "조건에 맞는 동행이 없어요"
                      : "아직 모집 중인 동행이 없어요"}
                  </Text>
                  <Text style={styles.companionEmptyDesc}>
                    {hasCompanionFilters
                      ? "필터를 바꾸거나 초기화해 보세요"
                      : "첫 번째 동행 모집 글을 올려 보세요!"}
                  </Text>
                </View>
              )}
              {filteredCompanions.map((post) => (
                <CompanionPostCard
                  key={post.id}
                  post={post}
                  style={isWide && styles.gridCard}
                  onPress={() => router.push({ pathname: "/community-detail", params: { type: "companion", id: String(post.id) } } as never)}
                />
              ))}
            </View>

            {companionHasNext && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={handleLoadMoreCompanion}
                disabled={loadingMoreCompanion}
              >
                {loadingMoreCompanion ? (
                  <ActivityIndicator color={BLUE} />
                ) : (
                  <Text style={styles.loadMoreText}>더보기</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          activeTab === "자유 게시판" ? "자유 게시판 글쓰기" : "동행 모집"
        }
        style={styles.fab}
        onPress={handleFabPress}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      <BottomSheetModal
        visible={boardSortSheetVisible}
        onRequestClose={() => setBoardSortSheetVisible(false)}
      >
        <View style={styles.boardSortOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="정렬 선택 닫기"
            onPress={() => setBoardSortSheetVisible(false)}
          />
          <BottomSheetView style={styles.boardSortSheet}>
            <View style={styles.boardSortOptions}>
              <View style={styles.boardSortHandle} />
              {boardSortOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: boardSortOrder === option.value,
                  }}
                  onPress={() => {
                    setBoardSortOrder(option.value);
                    setBoardSortSheetVisible(false);
                  }}
                  style={styles.boardSortOption}
                >
                  <Text style={styles.boardSortOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: insets.bottom }} />
          </BottomSheetView>
        </View>
      </BottomSheetModal>
      <BottomSheetModal
        visible={companionSortSheetVisible}
        onRequestClose={() => setCompanionSortSheetVisible(false)}
      >
        <View style={styles.boardSortOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="정렬 선택 닫기"
            onPress={() => setCompanionSortSheetVisible(false)}
          />
          <BottomSheetView style={styles.boardSortSheet}>
            <View style={styles.boardSortOptions}>
              <View style={styles.boardSortHandle} />
              {companionSortOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: companionSortOrder === option.value,
                  }}
                  onPress={() => {
                    setCompanionSortOrder(option.value);
                    setCompanionSortSheetVisible(false);
                  }}
                  style={styles.boardSortOption}
                >
                  <Text style={styles.boardSortOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: insets.bottom }} />
          </BottomSheetView>
        </View>
      </BottomSheetModal>
      <CompanionFilterSheet
        visible={companionFilterSheetVisible}
        value={companionFilters}
        onClose={() => setCompanionFilterSheetVisible(false)}
        onApply={(filters) => {
          setCompanionFilters(filters);
          setCompanionFilterSheetVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 23,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  headerBackButton: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  iconBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 23,
    paddingBottom: 20,
  },
  contentWide: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  tradeTypeBox: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginHorizontal: -7,
    marginBottom: 8,
  },
  tradeTypeButton: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tradeTypeActive: {
    borderBottomColor: "#252B35",
  },
  searchBox: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#E2E5E9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  searchInput: {
    ...fonts.body3_r_16,
    color: "#191F28",
    paddingVertical: 0,
  },
  boardSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  boardStatusFilterRow: {
    gap: 8,
    paddingRight: 4,
    paddingBottom: 14,
  },
  boardStatusFilter: {
    height: 38,
    borderRadius: 20,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  boardStatusFilterSelected: {
    backgroundColor: "#191F28",
  },
  boardStatusFilterText: {
    color: "#6B7684",
  },
  boardStatusFilterTextSelected: {
    color: "#FFFFFF",
  },
  boardSortButton: {
    width: 52,
    height: 52,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#E2E5E9",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonWrap: { position: "relative" },
  boardSortOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  boardSortSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  boardSortOptions: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 20,
  },
  boardSortHandle: {
    position: "absolute",
    top: 9,
    alignSelf: "center",
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D2D6DC",
  },
  boardSortOption: {
    minHeight: 52,
    justifyContent: "center",
  },
  boardSortOptionText: {
    ...fonts.body1_m_16,
    color: Colors.gray[10],
  },
  dropdownWrap: {
    position: "relative",
    zIndex: 20,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  dropdownWrapCompact: {
    marginBottom: 0,
    flexShrink: 0,
  },
  dropdownButton: {
    minWidth: 128,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
  },
  dropdownButtonCompact: {
    minWidth: 98,
    maxWidth: 150,
    height: 40,
    borderRadius: 12,
    borderColor: "#E6EAF2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#333333",
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 0,
    minWidth: 132,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7EAF0",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    zIndex: 50,
  },
  dropdownItem: {
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: "#F0F3F7",
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
  },
  dropdownItemTextActive: {
    fontWeight: "900",
    color: "#111111",
  },
  loadMoreButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE4F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    backgroundColor: "#FFFFFF",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "900",
    color: BLUE,
  },
  gridList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  gridCard: {
    width: "48.7%",
  },
  compactFilterBar: {
    position: "relative",
    zIndex: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  companionFilterPanel: {
    position: "relative",
    zIndex: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8ECF3",
    backgroundColor: "#F8FAFD",
    padding: 13,
    marginBottom: 18,
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  filterTopRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 11,
  },
  filterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterPanelTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111111",
  },
  clearDateButton: {
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  clearDateText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666666",
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  dateRangeButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  dateRangeButtonActive: {
    borderColor: "#C9D4FF",
    backgroundColor: "#F4F7FF",
  },
  dateRangeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateRangeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8A8A8A",
  },
  dateRangeLabelActive: {
    color: BLUE,
  },
  dateRangeValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#A0A0A0",
  },
  dateRangeValueActive: {
    color: "#111111",
  },
  dateRangeDivider: {
    width: 10,
    height: 1,
    borderRadius: 1,
    backgroundColor: "#B9C0CC",
  },
  applyFilterButton: {
    height: 43,
    borderRadius: 13,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  applyFilterText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111111",
  },
  nowHeader: {
    marginTop: 0,
    marginBottom: 12,
  },
  companionList: {
    gap: 20,
  },
  companionEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 72,
    gap: 8,
  },
  companionEmptyTitle: {
    ...fonts.body1_m_16,
    color: Colors.gray[9],
    marginTop: 8,
  },
  companionEmptyDesc: {
    ...fonts.caption5_r_13,
    color: Colors.gray[6],
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 17, 0.32)",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingBottom: 28,
    overflow: "hidden",
  },
  pickerHeader: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },
  pickerCancel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#777777",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },
  pickerDone: {
    fontSize: 15,
    fontWeight: "900",
    color: BLUE,
  },
  iosPicker: {
    height: 210,
    backgroundColor: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#252B35",
    alignItems: "center",
    justifyContent: "center",
  },
});
