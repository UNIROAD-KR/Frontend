import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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

import { getChatMessages } from '../../src/api/chat';

type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number | 'me' | 'other';
  message: string;
  type: string;
  createdAt: string;
};

const BLUE = '#123F9F';

export default function ChatRoomPage() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await getChatMessages(Number(roomId));
      setMessages(response.data.data ?? response.data ?? []);
    } catch (error: any) {
      console.log('메시지 조회 실패:', error.response?.data || error.message);
    }
  };

  const handleSend = () => {
    const text = message.trim();

    if (!text) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      roomId: Number(roomId),
      senderId: 'me',
      message: text,
      type: 'TALK',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={15}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.nameRow}>
          <Text style={styles.name}>may.be</Text>
          <Image
            source={require('../../assets/images/shield.png')}
            style={styles.badgeIcon}
          />
        </View>

        <Image
          source={require('../../assets/images/chat_menu.png')}
          style={styles.menuIcon}
        />
      </View>

      <View style={styles.productCard}>
        <View style={styles.thumbnail} />

        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>
            독일 아샤펜부르크 중고 물품 양도
          </Text>
          <Text style={styles.productPrice}>21만 원</Text>
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
              const isMine = item.senderId === 'me';

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
                style={styles.sendIcon}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    fontSize: 34,
    lineHeight: 36,
    color: '#111111',
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  name: {
    fontSize: 28,
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
    paddingHorizontal: 8,
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
    marginRight: -2,
  },

  emojiIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  sendButton: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  sendIcon: {
    width: 29,
    height: 29,
    resizeMode: 'contain',
  },
});
