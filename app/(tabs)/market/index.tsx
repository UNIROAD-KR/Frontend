import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getTickets,
  getScrappedTickets,
  searchTickets,
  TicketTransferResponse,
  TicketType,
  toggleTicketScrap,
} from '../../../src/api/ticket';
import {
  getScrappedUsedItems,
  getUsedItems,
  searchUsedItems,
  toggleUsedItemScrap,
  UsedItem,
} from '../../../src/api/usedItems';
import { canUseMarketWithoutVerification } from '../../../src/utils/verification';
import {
  clearMarketDraft,
  getMarketDraft,
  type MarketDraft,
} from '../../../src/storage/marketDraft';
import {
  clearTicketDraft,
  getTicketDraft,
} from '../../../src/storage/ticketDraft';
import { getTicketMetadataMap } from '../../../src/storage/ticketMetadata';
import { getUsedItemStatusMap } from '../../../src/storage/usedItemStatus';
import { AppBackButton } from '@/components/ui/app-back-button';
const countryTabs = ['전체', '독일', '프랑스', '스페인', '체코'];
const SAVED_TICKET_POSTS_STORAGE_KEY = 'univ:profile:saved-ticket-posts';
const LIKED_MARKET_POSTS_STORAGE_KEY = 'univ:profile:liked-market-posts';

type TicketItem = {
  id: number;
  title: string;
  country: string;
  semester: string;
  region: string;
  category: string;
  date: string;
  price: string;
  time: string;
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

const formatPrice = (price: number) => {
  if (!price) return '가격 미정';
  return `${price.toLocaleString()}원`;
};

const ticketTypeLabelMap: Record<TicketType, string> = {
  TOUR: '관광 티켓',
  CONCERT: '콘서트 / 공연',
  TRAIN: '기차',
  FLIGHT: '항공권',
  ACCOMMODATION: '숙박',
};

const formatTicketPrice = (price: number, currencyUnit = '€') =>
  `${currencyUnit} ${price.toLocaleString('ko-KR')}`;

const formatSingleTicketDate = (date: string) => {
  const [, month, day] = date.trim().split('-');

  if (!month || !day) return date;

  const parsedMonth = Number(month);
  const parsedDay = Number(day);

  if (Number.isNaN(parsedMonth) || Number.isNaN(parsedDay)) {
    return date;
  }

  return `${parsedMonth}월 ${parsedDay}일`;
};

const formatTicketDate = (date: string) => {
  const [startDate, endDate] = date.split('~').map((value) => value.trim());

  if (!endDate) {
    return formatSingleTicketDate(startDate);
  }

  return `${formatSingleTicketDate(startDate)} ~ ${formatSingleTicketDate(endDate)}`;
};

const formatTicketCreatedTime = (createdAt?: string) => {
  if (!createdAt) return '';

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return createdAt.slice(0, 10).replaceAll('-', '.');
  }

  const diffMs = Date.now() - createdDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return createdAt.slice(0, 10).replaceAll('-', '.');
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

const mapTicketItem = (
  item: TicketTransferResponse,
  currencyUnit = '€',
): TicketItem => ({
  id: item.id,
  title: item.title,
  country: item.authorDispatchedCountry ?? '',
  semester: ticketTypeLabelMap[item.ticketType],
  region: item.country,
  category: ticketTypeLabelMap[item.ticketType],
  date: formatTicketDate(item.eventDate),
  price: formatTicketPrice(item.transferPrice, currencyUnit),
  time: formatTicketCreatedTime(item.createdAt ?? item.updatedAt),
});

const saveBookmarkedTickets = async (
  bookmarkedIds: number[],
  ticketItems: TicketItem[],
) => {
  const bookmarkedTickets = ticketItems.filter((item) =>
    bookmarkedIds.includes(item.id),
  );

  await AsyncStorage.setItem(
    SAVED_TICKET_POSTS_STORAGE_KEY,
    JSON.stringify(bookmarkedTickets),
  );
};

const saveLikedMarketPosts = async (
  likedIds: number[],
  marketItems: UsedItem[],
) => {
  const rawStoredPosts = await AsyncStorage.getItem(LIKED_MARKET_POSTS_STORAGE_KEY);
  let storedPosts: LikedMarketPost[] = [];

  try {
    const parsedPosts = rawStoredPosts ? JSON.parse(rawStoredPosts) : [];
    storedPosts = Array.isArray(parsedPosts)
      ? (parsedPosts as LikedMarketPost[])
      : [];
  } catch {
    storedPosts = [];
  }

  const marketItemIds = new Set(marketItems.map((item) => item.id));
  const preservedStoredPosts = storedPosts.filter(
    (item) =>
      likedIds.includes(item.id) && !marketItemIds.has(item.id),
  );
  const likedPosts: LikedMarketPost[] = marketItems
    .filter((item) => likedIds.includes(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title,
      region: item.region,
      semester: item.semester,
      price: formatPrice(item.price),
      time: formatRelativeTime(item.createdAt ?? item.updatedAt),
      imageUrl: item.thumbnailImageUrl ?? '',
    }));

  await AsyncStorage.setItem(
    LIKED_MARKET_POSTS_STORAGE_KEY,
    JSON.stringify([...likedPosts, ...preservedStoredPosts]),
  );
};

