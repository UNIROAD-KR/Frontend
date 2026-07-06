import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  getTicketDetail,
  TicketTransferResponse,
  TicketType,
} from '../../../src/api/ticket';

const BLUE = '#123F9F';
const LIKED_TICKET_POSTS_STORAGE_KEY = 'univ:profile:liked-ticket-posts';

const ticketTypeLabelMap: Record<TicketType, string> = {
  TOUR: '관광 티켓',
  CONCERT: '콘서트 / 공연',
  TRAIN: '기차',
  FLIGHT: '항공권',
  ACCOMMODATION: '숙박',
};

type TicketInfoLabels = {
  date: string;
  time: string;
  location: string;
};

type StoredTicketPost = {
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

const defaultTicketInfoLabels: TicketInfoLabels = {
  date: '날짜',
  time: '시간',
  location: '장소',
};

const ticketInfoLabelMap: Partial<Record<TicketType, TicketInfoLabels>> = {
  TOUR: {
    date: '이용일',
    time: '이용시간',
    location: '이용 장소',
  },
  CONCERT: {
    date: '공연일',
    time: '공연시간',
    location: '공연 장소',
  },
  TRAIN: {
    date: '탑승일',
    time: '탑승시간',
    location: '출발/도착 장소',
  },
  FLIGHT: {
    date: '출발일',
    time: '출발시간',
    location: '출발/도착 공항',
  },
  ACCOMMODATION: {
    date: '체크인 날짜',
    time: '체크아웃 날짜',
    location: '숙소 위치',
  },
};

const formatPrice = (price: number) => `€ ${price.toLocaleString('ko-KR')}`;
const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const formatRelativeTime = (value?: string) => {
  if (!value) return '';

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return value.slice(0, 10).replaceAll('-', '.');
  }

  const diffMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return value.slice(0, 10).replaceAll('-', '.');
};

const formatDate = (date: string) => {
  const trimmedDate = date.trim();
  const matchedDate = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!matchedDate) return trimmedDate;

  const [, year, month, day] = matchedDate;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return trimmedDate;
  }

  return `${year}. ${month}. ${day} (${weekdayLabels[parsedDate.getDay()]})`;
};

const getAccommodationDates = (dateRange: string) => {
  const [startDate, endDate] = dateRange.split('~').map((date) => date.trim());

  return {
    checkIn: startDate ? formatDate(startDate) : formatDate(dateRange),
    checkOut: endDate ? formatDate(endDate) : '-',
  };
};

const formatAccommodationDateRange = (dateRange: string) => {
  const { checkIn, checkOut } = getAccommodationDates(dateRange);

  if (checkOut === '-') {
    return formatDate(dateRange);
  }

  return `${checkIn} ~ ${checkOut}`;
};

const formatDispatchSemester = (
  year?: number | string,
  semester?: number | string,
) => {
  if (!year || !semester) return '';

  const firstValue = String(year);
  const secondValue = String(semester);
  const firstNumber = Number(firstValue.replace(/[^0-9]/g, ''));
  const secondNumber = Number(secondValue.replace(/[^0-9]/g, ''));
  const dispatchYear =
    firstNumber >= 1000 ? firstNumber : secondNumber >= 1000 ? secondNumber : 0;
  const dispatchSemester =
    firstNumber >= 1 && firstNumber <= 2
      ? firstNumber
      : secondNumber >= 1 && secondNumber <= 2
        ? secondNumber
        : 0;

  if (!dispatchYear || !dispatchSemester) return '';

  return `${String(dispatchYear).slice(-2)}-${dispatchSemester}학기 파견생`;
};

const formatJoinedDate = (date?: string) => {
  const matchedDate = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!matchedDate) return '';

  const [, year, month, day] = matchedDate;

  return `${year}년 ${Number(month)}월 ${Number(day)}일 가입`;
};

const readLikedTicketPosts = async () => {
  const rawPosts = await AsyncStorage.getItem(LIKED_TICKET_POSTS_STORAGE_KEY);

  if (!rawPosts) return [];

  try {
    const parsedPosts = JSON.parse(rawPosts);

    return Array.isArray(parsedPosts)
      ? (parsedPosts as StoredTicketPost[])
      : [];
  } catch {
    await AsyncStorage.removeItem(LIKED_TICKET_POSTS_STORAGE_KEY);
    return [];
  }
};

const isLikedTicketPost = async (id: number) => {
  const likedPosts = await readLikedTicketPosts();

  return likedPosts.some((item) => item.id === id);
};

const toStoredTicketPost = (ticket: TicketTransferResponse): StoredTicketPost => {
  const isAccommodation = ticket.ticketType === 'ACCOMMODATION';
  const eventDate = isAccommodation
    ? formatAccommodationDateRange(ticket.eventDate)
    : formatDate(ticket.eventDate);

  return {
    id: ticket.id,
    title: ticket.title,
    country: ticket.authorDispatchedCountry ?? '',
    semester: ticketTypeLabelMap[ticket.ticketType],
    region: ticket.country,
    category: ticketTypeLabelMap[ticket.ticketType],
    date: eventDate,
    price: formatPrice(ticket.transferPrice),
    time: formatRelativeTime(ticket.createdAt ?? ticket.updatedAt),
  };
};

