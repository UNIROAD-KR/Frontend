import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createOrGetChatRoom } from '../../../src/api/chat';
import {
  completeUsedItem,
  deleteUsedItem,
  getScrappedUsedItems,
  getUsedItemDetail,
  reopenUsedItem,
  TradeCategory,
  toggleUsedItemScrap,
  UsedItemResponse,
} from '../../../src/api/usedItems';
import {
  deleteLocalMarketPost,
  getLocalMarketPost,
  LocalMarketPost,
} from '../../../src/storage/marketPosts';
import { getMemberMe } from '../../../src/api/auth';
import { createReport, ReportReason } from '../../../src/api/reports';
import { AppBackButton } from '@/components/ui/app-back-button';
import {
  getUsedItemStatus,
  saveUsedItemStatus,
  UsedItemTradeStatus,
} from '../../../src/storage/usedItemStatus';

const BLUE = '#123F9F';
const DETAIL_IMAGE_HEIGHT = 290;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LIKED_MARKET_POSTS_STORAGE_KEY = 'univ:profile:liked-market-posts';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const REPORT_OPTIONS: { label: string; reason: ReportReason }[] = [
  { label: '사기 의심', reason: 'FRAUD' },
  { label: '부적절한 내용', reason: 'INAPPROPRIATE' },
  { label: '욕설/비방', reason: 'ABUSE' },
  { label: '스팸/광고', reason: 'SPAM' },
  { label: '기타', reason: 'ETC' },
];
const categoryNameMap: Record<TradeCategory, string> = {
  KITCHEN: '주방 용품',
  BATH: '욕실 / 청소 용품',
  LIFE: '생활 용품',
  BEDDING: '침구류',
  ELECTRONICS: '전자기기',
  ETC: '기타',
};

type MarketDetailPost = Omit<LocalMarketPost, 'id'> & {
  id: string | number;
  source: 'api' | 'local';
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

  if (!date) return '미정';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = WEEKDAYS[date.getDay()];

  return `${year}. ${month}. ${day} (${weekday})`;
};

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return '';
  }

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return value.slice(0, 10).replaceAll('-', '.');
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 60000),
  );

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return value.slice(0, 10).replaceAll('-', '.');
};

const formatNumberPrice = (price: number) => {
  if (!price) return '가격 미정';
  return `${price.toLocaleString()}원`;
};

const formatPrice = (post: MarketDetailPost) => {
  if (post.priceText) return post.priceText;

  return formatNumberPrice(post.price);
};

const getCategoryName = (category: TradeCategory | string) =>
  categoryNameMap[category as TradeCategory] ?? category;