export default function MarketPage() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'bulk' | 'ticket'>('bulk');
  const { tab, fromTab, fromHome, openItemId, openTicketId } =
    useLocalSearchParams<{
      tab?: string;
      fromTab?: string;
      fromHome?: string;
      openItemId?: string;
      openTicketId?: string;
    }>();
  const openedFromTab = fromTab === 'true';
  const openedFromHome = fromHome === 'true';
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [items, setItems] = useState<UsedItem[]>([]);
  const [tickets, setTickets] = useState<TicketTransferResponse[]>([]);
  const [marketListError, setMarketListError] = useState('');
  const [ticketListError, setTicketListError] = useState('');
  const [ticketCurrencyMap, setTicketCurrencyMap] = useState<Record<string, string>>(
    {},
  );
  const [usedStatusMap, setUsedStatusMap] = useState<Record<string, 'AVAILABLE' | 'COMPLETED'>>(
    {},
  );
  const [ticketNextCursorId, setTicketNextCursorId] = useState<number | null>(
    null,
  );
  const [ticketHasNext, setTicketHasNext] = useState(false);
  const [ticketLoadingMore, setTicketLoadingMore] = useState(false);
  const ticketLoadingMoreRef = useRef(false);
  const [selectedType, setSelectedType] = useState<'bulk' | 'ticket'>('bulk');
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const openedEditDetailRef = useRef<string | null>(null);
  const latestMarketQueryRef = useRef({
    keyword: '',
    country: '전체',
  });
  useEffect(() => {
    if (tab === 'ticket') {
      setSelectedTab('ticket');
      setSelectedType('ticket');
    } else {
      setSelectedTab('bulk');
      setSelectedType('bulk');
    }
  }, [tab]);

  useEffect(() => {
    if (openItemId) {
      const requestKey = `item:${openItemId}`;

      if (openedEditDetailRef.current === requestKey) return;

      openedEditDetailRef.current = requestKey;
      setSelectedTab('bulk');
      setSelectedType('bulk');

      const frame = requestAnimationFrame(() => {
        router.push({
          pathname: '/market/[id]',
          params: { id: openItemId },
        } as any);
      });

      return () => cancelAnimationFrame(frame);
    }

    if (openTicketId) {
      const requestKey = `ticket:${openTicketId}`;

      if (openedEditDetailRef.current === requestKey) return;

      openedEditDetailRef.current = requestKey;
      setSelectedTab('ticket');
      setSelectedType('ticket');

      const frame = requestAnimationFrame(() => {
        router.push({
          pathname: '/market/ticket-preview',
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
      console.log('스크랩한 중고거래 목록 조회 실패:', error.response?.data || error.message);
      try {
        const likedMarketPosts = await AsyncStorage.getItem(
          LIKED_MARKET_POSTS_STORAGE_KEY,
        );

        if (!likedMarketPosts) return;
        const parsedPosts = JSON.parse(likedMarketPosts) as Partial<LikedMarketPost>[];
        const ids = parsedPosts
          .map((item) => item.id)
          .filter((storedId): storedId is number => typeof storedId === 'number');

        setLikedIds(ids);
      } catch {
        await AsyncStorage.removeItem(LIKED_MARKET_POSTS_STORAGE_KEY);
      }
    }

    try {
      const response = await getScrappedTickets({ size: 100 });
      const ids = response.data.data.items.map((item) => item.id);

      setBookmarkedIds(ids);
    } catch (error: any) {
      console.log('스크랩한 티켓 목록 조회 실패:', error.response?.data || error.message);
      try {
        const savedTickets = await AsyncStorage.getItem(
          SAVED_TICKET_POSTS_STORAGE_KEY,
        );

        if (!savedTickets) return;

        const parsedTickets = JSON.parse(savedTickets) as Partial<TicketItem>[];
        const ids = parsedTickets
          .map((item) => item.id)
          .filter((storedId): storedId is number => typeof storedId === 'number');

        setBookmarkedIds(ids);
      } catch {
        await AsyncStorage.removeItem(SAVED_TICKET_POSTS_STORAGE_KEY);
      }
    }

    try {
      setUsedStatusMap(await getUsedItemStatusMap());
    } catch {
      setUsedStatusMap({});
    }

    try {
      const metadataMap = await getTicketMetadataMap();
      const currencyMap = Object.entries(metadataMap).reduce<Record<string, string>>(
        (acc, [ticketId, metadata]) => {
          if (metadata.currencyUnit) {
            acc[ticketId] = metadata.currencyUnit;
          }

          return acc;
        },
        {},
      );

      setTicketCurrencyMap(currencyMap);
    } catch {
      setTicketCurrencyMap({});
    }
  };

  useEffect(() => {
    loadStoredMarketInteractions();
  }, []);

  const fetchUsedItems = useCallback(async (keyword = '', country = '전체') => {
    try {
      setMarketListError('');
      const keywordText = keyword.trim();
      const countryParam = country === '전체' ? undefined : country;

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
        '중고거래 목록 조회 실패:',
        error.response?.data || error.message,
      );
      setMarketListError('중고거래 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      setItems([]);
    }
  }, []);

  const fetchTickets = useCallback(
    async (cursorId?: number, keyword = '', country = '전체') => {
    try {
      if (!cursorId) {
        setTicketListError('');
      }
      const keywordText = keyword.trim();
      const countryParam = country === '전체' ? undefined : country;
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
        : (
            countryParam
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
      console.log('티켓 양도 목록 조회 실패:', error.response?.data || error.message);
      if (!cursorId) {
        setTicketListError('티켓 양도 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
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
    if (selectedType !== 'ticket') {
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
        '교환학생 인증',
        '중고거래를 이용하려면 교환학생 신원 인증이 필요해요.',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '신원 인증하기',
            onPress: () => router.push('/verification-consent' as any),
          },
        ],
      );
    };

    try {
      const canUseMarket = await canUseMarketWithoutVerification();

      console.log('현재 마켓 이용 가능 상태:', canUseMarket);

      if (canUseMarket) {
        return;
      }

      showVerificationAlert();
    } catch (error: any) {
      console.log('내 정보 조회 실패:', error.response?.data || error.message);
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
      if (selectedType === 'ticket') {
        fetchTickets(undefined, searchKeyword, selectedCountry);
        return;
      }

      fetchUsedItems(searchKeyword, selectedCountry);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchTickets, fetchUsedItems, searchKeyword, selectedCountry, selectedType]);

  const toggleLike = async (id: number) => {
    const wasSaved = likedIds.includes(id);

    setLikedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      saveLikedMarketPosts(next, items).catch((error) => {
        console.log('좋아요한 중고거래 목록 저장 실패:', error);
      });

      return next;
    });

    try {
      await toggleUsedItemScrap(id);
    } catch (error: any) {
      console.log('중고거래 스크랩 실패:', error.response?.data || error.message);
      setLikedIds((prev) =>
        wasSaved
          ? Array.from(new Set([...prev, id]))
          : prev.filter((item) => item !== id),
      );
      Alert.alert('저장 실패', '게시글 저장 상태를 변경하지 못했어요.');
    }
  };

  const ticketItems = useMemo(
    () =>
      tickets.map((item) =>
        mapTicketItem(item, ticketCurrencyMap[String(item.id)] ?? '€'),
      ),
    [ticketCurrencyMap, tickets],
  );

  const toggleBookmark = async (id: number) => {
    const wasSaved = bookmarkedIds.includes(id);

    setBookmarkedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      saveBookmarkedTickets(next, ticketItems).catch((error) => {
        console.log('저장한 티켓 목록 저장 실패:', error);
      });

      return next;
    });

    try {
      await toggleTicketScrap(id);
    } catch (error: any) {
      console.log('티켓 스크랩 실패:', error.response?.data || error.message);
      setBookmarkedIds((prev) =>
        wasSaved
          ? Array.from(new Set([...prev, id]))
          : prev.filter((item) => item !== id),
      );
      Alert.alert('저장 실패', '티켓 저장 상태를 변경하지 못했어요.');
    }
  };

  const buildDraftWriteParams = (draft: MarketDraft) => ({
    type: draft.write.type ?? 'all',
    title: draft.write.title,
    content: draft.write.content,
    price: draft.write.price,
    country: draft.write.country ?? '',
    region: draft.write.region,
    returnDate: draft.write.returnDate,
    semester: draft.write.semester ?? '',
    photos: JSON.stringify(draft.write.photos ?? []),
  });

  const navigateToBulkDraft = (draft: MarketDraft) => {
    const writeParams = buildDraftWriteParams(draft);

    if (draft.step === 'preview' && draft.preview) {
      const previewSelectedCategories =
        draft.category?.selectedCategories ??
        Object.entries(draft.preview.itemsByCategory)
          .filter(([, items]) =>
            items.some((item) => item.checked && item.name.trim().length > 0),
          )
          .map(([category]) => category);

      router.push({
        pathname: '/market/write',
        params: {
          ...writeParams,
          resumeCategory: 'true',
          resumePreview: 'true',
          selectedItems: draft.preview.selectedItems,
          draftSelectedCategories: JSON.stringify(previewSelectedCategories),
          draftItemsByCategory: JSON.stringify(draft.preview.itemsByCategory),
          draftCategoryDetails: JSON.stringify(draft.preview.categoryDetails),
        },
      } as any);
      return;
    }

    if (draft.step === 'category' && draft.category) {
      router.push({
        pathname: '/market/write',
        params: {
          ...writeParams,
          resumeCategory: 'true',
          draftSelectedCategories: JSON.stringify(draft.category.selectedCategories),
          draftItemsByCategory: JSON.stringify(draft.category.itemsByCategory),
          draftCategoryDetails: JSON.stringify(draft.preview?.categoryDetails ?? {}),
        },
      } as any);
      return;
    }

    router.push({
      pathname: '/market/write',
      params: writeParams,
    } as any);
  };

  const openBulkWrite = async () => {
    const draft = await getMarketDraft();

    if (!draft) {
      router.push('/market/write?type=all' as any);
      return;
    }

    Alert.alert(
      '임시저장 중인 글이 있어요',
      '이어서 작성할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '새로 쓰기',
          style: 'destructive',
          onPress: async () => {
            await clearMarketDraft();
            router.push('/market/write?type=all' as any);
          },
        },
        {
          text: '이어쓰기',
          onPress: () => navigateToBulkDraft(draft),
        },
      ],
    );
  };

  const openTicketWrite = async () => {
    const draft = await getTicketDraft();

    if (!draft) {
      router.push('/market/ticket-write' as any);
      return;
    }

    Alert.alert(
      '임시저장 중인 글이 있어요',
      '이어서 작성할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '새로 쓰기',
          style: 'destructive',
          onPress: async () => {
            await clearTicketDraft();
            router.push('/market/ticket-write' as any);
          },
        },
        {
          text: '이어쓰기',
          onPress: () =>
            router.push({
              pathname: '/market/ticket-write',
              params: { resumeDraft: 'true' },
            } as any),
        },
      ],
    );
  };

  const handleFabPress = () => {
    if (selectedType === 'ticket') {
      setIsFabOpen(false);
      requireVerificationBefore('/market/ticket-write', openTicketWrite);
      return;
    }

    setIsFabOpen(false);
    requireVerificationBefore('/market/write?type=all', openBulkWrite);
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
      console.log('내 정보 조회 실패:', error.response?.data || error.message);
    }

    Alert.alert(
      '교환학생 인증',
      '중고거래를 이용하려면 교환학생 신원 인증이 필요해요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신원 인증하기',
          onPress: () => router.push('/verification-consent' as any),
        },
      ],
    );
  };

  const displayItems = items.map((item) => {
    const saved = likedIds.includes(item.id);
    const baseScraps = item.scrapCount ?? 0;
    const scraps = baseScraps || (saved ? 1 : 0);
    const sellerCountry = item.authorDispatchedCountry ?? '';
    const tradeCountry = item.country ?? '';
    const status = item.status ?? usedStatusMap[String(item.id)] ?? 'AVAILABLE';

    return {
      id: item.id,
      title: item.title,
      status,
      sellerCountry,
      tradeCountry,
      region: item.region,
      semester: item.semester,
      time: formatRelativeTime(item.createdAt ?? item.updatedAt),
      priceText: formatPrice(item.price),
      scraps,
      saved,
      chats: item.chatCount ?? 0,
      imageUrl: item.thumbnailImageUrl ?? '',
      meta: [
        tradeCountry,
        item.region,
        item.semester,
        formatRelativeTime(item.createdAt ?? item.updatedAt),
      ]
        .filter(Boolean)
        .join(' · '),
    };
  });

  const filteredItems = displayItems
    .filter((item) => {
      return (
        selectedCountry === '전체' ||
        item.tradeCountry === selectedCountry ||
        item.sellerCountry === selectedCountry ||
        item.region.includes(selectedCountry)
      );
    })
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'COMPLETED' ? 1 : -1;
    });

  const displayTickets = tickets.map((item) => ({
    id: item.id,
    country: item.authorDispatchedCountry ?? '',
    semester: ticketTypeLabelMap[item.ticketType],
    time: formatTicketCreatedTime(item.createdAt),
    region: item.country,
    category: ticketTypeLabelMap[item.ticketType],
    title: item.title,
    date: formatTicketDate(item.eventDate),
    count: `${item.quantity}매`,
    price: formatTicketPrice(
      item.transferPrice,
      ticketCurrencyMap[String(item.id)] ?? '€',
    ),
    originalPrice: item.originalPrice
      ? formatTicketPrice(
          item.originalPrice,
          ticketCurrencyMap[String(item.id)] ?? '€',
        )
      : '',
    scraps: item.scrapCount ?? 0,
  }));

  const filteredTickets = displayTickets.filter((item) => {
    return selectedCountry === '전체' || item.region.includes(selectedCountry);
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(84, insets.top + 42),
            paddingBottom: Math.max(120, insets.bottom + 110),
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleMarketScroll}
      >
        <View style={styles.header}>
          {!openedFromTab ? (
            <AppBackButton
              fallbackHref="/home"
              onPress={
                openedFromHome
                  ? () => router.replace('/home' as any)
                  : undefined
              }
              style={styles.headerBackButton}
            />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            교환학생 전용 거래
          </Text>

          <View style={styles.headerIcons}>
            <Pressable
              onPress={() =>
                router.push('/notifications' as any)
              }
            >
              <Image
                source={require('../../../assets/images/alarm.png')}
                style={styles.headerIconImage}
              />
            </Pressable>

            <Pressable
              onPress={() => router.push('/more-menu' as any)}
            >
              <Image
                source={require('../../../assets/images/menu.png')}
                style={styles.headerIconImage}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.tradeTypeWrapper}>
          <TouchableOpacity
            style={[
              styles.tradeTypeButton,
              selectedTab === 'bulk' && styles.tradeTypeButtonActive,
            ]}
            onPress={() => {
              setSelectedTab('bulk');
              setSelectedType('bulk');
              setIsFabOpen(false);
            }}
          >
            <Text
              style={[
                styles.tradeTypeText,
                selectedTab === 'bulk' && styles.tradeTypeTextActive,
              ]}
            >
              귀국 전 일괄 거래
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tradeTypeButton,
              selectedTab === 'ticket' && styles.tradeTypeButtonActive,
            ]}
            onPress={() => {
              setSelectedTab('ticket');
              setSelectedType('ticket');
              setIsFabOpen(false);
            }}
          >
            <Text
              style={[
                styles.tradeTypeText,
                selectedTab === 'ticket' && styles.tradeTypeTextActive,
              ]}
            >
              티켓 양도
            </Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.categoryRow}>
          {countryTabs.map((tab) => {
            const active = selectedCountry === tab;

            return (
              <Pressable
                key={tab}
                style={styles.categoryButton}
                onPress={() => setSelectedCountry(tab)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.activeCategoryText,
                  ]}
                >
                  {tab}
                </Text>
                {active && <View style={styles.activeLine} />}
              </Pressable>
            );
          })}
        </View>

        {selectedTab === 'bulk' ? (
          marketListError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>목록을 불러오지 못했어요</Text>
              <Text style={styles.emptyText}>{marketListError}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => fetchUsedItems(searchKeyword, selectedCountry)}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : filteredItems.length > 0 ? (
            <View style={styles.postList}>
              {filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.postCard,
                    item.status === 'COMPLETED' && styles.postCardCompleted,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/market/[id]',
                      params: { id: item.id },
                    } as any)
                  }
                >
                  <View style={styles.thumbnail}>
                    {item.imageUrl.length > 0 && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.thumbnailImage}
                      />
                    )}

                    <Pressable
                      style={[
                        styles.heartCircle,
                        item.saved && styles.heartCircleActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(item.id);
                      }}
                    >
                      <Ionicons
                        name={item.saved ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={item.saved ? BLUE : '#FFFFFF'}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.postInfo}>
                    <View style={styles.postTop}>
                      <Text style={styles.postTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.status === 'COMPLETED' ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>거래완료</Text>
                        </View>
                      ) : null}
                      <Text style={styles.arrow}>›</Text>
                    </View>

                    <Text style={styles.meta} numberOfLines={2}>
                      {item.meta}
                    </Text>

                    <Text style={styles.price}>{item.priceText}</Text>

                    <View style={styles.reactionRow}>
                      <View style={styles.reactionItem}>
                        <Ionicons
                          name={item.saved ? 'bookmark' : 'bookmark-outline'}
                          size={14}
                          color={item.saved ? BLUE : '#7C7C7C'}
                        />
                        <Text style={styles.reactionText}>{item.scraps}</Text>
                      </View>

                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>등록한 거래글이 아직 없어요</Text>
              <Text style={styles.emptyText}>첫 거래글을 기다리고 있어요.</Text>
            </View>
          )
        ) : ticketListError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>목록을 불러오지 못했어요</Text>
            <Text style={styles.emptyText}>{ticketListError}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => fetchTickets(undefined, searchKeyword, selectedCountry)}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.ticketList}>
            {filteredTickets.map((item) => (
              <Pressable
                key={item.id}
                style={styles.ticketCard}
                onPress={() =>
                  router.push({
                    pathname: '/market/ticket-preview',
                    params: { id: String(item.id) },
                  } as any)
                }
              >
                <View style={styles.ticketMetaRow}>
                  <Image
                    source={require('../../../assets/images/ticket_profile.png')}
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
                  <Pressable
                    style={styles.bookmarkButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item.id);
                    }}
                  >
                    <View style={styles.bookmarkIconWrapper}>
                      <Ionicons
                        name={
                          bookmarkedIds.includes(item.id)
                            ? 'bookmark'
                            : 'bookmark-outline'
                        }
                        size={24}
                        color={
                          bookmarkedIds.includes(item.id) ? BLUE : '#111111'
                        }
                      />
                    </View>
                  </Pressable>
                </View>

                <View style={styles.ticketInfoRow}>
                  <View style={styles.ticketInfoItem}>
                    <Image
                      source={require('../../../assets/images/ticket_date.png')}
                      style={styles.ticketInfoIcon}
                    />
                    <Text style={styles.ticketInfo}>{item.date}</Text>
                  </View>

                  <View style={styles.ticketInfoItem}>
                    <Image
                      source={require('../../../assets/images/count_ticket.png')}
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
            {ticketLoadingMore && (
              <View style={styles.ticketLoadingMore}>
                <ActivityIndicator color={BLUE} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {isFabOpen && selectedType === 'bulk' && (
        <View style={styles.fabMenu}>
          <Pressable
            style={styles.fabMenuItem}
            onPress={() => requireVerificationBefore('/market/write?type=all', openBulkWrite)}
          >
            <Image
              source={require('../../../assets/images/used_all.png')}
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
              requireVerificationBefore('/market/ticket-write', openTicketWrite);
            }}
          >
            <Image
              source={require('../../../assets/images/used_each.png')}
              style={styles.fabMenuImage}
            />
            <Text style={styles.fabMenuText}>티켓 양도하기</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[styles.fabButton, isFabOpen && styles.fabButtonOpen]}
        onPress={handleFabPress}
      >
        <Text style={styles.fabText}>{isFabOpen ? '−' : '+'}</Text>
      </Pressable>
    </View>
  );
}

