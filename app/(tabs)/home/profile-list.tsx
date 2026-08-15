import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  CompanionPostResponse,
  getMyCompanionPostPage,
  getScrappedCompanionPosts,
} from '../../../src/api/companion';
import {
  FreePostSummaryResponse,
  getFreePostDetail,
  getFreePosts,
  getLikedFreePosts,
  getMyFreePosts,
  getScrappedFreePosts,
} from '../../../src/api/freePosts';
import {
  getMyTickets,
  getScrappedTickets,
  TicketTransferResponse,
  type TicketType,
} from '../../../src/api/ticket';
import {
  getMyUsedItems,
  getScrappedUsedItems,
  UsedItemSummaryResponse,
} from '../../../src/api/usedItems';
import LikedPostsEmptyInfoIcon from '@/assets/icon/profile/liked-posts-empty-info.svg';

const NAVY = '#18202B';
const BLUE = '#3568DA';
const INK = '#1A2029';
const MUTED = '#7A8491';
const LINE = '#E3E7EC';
const SOFT = '#F1F3F6';
const SAVED_TICKET_POSTS_STORAGE_KEY = 'univ:profile:saved-ticket-posts';
const RECENT_POSTS_STORAGE_KEY = 'univ:profile:recent-posts';
const LIKED_FREE_POSTS_STORAGE_KEY = 'univ:profile:liked-free-posts';
const LIKED_MARKET_POSTS_STORAGE_KEY = 'univ:profile:liked-market-posts';
const LIKED_TICKET_POSTS_STORAGE_KEY = 'univ:profile:liked-ticket-posts';

type ProfileListType =
  | 'saved'
  | 'recent'
  | 'liked'
  | 'free'
  | 'market'
  | 'companion'
  | 'written';
type ProfileListCategory = 'free' | 'used' | 'ticket' | 'companion';
type ProfileListGroup = 'community' | 'market';

type SavedTicket = {
  id?: number;
  title?: string;
  country?: string;
  semester?: string;
  region?: string;
  category?: string;
  date?: string;
  price?: string;
  time?: string;
};

type LikedMarketPost = {
  id?: number;
  title?: string;
  country?: string;
  region?: string;
  semester?: string;
  price?: string;
  time?: string;
  imageUrl?: string;
  status?: 'AVAILABLE' | 'COMPLETED';
};

type RecentPost = {
  id?: number | string;
  title?: string;
  subtitle?: string;
  meta?: string;
  type?: string;
  route?: string;
};

type ListCard = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  category?: ProfileListCategory;
  icon: keyof typeof Ionicons.glyphMap;
  route?: unknown;
  imageUrl?: string;
  authorName?: string;
  country?: string;
  region?: string;
  postStatus?: string;
  commentCount?: number;
  price?: number | string;
  originalPrice?: number;
  eventDate?: string;
  eventTime?: string;
  ticketType?: TicketType | string;
  createdAt?: string;
  status?: 'AVAILABLE' | 'COMPLETED';
};

type LikedCommunityTab = 'free' | 'companion';
type LikedTicketTab = 'all' | TicketType;
type LikedSortMode = 'latest' | 'oldest' | 'title';

const likedTicketTabs: { key: LikedTicketTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'TOUR', label: '관광 티켓' },
  { key: 'CONCERT', label: '콘서트·공연' },
  { key: 'TRAIN', label: '기차표' },
  { key: 'FLIGHT', label: '항공권' },
];

const screenConfig: Record<
  ProfileListType,
  {
    title: string;
    description: string;
    emptyTitle: string;
    emptyText: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  saved: {
    title: '스크랩/저장한 글',
    description: '나중에 다시 볼 글을 카테고리별로 확인해요.',
    emptyTitle: '저장한 글이 아직 없어요',
    emptyText: '마켓이나 커뮤니티에서 저장하면 여기에 모여요.',
    icon: 'bookmark-outline',
  },
  recent: {
    title: '최근 본 글',
    description: '방금 확인했던 글을 빠르게 다시 열어볼 수 있어요.',
    emptyTitle: '최근 본 글이 아직 없어요',
    emptyText: '글 상세 화면을 둘러보면 최근 본 글 목록이 채워질 예정이에요.',
    icon: 'time-outline',
  },
  liked: {
    title: '좋아요한 글',
    description: '내가 좋아요를 누르거나 저장한 글을 모아봤어요.',
    emptyTitle: '좋아요한 글이 아직 없어요',
    emptyText: '마음에 드는 커뮤니티/마켓 글에 좋아요를 누르면 여기에 표시돼요.',
    icon: 'thumbs-up-outline',
  },
  free: {
    title: '커뮤니티 작성글',
    description: '내가 쓴 질문, 후기, 정보 공유 글을 관리해요.',
    emptyTitle: '작성한 커뮤니티 글이 없어요',
    emptyText: '궁금한 점이나 경험을 커뮤니티에 남겨보세요.',
    icon: 'chatbubbles-outline',
  },
  market: {
    title: '중고거래 작성글',
    description: '중고거래와 티켓 양도 글을 카테고리별로 확인해요.',
    emptyTitle: '작성한 거래글이 없어요',
    emptyText: '귀국 전 물품이나 티켓을 등록하면 여기에 표시돼요.',
    icon: 'bag-handle-outline',
  },
  companion: {
    title: '동행 모집글',
    description: '출국, 여행, 정착 동행 모집 현황을 확인해요.',
    emptyTitle: '모집 중인 동행 글이 없어요',
    emptyText: '함께 이동하거나 여행할 친구를 모집해보세요.',
    icon: 'people-outline',
  },
  written: {
    title: '내가 쓴 글',
    description: '커뮤니티와 중고마켓 작성글을 나눠서 확인해요.',
    emptyTitle: '작성한 글이 없어요',
    emptyText: '거래나 동행 모집 글을 작성하면 여기에 표시돼요.',
    icon: 'create-outline',
  },
};