const syncLikedTicketPost = async (
  ticket: TicketTransferResponse,
  nextLiked: boolean,
) => {
  const likedPosts = await readLikedTicketPosts();
  const withoutCurrentPost = likedPosts.filter((item) => item.id !== ticket.id);

  if (!nextLiked) {
    await AsyncStorage.setItem(
      LIKED_TICKET_POSTS_STORAGE_KEY,
      JSON.stringify(withoutCurrentPost),
    );
    return;
  }

  await AsyncStorage.setItem(
    LIKED_TICKET_POSTS_STORAGE_KEY,
    JSON.stringify([toStoredTicketPost(ticket), ...withoutCurrentPost]),
  );
};

export default function TicketPreviewPage() {
  const { id, fromProfileList } = useLocalSearchParams<{
    id?: string;
    fromProfileList?: string;
  }>();
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<'ticket' | 'seller'>('ticket');
  const [ticket, setTicket] = useState<TicketTransferResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const bottomSafePadding = 4;
  const bottomBarHeight = 60;
  const topSafePadding = Math.max(54, insets.top + 12);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTicket = async () => {
        const numericId = Number(id);

        if (!id || !Number.isFinite(numericId)) {
          setTicket(null);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const response = await getTicketDetail(numericId);
          const nextTicket = response.data.data;
          const savedLiked = await isLikedTicketPost(nextTicket.id);

          if (active) {
            setTicket(nextTicket);
            setLiked(savedLiked);
          }
        } catch (error: any) {
          console.log('티켓 양도 상세 조회 실패:', error.response?.data || error.message);
          if (active) {
            setTicket(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      loadTicket();

      return () => {
        active = false;
      };
    }, [id]),
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={BLUE} />
        <Text style={styles.centerText}>티켓 정보를 불러오는 중이에요</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <AppBackButton
          style={[styles.centerBackButton, { top: topSafePadding }]}
          onPress={() => {
            if (
              fromProfileList === 'market' ||
              fromProfileList === 'liked' ||
              fromProfileList === 'saved'
            ) {
              router.replace({
                pathname: '/home/profile-list',
                params: { type: fromProfileList },
              } as any);
              return;
            }

            router.back();
          }}
        />
        <Text style={styles.emptyTitle}>게시글을 찾을 수 없어요</Text>
        <Text style={styles.emptyText}>목록에서 다시 선택해주세요.</Text>
      </View>
    );
  }

  const category = ticketTypeLabelMap[ticket.ticketType];
  const isAccommodation = ticket.ticketType === 'ACCOMMODATION';
  const infoLabels =
    ticketInfoLabelMap[ticket.ticketType] ?? defaultTicketInfoLabels;
  const accommodationDates = getAccommodationDates(ticket.eventDate);
  const eventDate = isAccommodation
    ? formatAccommodationDateRange(ticket.eventDate)
    : formatDate(ticket.eventDate);
  const infoDate = isAccommodation ? accommodationDates.checkIn : eventDate;
  const infoTime = isAccommodation
    ? accommodationDates.checkOut
    : ticket.eventTime;
  const metaText = isAccommodation
    ? `${ticket.quantity}매 / ${eventDate}`
    : `${ticket.quantity}매 / ${eventDate} ${ticket.eventTime}`;
  const postedTime = formatRelativeTime(ticket.createdAt ?? ticket.updatedAt);
  const sellerNickname = ticket.authorNickname || ticket.authorName;
  const sellerUniversity = ticket.authorDispatchedUniversity;
  const sellerRegion =
    ticket.authorDispatchedRegion || ticket.authorDispatchRegion;
  const sellerSemester = formatDispatchSemester(
    ticket.authorDispatchYear,
    ticket.authorDispatchSemester,
  );
  const sellerJoinedDate = formatJoinedDate(ticket.authorDispatchStartDate);
  const handleToggleLike = () => {
    setLiked((prev) => {
      const next = !prev;

      syncLikedTicketPost(ticket, next).catch((error) => {
        console.log('좋아요한 티켓 양도 글 저장 실패:', error);
      });

      return next;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topSafePadding,
            paddingBottom: bottomBarHeight + 18,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppBackButton
          style={styles.backButton}
          onPress={() => {
            if (
              fromProfileList === 'market' ||
              fromProfileList === 'liked' ||
              fromProfileList === 'saved'
            ) {
              router.replace({
                pathname: '/home/profile-list',
                params: { type: fromProfileList },
              } as any);
              return;
            }

            router.back();
          }}
        />

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{ticket.location}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{category}</Text>
          </View>
          {postedTime ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{postedTime}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={3}>
            {ticket.title}
          </Text>
          <Image
            source={require('../../../assets/images/share.png')}
            style={styles.shareIcon}
          />
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(ticket.transferPrice)}</Text>
          <Text style={styles.originalPrice}>
            원가 {formatPrice(ticket.originalPrice ?? ticket.transferPrice)}
          </Text>
          <Text style={styles.meta}>{metaText}</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable style={styles.tabButton} onPress={() => setTab('ticket')}>
            <Text style={styles.tabText}>티켓 정보</Text>
            {tab === 'ticket' && <View style={styles.activeLine} />}
          </Pressable>

          <Pressable style={styles.tabButton} onPress={() => setTab('seller')}>
            <Text style={styles.tabText}>판매자 정보</Text>
            {tab === 'seller' && <View style={styles.activeLine} />}
          </Pressable>
        </View>

        {tab === 'ticket' ? (
          <>
            <Text style={styles.sectionTitle}>티켓 정보</Text>
            <Text style={styles.sectionDesc}>
              티켓 정보 및 판매자가 직접 작성한 내용이에요
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{infoLabels.date}</Text>
                <Text style={styles.infoValue}>{infoDate}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{infoLabels.time}</Text>
                <Text style={styles.infoValue}>{infoTime}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{infoLabels.location}</Text>
                <Text style={styles.infoValue}>{ticket.location}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>양도 매수</Text>
                <Text style={styles.infoValue}>{ticket.quantity}매</Text>
              </View>
            </View>

            <Text style={styles.sellerTitle}>판매자 글</Text>

            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{ticket.content}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>판매자 정보</Text>
            <Text style={styles.sectionDesc}>
              교환학생 티켓 양도 판매자의 기본 정보예요
            </Text>

            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <Image
                  source={require('../../../assets/images/ticket_profile.png')}
                  style={styles.profileImage}
                />

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{sellerNickname}</Text>
                  {sellerSemester.length > 0 && (
                    <Text style={styles.profileSemester}>{sellerSemester}</Text>
                  )}
                </View>
              </View>

              {(sellerJoinedDate ||
                ticket.authorDispatchedCountry ||
                sellerUniversity ||
                sellerRegion) && (
                <View style={styles.profileDetailList}>
                  {sellerJoinedDate.length > 0 && (
                    <View style={styles.profileDetailRow}>
                      <Text style={styles.profileDetailLabel}>가입일</Text>
                      <Text style={styles.profileDetailValue}>
                        {sellerJoinedDate}
                      </Text>
                    </View>
                  )}
                  {(ticket.authorDispatchedCountry || sellerRegion) && (
                    <View style={styles.profileDetailRow}>
                      <Text style={styles.profileDetailLabel}>파견 지역</Text>
                      <Text style={styles.profileDetailValue}>
                        {[ticket.authorDispatchedCountry, sellerRegion]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  )}
                  {sellerUniversity && (
                    <View style={styles.profileDetailRow}>
                      <Text style={styles.profileDetailLabel}>파견교</Text>
                      <Text style={styles.profileDetailValue}>
                        {sellerUniversity}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}
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
        <Pressable onPress={handleToggleLike} style={styles.heartButton}>
          <Image
            source={
              liked
                ? require('../../../assets/images/filled_heart.png')
                : require('../../../assets/images/heart.png')
            }
            style={styles.heartIcon}
          />
        </Pressable>
        <Pressable
          style={styles.chatButton}
          onPress={() => Alert.alert('준비 중', '채팅 연결은 상세 기능에서 연결할 예정이에요.')}
        >
          <Text style={styles.chatText}>채팅 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerBackButton: {
    position: 'absolute',
    left: 20,
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#777777',
  },
  backButton: {
    marginBottom: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  tag: {
    height: 24,
    minWidth: 62,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#777777',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    color: '#000000',
  },
  shareIcon: {
    width: 27,
    height: 27,
    resizeMode: 'contain',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#C8C8C8',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  meta: {
    fontSize: 12,
    color: '#555555',
  },
  tabRow: {
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 25,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
  },
  activeLine: {
    position: 'absolute',
    bottom: -1,
    width: '92%',
    height: 4,
    borderRadius: 99,
    backgroundColor: '#102BE0',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#666666',
    marginBottom: 28,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: '47%',
    minHeight: 82,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 9,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
    marginBottom: 9,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 19,
  },
  sellerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },
  contentBox: {
    minHeight: 143,
    borderRadius: 6,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 21,
    paddingVertical: 22,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#111111',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
    marginTop: 14,
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 13,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333333',
    marginBottom: 4,
  },
  profileSemester: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
    lineHeight: 17,
  },
  profileDetailList: {
    gap: 9,
    paddingTop: 2,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetailLabel: {
    width: 52,
    fontSize: 12,
    fontWeight: '800',
    color: '#777777',
  },
  profileDetailValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: '#222222',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heartButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heartIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  chatButton: {
    flex: 1,
    height: 52,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
