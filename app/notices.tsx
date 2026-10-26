import { Text } from "@/components/ui/app-text";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import ArrowDownIcon from "@/assets/icon/Property 1=arrow2, Property 2=down.svg";
import ArrowUpIcon from "@/assets/icon/Property 1=arrow2, Property 2=up.svg";
import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import { SortSheet } from "@/components/ui/sort-sheet";
import { Colors, fonts } from "@/constants/theme";
import NoticeReadDotIcon from "@/assets/icon/profile/notice-read-dot.svg";
import {
  getNoticeDetail,
  getNotices,
  NoticeResponse,
} from "../src/api/notices";

const BLUE = Colors.primary.default;
const MUTED = Colors.gray[7];
const LINE = Colors.gray[3];
const READ_NOTICE_IDS_STORAGE_KEY = "univ:profile:read-notice-ids";

type NoticeSortMode = "latest" | "oldest";

const normalizeNotices = (data: unknown): NoticeResponse[] => {
  if (Array.isArray(data)) {
    return data as NoticeResponse[];
  }

  if (data && typeof data === "object") {
    const candidate = data as {
      items?: NoticeResponse[];
      content?: NoticeResponse[];
      data?:
        | NoticeResponse[]
        | { items?: NoticeResponse[]; content?: NoticeResponse[] };
    };

    if (Array.isArray(candidate.data)) {
      return candidate.data;
    }

    if (candidate.data && typeof candidate.data === "object") {
      return candidate.data.items ?? candidate.data.content ?? [];
    }

    return candidate.items ?? candidate.content ?? [];
  }

  return [];
};

const formatDate = (value?: string) => {
  if (!value) return "";

  return value.slice(0, 10).replaceAll("-", ".");
};

const noticeSortLabel = (mode: NoticeSortMode) => {
  if (mode === "oldest") return "오래된순";

  return "최신순";
};

const parseReadNoticeIds = (value: string | null) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === "number")
      : [];
  } catch {
    return [];
  }
};

export default function NoticesScreen() {
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [noticeDetails, setNoticeDetails] = useState<
    Record<number, NoticeResponse>
  >({});
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [readNoticeIds, setReadNoticeIds] = useState<number[]>([]);
  const [sortMode, setSortMode] = useState<NoticeSortMode>("latest");
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
          console.log(
            "공지사항 조회 실패:",
            error.response?.data || error.message,
          );
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
      void AsyncStorage.setItem(
        READ_NOTICE_IDS_STORAGE_KEY,
        JSON.stringify(nextIds),
      );
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
      console.log(
        "공지사항 상세 조회 실패:",
        error.response?.data || error.message,
      );
    } finally {
      setDetailLoadingId(null);
    }
  };

  const sortedNotices = useMemo(() => {
    return [...notices].sort((first, second) => {
      const firstTime = first.createdAt
        ? new Date(first.createdAt).getTime()
        : 0;
      const secondTime = second.createdAt
        ? new Date(second.createdAt).getTime()
        : 0;

      return sortMode === "oldest"
        ? firstTime - secondTime
        : secondTime - firstTime;
    });
  }, [notices, sortMode]);

  return (
    <View style={styles.container}>
      <ProfileScreenHeader title="공지사항" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
              {loadFailed
                ? "공지사항을 불러오지 못했어요"
                : "등록된 공지사항이 없어요"}
            </Text>
            <Text style={styles.emptyText}>
              {loadFailed
                ? "잠시 후 다시 시도해주세요."
                : "새 공지가 등록되면 이곳에서 확인할 수 있어요."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                전체{" "}
                <Text style={styles.summaryCount}>
                  {sortedNotices.length}개
                </Text>
              </Text>
              <Pressable
                style={styles.sortLabel}
                onPress={() => setSortVisible(true)}
              >
                <Text style={[fonts.body2_m_14, { color: Colors.gray[8] }]}>
                  {noticeSortLabel(sortMode)}
                </Text>
                <ArrowDownIcon width={16} height={16} color={MUTED} />
              </Pressable>
            </View>
            {sortedNotices.map((notice, index) => {
              const expanded = expandedNoticeId === notice.id;
              const detail = noticeDetails[notice.id] ?? notice;
              const read = readNoticeIds.includes(notice.id);

              return (
                <Pressable
                  key={notice.id ?? notice.title}
                  style={[
                    styles.noticeRow,
                    index === sortedNotices.length - 1 && styles.noticeRowLast,
                  ]}
                  onPress={() => handleNoticePress(notice)}
                >
                  {read ? (
                    <NoticeReadDotIcon
                      width={6}
                      height={6}
                      style={styles.noticeReadDot}
                    />
                  ) : (
                    <View style={styles.noticeDot} />
                  )}
                  <View style={styles.noticeBody}>
                    <View style={styles.noticeTitleRow}>
                      <Text
                        style={[
                          styles.noticeTitle,
                          read && styles.noticeTitleRead,
                        ]}
                        numberOfLines={expanded ? undefined : 1}
                      >
                        {detail.title}
                      </Text>
                      {expanded ? (
                        <ArrowUpIcon
                          width={20}
                          height={20}
                          color={Colors.gray[10]}
                        />
                      ) : (
                        <ArrowDownIcon
                          width={20}
                          height={20}
                          color={Colors.gray[10]}
                        />
                      )}
                    </View>
                    {detailLoadingId === notice.id ? (
                      <Text
                        style={[
                          styles.noticeContent,
                          read && styles.noticeContentRead,
                        ]}
                      >
                        공지 내용을 불러오는 중이에요.
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.noticeContent,
                          read && styles.noticeContentRead,
                        ]}
                        numberOfLines={expanded ? undefined : 1}
                      >
                        {detail.content}
                      </Text>
                    )}
                    <Text
                      style={[styles.noticeDate, read && styles.noticeDateRead]}
                    >
                      {formatDate(detail.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <SortSheet
        visible={sortVisible}
        value={sortMode}
        onClose={() => setSortVisible(false)}
        onSelect={(value) => {
          setSortMode(value);
          setSortVisible(false);
        }}
        options={[
          { value: "latest", label: "최신순" },
          { value: "oldest", label: "오래된순" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.common.white,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 104,
  },
  summaryRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  summaryText: {
    ...fonts.title5_b_20,
    color: Colors.gray[11],
  },
  summaryCount: {
    color: Colors.primary.default,
  },
  sortLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 36,
    paddingLeft: 8,
  },
  loadingBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    minHeight: 260,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#EEF2F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.gray[11],
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: MUTED,
    textAlign: "center",
  },
  noticeRow: {
    position: "relative",
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[3],
  },
  noticeRowLast: {
    borderBottomWidth: 0,
  },
  noticeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
    backgroundColor: Colors.primary.default,
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
    ...fonts.sub3_sb_16,
    color: Colors.gray[11],
  },
  noticeTitleRead: {
    color: Colors.gray[7],
  },
  noticeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noticeContent: {
    marginTop: 4,
    ...fonts.body4_r_14,
    color: Colors.gray[8],
  },
  noticeContentRead: {
    color: Colors.gray[5],
  },
  noticeDate: {
    marginTop: 8,
    ...fonts.caption4_m_12,
    color: Colors.gray[7],
  },
  noticeDateRead: {
    color: Colors.gray[5],
  },
});
