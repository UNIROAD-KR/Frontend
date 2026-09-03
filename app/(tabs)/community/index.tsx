import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { AppBackButton } from "@/components/ui/app-back-button";
import {
  CompanionPostResponse,
  getCompanionPosts,
} from "../../../src/api/companion";
import {
  FreePostStatusFilter,
  FreePostSummaryResponse,
  getFreePosts,
} from "../../../src/api/freePosts";
import { BLUE, GREEN } from "../../../src/data/community";

const communityTabs = ["자유 게시판", "동행 구하기"] as const;
const countryFilters = ["전체 국가", "프랑스", "독일", "스페인", "네덜란드"];
const boardStatusFilters = ["전체", "파견 전", "파견 중"] as const;
const companionStatusFilters = ["전체", "모집중", "모집완료"];
const sortFilters = ["최신순", "마감임박순"];
const COMMUNITY_PAGE_SIZE = 10;

type CommunityTab = (typeof communityTabs)[number];
type DropdownKey = "status" | "country" | "sort" | null;
type DatePickerTarget = "start" | "end" | null;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (dateText: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatDateText = (value?: string) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 10).replaceAll("-", ".");
};

const formatCompanionPeriod = (startDate?: string, endDate?: string) => {
  const start = startDate?.slice(5).replace("-", "/") || "";
  const end = endDate?.slice(5).replace("-", "/") || "";

  if (!start) {
    return "";
  }

  return start === end || !end ? start : `${start} - ${end}`;
};

const getBoardStatusColors = (status: string) => {
  if (status === "파견 중") {
    return { backgroundColor: "#DDF4E4", color: "#238451" };
  }

  if (status === "파견 전") {
    return { backgroundColor: "#EAF1FF", color: "#2F66D0" };
  }

  return { backgroundColor: "#FFF1DF", color: "#F28A2E" };
};

const getCompanionStatusText = (status: CompanionPostResponse["status"]) =>
  status === "RECRUITING" ? "모집중" : "모집완료";

