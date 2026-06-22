import { Ionicons } from '@expo/vector-icons';
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
  ChatMessageResponse,
  getChatMessages,
  sendChatMessage,
} from '../../src/api/chat';

type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number | 'me' | 'other';
  message: string;
  type?: string;
  createdAt: string;
};

const BLUE = '#123F9F';

const normalizeMessage = (item: ChatMessageResponse): ChatMessage => ({
  id: item.id,
  roomId: item.roomId,
  senderId: item.senderId,
  message: item.message ?? item.content ?? '',
  type: item.type,
  createdAt: item.createdAt,
});

export default function ChatRoomPage() {
  const { roomId, title, price, thumbnail, sellerName } = useLocalSearchParams<{
    roomId: string;
    title?: string;
    price?: string;
    thumbnail?: string;
    sellerName?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

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

  const fetchMessages = useCallback(async () => {
    try {
      const response = await getChatMessages(Number(roomId));
      const payload = response.data;
      const rawMessages = Array.isArray(payload)
        ? payload
        : (payload?.content ?? []);

      setMessages(rawMessages.map(normalizeMessage));
    } catch (error: any) {
      console.log('메시지 조회 실패:', error.response?.data || error.message);
    }
  }, [roomId]);

  useEffect(() => {
    fetchCurrentMember();
    fetchMessages();
  }, [fetchCurrentMember, fetchMessages]);

  const handleSend = async () => {
    const text = message.trim();

    if (!text || sending) return;

    try {
      setSending(true);
      const response = await sendChatMessage(Number(roomId), text);

      console.log(response.data);

      setMessages((prev) => [...prev, normalizeMessage(response.data)]);
      setMessage('');
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
          <AppBackButton />
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{sellerName ?? '채팅'}</Text>
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
              title="신고하기"
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('신고 접수', '운영팀이 대화 내용을 확인할게요.');
              }}
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

      <View style={styles.productCard}>
        <View style={styles.thumbnail}>
          {!!thumbnail && (
            <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} />
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{title ?? '중고거래 게시글'}</Text>
          <Text style={styles.productPrice}>{price ?? '가격 미정'}</Text>
        </View>
      </View>

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
  },

  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
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