const mergeLocalMarketPost = (
  apiPost: MarketDetailPost,
  localPost: LocalMarketPost,
): MarketDetailPost => {
  const localGroupByCategory = localPost.itemGroups.reduce<
    Record<string, LocalMarketPost['itemGroups'][number]>
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
      apiPost.authorDispatchedUniversity || localPost.authorDispatchedUniversity,
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
        description: apiGroup.description || localGroup?.description || '',
        items:
          apiGroup.items.length > 0
            ? apiGroup.items.map((item, index) => ({
                ...item,
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
    new Set([...Object.keys(itemsByCategory), ...Object.keys(categoryImageByName)]),
  );
  const photos = Array.from(
    new Set([item.thumbnailImageUrl].filter(Boolean)),
  );

  return {
    id: item.id,
    source: 'api',
    title: item.title,
    content: item.content,
    price: item.price,
    priceText: formatNumberPrice(item.price),
    country: item.country || '',
    sellerCountry: item.authorDispatchedCountry || '',
    region: item.region,
    semester: item.semester,
    returnDate: item.returnDate ?? '',
    photos,
    itemGroups: allCategories.map((category) => ({
      category,
      items: itemsByCategory[category] ?? [],
      photos: categoryImageByName[category] ?? [],
      description: '',
    })),
    authorName: item.authorNickname || item.authorName,
    authorDomesticUniversity:
      item.authorDomesticUniversity || item.authorHomeUniversity || '',
    authorHomeUniversity: item.authorHomeUniversity || '',
    authorDispatchedUniversity: item.authorDispatchedUniversity || '',
    authorDispatchedCountry: item.authorDispatchedCountry || '',
    authorDispatchedRegion: item.authorDispatchedRegion || '',
    authorDispatchSemester:
      [item.authorDispatchYear, item.authorDispatchSemester]
        .filter(Boolean)
        .join(' ') || '',
    authorVerified: item.authorVerified ?? true,
    createdAt: item.createdAt,
    targetMemberId: item.memberId,
    status: item.status,
    scrapCount: item.scrapCount,
  };
};

const mapLocalPost = (post: LocalMarketPost): MarketDetailPost => ({
  ...post,
  source: 'local',
});

const readLikedMarketPosts = async () => {
  const rawPosts = await AsyncStorage.getItem(LIKED_MARKET_POSTS_STORAGE_KEY);

  if (!rawPosts) return [];

  try {
    const parsedPosts = JSON.parse(rawPosts);

    return Array.isArray(parsedPosts)
      ? (parsedPosts as LikedMarketPost[])
      : [];
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
    console.log('스크랩한 중고거래 조회 실패:', error.response?.data || error.message);
    const likedPosts = await readLikedMarketPosts();

    return likedPosts.some((item) => item.id === id);
  }
};

const syncLikedMarketPost = async (
  post: MarketDetailPost,
  nextLiked: boolean,
) => {
  if (typeof post.id !== 'number') return;

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
        imageUrl: post.photos[0] ?? '',
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
  const [tab, setTab] = useState<'trade' | 'items' | 'seller'>('trade');
  const [liked, setLiked] = useState(false);
  const [post, setPost] = useState<MarketDetailPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const bottomSafePadding = 4;
  const bottomBarHeight = 56;

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
              '중고거래 상세 조회 실패:',
              error.response?.data || error.message,
            );
          }
        }

        if (!nextPost) {
          const localPost = await getLocalMarketPost(id);
          nextPost = localPost ? mapLocalPost(localPost) : null;
        }

        const savedLiked =
          nextPost && typeof nextPost.id === 'number'
            ? await isSavedMarketPost(nextPost.id)
            : false;
        const storedStatus =
          nextPost && typeof nextPost.id === 'number'
            ? await getUsedItemStatus(nextPost.id)
            : undefined;
        let nextCurrentMemberId: number | null = null;

        try {
          const memberResponse = await getMemberMe();
          nextCurrentMemberId = memberResponse.data.data.id;
        } catch (error: any) {
          console.log('내 정보 조회 실패:', error.response?.data || error.message);
        }

        if (active) {
          setPost(
            nextPost
              ? {
                  ...nextPost,
                  status: nextPost.status ?? storedStatus ?? 'AVAILABLE',
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

    return [
      post.country || '국가 미정',
      post.region || '장소 미정',
      post.semester || '학기 미정',
      formatRelativeTime(post.createdAt) || '등록일 미정',
    ].filter(Boolean);
  }, [post]);

  const handleChangeTab = (nextTab: 'trade' | 'items' | 'seller') => {
    const currentY = currentScrollY.current;

    setTab(nextTab);

    requestAnimationFrame(() => {
      const nextY = nextTab === 'seller' ? Math.min(currentY, 430) : currentY;

      scrollRef.current?.scrollTo({
        y: nextY,
        animated: false,
      });
    });
  };

  const handleStartChat = async () => {
    if (!post || chatLoading) return;

    if (post.source !== 'api' || typeof post.id !== 'number') {
      Alert.alert(
        '채팅을 시작할 수 없어요',
        '서버에 등록된 거래글만 채팅을 시작할 수 있어요.',
      );
      return;
    }

    if (!post.targetMemberId) {
      Alert.alert(
        '판매자 정보를 확인할 수 없어요',
        '백엔드 상세 응답에 판매자 ID가 없어 채팅방을 만들 수 없습니다.',
      );
      return;
    }

    try {
      setChatLoading(true);
      const response = await createOrGetChatRoom({
        referenceType: 'TRADE',
        referenceId: post.id,
        targetMemberId: post.targetMemberId,
      });
      const roomId = response.data.roomId;

      if (!roomId) {
        throw new Error('채팅방 ID가 응답에 없습니다.');
      }

      router.push({
        pathname: '/chat/[roomId]',
        params: {
          roomId: String(roomId),
          title: post.title,
          price: formatPrice(post),
          thumbnail: post.photos[0] ?? '',
          sellerName: post.authorName,
          referenceType: 'TRADE',
          referenceId: String(post.id),
          opponentMemberId: String(post.targetMemberId),
        },
      } as any);
    } catch (error: any) {
      console.log('채팅방 생성 실패:', error.response?.data || error.message);
      Alert.alert(
        '채팅방 생성 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
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
        console.log('좋아요한 중고거래 상세 저장 실패:', error);
      });

      return next;
    });

    if (typeof post.id !== 'number') {
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
                (prev.scrapCount ?? 0) + (nextSaved === wasSaved ? 0 : nextSaved ? 1 : -1),
              ),
            }
          : prev,
      );
    } catch (error: any) {
      console.log('중고거래 스크랩 실패:', error.response?.data || error.message);
      setLiked(wasSaved);
      Alert.alert('저장 실패', '게시글 저장 상태를 변경하지 못했어요.');
    }
  };

  const handleChangeTradeStatus = async (nextStatus: UsedItemTradeStatus) => {
    if (!post || typeof post.id !== 'number') return;

    try {
      if (nextStatus === 'COMPLETED') {
        await completeUsedItem(post.id);
      } else {
        await reopenUsedItem(post.id);
      }

      await saveUsedItemStatus(post.id, nextStatus);
      setPost((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      Alert.alert(
        '상태 변경 완료',
        nextStatus === 'COMPLETED'
          ? '거래완료로 변경했어요.'
          : '판매중으로 다시 변경했어요.',
      );
    } catch (error: any) {
      console.log('중고거래 상태 변경 실패:', error.response?.data || error.message);
      Alert.alert(
        '상태 변경 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
      );
    }
  };

  const submitReportPost = async (reason: ReportReason) => {
    if (!post || typeof post.id !== 'number' || reporting) return;

    try {
      setReporting(true);
      await createReport({
        targetType: 'USED_ITEM',
        targetId: post.id,
        reason,
        detail: `중고거래 게시글 #${post.id} 신고`,
      });
      Alert.alert('신고 접수', '운영팀이 게시글을 확인할게요.');
    } catch (error: any) {
      console.log('중고거래 신고 실패:', error.response?.data || error.message);
      Alert.alert(
        '신고 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setReporting(false);
    }
  };

  const handleReportPost = () => {
    if (!post || typeof post.id !== 'number') {
      Alert.alert('신고할 수 없어요', '서버에 등록된 게시글만 신고할 수 있어요.');
      return;
    }

    Alert.alert('신고하기', '신고 사유를 선택해주세요.', [
      ...REPORT_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => submitReportPost(option.reason),
      })),
      { text: '취소', style: 'cancel' as const },
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
    const categoryDetails = post.itemGroups.reduce<Record<string, {
      photos: string[];
      description: string;
    }>>((acc, group) => {
      acc[group.category] = {
        photos: group.photos ?? [],
        description: group.description ?? '',
      };
      return acc;
    }, {});

    router.push({
      pathname: '/market/preview',
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

    Alert.alert('판매글 삭제', '이 게시글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            if (post.source === 'api' && typeof post.id === 'number') {
              await deleteUsedItem(post.id);
            }

            await deleteLocalMarketPost(String(post.id));

            Alert.alert('삭제 완료', '판매글이 삭제되었어요.');
            router.replace('/market' as any);
          } catch (error: any) {
            console.log('중고거래 삭제 실패:', error.response?.data || error.message);
            Alert.alert(
              '삭제 실패',
              error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
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
            onPress={() => router.replace('/market' as any)}
          >
            <Text style={styles.centerButtonText}>목록으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const canManagePost =
    post.source === 'local' ||
    (currentMemberId !== null && post.targetMemberId === currentMemberId);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          currentScrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <HeaderBack
          fromProfileList={fromProfileList}
          fromEditComplete={fromEditComplete}
          canManagePost={canManagePost}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onChangeStatus={handleChangeTradeStatus}
          tradeStatus={post.status ?? 'AVAILABLE'}
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

        <ImageCarousel photos={post.photos} onOpenPhoto={setExpandedPhoto} />

        <View
          style={[
            styles.body,
            { paddingBottom: bottomBarHeight + 14 },
          ]}
        >
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={3}>
              {post.title}
            </Text>
            {post.status === 'COMPLETED' ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>거래완료</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.price}>{formatPrice(post)}</Text>

          <View style={styles.tabRow}>
            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab('trade')}
            >
              <Text style={styles.tabText}>거래 정보</Text>
              {tab === 'trade' && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab('items')}
            >
              <Text style={styles.tabText}>물품 목록</Text>
              {tab === 'items' && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab('seller')}
            >
              <Text style={styles.tabText}>판매자 정보</Text>
              {tab === 'seller' && <View style={styles.activeLine} />}
            </Pressable>
          </View>

          {tab === 'trade' && <TradeInfo post={post} />}
          {tab === 'items' && (
            <ItemList post={post} onOpenPhoto={setExpandedPhoto} />
          )}
          {tab === 'seller' && <SellerInfo post={post} />}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            height: bottomBarHeight,
            paddingBottom: bottomSafePadding,
          },
        ]}
      >
        <Pressable
          style={styles.bottomHeartButton}
          onPress={handleToggleLike}
        >
          <Ionicons
            name={liked ? 'bookmark' : 'bookmark-outline'}
            size={31}
            color={liked ? BLUE : '#111111'}
          />
        </Pressable>

        <Pressable style={styles.chatButton} onPress={handleStartChat}>
          <Text style={styles.chatText}>
            {chatLoading ? '채팅방 여는 중...' : '채팅 시작하기'}
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
  tradeStatus = 'AVAILABLE',
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

  return (
    <View style={styles.top}>
      <AppBackButton
        onPress={() => {
          if (fromEditComplete === 'true') {
            router.replace('/market' as any);
            return;
          }

          if (fromChatRoom === 'true' && chatRoomId) {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace({
              pathname: '/chat/[roomId]',
              params: {
                roomId: chatRoomId,
                title: chatTitle ?? '',
                price: chatPrice ?? '',
                thumbnail: chatThumbnail ?? '',
                sellerName: chatSellerName ?? '',
                referenceType: chatReferenceType ?? 'TRADE',
                referenceId: chatReferenceId ?? '',
              },
            } as any);
            return;
          }

          if (
            fromProfileList === 'market' ||
            fromProfileList === 'liked' ||
            fromProfileList === 'saved' ||
            fromProfileList === 'written'
          ) {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace({
              pathname: '/home/profile-list',
              params: { type: fromProfileList },
            } as any);
            return;
          }

          router.back();
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
          <View style={styles.postMenuPopover}>
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
                      tradeStatus === 'COMPLETED' ? 'AVAILABLE' : 'COMPLETED',
                    );
                  }}
                >
                  <Ionicons
                    name={
                      tradeStatus === 'COMPLETED'
                        ? 'refresh-outline'
                        : 'checkmark-circle-outline'
                    }
                    size={18}
                    color="#111111"
                  />
                  <Text style={styles.postMenuText}>
                    {tradeStatus === 'COMPLETED'
                      ? '판매중으로 변경'
                      : '거래완료로 변경'}
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
                  <Text style={[styles.postMenuText, styles.postMenuDangerText]}>
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
                  {reporting ? '신고 접수 중...' : '신고하기'}
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
  if (photos.length === 0) {
    return (
      <View style={[styles.imageArea, styles.emptyImageArea]}>
        <Text style={styles.emptyImageText}>등록된 사진 없음</Text>
      </View>
    );
  }

  return (
    <View style={styles.imageArea}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {photos.map((photo, index) => (
          <Pressable
            key={`${photo}-${index}`}
            style={styles.heroImageButton}
            onPress={() => onOpenPhoto(photo)}
          >
            <Image source={{ uri: photo }} style={styles.heroImage} />
          </Pressable>
        ))}
      </ScrollView>

      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
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

        {photo && (
          <Image source={{ uri: photo }} style={styles.fullImage} />
        )}

        <Pressable style={styles.fullImageCloseButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

function TradeInfo({ post }: { post: MarketDetailPost }) {
  const sellerCountry = post.sellerCountry || post.authorDispatchedCountry;

  return (
    <View>
      <Text style={styles.sectionTitle}>거래 정보</Text>
      <Text style={styles.sectionDesc}>
        기본 거래 정보 및 판매자가 직접 작성한 내용이에요
      </Text>

      <Text style={styles.subTitle}>거래 조건</Text>

      <View style={styles.conditionRow}>
        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Ionicons
              name="person-circle-outline"
              size={14}
              color="#555555"
              style={styles.conditionVectorIcon}
            />
            <Text style={styles.conditionLabel}>판매자 국가</Text>
          </View>
          <Text style={styles.conditionValue}>{sellerCountry || '미정'}</Text>
        </View>

        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Ionicons
              name="flag-outline"
              size={14}
              color="#555555"
              style={styles.conditionVectorIcon}
            />
            <Text style={styles.conditionLabel}>거래 국가</Text>
          </View>
          <Text style={styles.conditionValue}>{post.country || '미정'}</Text>
        </View>

        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Image
              source={require('../../../assets/images/place.png')}
              style={styles.conditionIcon}
            />
            <Text style={styles.conditionLabel}>거래 장소</Text>
          </View>
          <Text style={styles.conditionValue}>{post.region || '미정'}</Text>
        </View>

        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Image
              source={require('../../../assets/images/date.png')}
              style={styles.conditionIcon}
            />
            <Text style={styles.conditionLabel}>귀국일</Text>
          </View>
          <Text style={styles.conditionValue}>
            {formatReturnDate(post.returnDate)}
          </Text>
        </View>
      </View>

      <Text style={styles.subTitle}>판매자 글</Text>

      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>{post.content}</Text>
      </View>
    </View>
  );
}

function ItemList({
  post,
  onOpenPhoto,
}: {
  post: MarketDetailPost;
  onOpenPhoto: (photo: string) => void;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>물품 목록</Text>
      <Text style={styles.sectionDesc}>판매 물품 리스트예요</Text>

      {post.itemGroups.length > 0 ? (
        <>
          <Text style={styles.subTitle}>보유 카테고리</Text>

          <View style={styles.categoryPillRow}>
            {post.itemGroups.map((group) => (
              <Text key={group.category} style={styles.categoryPill}>
                {group.category}
              </Text>
            ))}
          </View>

          {post.itemGroups.map((group) => {
            const groupDescription =
              group.description ||
              group.items.find(
                (item) => item.description && item.description.length > 0,
              )?.description ||
              '';

            return (
              <View key={group.category} style={styles.itemGroup}>
                <Text style={styles.subTitle}>{group.category}</Text>

                {group.photos && group.photos.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.itemPhotoRow}
                  >
                    {group.photos.map((photo, index) => (
                      <Pressable
                        key={`${group.category}-${photo}-${index}`}
                        onPress={() => onOpenPhoto(photo)}
                      >
                        <Image source={{ uri: photo }} style={styles.itemPhoto} />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                {groupDescription.length > 0 && (
                  <View style={styles.itemDescriptionBox}>
                    <Text style={styles.itemDescriptionText}>
                      {groupDescription}
                    </Text>
                  </View>
                )}

                <View style={styles.itemGrid}>
                  {group.items.map((item, index) => (
                    <View
                      key={`${group.category}-${item.name}-${index}`}
                      style={styles.itemLineBlock}
                    >
                      <Text style={styles.itemText}>
                        • {item.name} {item.quantity}개
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <View style={styles.emptyListBox}>
          <Text style={styles.emptyListText}>등록된 물품이 없어요</Text>
        </View>
      )}
    </View>
  );
}

function SellerInfo({ post }: { post: MarketDetailPost }) {
  const authorName = post.authorName || '나';
  const initial = authorName.trim().charAt(0) || '나';
  const sellerCountry = post.sellerCountry || post.authorDispatchedCountry;
  const sellerRegion = post.authorDispatchedRegion || post.region;
  const domesticUniversity =
    post.authorDomesticUniversity || post.authorHomeUniversity || '소속대학 미정';
  const dispatchedUniversity = post.authorDispatchedUniversity || '파견교 미정';
  const dispatchSemester = post.authorDispatchSemester || post.semester || '학기 미정';
  const verified = post.authorVerified ?? true;

  return (
    <View>
      <Text style={styles.sectionTitle}>판매자 정보</Text>
      <Text style={styles.sectionDesc}>
        교환학생 선배 판매자의 기본 정보예요
      </Text>

      <View style={styles.profileCard}>
        <View style={styles.profileImage}>
          <Text style={styles.profileInitial}>{initial}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{authorName}</Text>
            {verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#123F9F" />
                <Text style={styles.verifiedText}>인증완료</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileMeta}>
            {[sellerCountry, sellerRegion].filter(Boolean).join(' ') || '지역 미정'} · {dispatchSemester} 파견생
          </Text>
        </View>
      </View>

      <View style={styles.sellerInfoList}>
        <View style={styles.sellerInfoRow}>
          <Text style={styles.sellerInfoLabel}>소속대학</Text>
          <Text style={styles.sellerInfoValue}>{domesticUniversity}</Text>
        </View>

        <View style={styles.sellerInfoRow}>
          <Text style={styles.sellerInfoLabel}>파견국가 및 지역</Text>
          <Text style={styles.sellerInfoValue}>
            {[sellerCountry, sellerRegion].filter(Boolean).join(' ') || '미정'}
          </Text>
        </View>

        <View style={styles.sellerInfoRow}>
          <Text style={styles.sellerInfoLabel}>파견교</Text>
          <Text style={styles.sellerInfoValue}>{dispatchedUniversity}</Text>
        </View>

        <View style={styles.sellerInfoRow}>
          <Text style={styles.sellerInfoLabel}>파견학기</Text>
          <Text style={styles.sellerInfoValue}>{dispatchSemester}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  top: {
    height: 92,
    paddingTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },

  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },

  postMenuPopover: {
    position: 'absolute',
    top: 82,
    right: 20,
    width: 150,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    shadowColor: '#0F2042',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
    zIndex: 9,
  },

  postMenuArrow: {
    position: 'absolute',
    top: -7,
    right: 17,
    width: 14,
    height: 14,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },

  postMenuRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },

  postMenuText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111111',
  },

  postMenuDangerText: {
    color: '#E5484D',
  },

  centerState: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  centerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },

  centerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#777777',
  },

  centerButton: {
    height: 44,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  centerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  imageArea: {
    height: DETAIL_IMAGE_HEIGHT,
    backgroundColor: '#F2F2F2',
  },

  emptyImageArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
  },

  heroImage: {
    width: SCREEN_WIDTH,
    height: DETAIL_IMAGE_HEIGHT,
    resizeMode: 'cover',
  },

  heroImageButton: {
    width: SCREEN_WIDTH,
    height: DETAIL_IMAGE_HEIGHT,
  },

  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  fullImage: {
    width: SCREEN_WIDTH,
    height: '78%',
    resizeMode: 'contain',
  },

  fullImageCloseButton: {
    position: 'absolute',
    top: 54,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  body: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: '#555555',
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    color: '#111111',
    marginRight: 10,
  },
  completedBadge: {
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#777777',
  },

  price: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
    color: BLUE,
  },

  tabRow: {
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: 22,
    marginBottom: 18,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
  },

  activeLine: {
    position: 'absolute',
    bottom: -1,
    height: 4,
    width: '100%',
    borderRadius: 99,
    backgroundColor: '#102BE0',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 7,
  },

  sectionDesc: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 24,
  },

  subTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
    marginTop: 8,
  },

  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 34,
  },

  conditionCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 92,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 11,
    paddingVertical: 12,
  },

  conditionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  conditionIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    marginRight: 5,
  },

  conditionVectorIcon: {
    marginRight: 5,
  },

  conditionLabel: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '700',
  },

  conditionValue: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '800',
    lineHeight: 18,
    flexWrap: 'wrap',
  },

  descriptionBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111111',
    fontWeight: '600',
  },

  categoryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 22,
  },

  categoryPill: {
    backgroundColor: '#F2F2F2',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    color: '#111111',
    fontWeight: '700',
    overflow: 'hidden',
  },

  itemGroup: {
    marginBottom: 22,
  },

  itemPhotoRow: {
    marginBottom: 12,
  },

  itemPhoto: {
    width: 96,
    height: 96,
    borderRadius: 10,
    resizeMode: 'cover',
    marginRight: 9,
  },

  itemDescriptionBox: {
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 12,
  },

  itemDescriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333333',
    fontWeight: '600',
  },

  itemGrid: {
    marginBottom: 28,
  },

  itemLineBlock: {
    marginBottom: 9,
  },

  itemText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#111111',
  },

  emptyListBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
  },

  emptyListText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
  },

  nickname: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 16,
  },

  profileCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 12,
  },

  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D9E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  profileInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE,
  },

  profileName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#333333',
  },

  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#123F9F',
  },

  profileMeta: {
    marginTop: 5,
    fontSize: 10,
    color: '#555555',
    fontWeight: '600',
  },

  sellerInfoList: {
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },

  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },

  sellerInfoLabel: {
    width: 96,
    fontSize: 12,
    fontWeight: '800',
    color: '#777777',
  },

  sellerInfoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#111111',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bottomHeartButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  chatButton: {
    height: 48,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  chatText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
