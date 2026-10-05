import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MarketItemList } from "@/components/market/MarketItemList";
import { Text } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { createOrGetChatRoom } from "../../src/api/chat";
import {
  completeUsedItem,
  deleteUsedItem,
  getScrappedUsedItems,
  getUsedItemDetail,
  reopenUsedItem,
  TradeCategory,
  toggleUsedItemScrap,
  UsedItemResponse,
} from "../../src/api/usedItems";
import {
  deleteLocalMarketPost,
  getLocalMarketPost,
  LocalMarketPost,
} from "../../src/storage/marketPosts";
import { getMemberMe } from "../../src/api/auth";
import { createReport, ReportReason } from "../../src/api/reports";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import {
  getUsedItemStatus,
  saveUsedItemStatus,
  UsedItemTradeStatus,
} from "../../src/storage/usedItemStatus";
import { commonStyles, fonts, Colors } from "@/constants/theme";

const BLUE = "#123F9F";
const CHAT_BAR_CLEARANCE = 120;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LIKED_MARKET_POSTS_STORAGE_KEY = "univ:profile:liked-market-posts";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const REPORT_OPTIONS: { label: string; reason: ReportReason }[] = [
  { label: "사기 의심", reason: "FRAUD" },
  { label: "부적절한 내용", reason: "INAPPROPRIATE" },
  { label: "욕설/비방", reason: "ABUSE" },
  { label: "스팸/광고", reason: "SPAM" },
  { label: "기타", reason: "ETC" },
];
const categoryNameMap: Record<TradeCategory, string> = {
  KITCHEN: "주방 용품",
  BATH: "욕실 / 청소 용품",
  LIFE: "생활 용품",
  BEDDING: "침구류",
  ELECTRONICS: "전자기기",
  ETC: "기타",
};

type MarketDetailPost = Omit<LocalMarketPost, "id"> & {
  id: string | number;
  source: "api" | "local";
  targetMemberId?: number;
  status?: UsedItemTradeStatus;
  scrapCount?: number;
};

type LikedMarketPost = {
  id: number;
  title: string;
  region: string;
  semester: string;
  price: string;
  time: string;
  imageUrl: string;
};

const parseDate = (value: string) => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatReturnDate = (value: string) => {
  const date = parseDate(value);

  if (!date) return "미정";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = WEEKDAYS[date.getDay()];

  return `${year}. ${month}. ${day} (${weekday})`;
};

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return "";
  }

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return value.slice(0, 10).replaceAll("-", ".");
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 60000),
  );

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return value.slice(0, 10).replaceAll("-", ".");
};

const formatNumberPrice = (price: number) => {
  if (!price) return "가격 미정";
  return `${price.toLocaleString()}원`;
};

const formatPrice = (post: MarketDetailPost) => {
  if (post.priceText) return post.priceText;

  return formatNumberPrice(post.price);
};

const getCategoryName = (category: TradeCategory | string) =>
  categoryNameMap[category as TradeCategory] ?? category;

const normalizeUsedItemStatus = (
  status: UsedItemResponse["status"],
): UsedItemTradeStatus | undefined => {
  if (status === "SOLD" || status === "COMPLETED") return "COMPLETED";
  if (status === "SELLING" || status === "RESERVED" || status === "AVAILABLE") {
    return "AVAILABLE";
  }
  return undefined;
};

const mergeLocalMarketPost = (
  apiPost: MarketDetailPost,
  localPost: LocalMarketPost,
): MarketDetailPost => {
  const localGroupByCategory = localPost.itemGroups.reduce<
    Record<string, LocalMarketPost["itemGroups"][number]>
  >((acc, group) => {
    acc[group.category] = group;
    return acc;
  }, {});
  const mergedCategoryNames = Array.from(
    new Set([
      ...apiPost.itemGroups.map((group) => group.category),
      ...localPost.itemGroups.map((group) => group.category),
    ]),
  );

  return {
    ...apiPost,
    country: apiPost.country || localPost.country,
    sellerCountry:
      apiPost.sellerCountry ||
      localPost.sellerCountry ||
      localPost.authorDispatchedCountry,
    authorDomesticUniversity:
      apiPost.authorDomesticUniversity ||
      apiPost.authorHomeUniversity ||
      localPost.authorDomesticUniversity ||
      localPost.authorHomeUniversity,
    authorHomeUniversity:
      apiPost.authorHomeUniversity || localPost.authorHomeUniversity,
    authorDispatchedUniversity:
      apiPost.authorDispatchedUniversity ||
      localPost.authorDispatchedUniversity,
    authorDispatchedCountry:
      apiPost.authorDispatchedCountry || localPost.authorDispatchedCountry,
    authorDispatchedRegion:
      apiPost.authorDispatchedRegion || localPost.authorDispatchedRegion,
    authorDispatchSemester:
      apiPost.authorDispatchSemester || localPost.authorDispatchSemester,
    authorVerified: apiPost.authorVerified ?? localPost.authorVerified,
    returnDate: apiPost.returnDate || localPost.returnDate,
    photos:
      localPost.photos.length > 0
        ? Array.from(new Set([...localPost.photos, ...apiPost.photos]))
        : apiPost.photos,
    itemGroups: mergedCategoryNames.map((category) => {
      const apiGroup = apiPost.itemGroups.find(
        (group) => group.category === category,
      );
      const localGroup = localGroupByCategory[category];

      if (!apiGroup) {
        return localGroup;
      }

      return {
        ...apiGroup,
        photos:
          apiGroup.photos && apiGroup.photos.length > 0
            ? apiGroup.photos
            : localGroup?.photos,
        description: apiGroup.description || localGroup?.description || "",
        items:
          apiGroup.items.length > 0
            ? apiGroup.items.map((item, index) => ({
                ...item,
                photos: localGroup?.items.find(
                  (localItem) => localItem.name === item.name,
                )?.photos,
                description:
                  item.description ||
                  localGroup?.items[index]?.description ||
                  undefined,
              }))
            : (localGroup?.items ?? []),
      };
    }),
  };
};

