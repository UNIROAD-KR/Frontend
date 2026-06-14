import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';
const STORAGE_KEY = 'univ:profile:notification-settings';

type NotificationKey =
  | 'market'
  | 'community'
  | 'chat'
  | 'schedule'
  | 'marketing';

type NotificationSettings = Record<NotificationKey, boolean>;

type NotificationItem = {
  key: NotificationKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const defaultSettings: NotificationSettings = {
  market: true,
  community: true,
  chat: true,
  schedule: true,
  marketing: false,
};

const notificationItems: NotificationItem[] = [
  {
    key: 'chat',
    title: '채팅 알림',
    description: '거래와 동행 채팅 메시지를 바로 받아요.',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    key: 'market',
    title: '중고마켓 알림',
    description: '저장한 거래글, 가격 문의, 거래 상태를 알려드려요.',
    icon: 'bag-handle-outline',
  },
  {
    key: 'community',
    title: '커뮤니티 알림',
    description: '내 글의 댓글과 관심 게시판 소식을 받아요.',
    icon: 'people-outline',
  },
  {
    key: 'schedule',
    title: '출국 준비 알림',
    description: '체크리스트 마감일과 준비 일정을 놓치지 않게 도와드려요.',
    icon: 'calendar-outline',
  },
  {
    key: 'marketing',
    title: '혜택 및 이벤트',
    description: '교환학생에게 맞는 혜택과 새 소식을 선택적으로 받아요.',
    icon: 'sparkles-outline',
  },
];

export default function ProfileNotificationsScreen() {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return;
        }

        try {
          setSettings({ ...defaultSettings, ...JSON.parse(raw) });
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      };

      loadSettings();
    }, []),
  );

  const toggleSetting = (key: NotificationKey) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => {
        console.log('알림 설정 저장 실패:', error);
      });
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          {notificationItems.map((item, index) => (
            <Pressable
              key={item.key}
              style={[
                styles.row,
                index < notificationItems.length - 1 && styles.divider,
              ]}
              onPress={() => toggleSetting(item.key)}
            >
              <View style={styles.rowIconBox}>
                <Ionicons name={item.icon} size={21} color={NAVY} />
              </View>

              <View style={styles.rowTextBox}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <View
                style={[
                  styles.switchTrack,
                  settings[item.key] && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    settings[item.key] && styles.switchThumbActive,
                  ]}
                />
              </View>
            </Pressable>
          ))}
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
  headerSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  heroCard: {
    minHeight: 106,
    borderRadius: 20,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBox: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  heroDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: MUTED,
  },
  sectionCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    overflow: 'hidden',
  },
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  rowIconBox: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  rowDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: MUTED,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D7DDE7',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: BLUE,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
