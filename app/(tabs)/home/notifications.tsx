import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';
const READ_STORAGE_KEY = 'univ:notifications:read-ids';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'chat' | 'market' | 'community' | 'schedule';
  route?: unknown;
};

const notificationSeed: NotificationItem[] = [
  {
    id: 'chat-1',
    title: '새 채팅 메시지',
    body: '관심 있어서 문의 드려요. 구매 가능할까요?',
    time: '방금 전',
    type: 'chat',
  },
  {
    id: 'market-1',
    title: '저장한 티켓 양도 글',
    body: '사그라다 파밀리아 표 양도 글을 다시 확인해보세요.',
    time: '12분 전',
    type: 'market',
    route: '/market/ticket-preview',
  },
  {
    id: 'community-1',
    title: '내 글에 새 댓글',
    body: '커뮤니티 작성글에 새로운 댓글이 달렸어요.',
    time: '오늘',
    type: 'community',
    route: {
      pathname: '/(tabs)/home/profile-list',
      params: { type: 'free' },
    },
  },
  {
    id: 'schedule-1',
    title: '출국 준비 체크',
    body: '비자 서류와 항공권 준비 상태를 한 번 더 확인해보세요.',
    time: '어제',
    type: 'schedule',
    route: '/(tabs)/home/departure-checklist',
  },
];

const notificationMeta: Record<
  NotificationItem['type'],
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string }
> = {
  chat: {
    icon: 'chatbubble-ellipses-outline',
    label: '채팅',
    color: '#1D4FBA',
    bg: '#EAF1FF',
  },
  market: {
    icon: 'bag-handle-outline',
    label: '거래',
    color: '#1D4FBA',
    bg: '#EAF1FF',
  },
  community: {
    icon: 'people-outline',
    label: '커뮤니티',
    color: '#238451',
    bg: '#E8F6EE',
  },
  schedule: {
    icon: 'calendar-outline',
    label: '준비',
    color: '#F28A2E',
    bg: '#FFF1DF',
  },
};

export default function NotificationsScreen() {
  const [readIds, setReadIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadReadIds = async () => {
        const raw = await AsyncStorage.getItem(READ_STORAGE_KEY);

        if (!raw) {
          return;
        }

        try {
          setReadIds(JSON.parse(raw));
        } catch {
          await AsyncStorage.removeItem(READ_STORAGE_KEY);
        }
      };

      loadReadIds();
    }, []),
  );

  const unreadCount = useMemo(
    () => notificationSeed.filter((item) => !readIds.includes(item.id)).length,
    [readIds],
  );

  const saveReadIds = (next: string[]) => {
    setReadIds(next);
    AsyncStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next)).catch((error) => {
      console.log('알림 읽음 상태 저장 실패:', error);
    });
  };

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) {
      return;
    }

    saveReadIds([...readIds, id]);
  };

  const markAllAsRead = () => {
    saveReadIds(notificationSeed.map((item) => item.id));
  };

  const openNotification = (item: NotificationItem) => {
    markAsRead(item.id);

    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>알림</Text>
        <Pressable style={styles.headerAction} onPress={markAllAsRead}>
          <Text style={styles.headerActionText}>모두 읽음</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBox}>
            <Ionicons name="notifications-outline" size={25} color={BLUE} />
          </View>
          <View style={styles.summaryTextBox}>
            <Text style={styles.summaryTitle}>받은 알림</Text>
            <Text style={styles.summaryDesc}>
              읽지 않은 알림 {unreadCount}개가 있어요.
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {notificationSeed.map((item) => {
            const meta = notificationMeta[item.type];
            const unread = !readIds.includes(item.id);

            return (
              <Pressable
                key={item.id}
                style={[styles.card, unread && styles.unreadCard]}
                onPress={() => openNotification(item)}
              >
                <View style={[styles.cardIconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={21} color={meta.color} />
                </View>

                <View style={styles.cardTextBox}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <View style={styles.cardBottomRow}>
                    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.badgeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    {unread && <View style={styles.unreadDot} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
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
  headerAction: {
    minWidth: 62,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  summaryCard: {
    borderRadius: 20,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  summaryTextBox: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  summaryDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: MUTED,
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    padding: 15,
    flexDirection: 'row',
  },
  unreadCard: {
    borderColor: '#CFE0FF',
    backgroundColor: '#FCFDFF',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextBox: {
    flex: 1,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A4ADBA',
  },
  cardBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: MUTED,
  },
  cardBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
});
