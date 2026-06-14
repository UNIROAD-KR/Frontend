import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { createOrGetChatRoom } from '../../../src/api/chat';
import {
  getTicketDetail,
  TicketTransferResponse,
  TicketType,
} from '../../../src/api/ticket';

const BLUE = '#123F9F';

const ticketTypeLabels: Record<TicketType, string> = {
  TOUR: '관광',
  CONCERT: '공연',
  TRAIN: '기차',
  FLIGHT: '항공권',
  ACCOMMODATION: '숙박',
};

const fallbackTicket: TicketTransferResponse = {
  id: 1,
  authorName: 'may.be',
  authorNickname: 'may.be',
  authorDispatchedCountry: '독일',
  authorDispatchedRegion: '아샤펜부르크',
  authorDispatchSemester: '26-2학기',
  ticketType: 'TOUR',
  title: '사그라다 파밀리아 표 양도',
  content:
    '사그라다 파밀리아 당일 표 양도합니다!\n입장 티켓 받아서 드려요.\n관심 있으신 분은 채팅 부탁드려요 :)',
  country: '스페인',
  eventDate: '2026-05-09',
  eventTime: '16:15',
  location: '사그라다 파밀리아 성당 앞 정문',
  quantity: 1,
  transferPrice: 20,
  originalPrice: 26,
  status: 'AVAILABLE',
};

const formatPrice = (value?: number) => {
  if (!value) {
    return '가격 미정';
  }

  return `${value.toLocaleString()}원`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return '날짜 미정';
  }

  return value.replaceAll('-', '.');
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

const getAuthorName = (ticket: TicketTransferResponse) =>
  ticket.authorNickname || ticket.authorName || '판매자';

const getAuthorMeta = (ticket: TicketTransferResponse) =>
  [
    ticket.authorDispatchedCountry,
    ticket.authorDispatchedRegion,
    ticket.authorDispatchSemester,
  ]
    .filter(Boolean)
    .join(' · ') || '교환학생 판매자';

export default function TicketPreviewPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<'ticket' | 'seller'>('ticket');
  const [ticket, setTicket] = useState<TicketTransferResponse | null>(
    id ? null : fallbackTicket,
  );
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) {
        setTicket(fallbackTicket);
        setLoading(false);
        return;
      }

      try {
        const response = await getTicketDetail(Number(id));
        setTicket(response.data.data);
      } catch (error: any) {
        console.log('티켓 양도 상세 조회 실패:', error.response?.data || error.message);
        Alert.alert('조회 실패', '티켓 양도글을 불러오지 못했어요.');
        setTicket(fallbackTicket);
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  const viewModel = useMemo(() => ticket ?? fallbackTicket, [ticket]);
  const postedTime = formatRelativeTime(
    viewModel.createdAt ?? viewModel.updatedAt,
  );

  const handleStartChat = async () => {
    try {
      const response = await createOrGetChatRoom({
        referenceType: 'TRADE',
        referenceId: viewModel.id,
        targetMemberId: 1,
      });

      const roomId = response.data.roomId;

      router.push({
        pathname: '/chat/[roomId]',
        params: {
          roomId: String(roomId),
          title: viewModel.title,
          price: formatPrice(viewModel.transferPrice),
          sellerName: getAuthorName(viewModel),
        },
      } as any);
    } catch (error: any) {
      console.log('채팅방 생성 실패:', error.response?.data || error.message);
      Alert.alert('채팅 시작 실패', '잠시 후 다시 시도해주세요.');
    }
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppBackButton style={styles.backButton} />

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{viewModel.country || '국가 미정'}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {ticketTypeLabels[viewModel.ticketType]}
            </Text>
          </View>
          {postedTime ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{postedTime}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Ionicons name="share-outline" size={28} color="#111111" />
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(viewModel.transferPrice)}</Text>
          {viewModel.originalPrice ? (
            <Text style={styles.originalPrice}>
              원가 {formatPrice(viewModel.originalPrice)}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {viewModel.quantity}매 / {formatDate(viewModel.eventDate)}{' '}
            {viewModel.eventTime}
          </Text>
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
              <InfoCard icon="calendar-outline" label="날짜" value={formatDate(viewModel.eventDate)} />
              <InfoCard icon="time-outline" label="시간" value={viewModel.eventTime || '시간 미정'} />
              <InfoCard icon="location-outline" label="장소" value={viewModel.location || '장소 미정'} />
              <InfoCard icon="ticket-outline" label="양도 매수" value={`${viewModel.quantity}매`} />
            </View>

            <Text style={styles.sellerTitle}>판매자 글</Text>

            <View style={styles.contentBox}>
              <Text style={styles.contentText}>
                {viewModel.content || '판매자가 아직 상세 설명을 작성하지 않았어요.'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>판매자 정보</Text>
            <Text style={styles.sectionDesc}>
              교환학생 선배 판매자의 기본 정보예요
            </Text>

            <Text style={styles.nickname}>{getAuthorName(viewModel)}</Text>

            <View style={styles.profileCard}>
              <Image
                source={require('../../../assets/images/ticket_profile.png')}
                style={styles.profileImage}
              />

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{getAuthorName(viewModel)}</Text>
                <Text style={styles.profileMeta}>{getAuthorMeta(viewModel)}</Text>
              </View>

              <Text style={styles.profileArrow}>›</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => setLiked(!liked)} style={styles.heartButton}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={36}
            color={liked ? BLUE : '#111111'}
          />
        </Pressable>
        <Pressable style={styles.chatButton} onPress={handleStartChat}>
          <Text style={styles.chatText}>채팅 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoLabelRow}>
        <Ionicons name={icon} size={14} color="#555555" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
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
    paddingTop: 54,
    paddingBottom: 120,
  },
  backButton: {
    marginBottom: 18,
  },
  tagRow: {
    flexDirection: 'row',
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
    minHeight: 86,
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
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 20,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginTop: 16,
    marginBottom: 15,
  },
  profileCard: {
    minHeight: 81,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileImage: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    marginRight: 17,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#333333',
    marginBottom: 5,
  },
  profileMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555555',
  },
  profileArrow: {
    fontSize: 33,
    color: '#000000',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 93,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
  },
  heartButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatButton: {
    flex: 1,
    height: 49,
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
