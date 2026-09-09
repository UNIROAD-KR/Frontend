import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationResponse,
  NotificationType,
} from '@/src/api/notifications';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

const notificationMeta: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string }
> = {
  CHAT: {
    icon: 'chatbubble-ellipses-outline',
    label: '채팅',
    color: '#1D4FBA',
    bg: '#EAF1FF',
  },
  MATCH: {
    icon: 'people-outline',
    label: '매칭',
    color: '#1D4FBA',
    bg: '#EAF1FF',
  },
  LIKE: {
    icon: 'heart-outline',
    label: '반응',
    color: '#238451',
    bg: '#E8F6EE',
  },
  NOTICE: {
    icon: 'megaphone-outline',
    label: '공지',
    color: '#F28A2E',
    bg: '#FFF1DF',
  },
  SYSTEM: {
    icon: 'notifications-outline',
    label: '시스템',
    color: '#6D4CC2',
    bg: '#F0ECFF',
  },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const [listResponse, countResponse] = await Promise.all([
        getNotifications({ page: 0, size: 30, sort: ['createdAt,desc'] }),
        getUnreadNotificationCount(),
      ]);

      const items = listResponse.data.data.content ?? [];
      if (__DEV__) {
        console.log('[Notifications][List] 조회 결과:', {
          unreadCount: countResponse.data.data.count,
          totalElements: listResponse.data.data.totalElements,
          items: items.map(({ notificationId, type, read, referenceId }) => ({
            notificationId, type, read, referenceId,
          })),
        });
      }
      setNotifications(items);
      setUnreadCount(countResponse.data.data.count ?? 0);
    } catch (error: any) {
      console.log('알림 조회 실패:', error.response?.data || error.message);
      Alert.alert('알림 조회 실패', '알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(true);

      const timer = setInterval(() => {
        fetchNotifications(false);
      }, 10000);

      return () => clearInterval(timer);
    }, [fetchNotifications]),
  );

  const refresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (error: any) {
      console.log('전체 알림 읽음 처리 실패:', error.response?.data || error.message);
      Alert.alert('처리 실패', '알림 읽음 처리에 실패했습니다.');
    }
  };

  const openNotification = async (item: NotificationResponse) => {
    try {
      await markNotificationAsRead(item.notificationId);
      await fetchNotifications();
    } catch (error: any) {
      console.log('알림 읽음 처리 실패:', error.response?.data || error.message);
    }

    if (item.type === 'CHAT') {
      const roomId = item.roomId ?? item.referenceId;

      if (roomId) {
        router.push({
          pathname: '/chat/[roomId]',
          params: { roomId: String(roomId) },
        } as any);
      }
    }
  };

  const formatTime = (value: string) => {
    const created = new Date(value);

    if (Number.isNaN(created.getTime())) {
      return '';
    }

    const diffMs = Date.now() - created.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

    if (diffMinutes < 1) {
      return '방금 전';
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 7) {
      return `${diffDays}일 전`;
    }

    return `${created.getMonth() + 1}.${created.getDate()}`;
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
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
          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={BLUE} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={34} color={BLUE} />
              <Text style={styles.emptyTitle}>새 알림이 없어요</Text>
              <Text style={styles.emptyDesc}>
                읽지 않은 알림이 생기면 이곳에 표시됩니다.
              </Text>
            </View>
          ) : (
            notifications.map((item) => {
            const meta = notificationMeta[item.type];

            return (
              <Pressable
                key={item.notificationId}
                style={[styles.card, styles.unreadCard]}
                onPress={() => openNotification(item)}
              >
                <View style={[styles.cardIconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={21} color={meta.color} />
                </View>

                <View style={styles.cardTextBox}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <View style={styles.cardBottomRow}>
                    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.badgeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <View style={styles.unreadDot} />
                  </View>
                </View>
              </Pressable>
            );
          }))}
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
    fontSize: 16,
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
  stateBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    minHeight: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '900',
    color: INK,
  },
  emptyDesc: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
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