const asListType = (value?: string | string[]): ProfileListType => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue === 'saved' ||
    normalizedValue === 'recent' ||
    normalizedValue === 'liked' ||
    normalizedValue === 'free' ||
    normalizedValue === 'market' ||
    normalizedValue === 'companion' ||
    normalizedValue === 'written'
  ) {
    return normalizedValue;
  }

  return 'saved';
};

const asListCategory = (
  value: string | string[] | undefined,
  fallback: ProfileListCategory,
): ProfileListCategory => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue === 'free' ||
    normalizedValue === 'used' ||
    normalizedValue === 'ticket' ||
    normalizedValue === 'companion'
  ) {
    return normalizedValue;
  }

  return fallback;
};

const extractItems = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = payload as {
    items?: T[];
    content?: T[];
    data?: unknown;
    result?: unknown;
    list?: T[];
    posts?: T[];
    freePosts?: T[];
  };
  const directItems =
    data.items ?? data.content ?? data.list ?? data.posts ?? data.freePosts;

  if (directItems) {
    return directItems;
  }

  return extractItems<T>(data.data ?? data.result);
};

const formatDate = (value?: string) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10).replaceAll('-', '.');
};

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return '';
  }

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return formatDate(value);
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

  return formatDate(value);
};

const formatPrice = (value?: number) => {
  if (!value) {
    return '가격 미정';
  }

  return `${value.toLocaleString()}원`;
};

const makeCardId = (prefix: string, id?: number | string) =>
  `${prefix}-${id ?? Math.random().toString(36).slice(2)}`;

const toFreePostCard = (
  post: FreePostSummaryResponse,
  prefix: string,
  badge: string,
): ListCard => ({
  id: makeCardId(prefix, post.id),
  title: post.title,
  subtitle: post.preview || `${post.country} 커뮤니티 글`,
  meta:
    badge === '스크랩'
      ? `${post.country} · 스크랩 ${post.scrapCount ?? 0} · 댓글 ${post.commentCount}`
      : badge === '좋아요'
        ? `${post.country} · 좋아요 ${post.likeCount} · 댓글 ${post.commentCount}`
        : `${post.country} · ${post.status} · 댓글 ${post.commentCount}`,
  badge,
  category: 'free',
  icon: badge === '스크랩' ? 'bookmark-outline' : 'chatbubble-ellipses-outline',
  imageUrl: post.thumbnailImageUrl,
  authorName: post.authorName,
  country: post.country,
  postStatus: post.status,
  commentCount: post.commentCount,
  createdAt: post.createdAt,
  route: {
    pathname: '/community-detail',
    params: {
      type: 'free',
      id: String(post.id),
      fromProfileList: prefix.includes('saved')
        ? 'saved'
        : prefix.includes('written')
          ? 'written'
          : prefix,
    },
  },
});

const toTicketCard = (
  item: SavedTicket | TicketTransferResponse,
  prefix: string,
  badge = '티켓 양도',
): ListCard => ({
  id: makeCardId(prefix, item.id),
  title: item.title || '티켓 양도 글',
  subtitle:
    'ticketType' in item
      ? [item.country, formatDate(item.eventDate)].filter(Boolean).join(' · ')
      : [item.country, item.semester, item.region].filter(Boolean).join(' · ') ||
    '티켓 양도 글',
  meta:
    'ticketType' in item
      ? [
          `${item.quantity}매`,
          formatPrice(item.transferPrice),
          formatRelativeTime(item.createdAt ?? item.updatedAt),
        ]
          .filter(Boolean)
          .join(' · ')
      : [item.category, item.date, item.price, item.time].filter(Boolean).join(' · ') ||
        '상세 정보를 확인해보세요.',
  badge,
  category: 'ticket',
  icon: 'bookmark-outline',
  imageUrl:
    'thumbnailImageUrl' in item
      ? item.thumbnailImageUrl || item.imageUrls?.[0]
      : undefined,
  country: item.country,
  region: 'location' in item ? item.location : item.region,
  price: 'transferPrice' in item ? item.transferPrice : item.price,
  originalPrice: 'originalPrice' in item ? item.originalPrice : undefined,
  eventDate: 'eventDate' in item ? item.eventDate : item.date,
  eventTime: 'eventTime' in item ? item.eventTime : item.time,
  ticketType: 'ticketType' in item ? item.ticketType : item.category,
  createdAt: 'createdAt' in item ? item.createdAt : undefined,
  status: 'status' in item ? item.status : undefined,
  route: item.id
    ? {
        pathname: '/market/ticket-preview',
        params: {
          id: String(item.id),
          fromProfileList: prefix.includes('saved')
            ? 'saved'
            : prefix.includes('written')
              ? 'written'
              : 'liked',
        },
      }
    : '/market/ticket-preview',
});

const toLikedMarketCard = (item: LikedMarketPost): ListCard => ({
  id: makeCardId('liked-market', item.id),
  title: item.title || '중고거래 글',
  subtitle:
    [item.region, item.semester].filter(Boolean).join(' · ') || '중고마켓 글',
  meta: [item.price, item.time].filter(Boolean).join(' · ') || '좋아요한 중고거래',
  badge: '중고마켓',
  category: 'used',
  icon: 'heart-outline',
  imageUrl: item.imageUrl,
  country: item.country,
  region: item.region,
  price: item.price,
  status: item.status,
  route: item.id
    ? {
        pathname: '/market/[id]',
        params: { id: String(item.id), fromProfileList: 'liked' },
      }
    : '/market',
});

