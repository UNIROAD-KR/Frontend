import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  getNoticeDetail,
  getNotices,
  NoticeResponse,
} from '../../../src/api/notices';

const NAVY = '#18202B';
const BLUE = '#3568DA';
const MUTED = '#7A8491';
const LINE = '#E3E7EC';

const normalizeNotices = (data: unknown): NoticeResponse[] => {
  if (Array.isArray(data)) {
    return data as NoticeResponse[];
  }

  if (data && typeof data === 'object') {
    const candidate = data as {
      items?: NoticeResponse[];
      content?: NoticeResponse[];
      data?: NoticeResponse[] | { items?: NoticeResponse[]; content?: NoticeResponse[] };
    };

    if (Array.isArray(candidate.data)) {
      return candidate.data;
    }

    if (candidate.data && typeof candidate.data === 'object') {
      return candidate.data.items ?? candidate.data.content ?? [];
    }

    return candidate.items ?? candidate.content ?? [];
  }

  return [];
};

const formatDate = (value?: string) => {
  if (!value) return '';

  return value.slice(0, 10).replaceAll('-', '.');
};

export default function NoticesScreen() {
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [noticeDetails, setNoticeDetails] = useState<Record<number, NoticeResponse>>({});
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadNotices = async () => {
        try {
          setLoading(true);
          setLoadFailed(false);
          const response = await getNotices();
          const apiNotices = normalizeNotices(response.data.data);

          if (active) {
            setNotices(apiNotices);
          }
        } catch (error: any) {
          console.log('공지사항 조회 실패:', error.response?.data || error.message);
          if (active) {
            setNotices([]);
            setLoadFailed(true);
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

  const handleNoticePress = async (notice: NoticeResponse) => {
    if (!notice.id) return;

    if (expandedNoticeId === notice.id) {
      setExpandedNoticeId(null);
      return;
    }

    setExpandedNoticeId(notice.id);

    if (noticeDetails[notice.id]) {
      return;
    }

    try {
      setDetailLoadingId(notice.id);
      const response = await getNoticeDetail(notice.id);
      setNoticeDetails((prev) => ({
        ...prev,
        [notice.id]: response.data.data,
      }));
    } catch (error: any) {
      console.log('공지사항 상세 조회 실패:', error.response?.data || error.message);
    } finally {
      setDetailLoadingId(null);
    }
  };

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
        ) : notices.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="megaphone-outline" size={28} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>
              {loadFailed ? '공지사항을 불러오지 못했어요' : '등록된 공지사항이 없어요'}
            </Text>
            <Text style={styles.emptyText}>
              {loadFailed
                ? '잠시 후 다시 시도해주세요.'
                : '새 공지가 등록되면 이곳에서 확인할 수 있어요.'}
            </Text>
          </View>
        ) : (
          notices.map((notice) => {
            const expanded = expandedNoticeId === notice.id;
            const detail = noticeDetails[notice.id] ?? notice;

            return (
            <Pressable
              key={notice.id ?? notice.title}
              style={[styles.noticeCard, expanded && styles.noticeCardExpanded]}
              onPress={() => handleNoticePress(notice)}
            >
              <View style={styles.noticeTopRow}>
                <View style={styles.pinBadge}>
                  <Ionicons name="megaphone-outline" size={13} color={BLUE} />
                  <Text style={styles.pinText}>공지</Text>
                </View>
                <Text style={styles.noticeDate}>
                  {formatDate(detail.createdAt)}
                </Text>
              </View>
              <View style={styles.noticeTitleRow}>
                <Text style={styles.noticeTitle}>{detail.title}</Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={MUTED}
                />
              </View>
              {detailLoadingId === notice.id ? (
                <Text style={styles.noticeContent}>공지 내용을 불러오는 중이에요.</Text>
              ) : expanded ? (
                <Text style={styles.noticeContent}>{detail.content}</Text>
              ) : null}
            </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 104,
  },
  loadingBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    minHeight: 260,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
  },
  noticeCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 10,
  },
  noticeCardExpanded: {
    borderColor: '#D8E2FF',
    backgroundColor: '#F5F8FF',
  },
  noticeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pinBadge: {
    borderRadius: 5,
    backgroundColor: '#EAF0FF',
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
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: NAVY,
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeContent: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '700',
    color: MUTED,
  },
});
