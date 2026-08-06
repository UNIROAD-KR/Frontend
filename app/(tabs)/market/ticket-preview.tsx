import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  deleteTicket,
  getMyTickets,
  getScrappedTickets,
  getTicketDetail,
  TicketTransferResponse,
  TicketType,
  toggleTicketScrap,
} from '../../../src/api/ticket';
import { createReport, ReportReason } from '../../../src/api/reports';
import { createOrGetChatRoom } from '../../../src/api/chat';
import { getTicketCurrency } from '../../../src/storage/ticketMetadata';

const BLUE = '#123F9F';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LIKED_TICKET_POSTS_STORAGE_KEY = 'univ:profile:liked-ticket-posts';
const REPORT_OPTIONS: { label: string; reason: ReportReason }[] = [
  { label: '사기 의심', reason: 'FRAUD' },
  { label: '부적절한 내용', reason: 'INAPPROPRIATE' },
  { label: '욕설/비방', reason: 'ABUSE' },
  { label: '스팸/광고', reason: 'SPAM' },
  { label: '기타', reason: 'ETC' },
];

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
  currencyUnit?: string;
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
    location: '관광지명',
  },
  CONCERT: {
    date: '공연일',
    time: '공연시간',
    location: '공연 장소',
  },
  TRAIN: {
    date: '출발일',
    time: '출발시간',
    location: '출발역 / 도착역',
  },
  FLIGHT: {
    date: '출발일',
    time: '출발시간',
    location: '출발공항 / 도착공항',
  },
  ACCOMMODATION: {
    date: '체크인 날짜',
    time: '체크아웃 날짜',
    location: '숙소명',
  },
};

const formatPrice = (price: number, currencyUnit = '€') =>
  `${currencyUnit} ${price.toLocaleString('ko-KR')}`;
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

const getTicketAuthorMemberId = (ticket: TicketTransferResponse) => {
  return ticket.memberId ?? ticket.authorMemberId ?? ticket.authorId;
};

const splitTicketDateRange = (ticket: TicketTransferResponse) => {
  if (ticket.ticketType !== 'ACCOMMODATION') {
    return {
      eventDate: ticket.eventDate,
      checkoutDate: '',
    };
  }

  const [eventDate = '', checkoutDate = ''] = ticket.eventDate
    .split('~')
    .map((value) => value.trim());

  return {
    eventDate,
    checkoutDate,
  };
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

const isScrappedTicketPost = async (id: number) => {
  try {
    const response = await getScrappedTickets({ size: 100 });

    return response.data.data.items.some((item) => item.id === id);
  } catch (error: any) {
    console.log('스크랩한 티켓 조회 실패:', error.response?.data || error.message);
    const likedPosts = await readLikedTicketPosts();

    return likedPosts.some((item) => item.id === id);
  }
};

const getTicketPhotos = (ticket: TicketTransferResponse) => {
  return Array.from(
    new Set(
      [
        ticket.thumbnailImageUrl,
        ...(ticket.imageUrls ?? []),
      ].filter((photo): photo is string => Boolean(photo)),
    ),
  );
};

const toStoredTicketPost = (
  ticket: TicketTransferResponse,
  currencyUnit = '€',
): StoredTicketPost => {
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
    price: formatPrice(ticket.transferPrice, currencyUnit),
    time: formatRelativeTime(ticket.createdAt ?? ticket.updatedAt),
    currencyUnit,
  };
};

const syncLikedTicketPost = async (
  ticket: TicketTransferResponse,
  nextLiked: boolean,
  currencyUnit = '€',
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
    JSON.stringify([toStoredTicketPost(ticket, currencyUnit), ...withoutCurrentPost]),
  );
};

