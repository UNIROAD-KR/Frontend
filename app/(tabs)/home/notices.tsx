import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { getNotices, NoticeResponse } from '../../../src/api/notices';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

const fallbackNotices: NoticeResponse[] = [
  {
    id: 1,
    title: 'UNIROAD 공지사항',
    content: '공지사항 API가 준비되면 이 화면에서 서비스 업데이트와 운영 안내를 확인할 수 있어요.',
    createdAt: '2026-07-05',
    type: 'NOTICE',
  },
];

const normalizeNotices = (data: unknown): NoticeResponse[] => {
  if (Array.isArray(data)) {
    return data as NoticeResponse[];
  }

  if (data && typeof data === 'object') {
    const candidate = data as { items?: NoticeResponse[]; content?: NoticeResponse[] };
    return candidate.items ?? candidate.content ?? [];
  }

  return [];
};

const formatDate = (value?: string) => {
  if (!value) return '';

  return value.slice(0, 10).replaceAll('-', '.');
};

export default function NoticesScreen() {
  const [notices, setNotices] = useState<NoticeResponse[]>(fallbackNotices);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadNotices = async () => {
        try {
          setLoading(true);
          const response = await getNotices({
            page: 0,
            size: 30,
            sort: ['createdAt,desc'],
          });
          const apiNotices = normalizeNotices(response.data.data).filter(
            (item) => item.type === 'NOTICE' || item.type === 'SYSTEM',
          );

          if (active) {
            setNotices(apiNotices.length > 0 ? apiNotices : fallbackNotices);
          }
        } catch (error: any) {
          console.log('공지사항 조회 실패:', error.response?.data || error.message);
          if (active) {
            setNotices(fallbackNotices);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      loadNotices();

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={BLUE} />
          </View>
        ) : (
          notices.map((notice) => (
            <View
              key={notice.id ?? notice.notificationId ?? notice.title}
              style={styles.noticeCard}
            >
              <View style={styles.noticeTopRow}>
                <View style={styles.pinBadge}>
                  <Ionicons name="megaphone-outline" size={13} color={BLUE} />
                  <Text style={styles.pinText}>
                    {notice.type === 'SYSTEM' ? '시스템' : '공지'}
                  </Text>
                </View>
                <Text style={styles.noticeDate}>
                  {formatDate(notice.createdAt)}
                </Text>
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeContent}>{notice.content}</Text>
            </View>
          ))
        )}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 130,
  },
  loadingBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginBottom: 14,
  },
  noticeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pinBadge: {
    borderRadius: 999,
    backgroundColor: '#F4F8FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinText: {
    fontSize: 11,
    fontWeight: '900',
    color: BLUE,
  },
  noticeDate: {
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
  },
  noticeTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: NAVY,
  },
  noticeContent: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: MUTED,
  },
});
