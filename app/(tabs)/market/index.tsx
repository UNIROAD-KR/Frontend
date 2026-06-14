import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';

import {
  getTickets,
  TicketTransferResponse,
  TicketType,
} from '../../../src/api/ticket';
import { getUsedItems, UsedItem } from '../../../src/api/usedItems';
import { canUseMarketWithoutVerification } from '../../../src/utils/verification';

const countryTabs = ['전체', '독일', '프랑스', '스페인', '체코'];

const ticketItems = [
  {
    id: 1,
    country: '독일',
    semester: '2026-1학기',
    time: '7분 전',
    region: '바르셀로나',
    category: '관광',
    title: '사그라다 파밀리아 표 양도',
    date: '5월 9일 (목)',
    count: '1매',
    price: '€20',
    originalPrice: '€26',
    likes: 4,
  },
  {
    id: 2,
    country: '프랑스',
    semester: '2026-1학기',
    time: '31분 전',
    region: '파리',
    category: '관광',
    title: '파리 롤랑가로스 아웃사이드 코트 티켓 양도',
    date: '6월 2일 (화)',
    count: '1매',
    price: '€30',
    originalPrice: '',
    likes: 5,
  },
  {
    id: 3,
    country: '독일',
    semester: '2026-1학기',
    time: '1시간 전',
    region: '뮌헨',
    category: '콘서트',
    title: '뮌헨 Coldplay 콘서트 티켓 양도',
    date: '5월 24일 (토)',
    count: '1매',
    price: '€100',
    originalPrice: '€130',
    likes: 7,
  },
];

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

const formatTicketPrice = (price: number) => `€ ${price.toLocaleString('ko-KR')}`;

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