const mapApiPost = (item: UsedItemResponse): MarketDetailPost => {
  const categoryImages = item.categoryImages ?? [];
  const categoryImageByName = categoryImages.reduce<Record<string, string[]>>(
    (acc, image) => {
      const category = getCategoryName(image.category);
      acc[category] = [...(acc[category] ?? []), image.imageUrl];
      return acc;
    },
    {},
  );
  const itemsByCategory = (item.items ?? []).reduce<
    Record<string, { name: string; quantity: number; description?: string }[]>
  >((acc, tradeItem) => {
    const category = getCategoryName(tradeItem.category);
    acc[category] = [
      ...(acc[category] ?? []),
      {
        name: tradeItem.name,
        quantity: tradeItem.quantity,
        description: tradeItem.description,
      },
    ];
    return acc;
  }, {});
  const allCategories = Array.from(
    new Set([
      ...Object.keys(itemsByCategory),
      ...Object.keys(categoryImageByName),
    ]),
  );
  const photos = Array.from(new Set([item.thumbnailImageUrl].filter(Boolean)));

  return {
    id: item.id,
    source: "api",
    title: item.title,
    content: item.content,
    price: item.price,
    priceText: formatNumberPrice(item.price),
    country: item.country || "",
    sellerCountry: item.authorDispatchedCountry || "",
    region: item.region,
    semester: item.semester,
    returnDate: item.returnDate ?? "",
    photos,
    itemGroups: allCategories.map((category) => ({
      category,
      items: itemsByCategory[category] ?? [],
      photos: categoryImageByName[category] ?? [],
      description: "",
    })),
    authorName: item.authorNickname || item.authorName,
    authorDomesticUniversity:
      item.authorDomesticUniversity || item.authorHomeUniversity || "",
    authorHomeUniversity: item.authorHomeUniversity || "",
    authorDispatchedUniversity: item.authorDispatchedUniversity || "",
    authorDispatchedCountry: item.authorDispatchedCountry || "",
    authorDispatchedRegion: item.authorDispatchedRegion || "",
    authorDispatchSemester:
      [item.authorDispatchYear, item.authorDispatchSemester]
        .filter(Boolean)
        .join(" ") || "",
    authorVerified: item.authorVerified ?? true,
    createdAt: item.createdAt,
    targetMemberId: item.memberId,
    status: normalizeUsedItemStatus(item.status),
    scrapCount: item.scrapCount,
  };
};

const mapLocalPost = (post: LocalMarketPost): MarketDetailPost => ({
  ...post,
  source: "local",
});

const readLikedMarketPosts = async () => {
  const rawPosts = await AsyncStorage.getItem(LIKED_MARKET_POSTS_STORAGE_KEY);

  if (!rawPosts) return [];

  try {
    const parsedPosts = JSON.parse(rawPosts);

    return Array.isArray(parsedPosts) ? (parsedPosts as LikedMarketPost[]) : [];
  } catch {
    await AsyncStorage.removeItem(LIKED_MARKET_POSTS_STORAGE_KEY);
    return [];
  }
};

const isSavedMarketPost = async (id: number) => {
  try {
    const response = await getScrappedUsedItems({ size: 100 });

    return response.data.data.items.some((item) => item.id === id);
  } catch (error: any) {
    console.log(
      "스크랩한 중고거래 조회 실패:",
      error.response?.data || error.message,
    );
    const likedPosts = await readLikedMarketPosts();

    return likedPosts.some((item) => item.id === id);
  }
};

