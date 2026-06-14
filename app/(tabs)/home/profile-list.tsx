import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  CompanionPostResponse,
  getMyCompanionPostPage,
} from '../../../src/api/companion';
import {
  FreePostSummaryResponse,
  getMyFreePosts,
} from '../../../src/api/freePosts';
import { getMyTickets, TicketTransferResponse } from '../../../src/api/ticket';
import { getMyUsedItems, UsedItemSummaryResponse } from '../../../src/api/usedItems';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';
const SAVED_TICKET_POSTS_STORAGE_KEY = 'univ:profile:saved-ticket-posts';
const RECENT_POSTS_STORAGE_KEY = 'univ:profile:recent-posts';

type ProfileListType = 'saved' | 'recent' | 'free' | 'market' | 'companion';

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
  icon: keyof typeof Ionicons.glyphMap;
  route?: unknown;
};

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
    title: '관심목록',
    description: '저장한 티켓과 관심 게시글을 한 번에 확인해요.',
    emptyTitle: '저장한 글이 아직 없어요',
    emptyText: '마켓이나 커뮤니티에서 관심 있는 글을 저장하면 여기에 모여요.',
    icon: 'heart-outline',
  },
  recent: {
    title: '최근 본 글',
    description: '방금 확인했던 글을 빠르게 다시 열어볼 수 있어요.',
    emptyTitle: '최근 본 글이 아직 없어요',
    emptyText: '글 상세 화면을 둘러보면 최근 본 글 목록이 채워질 예정이에요.',
    icon: 'time-outline',
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
    description: '내가 올린 일괄거래와 티켓 양도 글을 모아봤어요.',
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
};

const asListType = (value?: string): ProfileListType => {
  if (
    value === 'saved' ||
    value === 'recent' ||
    value === 'free' ||
    value === 'market' ||
    value === 'companion'
  ) {
    return value;
  }

  return 'saved';
};

const extractItems = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = payload as { items?: T[]; content?: T[] };
  return data.items ?? data.content ?? [];
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

export default function ProfileListScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const listType = asListType(type);
  const config = screenConfig[listType];
  const [items, setItems] = useState<ListCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);

    try {
      if (listType === 'saved') {
        const rawSavedTickets = await AsyncStorage.getItem(
          SAVED_TICKET_POSTS_STORAGE_KEY,
        );
        const savedTickets = rawSavedTickets
          ? (JSON.parse(rawSavedTickets) as SavedTicket[])
          : [];

        setItems(
          savedTickets.map((item) => ({
            id: makeCardId('saved-ticket', item.id),
            title: item.title || '저장한 티켓 양도 글',
            subtitle: [item.country, item.semester, item.region]
              .filter(Boolean)
              .join(' · '),
            meta: [item.category, item.date, item.price, item.time]
              .filter(Boolean)
              .join(' · '),
            badge: '티켓 양도',
            icon: 'bookmark-outline',
            route: item.id
              ? {
                  pathname: '/market/ticket-preview',
                  params: { id: String(item.id) },
                }
              : '/market/ticket-preview',
          })),
        );
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
          posts.map((post) => ({
            id: makeCardId('free', post.id),
            title: post.title,
            subtitle: post.preview || `${post.country} 커뮤니티 글`,
            meta: `${post.country} · ${post.status} · 댓글 ${post.commentCount}`,
            badge: '자유게시판',
            icon: 'chatbubble-ellipses-outline',
            route: {
              pathname: '/community-detail',
              params: { type: 'free', id: String(post.id) },
            },
          })),
        );
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
            icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/[id]',
              params: { id: String(item.id) },
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
            icon: 'ticket-outline' as keyof typeof Ionicons.glyphMap,
            route: {
              pathname: '/market/ticket-preview',
              params: { id: String(item.id) },
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
          icon: 'people-circle-outline',
          route: {
            pathname: '/community-detail',
            params: { type: 'companion', id: String(post.id) },
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

  const itemCountLabel = useMemo(() => `${items.length}개`, [items.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>{config.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Ionicons name={config.icon} size={25} color={BLUE} />
          </View>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>{config.title}</Text>
            <Text style={styles.heroDesc}>{config.description}</Text>
          </View>
          <Text style={styles.countPill}>{itemCountLabel}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.loadingText}>목록을 불러오는 중이에요</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name={config.icon} size={30} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>{config.emptyTitle}</Text>
            <Text style={styles.emptyText}>{config.emptyText}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
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
                        <Text style={styles.badgeText}>{item.badge}</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  headerTitle: {
    fontSize: 18,
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  heroCard: {
    minHeight: 106,
    borderRadius: 20,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBox: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
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
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
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
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#F4F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
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
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
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
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#EAF1FF',
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
