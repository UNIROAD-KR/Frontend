import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import NoticeReadDotIcon from '@/assets/icon/profile/notice-read-dot.svg';
import {
  getNoticeDetail,
  getNotices,
  NoticeResponse,
} from '../../../src/api/notices';

const NAVY = '#18202B';
const BLUE = '#3568DA';
const MUTED = '#7A8491';
const LINE = '#E3E7EC';
const READ_NOTICE_IDS_STORAGE_KEY = 'univ:profile:read-notice-ids';

type NoticeSortMode = 'latest' | 'oldest' | 'title';

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

const noticeSortLabel = (mode: NoticeSortMode) => {
  if (mode === 'oldest') return '오래된순';
  if (mode === 'title') return '가나다순';

  return '최신순';
};

const parseReadNoticeIds = (value: string | null) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === 'number')
      : [];
  } catch {
    return [];
  }
};

export default function NoticesScreen() {
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [noticeDetails, setNoticeDetails] = useState<Record<number, NoticeResponse>>({});
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [readNoticeIds, setReadNoticeIds] = useState<number[]>([]);
  const [sortMode, setSortMode] = useState<NoticeSortMode>('latest');
  const [sortVisible, setSortVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadNotices = async () => {
        try {
          setLoading(true);
          setLoadFailed(false);
          const [response, storedReadIds] = await Promise.all([
            getNotices(),
            AsyncStorage.getItem(READ_NOTICE_IDS_STORAGE_KEY),
          ]);
          const apiNotices = normalizeNotices(response.data.data);
          const parsedReadIds = parseReadNoticeIds(storedReadIds);

          if (active) {
            setNotices(apiNotices);
            setReadNoticeIds(parsedReadIds);
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
    setReadNoticeIds((previousIds) => {
      if (previousIds.includes(notice.id)) return previousIds;

      const nextIds = [...previousIds, notice.id];
      void AsyncStorage.setItem(READ_NOTICE_IDS_STORAGE_KEY, JSON.stringify(nextIds));
      return nextIds;
    });

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

  const sortedNotices = useMemo(() => {
    return [...notices].sort((first, second) => {
      if (sortMode === 'title') {
        return first.title.localeCompare(second.title, 'ko');
      }

      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;

      return sortMode === 'oldest'
        ? firstTime - secondTime
        : secondTime - firstTime;
    });
  }, [notices, sortMode]);

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
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                전체 <Text style={styles.summaryCount}>{sortedNotices.length}개</Text>
              </Text>
              <View style={styles.sortAnchor}>
                <Pressable style={styles.sortLabel} onPress={() => setSortVisible((value) => !value)}>
                  <Text style={styles.sortText}>{noticeSortLabel(sortMode)}</Text>
                  <Ionicons name={sortVisible ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} />
                </Pressable>
                {sortVisible ? (
                  <View style={styles.sortMenu}>
                    {(
                      [
                        { key: 'latest', label: '최신순' },
                        { key: 'oldest', label: '오래된순' },
                        { key: 'title', label: '가나다순' },
                      ] as { key: NoticeSortMode; label: string }[]
                    ).map((option) => {
                      const selected = sortMode === option.key;

                      return (
                        <Pressable
                          key={option.key}
                          style={styles.sortOption}
                          onPress={() => {
                            setSortMode(option.key);
                            setSortVisible(false);
                          }}
                        >
                          <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
                            {option.label}
                          </Text>
                          {selected ? <Ionicons name="checkmark" size={16} color={BLUE} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>
            {sortedNotices.map((notice) => {
            const expanded = expandedNoticeId === notice.id;
            const detail = noticeDetails[notice.id] ?? notice;
            const read = readNoticeIds.includes(notice.id);

            return (
            <Pressable
              key={notice.id ?? notice.title}
              style={styles.noticeRow}
              onPress={() => handleNoticePress(notice)}
            >
              {read ? (
                <NoticeReadDotIcon width={6} height={6} style={styles.noticeReadDot} />
              ) : (
                <View style={styles.noticeDot} />
              )}
              <View style={styles.noticeBody}>
                <View style={styles.noticeTitleRow}>
                  <Text
                    style={[styles.noticeTitle, read && styles.noticeTitleRead]}
                    numberOfLines={expanded ? undefined : 1}
                  >
                    {detail.title}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={read ? '#A8B0BA' : '#3D4856'}
                  />
                </View>
                {detailLoadingId === notice.id ? (
                  <Text style={[styles.noticeContent, read && styles.noticeContentRead]}>
                    공지 내용을 불러오는 중이에요.
                  </Text>
                ) : (
                  <Text
                    style={[styles.noticeContent, read && styles.noticeContentRead]}
                    numberOfLines={expanded ? undefined : 1}
                  >
                    {detail.content}
                  </Text>
                )}
                <Text style={[styles.noticeDate, read && styles.noticeDateRead]}>
                  {formatDate(detail.createdAt)}
                </Text>
              </View>
            </Pressable>
            );
            })}
          </>
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
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 8,
    backgroundColor: '#F6F7F9',
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
    paddingTop: 4,
    paddingBottom: 104,
  },
  summaryRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  summaryCount: {
    color: '#1677FF',
  },
  sortLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    paddingLeft: 8,
  },
  sortAnchor: {
    position: 'relative',
    zIndex: 10,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  sortMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    width: 112,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5EA',
    paddingVertical: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sortOption: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#556171',
  },
  sortOptionTextSelected: {
    fontWeight: '900',
    color: BLUE,
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
  noticeRow: {
    position: 'relative',
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE1E7',
  },
  noticeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
    backgroundColor: '#1677FF',
  },
  noticeReadDot: {
    marginTop: 7,
    marginRight: 8,
  },
  noticeBody: {
    flex: 1,
    minWidth: 0,
  },
  noticeTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: '#252C37',
  },
  noticeTitleRead: {
    color: '#9AA4B1',
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeContent: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: '#7A8491',
  },
  noticeContentRead: {
    color: '#B1B8C1',
  },
  noticeDate: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#8792A0',
  },
  noticeDateRead: {
    color: '#B9C0C8',
  },
});