export default function CommunityScreen() {
  const router = useRouter();
  const { tab, fromTab } = useLocalSearchParams<{
    tab?: string | string[];
    fromTab?: string | string[];
  }>();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<CommunityTab>("자유 게시판");
  const [boardKeyword, setBoardKeyword] = useState("");
  const [selectedBoardStatus, setSelectedBoardStatus] =
    useState<FreePostStatusFilter>("전체");
  const [selectedCompanionStatus, setSelectedCompanionStatus] =
    useState("전체");
  const [selectedCompanionCountry, setSelectedCompanionCountry] =
    useState("전체 국가");
  const [companionStartDate, setCompanionStartDate] = useState("");
  const [companionEndDate, setCompanionEndDate] = useState("");
  const [selectedCompanionSort, setSelectedCompanionSort] = useState("최신순");
  const [draftCompanionStatus, setDraftCompanionStatus] = useState("전체");
  const [draftCompanionCountry, setDraftCompanionCountry] =
    useState("전체 국가");
  const [draftCompanionStartDate, setDraftCompanionStartDate] = useState("");
  const [draftCompanionEndDate, setDraftCompanionEndDate] = useState("");
  const [draftCompanionSort, setDraftCompanionSort] = useState("최신순");
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [datePickerTarget, setDatePickerTarget] =
    useState<DatePickerTarget>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const [boardPosts, setBoardPosts] = useState<FreePostSummaryResponse[]>([]);
  const [companionPosts, setCompanionPosts] = useState<CompanionPostResponse[]>(
    [],
  );
  const [boardNextCursorId, setBoardNextCursorId] = useState<number | null>(
    null,
  );
  const [companionNextCursorId, setCompanionNextCursorId] = useState<
    number | null
  >(null);
  const [boardHasNext, setBoardHasNext] = useState(false);
  const [companionHasNext, setCompanionHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreBoard, setLoadingMoreBoard] = useState(false);
  const [loadingMoreCompanion, setLoadingMoreCompanion] = useState(false);
  const didMountRef = useRef(false);
  const boardKeywordRef = useRef("");
  const isWide = width >= 768;

  const loadFreePosts = useCallback(
    async (
      cursorId?: number,
      append = false,
      keywordText = boardKeywordRef.current,
      statusFilter = selectedBoardStatus,
    ) => {
      const keyword = keywordText.trim();
      try {
        const freeResponse = await getFreePosts(
          {
            cursorId,
            keyword: keyword.length > 0 ? keyword : undefined,
            size: COMMUNITY_PAGE_SIZE,
          },
          statusFilter,
        );
        const cursorData = freeResponse.data.data;
        const nextItems = cursorData?.items ?? [];

        setBoardPosts((prev) => (append ? [...prev, ...nextItems] : nextItems));
        setBoardNextCursorId(cursorData?.nextCursorId ?? null);
        setBoardHasNext(cursorData?.hasNext ?? false);
      } catch (error: any) {
        console.log(
          "자유게시판 목록 조회 실패:",
          error.response?.data || error.message,
        );
      }
    },
    [selectedBoardStatus],
  );

  const loadCompanionPosts = useCallback(
    async (cursorId?: number, append = false) => {
      try {
        const companionResponse = await getCompanionPosts({
          cursorId,
          size: COMMUNITY_PAGE_SIZE,
        });
        const cursorData = companionResponse.data.data;
        const nextItems = cursorData?.items ?? [];

        setCompanionPosts((prev) =>
          append ? [...prev, ...nextItems] : nextItems,
        );
        setCompanionNextCursorId(cursorData?.nextCursorId ?? null);
        setCompanionHasNext(cursorData?.hasNext ?? false);
      } catch (error: any) {
        console.log(
          "동행 구하기 목록 조회 실패:",
          error.response?.data || error.message,
        );
      }
    },
    [],
  );

  const loadCommunityPosts = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([loadFreePosts(), loadCompanionPosts()]);
    } finally {
      setLoading(false);
    }
  }, [loadCompanionPosts, loadFreePosts]);

  const handleLoadMoreBoard = async () => {
    if (!boardHasNext || boardNextCursorId == null || loadingMoreBoard) {
      return;
    }

    setLoadingMoreBoard(true);
    try {
      await loadFreePosts(
        boardNextCursorId,
        true,
        boardKeywordRef.current,
        selectedBoardStatus,
      );
    } finally {
      setLoadingMoreBoard(false);
    }
  };

  const handleLoadMoreCompanion = async () => {
    if (
      !companionHasNext ||
      companionNextCursorId == null ||
      loadingMoreCompanion
    ) {
      return;
    }

    setLoadingMoreCompanion(true);
    try {
      await loadCompanionPosts(companionNextCursorId, true);
    } finally {
      setLoadingMoreCompanion(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCommunityPosts();
    }, [loadCommunityPosts]),
  );

  useEffect(() => {
    boardKeywordRef.current = boardKeyword.trim();

    if (!didMountRef.current) {
      didMountRef.current = true;
      return undefined;
    }

    const timer = setTimeout(() => {
      loadFreePosts(undefined, false, boardKeyword, selectedBoardStatus);
    }, 300);

    return () => clearTimeout(timer);
  }, [boardKeyword, loadFreePosts, selectedBoardStatus]);

  const companionCountryFilterItems = useMemo(
    () => [
      "전체 국가",
      ...Array.from(
        new Set(companionPosts.map((post) => post.country).filter(Boolean)),
      ),
    ],
    [companionPosts],
  );

  const initialTab = Array.isArray(tab) ? tab[0] : tab;
  const openedFromTab =
    (Array.isArray(fromTab) ? fromTab[0] : fromTab) === "true";

  useEffect(() => {
    if (initialTab === "companion") {
      setActiveTab("동행 구하기");
    }
  }, [initialTab]);

  const filteredBoardPosts = useMemo(() => {
    const keyword = boardKeyword.trim().toLowerCase();

    return boardPosts.filter((post) => {
      const matchesKeyword =
        keyword.length === 0 ||
        `${post.title} ${post.preview}`.toLowerCase().includes(keyword);
      const matchesStatus =
        selectedBoardStatus === "전체" || post.status === selectedBoardStatus;

      return matchesKeyword && matchesStatus;
    });
  }, [boardKeyword, boardPosts, selectedBoardStatus]);

  const filteredCompanions = useMemo(() => {
    const filtered = companionPosts.filter((post) => {
      const matchesStatus =
        selectedCompanionStatus === "전체" ||
        getCompanionStatusText(post.status) === selectedCompanionStatus;
      const matchesCountry =
        selectedCompanionCountry === "전체 국가" ||
        post.country === selectedCompanionCountry;
      const matchesDate =
        (!companionStartDate || post.startDate >= companionStartDate) &&
        (!companionEndDate || post.startDate <= companionEndDate);

      return matchesStatus && matchesCountry && matchesDate;
    });

    return [...filtered].sort((a, b) =>
      selectedCompanionSort === "마감임박순"
        ? a.startDate.localeCompare(b.startDate)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [
    companionEndDate,
    companionStartDate,
    selectedCompanionCountry,
    selectedCompanionSort,
    selectedCompanionStatus,
    companionPosts,
  ]);

  const openCompanionDatePicker = (target: Exclude<DatePickerTarget, null>) => {
    const currentValue =
      target === "start" ? draftCompanionStartDate : draftCompanionEndDate;
    setDraftDate(parseDate(currentValue) || new Date());
    setDatePickerTarget(target);
  };

  const handleConfirmDate = () => {
    const nextDate = formatDate(draftDate);

    if (datePickerTarget === "start") {
      setDraftCompanionStartDate(nextDate);
      if (draftCompanionEndDate && draftCompanionEndDate < nextDate) {
        setDraftCompanionEndDate("");
      }
    }

    if (datePickerTarget === "end") {
      setDraftCompanionEndDate(nextDate);
      if (draftCompanionStartDate && draftCompanionStartDate > nextDate) {
        setDraftCompanionStartDate("");
      }
    }

    setDatePickerTarget(null);
  };

  const handleApplyCompanionFilters = () => {
    setSelectedCompanionStatus(draftCompanionStatus);
    setSelectedCompanionCountry(draftCompanionCountry);
    setCompanionStartDate(draftCompanionStartDate);
    setCompanionEndDate(draftCompanionEndDate);
    setSelectedCompanionSort(draftCompanionSort);
    setOpenDropdown(null);
  };

  const handleFabPress = () => {
    router.push({
      pathname: "/community-write",
      params: { type: activeTab === "자유 게시판" ? "free" : "companion" },
    } as never);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {!openedFromTab ? (
          <AppBackButton fallbackHref="/home" style={styles.headerBackButton} />
        ) : null}
        <Text style={styles.headerTitle}>커뮤니티</Text>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/notifications" as any)}
          >
            <Image
              source={require("../../../assets/images/alarm.png")}
              style={styles.icon}
            />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/more-menu" as any)}
          >
            <Image
              source={require("../../../assets/images/menu.png")}
              style={styles.icon}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tradeTypeBox}>
          {communityTabs.map((tab) => {
            const active = activeTab === tab;

            return (
              <Pressable
                key={tab}
                style={[
                  styles.tradeTypeButton,
                  active && styles.tradeTypeActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tradeTypeText,
                    active && styles.tradeTypeTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "자유 게시판" ? (
          <View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color="#9A9A9A" />
              <TextInput
                style={styles.searchInput}
                placeholder="글 제목, 내용 검색"
                placeholderTextColor="#9A9A9A"
                value={boardKeyword}
                onChangeText={setBoardKeyword}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.boardStatusFilterRow}
            >
              {boardStatusFilters.map((status) => {
                const active = selectedBoardStatus === status;

                return (
                  <Pressable
                    key={status}
                    style={[
                      styles.boardStatusFilter,
                      active && styles.boardStatusFilterActive,
                    ]}
                    onPress={() => setSelectedBoardStatus(status)}
                  >
                    <Text
                      style={[
                        styles.boardStatusFilterText,
                        active && styles.boardStatusFilterTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={[styles.boardList, isWide && styles.gridList]}>
              {filteredBoardPosts.map((post) => (
                <Pressable
                  key={post.id}
                  style={[styles.boardCard, isWide && styles.gridCard]}
                  onPress={() =>
                    router.push({
                      pathname: "/community-detail",
                      params: { type: "free", id: String(post.id) },
                    } as never)
                  }
                >
                  <View style={styles.boardTopRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getBoardStatusColors(post.status)
                            .backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getBoardStatusColors(post.status).color },
                        ]}
                      >
                        {post.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.boardTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={styles.boardPreview} numberOfLines={1}>
                    {post.preview}
                  </Text>

                  <View style={styles.boardFooter}>
                    <View style={styles.authorRow}>
                      <Text style={styles.metaText}>
                        익명 · {post.country} {post.status}
                      </Text>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="thumbs-up-outline"
                          size={13}
                          color="#A5A5A5"
                        />
                        <Text style={styles.statText}>{post.likeCount}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={13}
                          color="#A5A5A5"
                        />
                        <Text style={styles.statText}>{post.commentCount}</Text>
                      </View>
                      <Text style={styles.timeText}>
                        {formatDateText(post.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {boardHasNext && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={handleLoadMoreBoard}
                disabled={loadingMoreBoard}
              >
                {loadingMoreBoard ? (
                  <ActivityIndicator color={BLUE} />
                ) : (
                  <Text style={styles.loadMoreText}>더보기</Text>
                )}
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.companionFilterPanel}>
              <View style={styles.filterTopRow}>
                <View style={styles.filterTitleRow}>
                  <Ionicons name="options-outline" size={16} color={BLUE} />
                  <Text style={styles.filterPanelTitle}>필터</Text>
                </View>

                {(draftCompanionStartDate || draftCompanionEndDate) && (
                  <Pressable
                    style={styles.clearDateButton}
                    onPress={() => {
                      setDraftCompanionStartDate("");
                      setDraftCompanionEndDate("");
                    }}
                  >
                    <Ionicons name="refresh" size={13} color="#666666" />
                    <Text style={styles.clearDateText}>날짜 초기화</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.compactFilterBar}>
                <DropdownFilter
                  compact
                  label={draftCompanionStatus}
                  items={companionStatusFilters}
                  selected={draftCompanionStatus}
                  open={openDropdown === "status"}
                  onToggle={() =>
                    setOpenDropdown(openDropdown === "status" ? null : "status")
                  }
                  onSelect={(item) => {
                    setDraftCompanionStatus(item);
                    setOpenDropdown(null);
                  }}
                />
                <DropdownFilter
                  compact
                  label={draftCompanionCountry}
                  items={
                    companionCountryFilterItems.length > 1
                      ? companionCountryFilterItems
                      : countryFilters
                  }
                  selected={draftCompanionCountry}
                  open={openDropdown === "country"}
                  onToggle={() =>
                    setOpenDropdown(
                      openDropdown === "country" ? null : "country",
                    )
                  }
                  onSelect={(item) => {
                    setDraftCompanionCountry(item);
                    setOpenDropdown(null);
                  }}
                />
                <DropdownFilter
                  compact
                  label={draftCompanionSort}
                  items={sortFilters}
                  selected={draftCompanionSort}
                  open={openDropdown === "sort"}
                  onToggle={() =>
                    setOpenDropdown(openDropdown === "sort" ? null : "sort")
                  }
                  onSelect={(item) => {
                    setDraftCompanionSort(item);
                    setOpenDropdown(null);
                  }}
                />
              </View>

              <View style={styles.dateRangeRow}>
                <DateRangeButton
                  label="시작일"
                  value={draftCompanionStartDate}
                  onPress={() => openCompanionDatePicker("start")}
                />
                <View style={styles.dateRangeDivider} />
                <DateRangeButton
                  label="종료일"
                  value={draftCompanionEndDate}
                  onPress={() => openCompanionDatePicker("end")}
                />
              </View>

              <Pressable
                style={styles.applyFilterButton}
                onPress={handleApplyCompanionFilters}
              >
                <Text style={styles.applyFilterText}>적용</Text>
              </Pressable>
            </View>

            <View style={styles.nowHeader}>
              <Text style={styles.sectionTitle}>조건에 맞는 동행</Text>
            </View>

            <View style={[styles.companionList, isWide && styles.gridList]}>
              {filteredCompanions.map((post) => (
                <Pressable
                  key={post.id}
                  style={[styles.companionCard, isWide && styles.gridCard]}
                  onPress={() =>
                    router.push({
                      pathname: "/community-detail",
                      params: { type: "companion", id: String(post.id) },
                    } as never)
                  }
                >
                  <View
                    style={[
                      styles.companionThumb,
                      { backgroundColor: "#EAF1FF" },
                    ]}
                  >
                    <Ionicons name="map-outline" size={23} color="#2F66D0" />
                  </View>

                  <View style={styles.companionBody}>
                    <View style={styles.companionTitleRow}>
                      <Text style={styles.companionTitle} numberOfLines={1}>
                        {post.title}
                      </Text>
                      <View
                        style={[
                          styles.smallStatus,
                          post.status === "COMPLETED" && styles.smallStatusDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallStatusText,
                            post.status === "COMPLETED" &&
                              styles.smallStatusDoneText,
                          ]}
                        >
                          {getCompanionStatusText(post.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.companionMeta}>
                      {post.country} · {post.region} ·{" "}
                      {formatCompanionPeriod(post.startDate, post.endDate)}
                    </Text>

                    <View style={styles.companionFooter}>
                      <View style={styles.peopleRow}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#777777"
                        />
                        <Text style={styles.peopleText}>
                          {post.currentParticipants}/{post.capacity}명
                        </Text>
                      </View>
                      <View style={styles.verifyRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={GREEN}
                        />
                        <Text style={styles.verifyText}>학교인증</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {companionHasNext && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={handleLoadMoreCompanion}
                disabled={loadingMoreCompanion}
              >
                {loadingMoreCompanion ? (
                  <ActivityIndicator color={BLUE} />
                ) : (
                  <Text style={styles.loadMoreText}>더보기</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={datePickerTarget !== null}
        animationType="slide"
        onRequestClose={() => setDatePickerTarget(null)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setDatePickerTarget(null)}
          />

          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setDatePickerTarget(null)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>

              <Text style={styles.pickerTitle}>
                {datePickerTarget === "start" ? "시작일 선택" : "종료일 선택"}
              </Text>

              <Pressable onPress={handleConfirmDate}>
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              textColor="#111111"
              themeVariant="light"
              style={styles.iosPicker}
              onChange={(event, date) => {
                if (date) {
                  setDraftDate(date);
                }
              }}
            />
          </View>
        </View>
      </Modal>

      <Pressable style={styles.fab} onPress={handleFabPress}>
        <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>
          {activeTab === "자유 게시판" ? "글쓰기" : "동행 모집"}
        </Text>
      </Pressable>
    </View>
  );
}

function DropdownFilter({
  label,
  items,
  selected,
  open,
  onToggle,
  onSelect,
  compact = false,
}: {
  label: string;
  items: string[];
  selected: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (item: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.dropdownWrap, compact && styles.dropdownWrapCompact]}>
      <Pressable
        style={[styles.dropdownButton, compact && styles.dropdownButtonCompact]}
        onPress={onToggle}
      >
        <Text style={styles.dropdownText} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={15}
          color="#555555"
        />
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {items.map((item) => {
            const active = selected === item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.dropdownItem,
                  active && styles.dropdownItemActive,
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    active && styles.dropdownItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function DateRangeButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const active = value.length > 0;

  return (
    <Pressable
      style={[styles.dateRangeButton, active && styles.dateRangeButtonActive]}
      onPress={onPress}
    >
      <View style={styles.dateRangeLabelRow}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={active ? BLUE : "#8A8A8A"}
        />
        <Text
          style={[styles.dateRangeLabel, active && styles.dateRangeLabelActive]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[styles.dateRangeValue, active && styles.dateRangeValueActive]}
        numberOfLines={1}
      >
        {active ? value : "날짜 선택"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 23,
    paddingTop: 84,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  headerBackButton: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  iconBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 23,
    paddingBottom: 120,
  },
  contentWide: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  tradeTypeBox: {
    height: 55,
    backgroundColor: "#F0F3F7",
    borderRadius: 10,
    flexDirection: "row",
    padding: 5,
    marginBottom: 16,
  },
  tradeTypeButton: {
    flex: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tradeTypeActive: {
    backgroundColor: "#FFFFFF",
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#8F8F8F",
  },
  tradeTypeTextActive: {
    color: "#111111",
    fontWeight: "900",
  },
  searchBox: {
    height: 45,
    borderRadius: 13,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    paddingVertical: 0,
  },
  boardStatusFilterRow: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 15,
  },
  boardStatusFilter: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  boardStatusFilterActive: {
    borderColor: "#DCE7FF",
    backgroundColor: "#EAF1FF",
  },
  boardStatusFilterText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  boardStatusFilterTextActive: {
    color: BLUE,
  },
  dropdownWrap: {
    position: "relative",
    zIndex: 20,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  dropdownWrapCompact: {
    marginBottom: 0,
    flexShrink: 0,
  },
  dropdownButton: {
    minWidth: 128,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
  },
  dropdownButtonCompact: {
    minWidth: 98,
    maxWidth: 150,
    height: 40,
    borderRadius: 12,
    borderColor: "#E6EAF2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#333333",
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 0,
    minWidth: 132,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7EAF0",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    zIndex: 50,
  },
  dropdownItem: {
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: "#F0F3F7",
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
  },
  dropdownItemTextActive: {
    fontWeight: "900",
    color: "#111111",
  },
  boardList: {
    gap: 12,
  },
  loadMoreButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE4F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    backgroundColor: "#FFFFFF",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "900",
    color: BLUE,
  },
  gridList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  boardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 13,
  },
  gridCard: {
    width: "48.7%",
  },
  boardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B4B4B4",
  },
  boardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111111",
  },
  boardPreview: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "#777777",
  },
  boardFooter: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  authorRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#888888",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A5A5A5",
  },
  compactFilterBar: {
    position: "relative",
    zIndex: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  companionFilterPanel: {
    position: "relative",
    zIndex: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8ECF3",
    backgroundColor: "#F8FAFD",
    padding: 13,
    marginBottom: 18,
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  filterTopRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 11,
  },
  filterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterPanelTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111111",
  },
  clearDateButton: {
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  clearDateText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666666",
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  dateRangeButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  dateRangeButtonActive: {
    borderColor: "#C9D4FF",
    backgroundColor: "#F4F7FF",
  },
  dateRangeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateRangeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8A8A8A",
  },
  dateRangeLabelActive: {
    color: BLUE,
  },
  dateRangeValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#A0A0A0",
  },
  dateRangeValueActive: {
    color: "#111111",
  },
  dateRangeDivider: {
    width: 10,
    height: 1,
    borderRadius: 1,
    backgroundColor: "#B9C0CC",
  },
  applyFilterButton: {
    height: 43,
    borderRadius: 13,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  applyFilterText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111111",
  },
  nowHeader: {
    marginTop: 0,
    marginBottom: 12,
  },
  companionList: {
    gap: 12,
  },
  companionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    padding: 12,
  },
  companionThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  companionBody: {
    flex: 1,
  },
  companionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companionTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111111",
  },
  smallStatus: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#EEF3FF",
  },
  smallStatusDone: {
    backgroundColor: "#F2F2F2",
  },
  smallStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: BLUE,
  },
  smallStatusDoneText: {
    color: "#777777",
  },
  companionMeta: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#777777",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 9,
  },
  tagChip: {
    borderRadius: 6,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#777777",
  },
  companionFooter: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  peopleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#555555",
  },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: "900",
    color: GREEN,
  },
  verifyTextInactive: {
    color: "#A5A5A5",
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 17, 0.32)",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingBottom: 28,
    overflow: "hidden",
  },
  pickerHeader: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },
  pickerCancel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#777777",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },
  pickerDone: {
    fontSize: 15,
    fontWeight: "900",
    color: BLUE,
  },
  iosPicker: {
    height: 210,
    backgroundColor: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: 23,
    bottom: 30,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  fabText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