const syncLikedMarketPost = async (
  post: MarketDetailPost,
  nextLiked: boolean,
) => {
  if (typeof post.id !== "number") return;

  const likedPosts = await readLikedMarketPosts();
  const withoutCurrentPost = likedPosts.filter((item) => item.id !== post.id);

  if (!nextLiked) {
    await AsyncStorage.setItem(
      LIKED_MARKET_POSTS_STORAGE_KEY,
      JSON.stringify(withoutCurrentPost),
    );
    return;
  }

  await AsyncStorage.setItem(
    LIKED_MARKET_POSTS_STORAGE_KEY,
    JSON.stringify([
      {
        id: post.id,
        title: post.title,
        region: post.region,
        semester: post.semester,
        price: formatPrice(post),
        time: formatRelativeTime(post.createdAt),
        imageUrl: post.photos[0] ?? "",
      },
      ...withoutCurrentPost,
    ]),
  );
};

export default function MarketDetailPage() {
  const {
    id,
    fromProfileList,
    fromEditComplete,
    fromChatRoom,
    chatRoomId,
    chatTitle,
    chatPrice,
    chatThumbnail,
    chatSellerName,
    chatReferenceType,
    chatReferenceId,
  } = useLocalSearchParams<{
    id?: string;
    fromProfileList?: string;
    fromEditComplete?: string;
    fromChatRoom?: string;
    chatRoomId?: string;
    chatTitle?: string;
    chatPrice?: string;
    chatThumbnail?: string;
    chatSellerName?: string;
    chatReferenceType?: string;
    chatReferenceId?: string;
  }>();
  const [tab, setTab] = useState<"trade" | "items" | "seller">("items");
  const [liked, setLiked] = useState(false);
  const [post, setPost] = useState<MarketDetailPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadPost = async () => {
        setLoading(true);

        if (!id) {
          setPost(null);
          setLoading(false);
          return;
        }

        const numericId = Number(id);
        let nextPost: MarketDetailPost | null = null;

        if (Number.isFinite(numericId)) {
          try {
            const response = await getUsedItemDetail(numericId);
            nextPost = mapApiPost(response.data.data);

            const localPost = await getLocalMarketPost(String(numericId));
            if (localPost) {
              nextPost = mergeLocalMarketPost(nextPost, localPost);
            }
          } catch (error: any) {
            console.log(
              "중고거래 상세 조회 실패:",
              error.response?.data || error.message,
            );
          }
        }

        if (!nextPost) {
          const localPost = await getLocalMarketPost(id);
          nextPost = localPost ? mapLocalPost(localPost) : null;
        }

        const savedLiked =
          nextPost && typeof nextPost.id === "number"
            ? await isSavedMarketPost(nextPost.id)
            : false;
        const storedStatus =
          nextPost && typeof nextPost.id === "number"
            ? await getUsedItemStatus(nextPost.id)
            : undefined;
        let nextCurrentMemberId: number | null = null;

        try {
          const memberResponse = await getMemberMe();
          nextCurrentMemberId = memberResponse.data.data.id;
        } catch (error: any) {
          console.log(
            "내 정보 조회 실패:",
            error.response?.data || error.message,
          );
        }

        if (active) {
          setPost(
            nextPost
              ? {
                  ...nextPost,
                  status: nextPost.status ?? storedStatus ?? "AVAILABLE",
                }
              : null,
          );
          setLiked(savedLiked);
          setCurrentMemberId(nextCurrentMemberId);
          setLoading(false);
        }
      };

      loadPost();

      return () => {
        active = false;
      };
    }, [id]),
  );

  const tags = useMemo(() => {
    if (!post) return [];

    return [post.country || "국가 미정", post.region || "장소 미정"].filter(
      Boolean,
    );
  }, [post]);

  const handleChangeTab = (nextTab: "trade" | "items" | "seller") => {
    const currentY = currentScrollY.current;

    setTab(nextTab);

    requestAnimationFrame(() => {
      const nextY = nextTab === "seller" ? Math.min(currentY, 430) : currentY;

      scrollRef.current?.scrollTo({
        y: nextY,
        animated: false,
      });
    });
  };

  const handleStartChat = async () => {
    if (!post || chatLoading) return;

    if (post.source !== "api" || typeof post.id !== "number") {
      Alert.alert(
        "채팅을 시작할 수 없어요",
        "서버에 등록된 거래글만 채팅을 시작할 수 있어요.",
      );
      return;
    }

    if (!post.targetMemberId) {
      Alert.alert(
        "판매자 정보를 확인할 수 없어요",
        "백엔드 상세 응답에 판매자 ID가 없어 채팅방을 만들 수 없습니다.",
      );
      return;
    }

    try {
      setChatLoading(true);
      const response = await createOrGetChatRoom({
        referenceType: "TRADE",
        referenceId: post.id,
        targetMemberId: post.targetMemberId,
      });
      const roomId = response.data.roomId;

      if (!roomId) {
        throw new Error("채팅방 ID가 응답에 없습니다.");
      }

      router.push({
        pathname: "/chat/[roomId]",
        params: {
          roomId: String(roomId),
          title: post.title,
          price: formatPrice(post),
          thumbnail: post.photos[0] ?? "",
          sellerName: post.authorName,
          referenceType: "TRADE",
          referenceId: String(post.id),
          opponentMemberId: String(post.targetMemberId),
        },
      } as any);
    } catch (error: any) {
      console.log("채팅방 생성 실패:", error.response?.data || error.message);
      Alert.alert(
        "채팅방 생성 실패",
        error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!post) return;

    const wasSaved = liked;

    setLiked((prev) => {
      const next = !prev;

      syncLikedMarketPost(post, next).catch((error) => {
        console.log("좋아요한 중고거래 상세 저장 실패:", error);
      });

      return next;
    });

    if (typeof post.id !== "number") {
      return;
    }

    try {
      const response = await toggleUsedItemScrap(post.id);
      const nextSaved = response.data.data;

      setLiked(nextSaved);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              scrapCount: Math.max(
                0,
                (prev.scrapCount ?? 0) +
                  (nextSaved === wasSaved ? 0 : nextSaved ? 1 : -1),
              ),
            }
          : prev,
      );
    } catch (error: any) {
      console.log(
        "중고거래 스크랩 실패:",
        error.response?.data || error.message,
      );
      setLiked(wasSaved);
      Alert.alert("저장 실패", "게시글 저장 상태를 변경하지 못했어요.");
    }
  };

  const handleChangeTradeStatus = async (nextStatus: UsedItemTradeStatus) => {
    if (!post || typeof post.id !== "number") return;

    try {
      if (nextStatus === "COMPLETED") {
        await completeUsedItem(post.id);
      } else {
        await reopenUsedItem(post.id);
      }

      await saveUsedItemStatus(post.id, nextStatus);
      setPost((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      Alert.alert(
        "상태 변경 완료",
        nextStatus === "COMPLETED"
          ? "거래완료로 변경했어요."
          : "판매중으로 다시 변경했어요.",
      );
    } catch (error: any) {
      console.log(
        "중고거래 상태 변경 실패:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "상태 변경 실패",
        error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
      );
    }
  };

  const submitReportPost = async (reason: ReportReason) => {
    if (!post || typeof post.id !== "number" || reporting) return;

    try {
      setReporting(true);
      await createReport({
        targetType: "USED_ITEM",
        targetId: post.id,
        reason,
        detail: `중고거래 게시글 #${post.id} 신고`,
      });
      Alert.alert("신고 접수", "운영팀이 게시글을 확인할게요.");
    } catch (error: any) {
      console.log("중고거래 신고 실패:", error.response?.data || error.message);
      Alert.alert(
        "신고 실패",
        error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setReporting(false);
    }
  };

  const handleReportPost = () => {
    if (!post || typeof post.id !== "number") {
      Alert.alert(
        "신고할 수 없어요",
        "서버에 등록된 게시글만 신고할 수 있어요.",
      );
      return;
    }

    Alert.alert("신고하기", "신고 사유를 선택해주세요.", [
      ...REPORT_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => submitReportPost(option.reason),
      })),
      { text: "취소", style: "cancel" as const },
    ]);
  };

  const handleEditPost = () => {
    if (!post) return;

    const selectedItems = post.itemGroups.map((group) => ({
      category: group.category,
      items: group.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        description: item.description,
      })),
    }));
    const categoryDetails = post.itemGroups.reduce<
      Record<
        string,
        {
          photos: string[];
          description: string;
        }
      >
    >((acc, group) => {
      acc[group.category] = {
        photos: group.photos ?? [],
        description: group.description ?? "",
      };
      return acc;
    }, {});

    router.push({
      pathname: "/market/preview",
      params: {
        editId: String(post.id),
        title: post.title,
        content: post.content,
        price: String(post.price),
        country: post.country,
        region: post.region,
        returnDate: post.returnDate,
        semester: post.semester,
        photos: JSON.stringify(post.photos),
        selectedItems: JSON.stringify(selectedItems),
        draftCategoryDetails: JSON.stringify(categoryDetails),
      },
    } as any);
  };

  const handleDeletePost = () => {
    if (!post) return;

    Alert.alert("판매글 삭제", "이 게시글을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            if (post.source === "api" && typeof post.id === "number") {
              await deleteUsedItem(post.id);
            }

            await deleteLocalMarketPost(String(post.id));

            Alert.alert("삭제 완료", "판매글이 삭제되었어요.");
            router.replace("/market" as any);
          } catch (error: any) {
            console.log(
              "중고거래 삭제 실패:",
              error.response?.data || error.message,
            );
            Alert.alert(
              "삭제 실패",
              error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBack
          fromProfileList={fromProfileList}
          fromEditComplete={fromEditComplete}
          fromChatRoom={fromChatRoom}
          chatRoomId={chatRoomId}
          chatTitle={chatTitle}
          chatPrice={chatPrice}
          chatThumbnail={chatThumbnail}
          chatSellerName={chatSellerName}
          chatReferenceType={chatReferenceType}
          chatReferenceId={chatReferenceId}
        />

        <View style={styles.centerState}>
          <Text style={styles.centerText}>게시글을 불러오는 중이에요</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <HeaderBack
          fromProfileList={fromProfileList}
          fromEditComplete={fromEditComplete}
          fromChatRoom={fromChatRoom}
          chatRoomId={chatRoomId}
          chatTitle={chatTitle}
          chatPrice={chatPrice}
          chatThumbnail={chatThumbnail}
          chatSellerName={chatSellerName}
          chatReferenceType={chatReferenceType}
          chatReferenceId={chatReferenceId}
        />

        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>게시글을 찾을 수 없어요</Text>
          <Pressable
            style={styles.centerButton}
            onPress={() => router.replace("/market" as any)}
          >
            <Text style={styles.centerButtonText}>목록으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const canManagePost =
    post.source === "local" ||
    (currentMemberId !== null && post.targetMemberId === currentMemberId);

  return (
    <View style={styles.container}>
      <HeaderBack
        fromProfileList={fromProfileList}
        fromEditComplete={fromEditComplete}
        canManagePost={canManagePost}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onChangeStatus={handleChangeTradeStatus}
        tradeStatus={post.status ?? "AVAILABLE"}
        onReport={handleReportPost}
        reporting={reporting}
        fromChatRoom={fromChatRoom}
        chatRoomId={chatRoomId}
        chatTitle={chatTitle}
        chatPrice={chatPrice}
        chatThumbnail={chatThumbnail}
        chatSellerName={chatSellerName}
        chatReferenceType={chatReferenceType}
        chatReferenceId={chatReferenceId}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          currentScrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <ImageCarousel
          key={post.id}
          photos={post.photos}
          onOpenPhoto={setExpandedPhoto}
        />

        <View style={[styles.body, { paddingBottom: CHAT_BAR_CLEARANCE }]}>
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>

          <View style={styles.titleRow}>
            <Text style={fonts.title3_b_24} numberOfLines={3}>
              {post.title}
            </Text>
            {post.status === "COMPLETED" ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>거래완료</Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              fonts.body4_r_14,
              { color: Colors.gray[7], marginTop: 10, marginBottom: 16 },
            ]}
          >
            {post.content}
          </Text>

          <Text style={fonts.title3_b_24}>{formatPrice(post)}</Text>

          <View style={styles.tabRow}>
            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab("items")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "items" && styles.activeTabText,
                ]}
              >
                물품 목록
              </Text>
              {tab === "items" && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab("trade")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "trade" && styles.activeTabText,
                ]}
              >
                거래 정보
              </Text>
              {tab === "trade" && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab("seller")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "seller" && styles.activeTabText,
                ]}
              >
                판매자 정보
              </Text>
              {tab === "seller" && <View style={styles.activeLine} />}
            </Pressable>
          </View>

          {tab === "trade" && <TradeInfo post={post} />}
          {tab === "items" && (
            <MarketItemList key={post.id} groups={post.itemGroups} />
          )}
          {tab === "seller" && <SellerInfo post={post} />}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingTop: 16,
            paddingBottom: 32,
          },
        ]}
      >
        <Pressable style={styles.bottomHeartButton} onPress={handleToggleLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={28}
            color={liked ? "#E5484D" : Colors.common.black}
          />
        </Pressable>

        <Pressable style={commonStyles.button} onPress={handleStartChat}>
          <Text style={[fonts.sub3_sb_16, { color: "#FFFFFF" }]}>
            {chatLoading ? "채팅방 여는 중..." : "채팅 시작하기"}
          </Text>
        </Pressable>
      </View>

      <FullImageModal
        photo={expandedPhoto}
        onClose={() => setExpandedPhoto(null)}
      />
    </View>
  );
}