const toLikedUsedItemCard = (item: UsedItemSummaryResponse): ListCard => ({
  id: makeCardId('liked-used', item.id),
  title: item.title,
  subtitle: `${item.country || '거래'} · ${item.region}`,
  meta: [formatPrice(item.price), formatRelativeTime(item.updatedAt || item.createdAt)]
    .filter(Boolean)
    .join(' · '),
  badge: item.status === 'COMPLETED' ? '거래 완료' : '중고거래',
  category: 'used',
  icon: 'bookmark-outline',
  imageUrl: item.thumbnailImageUrl,
  country: item.country,
  region: item.region,
  price: item.price,
  createdAt: item.updatedAt || item.createdAt,
  status: item.status,
  route: {
    pathname: '/market/[id]',
    params: { id: String(item.id), fromProfileList: 'liked' },
  },
});

const toLikedCompanionCard = (post: CompanionPostResponse): ListCard => ({
  id: makeCardId('liked-companion', post.id),
  title: post.title,
  subtitle: post.content,
  meta: `${post.memberName} · ${post.country} ${post.region} · ${post.currentParticipants}/${post.capacity}명`,
  badge: '동행 모집',
  category: 'companion',
  icon: 'people-outline',
  authorName: post.memberName,
  country: post.country,
  region: post.region,
  createdAt: post.createdAt,
  route: {
    pathname: '/community-detail',
    params: { type: 'companion', id: String(post.id), fromProfileList: 'liked' },
  },
});

const mergePostsById = (posts: FreePostSummaryResponse[]) => {
  const postMap = new Map<number, FreePostSummaryResponse>();

  posts.forEach((post) => {
    postMap.set(post.id, post);
  });

  return Array.from(postMap.values());
};

const mergeTicketsById = (tickets: SavedTicket[]) => {
  const ticketMap = new Map<number, SavedTicket>();

  tickets.forEach((ticket) => {
    if (typeof ticket.id === 'number') {
      ticketMap.set(ticket.id, ticket);
    }
  });

  return Array.from(ticketMap.values());
};

