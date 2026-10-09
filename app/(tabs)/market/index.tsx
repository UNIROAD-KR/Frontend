import { MarketSortSheet } from "@/components/market/MarketSortSheet";
import {
  compareMarketDates,
  type MarketSortOrder,
} from "@/src/utils/marketSort";
import { MarketCountrySheet } from "@/components/market/MarketCountrySheet";
import { MarketFilterBar } from "@/components/market/MarketFilterBar";
import {
  emptyMarketFilters,
  MarketFilterSheet,
  type MarketFilters,
} from "@/components/market/MarketFilterSheet";
import { UsedMarketScreen } from "@/components/market/UsedMarketScreen";
import { TicketTransferScreen } from "@/components/market/TicketTransferScreen";
import { Text, TextInput } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getTickets,
  searchTickets,
  TicketTransferResponse,
  TicketType,
} from "../../../src/api/ticket";
import {
  getScrappedUsedItems,
  getUsedItems,
  searchUsedItems,
  UsedItem,
} from "../../../src/api/usedItems";
import { canUseMarketWithoutVerification } from "../../../src/utils/verification";
import {
  clearMarketDraft,
  getMarketDraft,
  type MarketDraft,
} from "../../../src/storage/marketDraft";
import {
  clearTicketDraft,
  getTicketDraft,
} from "../../../src/storage/ticketDraft";
import { getTicketMetadataMap } from "../../../src/storage/ticketMetadata";
import { getUsedItemStatusMap } from "../../../src/storage/usedItemStatus";
import { Colors, commonStyles, fonts } from "@/constants/theme";
const LIKED_MARKET_POSTS_STORAGE_KEY = "univ:profile:liked-market-posts";

type LikedMarketPost = {
  id: number;
  title: string;
  region: string;
  semester: string;
  price: string;
  time: string;
  imageUrl: string;
};

const formatPrice = (price: number) => {
  if (!price) return "가격 미정";
  return `${price.toLocaleString()}원`;
};

const normalizeUsedItemStatus = (
  status: UsedItem["status"],
  storedStatus?: "AVAILABLE" | "COMPLETED",
) => {
  if (status === "SOLD" || status === "COMPLETED") return "COMPLETED";
  if (status === "SELLING" || status === "RESERVED" || status === "AVAILABLE") {
    return "AVAILABLE";
  }
  return storedStatus ?? "AVAILABLE";
};

const ticketTypeLabelMap: Record<TicketType, string> = {
  TOUR: "관광 티켓",
  CONCERT: "콘서트 / 공연",
  TRAIN: "기차",
  FLIGHT: "항공권",
  ACCOMMODATION: "숙박",
};

const formatTicketPrice = (price: number, currencyUnit = "€") =>
  `${currencyUnit} ${price.toLocaleString("ko-KR")}`;

const hasActiveMarketFilters = (filters: MarketFilters) =>
  filters.categories.length > 0 ||
  filters.minPrice > 0 ||
  filters.maxPrice !== null ||
  filters.tradeMode !== "all" ||
  filters.deadline !== "";

const firstTicketDate = (value: string) => {
  const match = value.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  return match
    ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
    : "";
};

const formatTicketCreatedTime = (createdAt?: string) => {
  if (!createdAt) return "";

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return createdAt.slice(0, 10).replaceAll("-", ".");
  }

  const diffMs = Date.now() - createdDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return createdAt.slice(0, 10).replaceAll("-", ".");
};

const formatRelativeTime = formatTicketCreatedTime;

const mergeUniqueById = <T extends { id: number }>(groups: T[][]) => {
  const seenIds = new Set<number>();
  const mergedItems: T[] = [];

  groups.flat().forEach((item) => {
    if (seenIds.has(item.id)) return;

    seenIds.add(item.id);
    mergedItems.push(item);
  });

  return mergedItems;
};