const BLUE = '#102BE0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 20,
  },
  tradeTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F6',
    borderRadius: 12,
    padding: 5,
    marginHorizontal: 22,
    marginTop: 16,
    marginBottom: 16,
    height: 56,
  },

  tradeTypeButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeTypeWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F6',
    borderRadius: 15,
    padding: 5,
    marginTop: 16,
    marginBottom: 16,
    height: 54,
  },
  tradeTypeButtonActive: {
    backgroundColor: '#FFFFFF',
  },

  tradeTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9B9B9B',
  },

  tradeTypeTextActive: {
    color: '#003CFF',
  },
  segmentButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },

  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999999',
  },

  segmentTextActive: {
    color: '#003CFF',
  },
  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 23,
  },
  ticketProfileIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    resizeMode: 'cover',
    marginRight: 6,
  },
  bookmarkButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookmarkIconWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookmarkIcon: {
    width: 27,
    height: 27,
    resizeMode: 'contain',
    position: 'absolute',
  },

  ticketInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ticketInfoIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    marginRight: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
    marginBottom: 24,
  },

  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },

  headerBackButton: {
    width: 24,
    height: 24,
    marginRight: 16,
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
  },

  headerIconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  tradeTypeBox: {
    height: 55,
    backgroundColor: '#F0F3F7',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 5,
    marginBottom: 16,
  },

  searchBox: {
    height: 47,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 24,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  searchIcon: {
    fontSize: 32,
    color: '#111111',
    marginRight: 12,
    marginTop: -5,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
  },

  categoryText: {
    fontSize: 15,
    color: '#555555',
  },

  activeCategoryText: {
    color: '#111111',
    fontWeight: '900',
  },

  activeLine: {
    position: 'absolute',
    bottom: 0,
    width: 86,
    height: 2,
    backgroundColor: '#111111',
  },

  postList: {
    gap: 16,
  },

  emptyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777777',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    minWidth: 96,
    height: 38,
    borderRadius: 19,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  postCard: {
    flexDirection: 'row',
    minWidth: 0,
  },
  postCardCompleted: {
    opacity: 0.58,
  },

  thumbnail: {
    width: 118,
    height: 118,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    marginRight: 13,
    overflow: 'hidden',
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  heartCircle: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartCircleActive: {
    backgroundColor: '#EAF1FF',
  },

  heart: {
    color: '#FFFFFF',
    fontSize: 19,
  },

  heartActive: {
    color: BLUE,
  },

  postInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },

  postTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },

  postTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111111',
  },

  arrow: {
    fontSize: 28,
    color: '#777777',
  },
  completedBadge: {
    flexShrink: 0,
    minHeight: 22,
    borderRadius: 11,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#777777',
  },

  meta: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
  },

  price: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginTop: 4,
  },

  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
  },

  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  reactionIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    tintColor: '#777777',
  },

  reactionText: {
    fontSize: 12,
    color: '#777777',
    fontWeight: '600',
  },

  ticketList: {
    marginTop: 0,
  },

  ticketLoadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  ticketCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    marginBottom: 9,
  },

  userCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  userIcon: {
    fontSize: 9,
    color: '#111111',
  },

  ticketMeta: {
    flex: 1,
    minWidth: 120,
    fontSize: 10,
    color: '#777777',
  },

  ticketTag: {
    paddingHorizontal: 9,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },

  ticketTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
  },

  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ticketTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: '#111111',
  },

  bookmark: {
    fontSize: 28,
    color: '#111111',
    marginLeft: 10,
  },

  ticketInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 9,
  },

  ticketInfo: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },

  ticketPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  ticketPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginRight: 8,
  },

  ticketOriginalPrice: {
    fontSize: 12,
    color: '#B8B8B8',
    textDecorationLine: 'line-through',
  },

  ticketLikeRow: {
    alignItems: 'flex-end',
    marginTop: -8,
  },

  ticketLike: {
    fontSize: 12,
    color: '#555555',
  },

  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },

  fabButtonOpen: {
    backgroundColor: '#303030',
  },

  fabText: {
    fontSize: 30,
    lineHeight: 33,
    color: '#FFFFFF',
    fontWeight: '400',
  },

  fabMenu: {
    position: 'absolute',
    right: 24,
    bottom: 162,
    width: 270,
    backgroundColor: '#4A4A4A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },

  fabMenuImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: 8,
  },

  fabMenuText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