const parseStoredList = <T,>(rawValue: string | null): T[] => {
  if (!rawValue) return [];

  try {
    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch {
    return [];
  }
};

const categoryTabsByType: Partial<
  Record<ProfileListType, { key: ProfileListCategory; label: string }[]>
> = {
  saved: [
    { key: 'free', label: '자유게시판' },
    { key: 'companion', label: '동행구하기' },
    { key: 'used', label: '귀국 전 일괄거래' },
    { key: 'ticket', label: '티켓양도' },
  ],
  liked: [
    { key: 'free', label: '커뮤니티' },
    { key: 'used', label: '중고거래' },
    { key: 'ticket', label: '티켓양도' },
  ],
  market: [
    { key: 'used', label: '중고거래' },
    { key: 'ticket', label: '티켓양도' },
  ],
  written: [
    { key: 'free', label: '자유게시판' },
    { key: 'companion', label: '동행구하기' },
    { key: 'used', label: '귀국 전 일괄거래' },
    { key: 'ticket', label: '티켓양도' },
  ],
};

const groupTabs = [
  { key: 'community' as const, label: '커뮤니티' },
  { key: 'market' as const, label: '중고마켓' },
];

const categoryGroupMap: Record<ProfileListCategory, ProfileListGroup> = {
  free: 'community',
  companion: 'community',
  used: 'market',
  ticket: 'market',
};

const subCategoryTabsByGroup: Record<
  ProfileListGroup,
  { key: ProfileListCategory; label: string }[]
> = {
  community: [
    { key: 'free', label: '자유게시판' },
    { key: 'companion', label: '동행구하기' },
  ],
  market: [
    { key: 'used', label: '귀국 전 일괄거래' },
    { key: 'ticket', label: '티켓양도' },
  ],
};

export default function ProfileListScreen() {
  const { type, category } = useLocalSearchParams<{
    type?: string | string[];
    category?: string | string[];
  }>();
  const listType = asListType(type);
  const config = screenConfig[listType];
  const categoryTabs = categoryTabsByType[listType];
  const defaultCategory = categoryTabs?.[0]?.key ?? 'free';
  const routeCategory = asListCategory(category, defaultCategory);
  const usesGroupedTabs = listType === 'saved' || listType === 'written';
  const [items, setItems] = useState<ListCard[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProfileListGroup>(
    categoryGroupMap[routeCategory] ?? 'community',
  );
  const [selectedCategory, setSelectedCategory] = useState<ProfileListCategory>(
    routeCategory,
  );
  const [likedCommunityTab, setLikedCommunityTab] = useState<LikedCommunityTab>('free');
  const [likedTicketTab, setLikedTicketTab] = useState<LikedTicketTab>('all');
  const [likedSortMode, setLikedSortMode] = useState<LikedSortMode>('latest');
  const [likedSortOpen, setLikedSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!categoryTabs) {
      setSelectedCategory(defaultCategory);
      return;
    }

    const hasRouteCategory = categoryTabs.some(
      (tabItem) => tabItem.key === routeCategory,
    );

    setSelectedCategory(hasRouteCategory ? routeCategory : defaultCategory);
    setSelectedGroup(
      categoryGroupMap[hasRouteCategory ? routeCategory : defaultCategory] ??
        'community',
    );
  }, [categoryTabs, defaultCategory, listType, routeCategory]);

  const loadItems = useCallback(async () => {
    setLoading(true);

    try {
      if (listType === 'saved') {
        const [
          freeResponse,
          companionResponse,
          usedResponse,
          ticketResponse,
        ] = await Promise.all([
          getScrappedFreePosts({ size: 30 }),
          getScrappedCompanionPosts({ size: 30 }),
          getScrappedUsedItems({ size: 30 }),
          getScrappedTickets({ size: 30 }),
        ]);
        const freePosts = extractItems<FreePostSummaryResponse>(
          freeResponse.data.data,
        );
        const companionPosts = extractItems<CompanionPostResponse>(
          companionResponse.data.data,
        );
        const usedItems = extractItems<UsedItemSummaryResponse>(
          usedResponse.data.data,
        );
        const tickets = extractItems<TicketTransferResponse>(
          ticketResponse.data.data,
        );

        setItems([
          ...freePosts.map((post) => toFreePostCard(post, 'saved-free', '스크랩')),
          ...companionPosts.map((post) => ({
            id: makeCardId('saved-companion', post.id),
            title: post.title,
            subtitle: `${post.country} ${post.region}`,
            meta: `${formatDate(post.startDate)} - ${formatDate(post.endDate)} · 스크랩 ${post.scrapCount ?? 0}`,
            badge: '동행구하기',
            category: 'companion' as ProfileListCategory,
            icon: 'bookmark-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/community-detail',
              params: {
                type: 'companion',
                id: String(post.id),
                fromProfileList: 'saved',
              },
            },
          })),
          ...usedItems.map((item) => ({
            id: makeCardId('saved-used', item.id),
            title: item.title,
            subtitle: `${item.region} · ${item.semester}`,
            meta: [
              formatPrice(item.price),
              `스크랩 ${item.scrapCount ?? 0}`,
              formatRelativeTime(item.updatedAt),
            ]
              .filter(Boolean)
              .join(' · '),
            badge: item.status === 'COMPLETED' ? '거래완료' : '일괄거래',
            category: 'used' as ProfileListCategory,
            icon: 'bookmark-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/[id]',
              params: { id: String(item.id), fromProfileList: 'saved' },
            },
          })),
          ...tickets.map((item) => toTicketCard(item, 'saved-ticket')),
        ]);
        return;
      }

      if (listType === 'recent') {
        const rawRecent = await AsyncStorage.getItem(RECENT_POSTS_STORAGE_KEY);
        const recentPosts = rawRecent ? (JSON.parse(rawRecent) as RecentPost[]) : [];

        setItems(
          recentPosts.map((item) => ({
            id: makeCardId('recent', item.id),
            title: item.title || '최근 본 글',
            subtitle: item.subtitle || '다시 확인할 수 있는 글이에요.',
            meta: item.meta || item.type || '최근 열람',
            badge: item.type,
            icon: 'time-outline',
            route: item.route,
          })),
        );
        return;
      }

      if (listType === 'free') {
        const response = await getMyFreePosts({ size: 30 });
        const posts = extractItems<FreePostSummaryResponse>(response.data.data);

        setItems(
          posts.map((post) => toFreePostCard(post, 'free', '자유게시판')),
        );
        return;
      }

      if (listType === 'liked') {
        let posts: FreePostSummaryResponse[] = [];
        const rawLocalLikedPosts = await AsyncStorage.getItem(LIKED_FREE_POSTS_STORAGE_KEY);
        const rawLikedMarketPosts = await AsyncStorage.getItem(
          LIKED_MARKET_POSTS_STORAGE_KEY,
        );
        const rawLikedTicketPosts = await AsyncStorage.getItem(
          LIKED_TICKET_POSTS_STORAGE_KEY,
        );
        const rawSavedTickets = await AsyncStorage.getItem(
          SAVED_TICKET_POSTS_STORAGE_KEY,
        );
        const localLikedPosts = parseStoredList<FreePostSummaryResponse>(rawLocalLikedPosts);
        const likedMarketPosts =
          parseStoredList<LikedMarketPost>(rawLikedMarketPosts);
        const likedTickets = mergeTicketsById([
          ...parseStoredList<SavedTicket>(rawLikedTicketPosts),
          ...parseStoredList<SavedTicket>(rawSavedTickets),
        ]);

        const [companionResult, usedResult, ticketResult] = await Promise.allSettled([
          getScrappedCompanionPosts({ size: 30 }),
          getScrappedUsedItems({ size: 30 }),
          getScrappedTickets({ size: 30 }),
        ]);
        const companionPosts =
          companionResult.status === 'fulfilled'
            ? extractItems<CompanionPostResponse>(companionResult.value.data.data)
            : [];
        const usedItems =
          usedResult.status === 'fulfilled'
            ? extractItems<UsedItemSummaryResponse>(usedResult.value.data.data)
            : [];
        const ticketPosts =
          ticketResult.status === 'fulfilled'
            ? extractItems<TicketTransferResponse>(ticketResult.value.data.data)
            : [];

        try {
          const response = await getLikedFreePosts({ size: 30 });
          posts = extractItems<FreePostSummaryResponse>(response.data.data);
          if (posts.length === 0) {
            posts = extractItems<FreePostSummaryResponse>(response.data);
          }
        } catch (error: any) {
          console.log('좋아요한 글 목록 API 실패:', error.response?.data || error.message);
        }

        if (posts.length === 0) {
          try {
            const response = await getFreePosts({ size: 50 });
            const candidatePosts = extractItems<FreePostSummaryResponse>(response.data.data);
            const candidates =
              candidatePosts.length > 0
                ? candidatePosts
                : extractItems<FreePostSummaryResponse>(response.data);
            const detailResults = await Promise.allSettled(
              candidates.map((post) => getFreePostDetail(post.id)),
            );

            posts = detailResults.flatMap((result, index) => {
              if (result.status !== 'fulfilled') return [];

              return result.value.data.data.liked ? [candidates[index]] : [];
            });
          } catch (error: any) {
            console.log('좋아요한 글 상세 확인 실패:', error.response?.data || error.message);
          }
        }

        posts = mergePostsById([...localLikedPosts, ...posts]);

        setItems([
          ...posts.map((post) => toFreePostCard(post, 'liked', '자유게시판')),
          ...companionPosts.map(toLikedCompanionCard),
          ...(usedItems.length > 0
            ? usedItems.map(toLikedUsedItemCard)
            : likedMarketPosts.map(toLikedMarketCard)),
          ...(ticketPosts.length > 0
            ? ticketPosts.map((item) => toTicketCard(item, 'liked-ticket'))
            : likedTickets.map((item) => toTicketCard(item, 'liked-ticket'))),
        ]);
        return;
      }

      if (listType === 'market') {
        const [usedResponse, ticketResponse] = await Promise.all([
          getMyUsedItems({ size: 30 }),
          getMyTickets({ size: 30 }),
        ]);
        const usedItems = extractItems<UsedItemSummaryResponse>(
          usedResponse.data.data,
        );
        const tickets = extractItems<TicketTransferResponse>(ticketResponse.data.data);

        setItems([
          ...usedItems.map((item) => ({
            id: makeCardId('used', item.id),
            title: item.title,
            subtitle: `${item.region} · ${item.semester}`,
            meta: [formatPrice(item.price), formatRelativeTime(item.createdAt)]
              .filter(Boolean)
              .join(' · '),
            badge: '일괄거래',
            category: 'used' as ProfileListCategory,
            icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/[id]',
              params: { id: String(item.id), fromProfileList: 'market' },
            },
          })),
          ...tickets.map((item) => ({
            id: makeCardId('ticket', item.id),
            title: item.title,
            subtitle: `${item.location} · ${formatDate(item.eventDate)}`,
            meta: [
              `${item.quantity}매`,
              formatPrice(item.transferPrice),
              formatRelativeTime(item.createdAt ?? item.updatedAt),
            ]
              .filter(Boolean)
              .join(' · '),
            badge: item.status === 'COMPLETED' ? '양도 완료' : '티켓 양도',
            category: 'ticket' as ProfileListCategory,
            icon: 'ticket-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/ticket-preview',
              params: { id: String(item.id), fromProfileList: 'market' },
            },
          })),
        ]);
        return;
      }

      if (listType === 'written') {
        const [
          freeResponse,
          usedResponse,
          ticketResponse,
          companionResponse,
        ] = await Promise.all([
          getMyFreePosts({ size: 30 }),
          getMyUsedItems({ size: 30 }),
          getMyTickets({ size: 30 }),
          getMyCompanionPostPage({ size: 30 }),
        ]);
        const freePosts = extractItems<FreePostSummaryResponse>(
          freeResponse.data.data,
        );
        const usedItems = extractItems<UsedItemSummaryResponse>(
          usedResponse.data.data,
        );
        const tickets = extractItems<TicketTransferResponse>(ticketResponse.data.data);
        const companionPosts = extractItems<CompanionPostResponse>(
          companionResponse.data.data,
        );

        setItems([
          ...freePosts.map((post) =>
            toFreePostCard(post, 'written-free', '자유게시판'),
          ),
          ...companionPosts.map((post) => ({
            id: makeCardId('written-companion', post.id),
            title: post.title,
            subtitle: `${post.country} ${post.region}`,
            meta: `${formatDate(post.startDate)} - ${formatDate(post.endDate)} · ${post.currentParticipants}/${post.capacity}명`,
            badge: post.status === 'RECRUITING' ? '모집중' : '모집완료',
            category: 'companion' as ProfileListCategory,
            icon: 'people-circle-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/community-detail',
              params: {
                type: 'companion',
                id: String(post.id),
                fromProfileList: 'written',
              },
            },
          })),
          ...usedItems.map((item) => ({
            id: makeCardId('written-used', item.id),
            title: item.title,
            subtitle: `${item.region} · ${item.semester}`,
            meta: [formatPrice(item.price), formatRelativeTime(item.createdAt)]
              .filter(Boolean)
              .join(' · '),
            badge: '중고거래',
            category: 'used' as ProfileListCategory,
            icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/[id]',
              params: { id: String(item.id), fromProfileList: 'written' },
            },
          })),
          ...tickets.map((item) => ({
            id: makeCardId('written-ticket', item.id),
            title: item.title,
            subtitle: `${item.location} · ${formatDate(item.eventDate)}`,
            meta: [
              `${item.quantity}매`,
              formatPrice(item.transferPrice),
              formatRelativeTime(item.createdAt ?? item.updatedAt),
            ]
              .filter(Boolean)
              .join(' · '),
            badge: item.status === 'COMPLETED' ? '양도 완료' : '티켓 양도',
            category: 'ticket' as ProfileListCategory,
            icon: 'ticket-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/ticket-preview',
              params: { id: String(item.id), fromProfileList: 'written' },
            },
          })),
        ]);
        return;
      }

      const response = await getMyCompanionPostPage({ size: 30 });
      const posts = extractItems<CompanionPostResponse>(response.data.data);

      setItems(
        posts.map((post) => ({
          id: makeCardId('companion', post.id),
          title: post.title,
          subtitle: `${post.country} ${post.region}`,
          meta: `${formatDate(post.startDate)} - ${formatDate(post.endDate)} · ${post.currentParticipants}/${post.capacity}명`,
          badge: post.status === 'RECRUITING' ? '모집중' : '모집완료',
          category: 'companion' as ProfileListCategory,
          icon: 'people-circle-outline',
          route: {
            pathname: '/community-detail',
            params: { type: 'companion', id: String(post.id), fromProfileList: 'companion' },
          },
        })),
      );
    } catch (error: any) {
      console.log('프로필 목록 조회 실패:', error.response?.data || error.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listType]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const visibleItems = useMemo(() => {
    if (!categoryTabs) return items;

    if (listType === 'liked') {
      const filteredItems =
        selectedCategory === 'free'
          ? items.filter((item) => item.category === likedCommunityTab)
          : selectedCategory === 'ticket' && likedTicketTab !== 'all'
            ? items.filter((item) => item.ticketType === likedTicketTab)
            : items.filter((item) => item.category === selectedCategory);

      return [...filteredItems].sort((first, second) => {
        const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
        const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;

        if (likedSortMode === 'title') {
          return first.title.localeCompare(second.title, 'ko');
        }

        return likedSortMode === 'oldest'
          ? firstTime - secondTime
          : secondTime - firstTime;
      });
    }

    return items.filter((item) => item.category === selectedCategory);
  }, [
    categoryTabs,
    items,
    likedCommunityTab,
    likedSortMode,
    likedTicketTab,
    listType,
    selectedCategory,
  ]);
  const currentCategoryTabs = usesGroupedTabs
    ? subCategoryTabsByGroup[selectedGroup]
    : categoryTabs;
  const itemCountLabel = useMemo(() => `${visibleItems.length}개`, [visibleItems.length]);
  const selectedGroupLabel = groupTabs.find((tab) => tab.key === selectedGroup)?.label;
  const selectedCategoryLabel = currentCategoryTabs?.find(
    (tab) => tab.key === selectedCategory,
  )?.label;
  const compactSummary = listType === 'saved';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          listType === 'liked' && styles.likedHeader,
          { paddingTop: Math.max(50, insets.top + 10) },
        ]}
      >
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {config.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          listType === 'liked' ? styles.likedContent : styles.content,
          { paddingBottom: Math.max(130, insets.bottom + 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {listType === 'liked' ? (
          <LikedPostsContent
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            communityTab={likedCommunityTab}
            onSelectCommunityTab={setLikedCommunityTab}
            ticketTab={likedTicketTab}
            onSelectTicketTab={setLikedTicketTab}
            sortMode={likedSortMode}
            sortOpen={likedSortOpen}
            onToggleSort={() => setLikedSortOpen((value) => !value)}
            onSelectSort={(mode) => {
              setLikedSortMode(mode);
              setLikedSortOpen(false);
            }}
            items={visibleItems}
            loading={loading}
          />
        ) : (
          <>
        {compactSummary ? (
          <View style={styles.compactSummaryBox}>
            <View>
              <Text style={styles.compactSummaryTitle}>저장한 글</Text>
              <Text style={styles.compactSummaryMeta}>
                {[selectedGroupLabel, selectedCategoryLabel].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Text style={styles.compactSummaryCount}>{itemCountLabel}</Text>
          </View>
        ) : (
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <Ionicons name={config.icon} size={25} color={BLUE} />
            </View>
            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>{config.title}</Text>
              <Text style={styles.heroDesc}>{config.description}</Text>
            </View>
            <Text style={styles.countPill} numberOfLines={1}>
              {itemCountLabel}
            </Text>
          </View>
        )}

        {usesGroupedTabs ? (
          <View style={styles.groupTabs}>
            {groupTabs.map((tabItem) => {
              const active = selectedGroup === tabItem.key;

              return (
                <Pressable
                  key={tabItem.key}
                  style={[styles.groupTab, active && styles.groupTabActive]}
                  onPress={() => {
                    setSelectedGroup(tabItem.key);
                    setSelectedCategory(subCategoryTabsByGroup[tabItem.key][0].key);
                  }}
                >
                  <Text
                    style={[
                      styles.groupTabText,
                      active && styles.groupTabTextActive,
                    ]}
                  >
                    {tabItem.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {currentCategoryTabs ? (
          <View style={styles.categoryTabs}>
            {currentCategoryTabs.map((tabItem) => {
              const active = selectedCategory === tabItem.key;

              return (
                <Pressable
                  key={tabItem.key}
                  style={[styles.categoryTab, active && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(tabItem.key)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      active && styles.categoryTabTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {tabItem.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.loadingText}>목록을 불러오는 중이에요</Text>
          </View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name={config.icon} size={30} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>{config.emptyTitle}</Text>
            <Text style={styles.emptyText}>{config.emptyText}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View style={styles.cardIconBox}>
                  <Ionicons name={item.icon} size={21} color={NAVY} />
                </View>

                <View style={styles.cardTextBox}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText} numberOfLines={1}>
                          {item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.subtitle || '상세 정보를 확인해보세요.'}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.meta || '내 활동'}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={19} color="#A4ADBA" />
              </Pressable>
            ))}
          </View>
        )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LikedPostsContent({
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
}: {
  selectedCategory: ProfileListCategory;
  onSelectCategory: (category: ProfileListCategory) => void;
  communityTab: LikedCommunityTab;
  onSelectCommunityTab: (tab: LikedCommunityTab) => void;
  ticketTab: LikedTicketTab;
  onSelectTicketTab: (tab: LikedTicketTab) => void;
  sortMode: LikedSortMode;
  sortOpen: boolean;
  onToggleSort: () => void;
  onSelectSort: (mode: LikedSortMode) => void;
  items: ListCard[];
  loading: boolean;
}) {
  const categoryTabs: { key: ProfileListCategory; label: string }[] = [
    { key: 'free', label: '커뮤니티' },
    { key: 'used', label: '중고거래' },
    { key: 'ticket', label: '티켓양도' },
  ];

  return (
    <>
      <View style={styles.likedPrimaryTabs}>
        {categoryTabs.map((tab) => {
          const active = selectedCategory === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={[styles.likedPrimaryTab, active && styles.likedPrimaryTabActive]}
              onPress={() => onSelectCategory(tab.key)}
            >
              <Text style={[styles.likedPrimaryTabText, active && styles.likedPrimaryTabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.likedToolbar}>
        <Text style={styles.likedCountText}>
          전체 <Text style={styles.likedCountNumber}>{items.length}개</Text>
        </Text>
        <View style={styles.likedSortAnchor}>
          <Pressable style={styles.likedSortButton} onPress={onToggleSort}>
            <Text style={styles.likedSortText}>{likedSortLabel(sortMode)}</Text>
            <Ionicons name={sortOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#7A8491" />
          </Pressable>
          {sortOpen ? (
            <View style={styles.likedSortMenu}>
              {(
                [
                  { key: 'latest', label: '최신순' },
                  { key: 'oldest', label: '오래된순' },
                  { key: 'title', label: '가나다순' },
                ] as { key: LikedSortMode; label: string }[]
              ).map((option) => {
                const selected = sortMode === option.key;

                return (
                  <Pressable
                    key={option.key}
                    style={styles.likedSortOption}
                    onPress={() => onSelectSort(option.key)}
                  >
                    <Text style={[styles.likedSortOptionText, selected && styles.likedSortOptionTextSelected]}>
                      {option.label}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={16} color="#1677FF" /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      {selectedCategory === 'free' ? (
        <View style={styles.likedFilterRow}>
          {[
            { key: 'free' as const, label: '자유게시판' },
            { key: 'companion' as const, label: '동행 모집' },
          ].map((tab) => {
            const active = communityTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                style={[styles.likedFilterChip, active && styles.likedFilterChipActive]}
                onPress={() => onSelectCommunityTab(tab.key)}
              >
                <Text style={[styles.likedFilterChipText, active && styles.likedFilterChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedCategory === 'ticket' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.likedTicketFilters}
        >
          {likedTicketTabs.map((tab) => {
            const active = ticketTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                style={[styles.likedFilterChip, active && styles.likedFilterChipActive]}
                onPress={() => onSelectTicketTab(tab.key)}
              >
                <Text style={[styles.likedFilterChipText, active && styles.likedFilterChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.likedLoadingBox}>
          <ActivityIndicator color={NAVY} />
        </View>
      ) : items.length === 0 ? (
        <LikedPostsEmpty />
      ) : (
        <View style={styles.likedList}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={
                selectedCategory === 'free'
                  ? styles.likedCommunityRow
                  : selectedCategory === 'used'
                    ? styles.likedUsedRow
                    : styles.likedTicketRow
              }
              onPress={() => item.route && router.push(item.route as any)}
            >
              {selectedCategory === 'free' ? (
                <LikedCommunityPostCard item={item} />
              ) : selectedCategory === 'used' ? (
                <LikedUsedPostCard item={item} />
              ) : (
                <LikedTicketPostCard item={item} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function LikedCommunityPostCard({ item }: { item: ListCard }) {
  const metadata = [
    item.authorName,
    [item.country, item.postStatus].filter(Boolean).join(' '),
    typeof item.commentCount === 'number' ? `댓글 ${item.commentCount}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <View style={styles.likedCommunityCopy}>
        <Text style={styles.likedCommunityTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.likedCommunityPreview} numberOfLines={2}>
          {item.subtitle || '게시글 본문입니다.'}
        </Text>
        <Text style={styles.likedCommunityMeta} numberOfLines={1}>
          {metadata || item.meta}
        </Text>
      </View>
      <LikedPostThumbnail uri={item.imageUrl} style={styles.likedCommunityThumbnail} />
    </>
  );
}

function LikedUsedPostCard({ item }: { item: ListCard }) {
  const price =
    typeof item.price === 'number'
      ? formatPrice(item.price)
      : item.price || item.meta.split(' · ')[0] || '가격 미정';

  return (
    <>
      <View style={styles.likedUsedThumbnailWrap}>
        <LikedPostThumbnail uri={item.imageUrl} style={styles.likedUsedThumbnail} />
        {item.status === 'COMPLETED' ? (
          <View style={styles.likedCompletedBadge}>
            <Text style={styles.likedCompletedBadgeText}>거래 완료</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.likedUsedCopy}>
        <Text style={styles.likedUsedTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.likedUsedMeta} numberOfLines={1}>
          거래 {item.country || '정보 없음'}
        </Text>
        <Text style={styles.likedUsedMeta} numberOfLines={1}>
          장소 {item.region || item.subtitle || '정보 없음'}
        </Text>
        <Text style={styles.likedUsedPrice}>{price}</Text>
      </View>
    </>
  );
}

function LikedTicketPostCard({ item }: { item: ListCard }) {
  const transferPrice =
    typeof item.price === 'number'
      ? formatPrice(item.price)
      : item.price || item.meta.split(' · ')[1] || '가격 미정';
  const ticketType = ticketTypeLabel(item.ticketType);

  return (
    <>
      <View style={styles.likedFlagBox}>
        <Text style={styles.likedFlag}>{countryFlag(item.country)}</Text>
        <Text style={styles.likedCountryName} numberOfLines={1}>
          {item.country || '국가'}
        </Text>
      </View>
      <View style={styles.likedTicketCopy}>
        <Text style={styles.likedTicketTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.likedTicketMeta} numberOfLines={1}>
          일시 {[formatDate(item.eventDate), item.eventTime].filter(Boolean).join(' ')}
        </Text>
        <Text style={styles.likedTicketMeta} numberOfLines={1}>
          유형 {ticketType}
        </Text>
        <View style={styles.likedTicketPriceRow}>
          <Text style={styles.likedTicketPrice}>{transferPrice}</Text>
          {item.originalPrice ? (
            <Text style={styles.likedTicketOriginalPrice}>{formatPrice(item.originalPrice)}</Text>
          ) : null}
        </View>
      </View>
    </>
  );
}

function LikedPostThumbnail({ uri, style }: { uri?: string; style: object }) {
  return uri ? (
    <Image source={{ uri }} style={style} resizeMode="cover" />
  ) : (
    <View style={[style, styles.likedThumbnailPlaceholder]} />
  );
}

function LikedPostsEmpty() {
  return (
    <View style={styles.likedEmptyBox}>
      <LikedPostsEmptyInfoIcon width={24} height={24} />
      <Text style={styles.likedEmptyTitle}>좋아요 누른 글이 없습니다</Text>
      <Text style={styles.likedEmptyText}>좋아요를 눌러 관심있는 글을{`\n`}저장하고 표현해보세요</Text>
    </View>
  );
}

function likedSortLabel(mode: LikedSortMode) {
  if (mode === 'oldest') return '오래된순';
  if (mode === 'title') return '가나다순';

  return '최신순';
}

function ticketTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    TOUR: '관광 티켓',
    CONCERT: '콘서트·공연',
    TRAIN: '기차표',
    FLIGHT: '항공권',
    ACCOMMODATION: '숙박',
  };

  return (type && labels[type]) || type || '티켓 양도';
}

function countryFlag(country?: string) {
  const flags: Record<string, string> = {
    대한민국: '🇰🇷',
    한국: '🇰🇷',
    일본: '🇯🇵',
    터키: '🇹🇷',
    독일: '🇩🇪',
    프랑스: '🇫🇷',
    스페인: '🇪🇸',
    이탈리아: '🇮🇹',
    미국: '🇺🇸',
    영국: '🇬🇧',
  };

  return flags[country || ''] || '🌐';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  likedHeader: {
    backgroundColor: '#F6F7F9',
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  likedContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  likedPrimaryTabs: {
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8ED',
  },
  likedPrimaryTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  likedPrimaryTabActive: {
    borderBottomColor: '#18202B',
  },
  likedPrimaryTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9AA4B1',
  },
  likedPrimaryTabTextActive: {
    fontWeight: '900',
    color: '#18202B',
  },
  likedToolbar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  likedCountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#18202B',
  },
  likedCountNumber: {
    color: '#1677FF',
  },
  likedSortButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8,
  },
  likedSortAnchor: {
    position: 'relative',
    zIndex: 10,
  },
  likedSortText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A8491',
  },
  likedSortMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    width: 112,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5EA',
    paddingVertical: 4,
    shadowColor: '#18202B',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  likedSortOption: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  likedSortOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#556171',
  },
  likedSortOptionTextSelected: {
    fontWeight: '900',
    color: '#1677FF',
  },
  likedFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  likedTicketFilters: {
    gap: 8,
    paddingBottom: 12,
    paddingRight: 16,
  },
  likedFilterChip: {
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedFilterChipActive: {
    backgroundColor: '#18202B',
  },
  likedFilterChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A8491',
  },
  likedFilterChipTextActive: {
    color: '#FFFFFF',
  },
  likedLoadingBox: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedEmptyBox: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 58,
  },
  likedEmptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '900',
    color: '#18202B',
  },
  likedEmptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: '#8B95A1',
    textAlign: 'center',
  },
  likedList: {
    gap: 10,
  },
  likedCommunityRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likedCommunityCopy: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 5,
  },
  likedCommunityTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#252C37',
  },
  likedCommunityPreview: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#8B95A1',
  },
  likedCommunityMeta: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#556171',
  },
  likedCommunityThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 6,
  },
  likedThumbnailPlaceholder: {
    backgroundColor: '#E3E7ED',
  },
  likedUsedRow: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likedUsedThumbnailWrap: {
    width: 96,
    height: 96,
  },
  likedUsedThumbnail: {
    width: 96,
    height: 96,
    borderRadius: 6,
  },
  likedCompletedBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderRadius: 4,
    backgroundColor: '#18202B',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  likedCompletedBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  likedUsedCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  likedUsedTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#252C37',
  },
  likedUsedMeta: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#7A8491',
  },
  likedUsedPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '900',
    color: '#18202B',
  },
  likedTicketRow: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likedFlagBox: {
    width: 46,
    alignItems: 'center',
  },
  likedFlag: {
    fontSize: 26,
  },
  likedCountryName: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#556171',
  },
  likedTicketCopy: {
    flex: 1,
    minWidth: 0,
  },
  likedTicketTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#252C37',
  },
  likedTicketMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#7A8491',
  },
  likedTicketPriceRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  likedTicketPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#18202B',
  },
  likedTicketOriginalPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A9B4',
    textDecorationLine: 'line-through',
  },
  heroCard: {
    minHeight: 82,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9EE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBox: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  heroDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: MUTED,
  },
  countPill: {
    flexShrink: 0,
    borderRadius: 5,
    backgroundColor: '#EDF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  compactSummaryBox: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactSummaryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: INK,
  },
  compactSummaryMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
  },
  compactSummaryCount: {
    flexShrink: 0,
    borderRadius: 5,
    backgroundColor: '#EDF2FF',
    paddingHorizontal: 11,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  categoryTabs: {
    marginTop: 14,
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#EEF1F4',
    padding: 4,
    gap: 4,
  },
  groupTabs: {
    marginTop: 14,
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#EAF0FF',
    padding: 4,
    gap: 4,
  },
  groupTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTabActive: {
    backgroundColor: '#FFFFFF',
  },
  groupTabText: {
    fontSize: 12,
    fontWeight: '900',
    color: MUTED,
  },
  groupTabTextActive: {
    color: BLUE,
  },
  categoryTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  categoryTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: NAVY,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '900',
    color: MUTED,
  },
  categoryTabTextActive: {
    color: BLUE,
  },
  loadingBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '800',
    color: MUTED,
  },
  emptyBox: {
    marginTop: 18,
    minHeight: 260,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
  card: {
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: INK,
  },
  badge: {
    flexShrink: 1,
    maxWidth: 96,
    borderRadius: 5,
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: BLUE,
  },
  cardSubtitle: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    color: NAVY,
  },
});