export default function MarketPage() {
  const [selectedTab, setSelectedTab] = useState<"bulk" | "ticket">("bulk");
  const { tab, openItemId, openTicketId } = useLocalSearchParams<{
    tab?: string;
    fromTab?: string;
    fromHome?: string;
    openItemId?: string;
    openTicketId?: string;
  }>();
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [items, setItems] = useState<UsedItem[]>([]);
  const [tickets, setTickets] = useState<TicketTransferResponse[]>([]);
  const [marketListError, setMarketListError] = useState("");
  const [ticketListError, setTicketListError] = useState("");
  const [ticketCurrencyMap, setTicketCurrencyMap] = useState<
    Record<string, string>
  >({});
  const [usedStatusMap, setUsedStatusMap] = useState<
    Record<string, "AVAILABLE" | "COMPLETED">
  >({});
  const [ticketNextCursorId, setTicketNextCursorId] = useState<number | null>(
    null,
  );
  const [ticketHasNext, setTicketHasNext] = useState(false);
  const [ticketLoadingMore, setTicketLoadingMore] = useState(false);
  const ticketLoadingMoreRef = useRef(false);
  const [selectedType, setSelectedType] = useState<"bulk" | "ticket">("bulk");
  const [selectedCountry, setSelectedCountry] = useState("전체");
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [bulkFilters, setBulkFilters] =
    useState<MarketFilters>(emptyMarketFilters);
  const [ticketFilters, setTicketFilters] =
    useState<MarketFilters>(emptyMarketFilters);
  const [sortOrder, setSortOrder] = useState<MarketSortOrder>("newest");
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const openedEditDetailRef = useRef<string | null>(null);
  const latestMarketQueryRef = useRef({
    keyword: "",
    country: "전체",
  });
  useEffect(() => {
    if (tab === "ticket") {
      setSelectedTab("ticket");
      setSelectedType("ticket");
    } else {
      setSelectedTab("bulk");
      setSelectedType("bulk");
    }
  }, [tab]);

  useEffect(() => {
    if (openItemId) {
      const requestKey = `item:${openItemId}`;

      if (openedEditDetailRef.current === requestKey) return;

      openedEditDetailRef.current = requestKey;
      setSelectedTab("bulk");
      setSelectedType("bulk");

      const frame = requestAnimationFrame(() => {
        router.push({
          pathname: "/market/[id]",
          params: { id: openItemId },
        } as any);
      });

      return () => cancelAnimationFrame(frame);
    }

    if (openTicketId) {
      const requestKey = `ticket:${openTicketId}`;

      if (openedEditDetailRef.current === requestKey) return;

      openedEditDetailRef.current = requestKey;
      setSelectedTab("ticket");
      setSelectedType("ticket");

      const frame = requestAnimationFrame(() => {
        router.push({
          pathname: "/market/ticket-preview",
          params: { id: openTicketId },
        } as any);
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [openItemId, openTicketId]);

  useEffect(() => {
    latestMarketQueryRef.current = {
      keyword: searchKeyword,
      country: selectedCountry,
    };
  }, [searchKeyword, selectedCountry]);

  const loadStoredMarketInteractions = async () => {
    try {
      const response = await getScrappedUsedItems({ size: 100 });
      const ids = response.data.data.items.map((item) => item.id);

      setLikedIds(ids);
    } catch (error: any) {
      console.log(
        "스크랩한 중고거래 목록 조회 실패:",
        error.response?.data || error.message,
      );
      try {
        const likedMarketPosts = await AsyncStorage.getItem(
          LIKED_MARKET_POSTS_STORAGE_KEY,
        );

        if (!likedMarketPosts) return;
        const parsedPosts = JSON.parse(
          likedMarketPosts,
        ) as Partial<LikedMarketPost>[];
        const ids = parsedPosts
          .map((item) => item.id)
          .filter(
            (storedId): storedId is number => typeof storedId === "number",
          );

        setLikedIds(ids);
      } catch {
        await AsyncStorage.removeItem(LIKED_MARKET_POSTS_STORAGE_KEY);
      }
    }

    try {
      setUsedStatusMap(await getUsedItemStatusMap());
    } catch {
      setUsedStatusMap({});
    }

    try {
      const metadataMap = await getTicketMetadataMap();
      const currencyMap = Object.entries(metadataMap).reduce<
        Record<string, string>
      >((acc, [ticketId, metadata]) => {
        if (metadata.currencyUnit) {
          acc[ticketId] = metadata.currencyUnit;
        }

        return acc;
      }, {});

      setTicketCurrencyMap(currencyMap);
    } catch {
      setTicketCurrencyMap({});
    }
  };

  useEffect(() => {
    loadStoredMarketInteractions();
  }, []);

  const fetchUsedItems = useCallback(async (keyword = "", country = "전체") => {
    try {
      setMarketListError("");
      const keywordText = keyword.trim();
      const countryParam = country === "전체" ? undefined : country;

      if (keywordText.length > 0) {
        const [titleResponse, contentResponse] = await Promise.all([
          searchUsedItems({
            title: keywordText,
            country: countryParam,
            size: 30,
          }),
          searchUsedItems({
            content: keywordText,
            country: countryParam,
            size: 30,
          }),
        ]);

        setItems(
          mergeUniqueById([
            titleResponse.data.data.items ?? [],
            contentResponse.data.data.items ?? [],
          ]),
        );
        return;
      }

      const response = countryParam
        ? await searchUsedItems({ country: countryParam, size: 30 })
        : await getUsedItems({ size: 30 });

      setItems(response.data.data.items ?? []);
    } catch (error: any) {
      console.log(
        "중고거래 목록 조회 실패:",
        error.response?.data || error.message,
      );
      setMarketListError(
        "중고거래 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      setItems([]);
    }
  }, []);

  const fetchTickets = useCallback(
    async (cursorId?: number, keyword = "", country = "전체") => {
      try {
        if (!cursorId) {
          setTicketListError("");
        }
        const keywordText = keyword.trim();
        const countryParam = country === "전체" ? undefined : country;
        const shouldSearchByKeyword = keywordText.length > 0;

        if (shouldSearchByKeyword && cursorId) {
          return;
        }

        if (cursorId) {
          ticketLoadingMoreRef.current = true;
          setTicketLoadingMore(true);
        }

        const responseData = shouldSearchByKeyword
          ? {
              items: mergeUniqueById(
                await Promise.all([
                  searchTickets({
                    title: keywordText,
                    country: countryParam,
                    size: 30,
                  }).then((response) => response.data.data.items ?? []),
                  searchTickets({
                    content: keywordText,
                    country: countryParam,
                    size: 30,
                  }).then((response) => response.data.data.items ?? []),
                ]),
              ),
              nextCursorId: null,
              hasNext: false,
            }
          : (countryParam
              ? await searchTickets({
                  cursorId,
                  country: countryParam,
                  size: 10,
                })
              : await getTickets(cursorId, 10)
            ).data.data;
        const { items: nextItems = [], nextCursorId, hasNext } = responseData;

        setTickets((prev) => {
          if (!cursorId || shouldSearchByKeyword) {
            return nextItems;
          }

          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNextItems = nextItems.filter(
            (item) => !existingIds.has(item.id),
          );

          return [...prev, ...uniqueNextItems];
        });
        setTicketNextCursorId(nextCursorId ?? null);
        setTicketHasNext(hasNext);
      } catch (error: any) {
        console.log(
          "티켓 양도 목록 조회 실패:",
          error.response?.data || error.message,
        );
        if (!cursorId) {
          setTicketListError(
            "티켓 양도 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
          );
          setTickets([]);
          setTicketNextCursorId(null);
          setTicketHasNext(false);
        }
      } finally {
        if (cursorId) {
          ticketLoadingMoreRef.current = false;
          setTicketLoadingMore(false);
        }
      }
    },
    [],
  );

  const fetchNextTickets = () => {
    if (!ticketHasNext || !ticketNextCursorId || ticketLoadingMoreRef.current) {
      return;
    }

    fetchTickets(ticketNextCursorId, searchKeyword, selectedCountry);
  };

  const handleMarketScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (selectedType !== "ticket") {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom < 180) {
      fetchNextTickets();
    }
  };

  const checkVerificationStatus = async () => {
    const showVerificationAlert = () => {
      Alert.alert(
        "교환학생 인증",
        "중고거래를 이용하려면 교환학생 신원 인증이 필요해요.",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "신원 인증하기",
            onPress: () => router.push("/verification-consent" as any),
          },
        ],
      );
    };

    try {
      const canUseMarket = await canUseMarketWithoutVerification();

      console.log("현재 마켓 이용 가능 상태:", canUseMarket);

      if (canUseMarket) {
        return;
      }

      showVerificationAlert();
    } catch (error: any) {
      console.log("내 정보 조회 실패:", error.response?.data || error.message);
      showVerificationAlert();
    }
  };

  useFocusEffect(
    useCallback(() => {
      const { keyword, country } = latestMarketQueryRef.current;

      loadStoredMarketInteractions();
      fetchUsedItems(keyword, country);
      fetchTickets(undefined, keyword, country);
      checkVerificationStatus();
    }, [fetchTickets, fetchUsedItems]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedType === "ticket") {
        fetchTickets(undefined, searchKeyword, selectedCountry);
        return;
      }

      fetchUsedItems(searchKeyword, selectedCountry);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    fetchTickets,
    fetchUsedItems,
    searchKeyword,
    selectedCountry,
    selectedType,
  ]);

  const buildDraftWriteParams = (draft: MarketDraft) => ({
    editId: draft.editId,
    wizard: draft.wizard ? JSON.stringify(draft.wizard) : "",
    type: draft.write.type ?? "all",
    title: draft.write.title,
    content: draft.write.content,
    price: draft.write.price,
    country: draft.write.country ?? "",
    region: draft.write.region,
    returnDate: draft.write.returnDate,
    semester: draft.write.semester ?? "",
    photos: JSON.stringify(draft.write.photos ?? []),
  });

  const navigateToBulkDraft = (draft: MarketDraft) => {
    const writeParams = buildDraftWriteParams(draft);

    if (draft.step === "preview" && draft.preview) {
      const previewSelectedCategories =
        draft.category?.selectedCategories ??
        Object.entries(draft.preview.itemsByCategory)
          .filter(([, items]) =>
            items.some((item) => item.checked && item.name.trim().length > 0),
          )
          .map(([category]) => category);

      router.push({
        pathname: "/market/write",
        params: {
          ...writeParams,
          resumeCategory: "true",
          resumePreview: "true",
          selectedItems: draft.preview.selectedItems,
          draftSelectedCategories: JSON.stringify(previewSelectedCategories),
          draftItemsByCategory: JSON.stringify(draft.preview.itemsByCategory),
          draftCategoryDetails: JSON.stringify(draft.preview.categoryDetails),
        },
      } as any);
      return;
    }

    if (draft.step === "category" && draft.category) {
      router.push({
        pathname: "/market/write",
        params: {
          ...writeParams,
          resumeCategory: "true",
          draftSelectedCategories: JSON.stringify(
            draft.category.selectedCategories,
          ),
          draftItemsByCategory: JSON.stringify(draft.category.itemsByCategory),
          draftCategoryDetails: JSON.stringify(
            draft.preview?.categoryDetails ?? {},
          ),
        },
      } as any);
      return;
    }

    router.push({
      pathname: "/market/write",
      params: writeParams,
    } as any);
  };

  const openBulkWrite = async () => {
    const draft = await getMarketDraft();

    if (!draft) {
      router.push("/market/write?type=all" as any);
      return;
    }

    Alert.alert("임시저장 중인 글이 있어요", "이어서 작성할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "새로 쓰기",
        style: "destructive",
        onPress: async () => {
          await clearMarketDraft();
          router.push("/market/write?type=all" as any);
        },
      },
      {
        text: "이어쓰기",
        onPress: () => navigateToBulkDraft(draft),
      },
    ]);
  };

  const openTicketWrite = async () => {
    const draft = await getTicketDraft();

    if (!draft) {
      router.push("/market/ticket-write" as any);
      return;
    }

    Alert.alert("임시저장 중인 글이 있어요", "이어서 작성할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "새로 쓰기",
        style: "destructive",
        onPress: async () => {
          await clearTicketDraft();
          router.push("/market/ticket-write" as any);
        },
      },
      {
        text: "이어쓰기",
        onPress: () =>
          router.push({
            pathname: "/market/ticket-write",
            params: { resumeDraft: "true" },
          } as any),
      },
    ]);
  };

  const handleFabPress = () => {
    if (selectedType === "ticket") {
      setIsFabOpen(false);
      requireVerificationBefore("/market/ticket-write", openTicketWrite);
      return;
    }

    setIsFabOpen(false);
    requireVerificationBefore("/market/write?type=all", openBulkWrite);
  };

  const requireVerificationBefore = async (
    path: string,
    onAllowed?: () => void | Promise<void>,
  ) => {
    try {
      const canUseMarket = await canUseMarketWithoutVerification();

      if (canUseMarket) {
        if (onAllowed) {
          await onAllowed();
        } else {
          router.push(path as any);
        }
        return;
      }
    } catch (error: any) {
      console.log("내 정보 조회 실패:", error.response?.data || error.message);
    }

    Alert.alert(
      "교환학생 인증",
      "중고거래를 이용하려면 교환학생 신원 인증이 필요해요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "신원 인증하기",
          onPress: () => router.push("/verification-consent" as any),
        },
      ],
    );
  };

  const displayItems = items.map((item) => {
    const saved = likedIds.includes(item.id);
    const baseScraps = item.scrapCount ?? 0;
    const scraps = baseScraps || (saved ? 1 : 0);
    const sellerCountry = item.authorDispatchedCountry ?? "";
    const tradeCountry = item.country ?? "";
    const status = normalizeUsedItemStatus(
      item.status,
      usedStatusMap[String(item.id)],
    );

    return {
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      title: item.title,
      status,
      price: item.price,
      categories: Array.from(
        new Set([
          ...(item.category ? [item.category] : []),
          ...(item.items?.map(({ category }) => category) ?? []),
          ...(item.categoryImages?.map(({ category }) => category) ?? []),
        ]),
      ),
      returnDate: item.returnDate,
      sellerCountry,
      tradeCountry,
      region: item.region,
      semester: item.semester,
      time: formatRelativeTime(item.createdAt ?? item.updatedAt),
      priceText: formatPrice(item.price),
      scraps,
      saved,
      chats: item.chatCount ?? 0,
      imageUrl: item.thumbnailImageUrl ?? "",
      meta: [
        tradeCountry,
        item.region,
        item.semester,
        formatRelativeTime(item.createdAt ?? item.updatedAt),
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });

  const filteredItems = displayItems
    .filter((item) => {
      return (
        selectedCountry === "전체" ||
        item.tradeCountry === selectedCountry ||
        item.sellerCountry === selectedCountry ||
        item.region.includes(selectedCountry)
      );
    })
    .filter((item) => {
      const categoriesMatch =
        !bulkFilters.categories.length ||
        item.categories.some((category) =>
          bulkFilters.categories.includes(category),
        );
      const priceMatches =
        item.price >= bulkFilters.minPrice &&
        (bulkFilters.maxPrice === null || item.price <= bulkFilters.maxPrice);
      const hasInPersonTrade = Boolean(item.returnDate);
      const tradeModeMatches =
        bulkFilters.tradeMode === "all" ||
        (bulkFilters.tradeMode === "in-person" && hasInPersonTrade) ||
        (bulkFilters.tradeMode === "not-in-person" && !hasInPersonTrade);
      return categoriesMatch && priceMatches && tradeModeMatches;
    })
    .sort((a, b) => compareMarketDates(a, b, sortOrder));

  const displayTickets = tickets.map((item) => ({
    id: item.id,
    ticketType: item.ticketType,
    priceValue: item.transferPrice,
    eventDateRaw: item.eventDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    country: item.authorDispatchedCountry ?? "",
    semester: ticketTypeLabelMap[item.ticketType],
    time: formatTicketCreatedTime(item.createdAt),
    region: item.country,
    category: ticketTypeLabelMap[item.ticketType],
    title: item.title,
    date: item.eventDate
      .split("~")
      .map((date) => date.trim().replace(/-/g, ". "))
      .join(" ~ "),
    count: `${item.quantity}매`,
    price: formatTicketPrice(
      item.transferPrice,
      ticketCurrencyMap[String(item.id)] ?? "€",
    ),
    originalPrice: item.originalPrice
      ? formatTicketPrice(
          item.originalPrice,
          ticketCurrencyMap[String(item.id)] ?? "€",
        )
      : "",
    scraps: item.scrapCount ?? 0,
  }));

  const filteredTickets = displayTickets
    .filter((item) => {
      return (
        selectedCountry === "전체" || item.region.includes(selectedCountry)
      );
    })
    .filter((item) => {
      const categoriesMatch =
        !ticketFilters.categories.length ||
        ticketFilters.categories.includes(item.ticketType);
      const priceMatches =
        item.priceValue >= ticketFilters.minPrice &&
        (ticketFilters.maxPrice === null ||
          item.priceValue <= ticketFilters.maxPrice);
      const eventDate = firstTicketDate(item.eventDateRaw);
      const deadlineMatches =
        !ticketFilters.deadline ||
        (!!eventDate && eventDate <= ticketFilters.deadline);
      return categoriesMatch && priceMatches && deadlineMatches;
    })
    .sort((a, b) => compareMarketDates(a, b, sortOrder));

  const activeFilters = selectedTab === "bulk" ? bulkFilters : ticketFilters;
  const filtersAreActive = hasActiveMarketFilters(activeFilters);

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={commonStyles.container}
    >
      <View style={styles.tradeTypeWrapper}>
        <TouchableOpacity
          style={[
            styles.tradeTypeButton,
            selectedTab === "bulk" && styles.tradeTypeButtonActive,
          ]}
          onPress={() => {
            setSelectedTab("bulk");
            setSelectedType("bulk");
            setIsFabOpen(false);
          }}
        >
          <Text
            style={[
              fonts.sub3_sb_16,
              { color: Colors.gray[6] },
              selectedTab === "bulk" && { color: Colors.common.black },
            ]}
          >
            중고거래
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tradeTypeButton,
            selectedTab === "ticket" && styles.tradeTypeButtonActive,
          ]}
          onPress={() => {
            setSelectedTab("ticket");
            setSelectedType("ticket");
            setIsFabOpen(false);
          }}
        >
          <Text
            style={[
              fonts.sub3_sb_16,
              { color: Colors.gray[6] },
              selectedTab === "ticket" && { color: Colors.common.black },
            ]}
          >
            티켓양도
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleMarketScroll}
      >
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="제목, 내용 검색"
            placeholderTextColor="#777777"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
          />
        </View>

        <MarketFilterBar
          selectedCountry={selectedCountry}
          filterActive={filtersAreActive}
          onSelectCountry={() => setCountrySheetVisible(true)}
          onSelectFilter={() => setFilterSheetVisible(true)}
          onSelectSort={() => setSortSheetVisible(true)}
        />

        {selectedTab === "bulk" ? (
          <UsedMarketScreen
            items={filteredItems}
            error={marketListError}
            hasActiveFilters={hasActiveMarketFilters(bulkFilters)}
            onRetry={() => fetchUsedItems(searchKeyword, selectedCountry)}
          />
        ) : (
          <TicketTransferScreen
            hasMore={ticketHasNext}
            onLoadMore={fetchNextTickets}
            items={filteredTickets}
            error={ticketListError}
            loadingMore={ticketLoadingMore}
            hasActiveFilters={hasActiveMarketFilters(ticketFilters)}
            onRetry={() =>
              fetchTickets(undefined, searchKeyword, selectedCountry)
            }
          />
        )}
      </ScrollView>

      {isFabOpen && selectedType === "bulk" && (
        <View style={styles.fabMenu}>
          <Pressable
            style={styles.fabMenuItem}
            onPress={() =>
              requireVerificationBefore("/market/write?type=all", openBulkWrite)
            }
          >
            <Image
              source={require("../../../assets/images/used_all.png")}
              style={styles.fabMenuImage}
            />
            <Text style={styles.fabMenuText}>
              다음 교환학생에게 일괄 판매하기
            </Text>
          </Pressable>

          <Pressable
            style={styles.fabMenuItem}
            onPress={() => {
              setIsFabOpen(false);
              requireVerificationBefore(
                "/market/ticket-write",
                openTicketWrite,
              );
            }}
          >
            <Image
              source={require("../../../assets/images/used_each.png")}
              style={styles.fabMenuImage}
            />
            <Text style={styles.fabMenuText}>티켓 양도하기</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          selectedTab === "bulk" ? "중고거래 글쓰기" : "티켓 양도 글쓰기"
        }
        style={[styles.fabButton, isFabOpen && styles.fabButtonOpen]}
        onPress={handleFabPress}
      >
        <Ionicons
          name={isFabOpen ? "remove" : "add"}
          size={32}
          color="#FFFFFF"
        />
      </Pressable>
      <MarketSortSheet
        visible={sortSheetVisible}
        value={sortOrder}
        onClose={() => setSortSheetVisible(false)}
        onSelect={(value) => {
          setSortOrder(value);
          setSortSheetVisible(false);
        }}
      />
      <MarketCountrySheet
        visible={countrySheetVisible}
        selectedCountry={selectedCountry}
        onClose={() => setCountrySheetVisible(false)}
        onSelect={(country) => {
          setSelectedCountry(country);
          setCountrySheetVisible(false);
        }}
      />
      <MarketFilterSheet
        visible={filterSheetVisible}
        mode={selectedTab}
        value={activeFilters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(value) => {
          if (selectedTab === "bulk") {
            setBulkFilters(value);
          } else {
            setTicketFilters(value);
          }
          setFilterSheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tradeTypeButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tradeTypeWrapper: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  tradeTypeButtonActive: {
    borderBottomColor: "#252B35",
  },

  scroll: {
    flex: 1,
  },

  content: {
    marginTop: 8,
    paddingHorizontal: 16,
  },

  searchBox: {
    height: 47,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 24,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchIcon: {
    fontSize: 32,
    color: "#111111",
    marginRight: 12,
    marginTop: -5,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111111",
  },

  fabButton: {
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

  fabButtonOpen: {
    backgroundColor: "#303030",
  },

  fabMenu: {
    position: "absolute",
    right: 24,
    bottom: 162,
    width: 270,
    backgroundColor: "#4A4A4A",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },

  fabMenuImage: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginRight: 8,
  },

  fabMenuText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