export default function TicketPreviewPage() {
  const {
    id,
    fromProfileList,
    fromEditComplete,
    fromCreateComplete,
    fromChatRoom,
    chatRoomId,
    chatTitle,
    chatPrice,
    chatThumbnail,
    chatSellerName,
    chatReferenceType,
    chatReferenceId,
  } =
    useLocalSearchParams<{
    id?: string;
    fromProfileList?: string;
    fromEditComplete?: string;
    fromCreateComplete?: string;
    fromChatRoom?: string;
    chatRoomId?: string;
    chatTitle?: string;
    chatPrice?: string;
    chatThumbnail?: string;
    chatSellerName?: string;
    chatReferenceType?: string;
    chatReferenceId?: string;
  }>();
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<'ticket' | 'seller'>('ticket');
  const [ticket, setTicket] = useState<TicketTransferResponse | null>(null);
  const [canManageTicket, setCanManageTicket] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currencyUnit, setCurrencyUnit] = useState('€');
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
          const savedLiked = await isScrappedTicketPost(nextTicket.id);
          const savedCurrencyUnit = await getTicketCurrency(nextTicket.id);
          let isMine = false;

          try {
            const myTicketResponse = await getMyTickets({ size: 100 });
            isMine = (myTicketResponse.data.data.items ?? []).some(
              (item) => item.id === nextTicket.id,
            );
          } catch (mineError: any) {
            console.log(
              '내 티켓 양도글 확인 실패:',
              mineError.response?.data || mineError.message,
            );
          }

          if (active) {
            setTicket(nextTicket);
            setLiked(savedLiked);
            setCanManageTicket(isMine);
            setCurrencyUnit(savedCurrencyUnit || '€');
          }
        } catch (error: any) {
          console.log('티켓 양도 상세 조회 실패:', error.response?.data || error.message);
          if (active) {
            setTicket(null);
            setCanManageTicket(false);
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
                  referenceType: chatReferenceType ?? 'TICKET',
                  referenceId: chatReferenceId ?? '',
                },
              } as any);
              return;
            }

            if (fromEditComplete === 'true' || fromCreateComplete === 'true') {
              router.replace({
                pathname: '/market',
                params: { tab: 'ticket' },
              } as any);
              return;
            }

            if (
              fromProfileList === 'market' ||
              fromProfileList === 'liked' ||
              fromProfileList === 'saved' ||
              fromProfileList === 'written'
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
  const sellerDomesticUniversity =
    ticket.authorDomesticUniversity || ticket.authorHomeUniversity || '소속대학 미정';
  const sellerUniversity = ticket.authorDispatchedUniversity;
  const sellerRegion =
    ticket.authorDispatchedRegion || ticket.authorDispatchRegion;
  const sellerSemester = formatDispatchSemester(
    ticket.authorDispatchYear,
    ticket.authorDispatchSemester,
  );
  const sellerJoinedDate = formatJoinedDate(ticket.authorDispatchStartDate);
  const ticketPhotos = getTicketPhotos(ticket);
  const handleToggleLike = async () => {
    const wasSaved = liked;

    setLiked((prev) => {
      const next = !prev;

      syncLikedTicketPost(ticket, next, currencyUnit).catch((error) => {
        console.log('저장한 티켓 양도 글 로컬 저장 실패:', error);
      });
      return next;
    });

    try {
      const response = await toggleTicketScrap(ticket.id);
      const nextSaved = response.data.data;

      setLiked(nextSaved);
      setTicket((prev) =>
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
      console.log('티켓 스크랩 실패:', error.response?.data || error.message);
      setLiked(wasSaved);
      Alert.alert('저장 실패', '티켓 저장 상태를 변경하지 못했어요.');
    }
  };
  const handleEditTicket = () => {
    const dates = splitTicketDateRange(ticket);

    router.push({
      pathname: '/market/ticket-write',
      params: {
        editId: String(ticket.id),
        ticketType: ticket.ticketType,
        eventDate: dates.eventDate,
        checkoutDate: dates.checkoutDate,
        eventTime: ticket.eventTime,
        country: ticket.country,
        location: ticket.location,
        quantity: String(ticket.quantity),
        currencyUnit,
        customCurrencyUnit: '',
        transferPrice: String(ticket.transferPrice),
        originalPrice: String(ticket.originalPrice ?? ticket.transferPrice),
        title: ticket.title,
        content: ticket.content,
      },
    } as any);
  };

  const handleDeleteTicket = () => {
    Alert.alert('티켓 양도글 삭제', '이 게시글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTicket(ticket.id);
            Alert.alert('삭제 완료', '티켓 양도글이 삭제되었어요.');
            router.replace({
              pathname: '/market',
              params: { tab: 'ticket', refresh: String(Date.now()) },
            } as any);
          } catch (error: any) {
            console.log('티켓 양도글 삭제 실패:', error.response?.data || error.message);
            Alert.alert(
              '삭제 실패',
              error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
            );
          }
        },
      },
    ]);
  };

  const submitReportTicket = async (reason: ReportReason) => {
    if (reporting) return;

    if (!ticket?.id) {
      Alert.alert('신고할 수 없어요', '신고 대상 게시글 정보를 불러오지 못했어요.');
      return;
    }

    try {
      setReporting(true);
      await createReport({
        targetType: 'TICKET_TRANSFER',
        targetId: ticket.id,
        reason,
        detail: `티켓 양도글 #${ticket.id} 신고`,
      });
      Alert.alert('신고 접수', '운영팀이 게시글을 확인할게요.');
    } catch (error: any) {
      console.log('티켓 양도 신고 실패:', error.response?.data || error.message);
      Alert.alert(
        '신고 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setReporting(false);
    }
  };

  const handleReportTicket = () => {
    Alert.alert('신고하기', '신고 사유를 선택해주세요.', [
      ...REPORT_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => submitReportTicket(option.reason),
      })),
      { text: '취소', style: 'cancel' as const },
    ]);
  };

  const handleStartChat = async () => {
    if (chatLoading) return;

    if (canManageTicket) {
      Alert.alert('채팅 시작 불가', '내가 작성한 티켓 양도글에는 채팅을 시작할 수 없어요.');
      return;
    }

    const targetMemberId = getTicketAuthorMemberId(ticket);

    if (!targetMemberId) {
      Alert.alert(
        '채팅 API 정보 필요',
        '티켓 양도 채팅을 만들려면 티켓 상세 응답에 작성자 memberId(authorMemberId)가 필요해요. 현재 스웨거 응답에는 이 값이 없어서 백엔드에 추가 요청이 필요합니다.',
      );
      return;
    }

    try {
      setChatLoading(true);
      const response = await createOrGetChatRoom({
        referenceType: 'TICKET',
        referenceId: ticket.id,
        targetMemberId,
      });

      router.push({
        pathname: '/chat/[roomId]',
        params: {
          roomId: String(response.data.roomId),
          title: ticket.title,
          price: formatPrice(ticket.transferPrice, currencyUnit),
          thumbnail: '',
          sellerName: sellerNickname,
          referenceType: 'TICKET',
          referenceId: String(ticket.id),
          opponentMemberId: String(targetMemberId),
        },
      } as any);
    } catch (error: any) {
      console.log('티켓 양도 채팅방 생성 실패:', error.response?.data || error.message);
      Alert.alert(
        '채팅 연결 실패',
        error.response?.data?.message ??
          '현재 채팅 API가 티켓 양도글을 지원하지 않을 수 있어요.',
      );
    } finally {
      setChatLoading(false);
    }
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
        <View style={styles.detailHeader}>
          <AppBackButton
            style={styles.backButton}
            onPress={() => {
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
                    referenceType: chatReferenceType ?? 'TICKET',
                    referenceId: chatReferenceId ?? '',
                  },
                } as any);
                return;
              }

              if (fromEditComplete === 'true' || fromCreateComplete === 'true') {
                router.replace({
                  pathname: '/market',
                  params: { tab: 'ticket' },
                } as any);
                return;
              }

              if (
                fromProfileList === 'market' ||
                fromProfileList === 'liked' ||
                fromProfileList === 'saved' ||
                fromProfileList === 'written'
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

          <Pressable
            style={styles.moreButton}
            onPress={() => setMenuVisible((prev) => !prev)}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#111111" />
          </Pressable>
        </View>

        {menuVisible && (
          <>
            <Pressable
              style={styles.menuBackdrop}
              onPress={() => setMenuVisible(false)}
            />
            <View style={styles.postMenuPopover}>
              <View style={styles.postMenuArrow} />
              {canManageTicket ? (
                <>
                  <Pressable
                    style={styles.postMenuRow}
                    onPress={() => {
                      setMenuVisible(false);
                      handleEditTicket();
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#111111" />
                    <Text style={styles.postMenuText}>수정하기</Text>
                  </Pressable>

                  <Pressable
                    style={styles.postMenuRow}
                    onPress={() => {
                      setMenuVisible(false);
                      handleDeleteTicket();
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
                    handleReportTicket();
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

        {ticketPhotos.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.photoScroller}
          >
            {ticketPhotos.map((photo, index) => (
              <Image
                key={`${photo}-${index}`}
                source={{ uri: photo }}
                style={styles.ticketPhoto}
              />
            ))}
          </ScrollView>
        )}

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
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(ticket.transferPrice, currencyUnit)}
          </Text>
          <Text style={styles.originalPrice}>
            원가 {formatPrice(ticket.originalPrice ?? ticket.transferPrice, currencyUnit)}
          </Text>
          <Text style={styles.meta}>{metaText}</Text>
          <Text style={styles.scrapMeta}>스크랩 {ticket.scrapCount ?? 0}</Text>
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
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName}>{sellerNickname}</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={13} color={BLUE} />
                      <Text style={styles.verifiedText}>인증완료</Text>
                    </View>
                  </View>
                  {sellerSemester.length > 0 && (
                    <Text style={styles.profileSemester}>{sellerSemester}</Text>
                  )}
                </View>
              </View>

              <View style={styles.profileDetailList}>
                {sellerJoinedDate.length > 0 && (
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>가입일</Text>
                    <Text style={styles.profileDetailValue}>
                      {sellerJoinedDate}
                    </Text>
                  </View>
                )}

                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>소속대학</Text>
                  <Text style={styles.profileDetailValue}>
                    {sellerDomesticUniversity}
                  </Text>
                </View>

                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>파견 지역</Text>
                  <Text style={styles.profileDetailValue}>
                    {[ticket.authorDispatchedCountry, sellerRegion]
                      .filter(Boolean)
                      .join(' · ') || '파견 지역 미정'}
                  </Text>
                </View>

                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>파견교</Text>
                  <Text style={styles.profileDetailValue}>
                    {sellerUniversity || '파견교 미정'}
                  </Text>
                </View>

                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>파견학기</Text>
                  <Text style={styles.profileDetailValue}>
                    {sellerSemester || '학기 미정'}
                  </Text>
                </View>
              </View>
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
          <Ionicons
            name={liked ? 'bookmark' : 'bookmark-outline'}
            size={30}
            color={liked ? BLUE : '#111111'}
          />
        </Pressable>
        <Pressable
          style={[styles.chatButton, chatLoading && styles.chatButtonDisabled]}
          onPress={handleStartChat}
          disabled={chatLoading}
        >
          <Text style={styles.chatText}>
            {chatLoading ? '채팅방 여는 중...' : '채팅 시작하기'}
          </Text>
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
  detailHeader: {
    height: 40,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoScroller: {
    width: '100%',
    height: 260,
    marginBottom: 18,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    overflow: 'hidden',
  },
  ticketPhoto: {
    width: SCREEN_WIDTH - 40,
    height: 260,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F8FC',
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
  scrapMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: '#777777',
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
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333333',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '900',
    color: BLUE,
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
  chatButtonDisabled: {
    opacity: 0.6,
  },
  chatText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