function HeaderBack({
  fromProfileList,
  fromEditComplete,
  canManagePost = false,
  onEdit,
  onDelete,
  onChangeStatus,
  tradeStatus = "AVAILABLE",
  onReport,
  reporting = false,
  fromChatRoom,
  chatRoomId,
  chatTitle,
  chatPrice,
  chatThumbnail,
  chatSellerName,
  chatReferenceType,
  chatReferenceId,
}: {
  fromProfileList?: string;
  fromEditComplete?: string;
  canManagePost?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onChangeStatus?: (nextStatus: UsedItemTradeStatus) => void;
  tradeStatus?: UsedItemTradeStatus;
  onReport?: () => void;
  reporting?: boolean;
  fromChatRoom?: string;
  chatRoomId?: string;
  chatTitle?: string;
  chatPrice?: string;
  chatThumbnail?: string;
  chatSellerName?: string;
  chatReferenceType?: string;
  chatReferenceId?: string;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const headerPaddingTop = insets.top + 8;
  const headerHeight = headerPaddingTop + 56;

  return (
    <View
      style={[
        styles.top,
        { height: headerHeight, paddingTop: headerPaddingTop },
      ]}
    >
      <AppBackButton
        onPress={() => {
          if (fromEditComplete === "true") {
            router.replace("/market" as any);
            return;
          }

          if (fromChatRoom === "true" && chatRoomId) {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace({
              pathname: "/chat/[roomId]",
              params: {
                roomId: chatRoomId,
                title: chatTitle ?? "",
                price: chatPrice ?? "",
                thumbnail: chatThumbnail ?? "",
                sellerName: chatSellerName ?? "",
                referenceType: chatReferenceType ?? "TRADE",
                referenceId: chatReferenceId ?? "",
              },
            } as any);
            return;
          }

          if (
            fromProfileList === "market" ||
            fromProfileList === "liked" ||
            fromProfileList === "saved" ||
            fromProfileList === "written"
          ) {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace({
              pathname: "/home/profile-list",
              params: { type: fromProfileList },
            } as any);
            return;
          }

          goBackOrReplace("/market");
        }}
      />

      <Pressable
        style={styles.moreButton}
        onPress={() => setMenuVisible((prev) => !prev)}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color="#111111" />
      </Pressable>

      {menuVisible && (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.postMenuPopover, { top: headerHeight - 4 }]}>
            <View style={styles.postMenuArrow} />
            {canManagePost ? (
              <>
                <Pressable
                  style={styles.postMenuRow}
                  onPress={() => {
                    setMenuVisible(false);
                    onEdit?.();
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#111111" />
                  <Text style={styles.postMenuText}>수정하기</Text>
                </Pressable>

                <Pressable
                  style={styles.postMenuRow}
                  onPress={() => {
                    setMenuVisible(false);
                    onChangeStatus?.(
                      tradeStatus === "COMPLETED" ? "AVAILABLE" : "COMPLETED",
                    );
                  }}
                >
                  <Ionicons
                    name={
                      tradeStatus === "COMPLETED"
                        ? "refresh-outline"
                        : "checkmark-circle-outline"
                    }
                    size={18}
                    color="#111111"
                  />
                  <Text style={styles.postMenuText}>
                    {tradeStatus === "COMPLETED"
                      ? "판매중으로 변경"
                      : "거래완료로 변경"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.postMenuRow}
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete?.();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#E5484D" />
                  <Text
                    style={[styles.postMenuText, styles.postMenuDangerText]}
                  >
                    삭제
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.postMenuRow}
                onPress={() => {
                  setMenuVisible(false);
                  onReport?.();
                }}
              >
                <Ionicons name="flag-outline" size={18} color="#E5484D" />
                <Text style={[styles.postMenuText, styles.postMenuDangerText]}>
                  {reporting ? "신고 접수 중..." : "신고하기"}
                </Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function ImageCarousel({
  photos,
  onOpenPhoto,
}: {
  photos: string[];
  onOpenPhoto: (photo: string) => void;
}) {
  const [width, setWidth] = useState(SCREEN_WIDTH);
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeIndex = Math.min(currentIndex, Math.max(0, photos.length - 1));
  const dotCount = Math.min(5, photos.length);
  const dotStart = Math.max(
    0,
    Math.min(activeIndex - 2, photos.length - dotCount),
  );
  const hasPreviousDots = dotStart > 0;
  const hasNextDots = dotStart + dotCount < photos.length;

  if (photos.length === 0) {
    return (
      <View style={[styles.imageArea, styles.emptyImageArea]}>
        <Text style={styles.emptyImageText}>등록된 사진 없음</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.imageArea}
      onLayout={({ nativeEvent }) => {
        const nextWidth = nativeEvent.layout.width;
        if (nextWidth > 0 && nextWidth !== width) {
          setWidth(nextWidth);
          setCurrentIndex(0);
        }
      }}
    >
      <ScrollView
        key={width}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          setCurrentIndex(
            Math.max(
              0,
              Math.min(
                photos.length - 1,
                Math.round(nativeEvent.contentOffset.x / width),
              ),
            ),
          );
        }}
      >
        {photos.map((photo, index) => (
          <Pressable
            key={`${photo}-${index}`}
            style={[styles.heroImageButton, { width }]}
            onPress={() => onOpenPhoto(photo)}
          >
            <Image source={{ uri: photo }} style={styles.heroImage} />
          </Pressable>
        ))}
      </ScrollView>

      {photos.length > 1 && (
        <View
          style={styles.dots}
          pointerEvents="none"
          accessible
          accessibilityLabel={`전체 ${photos.length}장 중 ${activeIndex + 1}번째 사진`}
        >
          {Array.from({ length: dotCount }, (_, index) => {
            const photoIndex = dotStart + index;
            const isOverflowEdge =
              (index === 0 && hasPreviousDots) ||
              (index === dotCount - 1 && hasNextDots);

            return (
              <View
                key={photoIndex}
                style={[
                  styles.dot,
                  isOverflowEdge && styles.overflowEdgeDot,
                  photoIndex === activeIndex && styles.activeDot,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

function FullImageModal({
  photo,
  onClose,
}: {
  photo: string | null;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={Boolean(photo)} animationType="fade">
      <View style={styles.fullImageOverlay}>
        <Pressable style={styles.fullImageBackdrop} onPress={onClose} />

        {photo && <Image source={{ uri: photo }} style={styles.fullImage} />}

        <Pressable style={styles.fullImageCloseButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

const countryFlagImages: Record<
  string,
  import("react-native").ImageSourcePropType
> = {
  독일: require("../../assets/images/flag_germany.png"),
  프랑스: require("../../assets/images/flag_france.png"),
  스페인: require("../../assets/images/flag_spain.png"),
  영국: require("../../assets/images/flag_england.png"),
  네덜란드: require("../../assets/images/flag_Neth.png"),
  미국: require("../../assets/images/flag_USA.png"),
};

function TradeInfo({ post }: { post: MarketDetailPost }) {
  const sellerCountry = post.sellerCountry || post.authorDispatchedCountry;
  const rows = [
    {
      label: "판매자 국가",
      icon: "person-outline",
      value: sellerCountry || "미정",
      country: sellerCountry,
    },
    {
      label: "거래 국가",
      icon: "flag-outline",
      value: post.country || "미정",
      country: post.country,
    },
    {
      label: "거래 장소",
      icon: "location-outline",
      value: post.region || "미정",
    },
    {
      label: "판매자 귀국일",
      icon: "calendar-outline",
      value: formatReturnDate(post.returnDate),
    },
  ] as const;

  return (
    <View>
      <Text style={fonts.title5_b_20}>거래 정보</Text>
      <View style={styles.conditionCard}>
        {rows.map((row) => {
          const flag =
            "country" in row && row.country
              ? countryFlagImages[row.country.trim()]
              : undefined;
          return (
            <View key={row.label} style={styles.conditionRow}>
              <View style={styles.conditionLabelRow}>
                <Ionicons name={row.icon} size={18} color="#738092" />
                <Text style={[fonts.body1_m_16, { color: Colors.gray[8] }]}>
                  {row.label}
                </Text>
              </View>
              <View style={styles.conditionValueRow}>
                {flag && (
                  <Image
                    source={flag}
                    style={styles.conditionFlag}
                    accessibilityIgnoresInvertColors
                  />
                )}
                <Text style={[fonts.body1_m_16, { color: Colors.gray[11] }]}>
                  {row.value}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SellerInfo({ post }: { post: MarketDetailPost }) {
  const authorName = post.authorName || "나";
  const sellerCountry = post.sellerCountry || post.authorDispatchedCountry;
  const sellerRegion = post.authorDispatchedRegion || post.region;
  const domesticUniversity =
    post.authorDomesticUniversity ||
    post.authorHomeUniversity ||
    "소속대학 미정";
  const dispatchedUniversity = post.authorDispatchedUniversity || "파견교 미정";
  const dispatchSemester =
    post.authorDispatchSemester || post.semester || "학기 미정";
  const verified = post.authorVerified ?? true;

  const location =
    [sellerCountry, sellerRegion].filter(Boolean).join(" ") || "미정";
  const rows = [
    { label: "소속 대학", icon: "school-outline", value: domesticUniversity },
    {
      label: "파견 국가 및 지역",
      icon: "flag-outline",
      value: location,
      country: sellerCountry,
    },
    { label: "파견교", icon: "school-outline", value: dispatchedUniversity },
    { label: "파견 학기", icon: "calendar-outline", value: dispatchSemester },
  ] as const;

  return (
    <View>
      <Text style={fonts.title5_b_20}>판매자 정보</Text>
      <View style={styles.conditionCard}>
        <View style={styles.profileCard}>
          <View style={styles.profileImage} />
          <View style={{ flex: 1 }}>
            <View style={styles.profileNameRow}>
              <Text
                style={[
                  fonts.sub3_sb_16,
                  { color: Colors.common.black, flexShrink: 1 },
                ]}
              >
                {authorName}
              </Text>
              {verified && (
                <View style={styles.verifiedBadge}>
                  <Text
                    style={[
                      fonts.body2_m_14,
                      { color: Colors.primary.default },
                    ]}
                  >
                    인증 완료
                  </Text>
                </View>
              )}
            </View>
            <Text style={[fonts.body2_m_14, styles.profileMeta]}>
              {domesticUniversity} · {location}
            </Text>
          </View>
        </View>
        <View style={styles.sellerInfoList}>
          {rows.map((row) => {
            const flag =
              "country" in row && row.country
                ? countryFlagImages[row.country.trim()]
                : undefined;
            return (
              <View key={row.label} style={styles.conditionRow}>
                <View style={styles.conditionLabelRow}>
                  <Ionicons name={row.icon} size={18} color={Colors.gray[7]} />
                  <Text style={[fonts.body1_m_16, { color: Colors.gray[8] }]}>
                    {row.label}
                  </Text>
                </View>
                <View style={styles.conditionValueRow}>
                  {flag && (
                    <Image
                      source={flag}
                      style={styles.conditionFlag}
                      accessibilityIgnoresInvertColors
                    />
                  )}
                  <Text style={[fonts.body1_m_16, styles.sellerInfoValue]}>
                    {row.value}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  top: {
    backgroundColor: Colors.common.white,
    zIndex: 10,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },

  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6F8FC",
    alignItems: "center",
    justifyContent: "center",
  },

  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },

  postMenuPopover: {
    position: "absolute",
    right: 20,
    width: 150,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E7ECF3",
    shadowColor: "#0F2042",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
    zIndex: 9,
  },

  postMenuArrow: {
    position: "absolute",
    top: -7,
    right: 17,
    width: 14,
    height: 14,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#E7ECF3",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },

  postMenuRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },

  postMenuText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  postMenuDangerText: {
    color: "#E5484D",
  },

  centerState: {
    flex: 1,
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  centerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 18,
  },

  centerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#777777",
  },

  centerButton: {
    height: 44,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  centerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  imageArea: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: Colors.gray[2],
    overflow: "hidden",
  },

  emptyImageArea: {
    alignItems: "center",
    justifyContent: "center",
  },

  emptyImageText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888888",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heroImageButton: {
    height: "100%",
  },

  fullImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  fullImage: {
    width: SCREEN_WIDTH,
    height: "78%",
    resizeMode: "contain",
  },

  fullImageCloseButton: {
    position: "absolute",
    top: 54,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  dots: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray[4],
  },

  overflowEdgeDot: {
    transform: [{ scale: 0.67 }],
  },

  activeDot: {
    backgroundColor: Colors.primary.default,
  },

  body: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },

  tag: {
    backgroundColor: "#EAF3FF",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flex: 1,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    color: "#111111",
    marginRight: 10,
  },
  completedBadge: {
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#777777",
  },

  price: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "900",
    color: BLUE,
  },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginBottom: 18,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    ...fonts.sub4_sb_14,
    color: Colors.gray[6],
  },
  activeTabText: {
    color: Colors.common.black,
  },

  activeLine: {
    position: "absolute",
    bottom: -1,
    height: 2,
    width: "100%",
    borderRadius: 99,
    backgroundColor: Colors.common.black,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 7,
  },

  sectionDesc: {
    fontSize: 11,
    color: "#777777",
    marginBottom: 24,
  },

  subTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 12,
    marginTop: 8,
  },

  conditionCard: {
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 20,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#DFE3E9",
    borderRadius: 10,
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  conditionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 1,
  },
  conditionLabel: {
    fontSize: 14,
    lineHeight: 22,
    color: "#556173",
    fontWeight: "500",
  },
  conditionValueRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 9,
  },
  conditionFlag: {
    width: 25,
    height: 18,
    borderRadius: 3,
    resizeMode: "cover",
  },
  conditionValue: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#252B35",
    fontWeight: "500",
    textAlign: "right",
  },

  descriptionBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111111",
    fontWeight: "600",
  },

  nickname: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 16,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
    marginBottom: 6,
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.gray[3],
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  verifiedBadge: {
    borderRadius: 4,
    backgroundColor: "#EAF2FF",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  profileMeta: {
    marginTop: 5,
    color: Colors.gray[8],
  },
  sellerInfoList: {
    gap: 22,
  },
  sellerInfoValue: {
    flexShrink: 1,
    textAlign: "right",
    color: Colors.gray[11],
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  bottomHeartButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
});