export default function MarketPage() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [items, setItems] = useState<UsedItem[]>([]);
  const [tickets, setTickets] = useState<TicketTransferResponse[]>([]);
  const [ticketNextCursorId, setTicketNextCursorId] = useState<number | null>(
    null,
  );
  const [ticketHasNext, setTicketHasNext] = useState(false);
  const [ticketLoadingMore, setTicketLoadingMore] = useState(false);
  const ticketLoadingMoreRef = useRef(false);
  const [selectedType, setSelectedType] = useState<'bulk' | 'ticket'>('bulk');
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [isFabOpen, setIsFabOpen] = useState(false);

  useEffect(() => {
    if (tab === 'ticket') {
      setSelectedType('ticket');
    } else {
      setSelectedType('bulk');
    }
  }, [tab]);

  const fetchUsedItems = async () => {
    try {
      const response = await getUsedItems();
      console.log('중고거래 목록:', response.data);
      setItems(response.data.data.items ?? []);
    } catch (error: any) {
      console.log(
        '중고거래 목록 조회 실패:',
        error.response?.data || error.message,
      );
    }
  };

  const fetchTickets = async (cursorId?: number) => {
    try {
      if (cursorId) {
        ticketLoadingMoreRef.current = true;
        setTicketLoadingMore(true);
      }

      const response = await getTickets(cursorId, 10);
      const { items: nextItems = [], nextCursorId, hasNext } =
        response.data.data;

      setTickets((prev) => {
        if (!cursorId) {
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
  };

  const fetchNextTickets = () => {
    if (!ticketHasNext || !ticketNextCursorId || ticketLoadingMoreRef.current) {
      return;
    }

    fetchTickets(ticketNextCursorId);
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
            onPress: () => router.push('/verification' as any),
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
      fetchUsedItems();
      fetchTickets();
      checkVerificationStatus();
    }, []),
  );

  const toggleLike = (id: number) => {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleBookmark = (id: number) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleFabPress = () => {
    if (selectedType === 'ticket') {
      setIsFabOpen(false);
      requireVerificationBefore('/market/ticket-write');
      return;
    }

    setIsFabOpen((prev) => !prev);
  };

  const requireVerificationBefore = async (path: string) => {
    try {
      const canUseMarket = await canUseMarketWithoutVerification();

      if (canUseMarket) {
        router.push(path as any);
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
        { text: '신원 인증하기', onPress: () => router.push('/verification' as any) },
      ],
    );
  };

  const displayItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    region: item.region,
    semester: item.semester,
    time: '방금 전',
    priceText: formatPrice(item.price),
    likes: 0,
    chats: 0,
    imageUrl: item.thumbnailImageUrl ?? '',
  }));

  const filteredItems =
    selectedCountry === '전체'
      ? displayItems
      : displayItems.filter((item) => item.region === selectedCountry);

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
    price: formatTicketPrice(item.transferPrice),
    originalPrice: item.originalPrice
      ? formatTicketPrice(item.originalPrice)
      : '',
    likes: 0,
  }));

  const filteredTickets =
    selectedCountry === '전체'
      ? displayTickets
      : displayTickets.filter((item) => item.region.includes(selectedCountry));

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleMarketScroll}
      >
        <View style={styles.header}>
          <Text style={styles.title}>교환학생 전용 거래</Text>

          <View style={styles.headerIcons}>
            <Pressable>
              <Image
                source={require('../../../assets/images/alarm.png')}
                style={styles.headerIconImage}
              />
            </Pressable>

            <Pressable>
              <Image
                source={require('../../../assets/images/menu.png')}
                style={styles.headerIconImage}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.tradeTypeBox}>
          <Pressable
            style={[
              styles.tradeTypeButton,
              selectedType === 'bulk' && styles.tradeTypeActive,
            ]}
            onPress={() => {
              setSelectedType('bulk');
              setIsFabOpen(false);
            }}
          >
            <Text
              style={[
                styles.tradeTypeText,
                selectedType === 'bulk' && styles.tradeTypeTextActive,
              ]}
            >
              귀국 전 일괄 거래
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tradeTypeButton,
              selectedType === 'ticket' && styles.tradeTypeActive,
            ]}
            onPress={() => {
              setSelectedType('ticket');
              setIsFabOpen(false);
            }}
          >
            <Text
              style={[
                styles.tradeTypeText,
                selectedType === 'ticket' && styles.tradeTypeTextActive,
              ]}
            >
              티켓 양도
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="파견 국가 및 지역 검색"
            placeholderTextColor="#777777"
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

        {selectedType === 'bulk' ? (
          filteredItems.length > 0 ? (
            <View style={styles.postList}>
              {filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.postCard}
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
                        likedIds.includes(item.id) && styles.heartCircleActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(item.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.heart,
                          likedIds.includes(item.id) && styles.heartActive,
                        ]}
                      >
                        ♥
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.postInfo}>
                    <View style={styles.postTop}>
                      <Text style={styles.postTitle}>{item.title}</Text>
                      <Text style={styles.arrow}>›</Text>
                    </View>

                    <Text style={styles.meta}>
                      {item.region} · {item.semester} · {item.time}
                    </Text>

                    <Text style={styles.price}>{item.priceText}</Text>

                    <View style={styles.reactionRow}>
                      <View style={styles.reactionItem}>
                        <Image
                          source={require('../../../assets/images/good.png')}
                          style={styles.reactionIcon}
                        />
                        <Text style={styles.reactionText}>{item.likes}</Text>
                      </View>

                      <View style={styles.reactionItem}>
                        <Image
                          source={require('../../../assets/images/comment.png')}
                          style={styles.reactionIcon}
                        />
                        <Text style={styles.reactionText}>{item.chats}</Text>
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
                  <Text style={styles.ticketTitle}>{item.title}</Text>
                  <Pressable
                    style={styles.bookmarkButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item.id);
                    }}
                  >
                    <View style={styles.bookmarkIconWrapper}>
                      <Image
                        source={
                          bookmarkedIds.includes(item.id)
                            ? require('../../../assets/images/filled_book_mark.png')
                            : require('../../../assets/images/book_mark.png')
                        }
                        style={styles.bookmarkIcon}
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
                  <Text style={styles.ticketLike}>♡ {item.likes}</Text>
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
            onPress={() => requireVerificationBefore('/market/write')}
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
            onPress={() => requireVerificationBefore('/market/ticket-preview')}
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

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 23,
    paddingTop: 84,
    paddingBottom: 120,
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
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
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

  tradeTypeButton: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tradeTypeActive: {
    backgroundColor: '#FFFFFF',
  },

  tradeTypeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8F8F8F',
  },

  tradeTypeTextActive: {
    color: '#111111',
    fontWeight: '900',
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
    gap: 20,
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

  postCard: {
    flexDirection: 'row',
  },

  thumbnail: {
    width: 144,
    height: 144,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    marginRight: 16,
    overflow: 'hidden',
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  heartCircle: {
    position: 'absolute',
    right: 9,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartCircleActive: {
    backgroundColor: '#FFE3EC',
  },

  heart: {
    color: '#FFFFFF',
    fontSize: 21,
  },

  heartActive: {
    color: '#FF4F7B',
  },

  postInfo: {
    flex: 1,
    paddingTop: 6,
  },

  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  postTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#111111',
  },

  arrow: {
    fontSize: 34,
    color: '#777777',
  },

  meta: {
    fontSize: 12,
    color: '#777777',
    marginTop: 8,
  },

  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    marginTop: 6,
  },

  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
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
    bottom: 42,
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
    bottom: 104,
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
