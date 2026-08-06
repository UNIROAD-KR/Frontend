import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { getMemberMe } from '../../src/api/auth';
import {
  ChatRoomResponse,
  ChatMessageResponse,
  getChatRooms,
  getChatMessages,
  readChatRoom,
  sendChatMessage,
} from '../../src/api/chat';
import { getUsedItemDetail } from '../../src/api/usedItems';
import { getTicketDetail } from '../../src/api/ticket';
import { createReport, ReportReason } from '../../src/api/reports';
import { getTicketCurrency } from '../../src/storage/ticketMetadata';

type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number | 'me' | 'other';
  message: string;
  type?: string;
  createdAt: string;
  unreadCount?: number;
  readCount?: number;
  read?: boolean;
  readByOpponent?: boolean;
  isRead?: boolean;
};

type ProductInfo = {
  title: string;
  price: string;
  thumbnail: string;
  sellerName?: string;
};

const BLUE = '#123F9F';
const GENERIC_TITLES = ['채팅', '중고거래 채팅', '멘토링 채팅', '티켓 양도 채팅'];
const REPORT_OPTIONS: { label: string; reason: ReportReason }[] = [
  { label: '사기 의심', reason: 'FRAUD' },
  { label: '부적절한 내용', reason: 'INAPPROPRIATE' },
  { label: '욕설/비방', reason: 'ABUSE' },
  { label: '스팸/광고', reason: 'SPAM' },
  { label: '기타', reason: 'ETC' },
];

const normalizeMessage = (item: ChatMessageResponse): ChatMessage => ({
  id: item.id,
  roomId: item.roomId,
  senderId: item.senderId,
  message: item.message ?? item.content ?? '',
  type: item.type,
  createdAt: item.createdAt,
  unreadCount: item.unreadCount,
  readCount: item.readCount,
  read: item.read,
  readByOpponent: item.readByOpponent,
  isRead: item.isRead,
});

