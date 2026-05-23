import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
  senderId: number;
  message: string;
  type: string;
  createdAt: string;
};

export default function ChatRoomPage() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [roomId]);

  const fetchMessages = async () => {
    try {
      const response = await getChatMessages(Number(roomId));
      const responseBody = response.data;
      setMessages(Array.isArray(responseBody) ? responseBody : responseBody.data ?? []);
    } catch (error: any) {
      console.log('메시지 조회 실패:', error.response?.data || error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.nameRow}>
          <Text style={styles.name}>may.be</Text>
          <Text style={styles.badge}>♛</Text>
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
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Image
              source={require('../../assets/images/school_icon.png')}
              style={styles.logo}
            />

            <Text style={styles.emptyText}>
              대화는 유니로드 채팅방에서 하는 것이 안전해요.
            </Text>
            <Text style={styles.emptyText}>
              교환학생 선배에게 인사로 대화를 시작해보세요.
            </Text>
          </View>
        ) : (
          messages.map((item) => (
            <View key={item.id} style={styles.messageBubble}>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          ))
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
            <Image
              source={require('../../assets/images/plus.png')}
              style={styles.plusIcon}
            />

            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="메시지 보내기"
                placeholderTextColor="#9A9A9A"
                value={message}
                onChangeText={setMessage}
                returnKeyType="send"
              />

              <Image
                source={require('../../assets/images/imogi.png')}
                style={styles.emojiIcon}
              />
            </View>

            <Image
              source={require('../../assets/images/send.png')}
              style={styles.sendIcon}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const BLUE = '#123F9F';

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
    fontSize: 48,
    lineHeight: 48,
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

  badge: {
    marginLeft: 7,
    fontSize: 17,
    color: '#0B36D9',
  },

  menuIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },

  productCard: {
    height: 102,
    marginHorizontal: 34,
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
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 5,
  },

  productPrice: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111111',
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    flexGrow: 1,
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
  },

  messageBubble: {
    alignSelf: 'flex-end',
    maxWidth: '75%',
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 28,
    marginBottom: 10,
  },

  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
  },

  bottomArea: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
  },

  quickContent: {
    paddingLeft: 34,
    paddingRight: 34,
    gap: 12,
    alignItems: 'center',
    marginBottom: 17,
  },

  quickBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickBackText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#555555',
  },

  quickChip: {
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555555',
  },

  inputRow: {
    height: 58,
    paddingHorizontal: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },

  plusIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 16,
  },

  inputBox: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E2E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 15,
  },

  input: {
    flex: 1,
    fontSize: 18,
    color: '#111111',
    paddingVertical: 0,
  },

  emojiIcon: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
    marginLeft: 8,
  },

  sendIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginLeft: 15,
  },
});