const sortMessagesByTime = (items: ChatMessage[]) => {
  return [...items].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

const mergeMessagesById = (
  currentMessages: ChatMessage[],
  nextMessages: ChatMessage[],
) => {
  const messageMap = new Map<number, ChatMessage>();

  [...currentMessages, ...nextMessages].forEach((item) => {
    messageMap.set(item.id, item);
  });

  return sortMessagesByTime(Array.from(messageMap.values()));
};

const formatProductPrice = (value?: number, currencyUnit = '원') => {
  if (!value) return '가격 미정';

  return currencyUnit === '원'
    ? `${value.toLocaleString('ko-KR')}원`
    : `${currencyUnit} ${value.toLocaleString('ko-KR')}`;
};

const isGenericTitle = (value?: string) => {
  return !value || GENERIC_TITLES.includes(value.trim());
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 || 12;

  return `${meridiem} ${displayHour}:${minutes}`;
};

const getReadStatus = (item: ChatMessage) => {
  if (item.isRead) {
    return '읽음';
  }

  if (item.readByOpponent || item.read || item.unreadCount === 0) {
    return '읽음';
  }

  if (typeof item.readCount === 'number' && item.readCount > 1) {
    return '읽음';
  }

  return '1';
};

export default function ChatRoomPage() {
  const {
    roomId,
    title,
    price,
    thumbnail,
    sellerName,
    referenceType,
    referenceId,
    opponentMemberId,
  } = useLocalSearchParams<{
    roomId: string;
    title?: string;
    price?: string;
    thumbnail?: string;
    sellerName?: string;
    referenceType?: string;
    referenceId?: string;
    opponentMemberId?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);
  const numericRoomId = Number(roomId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [roomInfo, setRoomInfo] = useState<ChatRoomResponse | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const effectiveReferenceType = roomInfo?.referenceType ?? referenceType;
  const effectiveReferenceId =
    roomInfo?.referenceId !== undefined
      ? String(roomInfo.referenceId)
      : referenceId;
  const parsedOpponentMemberId = opponentMemberId
    ? Number(opponentMemberId)
    : undefined;
  const effectiveOpponentMemberId =
    roomInfo?.opponentMemberId ??
    (Number.isFinite(parsedOpponentMemberId)
      ? parsedOpponentMemberId
      : undefined);
  const displaySellerName =
    sellerName ||
    roomInfo?.opponentNickname ||
    roomInfo?.opponentName ||
    productInfo?.sellerName ||
    '채팅';
  const productTitle =
    productInfo?.title ||
    (!isGenericTitle(title) ? title : undefined) ||
    (effectiveReferenceType === 'TICKET' ? '티켓 양도글' : '중고거래 게시글');
  const productPrice = productInfo?.price || price || '가격 미정';
  const productThumbnail = productInfo?.thumbnail || thumbnail || '';

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const fetchCurrentMember = useCallback(async () => {
    try {
      const response = await getMemberMe();
      setCurrentMemberId(response.data.data.id);
    } catch (error: any) {
      console.log('내 정보 조회 실패:', error.response?.data || error.message);
    }
  }, []);

  const fetchRoomInfo = useCallback(async () => {
    if (!Number.isFinite(numericRoomId)) return;

    try {
      const response = await getChatRooms();
      const currentRoom = response.data.find(
        (room) => room.roomId === numericRoomId,
      );

      if (currentRoom) {
        setRoomInfo(currentRoom);
      }
    } catch (error: any) {
      console.log('채팅방 정보 조회 실패:', error.response?.data || error.message);
    }
  }, [numericRoomId]);

  const fetchProductInfo = useCallback(async () => {
    const numericReferenceId = Number(effectiveReferenceId);

    if (!Number.isFinite(numericReferenceId)) {
      return;
    }

    try {
      if (effectiveReferenceType === 'TRADE') {
        const response = await getUsedItemDetail(numericReferenceId);
        const item = response.data.data;

        setProductInfo({
          title: item.title,
          price: formatProductPrice(item.price),
          thumbnail: item.thumbnailImageUrl ?? '',
          sellerName: item.authorNickname || item.authorName,
        });
        return;
      }

      if (effectiveReferenceType === 'TICKET') {
        const response = await getTicketDetail(numericReferenceId);
        const item = response.data.data;
        const currencyUnit = await getTicketCurrency(item.id);

        setProductInfo({
          title: item.title,
          price: formatProductPrice(item.transferPrice, currencyUnit || '€'),
          thumbnail: '',
          sellerName: item.authorNickname || item.authorName,
        });
      }
    } catch (error: any) {
      console.log('채팅 게시글 조회 실패:', error.response?.data || error.message);
    }
  }, [effectiveReferenceId, effectiveReferenceType]);

  const fetchMessages = useCallback(async () => {
    if (!Number.isFinite(numericRoomId)) return;

    try {
      const response = await getChatMessages(numericRoomId);
      const payload = response.data;
      const rawMessages = Array.isArray(payload)
        ? payload
        : (payload?.content ?? []);

      setMessages(sortMessagesByTime(rawMessages.map(normalizeMessage)));
      readChatRoom(numericRoomId).catch((error: any) => {
        console.log('채팅방 읽음 처리 실패:', error.response?.data || error.message);
      });
    } catch (error: any) {
      console.log('메시지 조회 실패:', error.response?.data || error.message);
    }
  }, [numericRoomId]);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentMember();
      fetchRoomInfo();
      fetchMessages();

      const messageTimer = setInterval(fetchMessages, 2500);
      const roomTimer = setInterval(fetchRoomInfo, 7000);

      return () => {
        clearInterval(messageTimer);
        clearInterval(roomTimer);
      };
    }, [fetchCurrentMember, fetchMessages, fetchRoomInfo]),
  );

  useEffect(() => {
    fetchProductInfo();
  }, [fetchProductInfo]);

  const handleSend = async () => {
    const text = message.trim();

    if (!text || sending || !Number.isFinite(numericRoomId)) return;

    try {
      setSending(true);
      const response = await sendChatMessage(numericRoomId, text);

      setMessages((prev) =>
        mergeMessagesById(prev, [normalizeMessage(response.data)]),
      );
      setMessage('');
      setTimeout(fetchMessages, 250);
    } catch (error: any) {
      console.log('메시지 전송 실패:', error.response?.data || error.message);
      Alert.alert(
        '메시지 전송 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSending(false);
    }
  };

  const submitReport = async (reason: ReportReason) => {
    if (reporting) return;

    const numericReferenceId = Number(effectiveReferenceId);
    const target = effectiveReferenceType === 'TICKET' && Number.isFinite(numericReferenceId)
      ? {
          targetType: 'TICKET_TRANSFER' as const,
          targetId: numericReferenceId,
        }
      : effectiveReferenceType === 'TRADE' && Number.isFinite(numericReferenceId)
        ? {
            targetType: 'USED_ITEM' as const,
            targetId: numericReferenceId,
          }
        : effectiveOpponentMemberId
          ? {
              targetType: 'MEMBER' as const,
              targetId: effectiveOpponentMemberId,
            }
        : null;

    if (!target) {
      Alert.alert(
        '신고할 수 없어요',
        '신고 대상 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      );
      return;
    }

    try {
      setReporting(true);
      await createReport({
        ...target,
        reason,
        detail: `채팅방 #${roomId}에서 신고된 대화입니다.`,
      });
      Alert.alert('신고 접수', '운영팀이 대화 내용을 확인할게요.');
    } catch (error: any) {
      console.log('신고 접수 실패:', error.response?.data || error.message);
      Alert.alert(
        '신고 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setReporting(false);
    }
  };

  const handleReport = () => {
    setMenuVisible(false);

    Alert.alert(
      '신고하기',
      '신고 사유를 선택해주세요.',
      [
        ...REPORT_OPTIONS.map((option) => ({
          text: option.label,
          onPress: () => submitReport(option.reason),
        })),
        { text: '취소', style: 'cancel' as const },
      ],
    );
  };

  const handleLeaveRoom = () => {
    setMenuVisible(false);
    Alert.alert('채팅방 나가기', '이 채팅방을 나가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <AppBackButton style={styles.backButton} />
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displaySellerName}
          </Text>
          <Image
            source={require('../../assets/images/shield.png')}
            style={styles.badgeIcon}
          />
        </View>

        <Pressable
          style={styles.headerSide}
          onPress={() => setMenuVisible((prev) => !prev)}
        >
          <Image
            source={require('../../assets/images/chat_menu.png')}
            style={styles.menuIcon}
          />
        </Pressable>
      </View>

      {menuVisible && (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.chatMenuPopover}>
            <View style={styles.popoverArrow} />
            <ChatMenuRow
              icon="notifications-off-outline"
              title="채팅 알림 끄기"
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('알림 설정', '이 채팅방 알림을 껐어요.');
              }}
            />
            <ChatMenuRow
              icon="flag-outline"
              title={reporting ? '신고 접수 중...' : '신고하기'}
              onPress={handleReport}
            />
            <ChatMenuRow
              icon="log-out-outline"
              title="채팅방 나가기"
              danger
              onPress={handleLeaveRoom}
            />
          </View>
        </>
      )}

      <Pressable
        style={styles.productCard}
        onPress={() => {
          if (effectiveReferenceType === 'TRADE' && effectiveReferenceId) {
            router.push({
              pathname: '/market/[id]',
              params: {
                id: effectiveReferenceId,
                fromChatRoom: 'true',
                chatRoomId: roomId,
                chatTitle: productTitle,
                chatPrice: productPrice,
                chatThumbnail: productThumbnail,
                chatSellerName: displaySellerName,
                chatReferenceType: effectiveReferenceType,
                chatReferenceId: effectiveReferenceId,
              },
            } as any);
            return;
          }

          if (effectiveReferenceType === 'TICKET' && effectiveReferenceId) {
            router.push({
              pathname: '/market/ticket-preview',
              params: {
                id: effectiveReferenceId,
                fromChatRoom: 'true',
                chatRoomId: roomId,
                chatTitle: productTitle,
                chatPrice: productPrice,
                chatThumbnail: productThumbnail,
                chatSellerName: displaySellerName,
                chatReferenceType: effectiveReferenceType,
                chatReferenceId: effectiveReferenceId,
              },
            } as any);
          }
        }}
      >
        <View style={styles.thumbnail}>
          {!!productThumbnail && (
            <Image
              source={{ uri: productThumbnail }}
              style={styles.thumbnailImage}
            />
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {productTitle}
          </Text>
          <Text style={styles.productPrice}>{productPrice}</Text>
        </View>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Image
              source={require('../../assets/images/school_icon.png')}
              style={styles.logo}
            />
            <Text style={styles.emptyText}>
              대화는 유니로드 채팅방에서 하는 것이 안전해요.{'\n'}
              교환학생 선배에게 인사로 대화를 시작해보세요.
            </Text>
          </View>
        ) : (
          <View style={styles.messageList}>
            {messages.map((item) => {
              const isMine =
                item.senderId === 'me' || item.senderId === currentMemberId;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    isMine ? styles.myMessageRow : styles.otherMessageRow,
                  ]}
                >
                  {isMine && (
                    <View style={styles.messageMetaBox}>
                      <Text style={styles.readStatus}>{getReadStatus(item)}</Text>
                      <Text style={styles.messageTime}>
                        {formatMessageTime(item.createdAt)}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMine ? styles.myMessageText : styles.otherMessageText,
                      ]}
                    >
                      {item.message}
                    </Text>
                  </View>

                  {!isMine && (
                    <Text style={styles.messageTime}>
                      {formatMessageTime(item.createdAt)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.bottomArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickContent}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.quickBack}>
              <Text style={styles.quickBackText}>‹</Text>
            </Pressable>

            {['안녕하세요', '관심 있어서 문의 드려요.', '구매 가능할까요?'].map(
              (text) => (
                <Pressable
                  key={text}
                  style={styles.quickChip}
                  onPress={() => setMessage(text)}
                >
                  <Text style={styles.quickText}>{text}</Text>
                </Pressable>
              ),
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <Pressable style={styles.plusButton}>
              <Image
                source={require('../../assets/images/plus.png')}
                style={styles.plusIcon}
              />
            </Pressable>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="메시지 보내기"
                placeholderTextColor="#9A9A9A"
                value={message}
                onChangeText={setMessage}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />

              <Pressable style={styles.emojiButton}>
                <Image
                  source={require('../../assets/images/imogi.png')}
                  style={styles.emojiIcon}
                />
              </Pressable>
            </View>

            <Pressable style={styles.sendButton} onPress={handleSend}>
              <Image
                source={require('../../assets/images/send.png')}
                style={[styles.sendIcon, sending && styles.sendingIcon]}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ChatMenuRow({
  icon,
  title,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.chatMenuRow} onPress={onPress}>
      <Ionicons name={icon} size={18} color={danger ? '#E5484D' : '#111111'} />
      <Text style={[styles.chatMenuText, danger && styles.chatMenuDangerText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 62,
  },

  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F8FC',
  },

  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111111',
  },

  badgeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginLeft: 6,
    marginTop: 2,
  },

  menuIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },

  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },

  chatMenuPopover: {
    position: 'absolute',
    top: 108,
    right: 18,
    width: 178,
    borderRadius: 18,
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

  popoverArrow: {
    position: 'absolute',
    top: -7,
    right: 18,
    width: 14,
    height: 14,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },

  chatMenuRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
  },

  chatMenuText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111111',
  },

  chatMenuDangerText: {
    color: '#E5484D',
  },

  productCard: {
    height: 102,
    marginHorizontal: 15,
    marginTop: 20,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#9B9B9B',
    marginRight: 22,
    overflow: 'hidden',
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  productInfo: {
    flex: 1,
  },

  productTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 5,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: 18,
    paddingBottom: 18,
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 70,
  },

  logo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
    marginBottom: 36,
  },

  emptyText: {
    fontSize: 18,
    lineHeight: 34,
    color: '#666666',
    fontWeight: '700',
    textAlign: 'center',
  },

  messageList: {
    paddingHorizontal: 22,
    paddingBottom: 10,
    gap: 10,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },

  myMessageRow: {
    justifyContent: 'flex-end',
  },

  otherMessageRow: {
    justifyContent: 'flex-start',
  },

  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: BLUE,
  },

  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F1F1',
  },

  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  otherMessageText: {
    color: '#111111',
  },

  messageMetaBox: {
    alignItems: 'flex-end',
    marginBottom: 2,
  },

  readStatus: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: '#E1A800',
  },

  messageTime: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#8C8C8C',
    marginBottom: 2,
  },

  bottomArea: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
  },

  quickContent: {
    paddingLeft: 18,
    paddingRight: 18,
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },

  quickBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickBackText: {
    fontSize: 26,
    lineHeight: 28,
    color: '#555555',
  },

  quickChip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555555',
  },

  inputRow: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  plusButton: {
    width: 30,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 3,
  },

  plusIcon: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },

  inputBox: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E2E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 4,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 0,
  },

  emojiButton: {
    width: 30,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginRight: 3,
  },

  emojiIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  sendButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  sendIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  sendingIcon: {
    opacity: 0.45,
  },
});
