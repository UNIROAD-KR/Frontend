import { SoftServiceIcon } from "@/components/soft-service-icon";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  DeviceEventEmitter,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LogoIcon from "../../../assets/icon/logo.svg";

import { getMemberMe, type CurrentSituation } from "../../../src/api/auth";
import {
  getUnreadNotificationCount,
  NOTIFICATION_READ_EVENT,
} from "../../../src/api/notifications";
import { getUsedItems, type UsedItem } from "../../../src/api/usedItems";

import {
  currentSituationLifecycleMap,
  quickActionsByStatus,
  statusDisplayMap,
} from "@/components/constants";
import type { LifecycleStatus } from "@/components/types";
import ArrowRightIcon from "../../../assets/icon/arrow-right.svg";
import NotificationIcon from "../../../assets/icon/notification.svg";
import PersonIcon from "../../../assets/icon/person.svg";
import SearchIcon from "../../../assets/icon/search.svg";
import { BulkTradeSection } from "../../../components/home/bulk-trade-section";
import { fonts } from "../../../constants/theme";

const NAVY = "#0F2042";
const BLUE = "#2F66D0";
const HERO_BLUE = "#1D4ED8";

const popularPosts = [
  {
    title: "독일 비자 인터뷰 예약 가능한 날짜 공유합니다",
    country: "독일",
    likes: 34,
    comments: 12,
    time: "8분 전",
  },
];

const companionPosts = [
  {
    city: "독일 뮌헨",
    period: "7.18 - 7.21",
    status: "모집중",
    people: "2/4명",
    verified: true,
    likes: 18,
  },
];

const currentSituationDisplayMap: Record<CurrentSituation, string> = {
  PREPARING_APPLICATION: "파견 지원 준비 중",
  WAITING_RESULT: "파견 결과 대기 중",
  ACCEPTED: "파견 확정",
  PREPARING_DEPARTURE: "출국 준비 중",
  DISPATCHED: "파견 중",
  RETURNED: "귀국 완료",
};

const getCurrentSituationDisplayText = (value: string | null | undefined) => {
  if (!value) return "상태 미설정";
  return currentSituationDisplayMap[value as CurrentSituation] || value;
};

const getLifecycleStatusFromCurrentSituation = (
  value: string | null | undefined,
): LifecycleStatus | null => {
  if (!value) return null;
  return currentSituationLifecycleMap[value as CurrentSituation] || null;
};

const createDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);
const oneDay = 1000 * 60 * 60 * 24;

const normalizeStatus = (
  profileStatus: string | null,
  onboardingStatus: string | null,
  hasDispatchedUniversity: boolean,
): LifecycleStatus => {
  if (profileStatus && profileStatus in quickActionsByStatus) {
    return profileStatus as LifecycleStatus;
  }

  if (onboardingStatus && statusDisplayMap[onboardingStatus]) {
    return statusDisplayMap[onboardingStatus];
  }

  return hasDispatchedUniversity ? "파견 중" : "지원 준비 중";
};

const parseDate = (value: string | null, fallback: Date) => {
  if (!value) return fallback;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const diffDays = (target: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedTarget = new Date(target);
  normalizedTarget.setHours(0, 0, 0, 0);

  return Math.ceil((normalizedTarget.getTime() - today.getTime()) / oneDay);
};

const formatTimelineDate = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const getSemesterText = (date: Date) => {
  const month = date.getMonth() + 1;
  return `${date.getFullYear()} ${month <= 6 ? "봄학기" : "가을학기"}`;
};

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState("닉네임");
  const [lifecycleStatus, setLifecycleStatus] =
    useState<LifecycleStatus>("지원 준비 중");
  const [currentSituationText, setCurrentSituationText] =
    useState("상태 미설정");
  const [dispatchInfo, setDispatchInfo] = useState({
    country: "파견 국가 미설정",
    region: "베를린",
    university: "베를린 자유대학교",
  });
  const [dashboardDates, setDashboardDates] = useState({
    applicationDeadline: createDate(2026, 3, 18),
    departurePrepStartDate: createDate(2026, 3, 1),
    departureDate: createDate(2026, 8, 21),
    dispatchStartDate: createDate(2026, 9, 1),
    returnDate: createDate(2027, 1, 15),
  });
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedHomeTab, setSelectedHomeTab] = useState<
    "정보" | "상태" | "추천"
  >("정보");
  const [tradeItems, setTradeItems] = useState<UsedItem[]>([]);
  useEffect(() => {
    if (__DEV__)
      console.log("[Notifications][Home] 화면 배지 상태:", unreadCount);
  }, [unreadCount]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let fetching = false;
      let pendingRefresh = false;
      const refreshUnreadCount = async () => {
        if (fetching || AppState.currentState !== "active") return;
        fetching = true;
        try {
          if (!(await AsyncStorage.getItem("accessToken"))) {
            if (__DEV__)
              console.log("[Notifications] 비로그인: 개수 조회 생략, 배지 0");
            if (active) setUnreadCount(0);
            return;
          }
          if (__DEV__)
            console.log("[Notifications] 읽지 않은 알림 개수 조회 요청");
          const response = await getUnreadNotificationCount();
          if (__DEV__)
            console.log(
              "[Notifications] 개수 조회 응답:",
              response.status,
              response.data,
            );
          const count = response.data.data.count;
          if (active) {
            setUnreadCount(count);
          }
        } catch (error: any) {
          console.log(
            "미확인 알림 개수 조회 실패:",
            error.response?.data || error.message,
          );
        } finally {
          fetching = false;
          if (active && pendingRefresh) {
            pendingRefresh = false;
            void refreshUnreadCount();
          }
        }
      };
      void refreshUnreadCount();
      const readSubscription = DeviceEventEmitter.addListener(
        NOTIFICATION_READ_EVENT,
        () => {
          if (fetching) pendingRefresh = true;
          else void refreshUnreadCount();
        },
      );
      const timer = setInterval(() => void refreshUnreadCount(), 10000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void refreshUnreadCount();
      });
      return () => {
        active = false;
        clearInterval(timer);
        subscription.remove();
        readSubscription.remove();
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTradeItems = async () => {
        try {
          const response = await getUsedItems({ size: 3 });
          if (active) setTradeItems(response.data.data.items ?? []);
        } catch (error: any) {
          console.log(
            "홈 중고거래 목록 조회 실패:",
            error.response?.data || error.message,
          );
          if (active) setTradeItems([]);
        }
      };

      void loadTradeItems();

      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    if (nickname) {
      setDisplayName(nickname);
    }
  }, [nickname]);

  useFocusEffect(
    useCallback(() => {
      const loadNickname = async () => {
        const [
          savedNickname,
          onboardingStatus,
          profileStatus,
          dispatchedRegion,
          dispatchedUniversity,
          applicationDeadline,
          departurePrepStartDate,
          departureDate,
          dispatchStartDate,
          returnDate,
          savedOverrides,
        ] = await Promise.all([
          AsyncStorage.getItem("nickname"),
          AsyncStorage.getItem("exchangeStatus"),
          AsyncStorage.getItem("profileStatus"),
          AsyncStorage.getItem("dispatchedRegion"),
          AsyncStorage.getItem("dispatchedUniversity"),
          AsyncStorage.getItem("applicationDeadline"),
          AsyncStorage.getItem("departurePrepStartDate"),
          AsyncStorage.getItem("departureDate"),
          AsyncStorage.getItem("dispatchStartDate"),
          AsyncStorage.getItem("returnDate"),
          AsyncStorage.getItem("profileFieldOverrides"),
        ]);
        const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

        let apiNickname: string | null = null;
        let apiDispatchedCountry: string | null = null;
        let apiDispatchedRegion: string | null = null;
        let apiDispatchedUniversity: string | null = null;
        let apiCurrentSituation: string | null = null;

        try {
          const memberRes = await getMemberMe();
          const member = memberRes.data?.data;

          apiNickname = overrides.nickname
            ? null
            : member?.nickname?.trim() || null;
          apiDispatchedCountry = member?.dispatchedCountry || null;
          apiDispatchedRegion = overrides.region
            ? null
            : member?.dispatchedRegion || null;
          apiDispatchedUniversity = overrides.dispatchedUniversity
            ? null
            : member?.dispatchedUniversity || null;
          apiCurrentSituation = member?.currentSituation || null;

          if (apiNickname) {
            await AsyncStorage.setItem("nickname", apiNickname);
          }
        } catch (error: any) {
          console.log(
            "회원 정보 조회 실패:",
            error.response?.data || error.message,
          );
        }

        if (apiNickname || savedNickname) {
          setDisplayName(apiNickname || savedNickname || "닉네임");
        }

        setCurrentSituationText(
          getCurrentSituationDisplayText(apiCurrentSituation),
        );
        setDispatchInfo({
          country: apiDispatchedCountry || "파견 국가 미설정",
          region: apiDispatchedRegion || dispatchedRegion || "베를린",
          university:
            apiDispatchedUniversity ||
            dispatchedUniversity ||
            "베를린 자유대학교",
        });

        setLifecycleStatus(
          getLifecycleStatusFromCurrentSituation(apiCurrentSituation) ||
            normalizeStatus(
              profileStatus,
              onboardingStatus,
              Boolean(dispatchedUniversity),
            ),
        );
        const parsedDepartureDate = parseDate(
          departureDate,
          createDate(2026, 8, 21),
        );
        setDashboardDates({
          applicationDeadline: parseDate(
            applicationDeadline,
            createDate(2026, 3, 18),
          ),
          departurePrepStartDate: parseDate(
            departurePrepStartDate,
            createDate(parsedDepartureDate.getFullYear(), 3, 1),
          ),
          departureDate: parsedDepartureDate,
          dispatchStartDate: parseDate(
            dispatchStartDate,
            createDate(2026, 9, 1),
          ),
          returnDate: parseDate(returnDate, createDate(2027, 1, 15)),
        });
      };

      loadNickname();
    }, []),
  );

  const isDispatched = lifecycleStatus === "파견 중";
  const isReturned = lifecycleStatus === "귀국";
  const showTradeBeforeCompanion = !isDispatched && !isReturned;
  const applicationDday = diffDays(dashboardDates.applicationDeadline);
  const departureDday = diffDays(dashboardDates.departureDate);
  const dispatchedDay = Math.max(
    0,
    Math.abs(diffDays(dashboardDates.dispatchStartDate)),
  );
  const returnDday = diffDays(dashboardDates.returnDate);
  const totalDispatchDays = Math.max(
    1,
    Math.ceil(
      (dashboardDates.returnDate.getTime() -
        dashboardDates.dispatchStartDate.getTime()) /
        oneDay,
    ),
  );
  const dispatchProgress = Math.min(
    100,
    Math.round((dispatchedDay / totalDispatchDays) * 100),
  );
  const remainingDispatchDays = Math.max(0, returnDday);
  const isApplicationPreparing = lifecycleStatus === statusDisplayMap.preparing;
  const isDeparturePreparing = lifecycleStatus === statusDisplayMap.accepted;
  const normalizedToday = new Date();
  normalizedToday.setHours(0, 0, 0, 0);
  const applicationTimelineStartDate = createDate(
    dashboardDates.applicationDeadline.getFullYear(),
    1,
    1,
  );
  const applicationTimelineTotal = Math.max(
    oneDay,
    dashboardDates.applicationDeadline.getTime() -
      applicationTimelineStartDate.getTime(),
  );
  const applicationTimelineElapsed = Math.min(
    Math.max(
      normalizedToday.getTime() - applicationTimelineStartDate.getTime(),
      0,
    ),
    applicationTimelineTotal,
  );
  const applicationTimelinePercent = Math.round(
    (applicationTimelineElapsed / applicationTimelineTotal) * 100,
  );
  const departureTimelineTotal = Math.max(
    oneDay,
    dashboardDates.departureDate.getTime() -
      dashboardDates.departurePrepStartDate.getTime(),
  );
  const departureTimelineElapsed = Math.min(
    Math.max(
      normalizedToday.getTime() -
        dashboardDates.departurePrepStartDate.getTime(),
      0,
    ),
    departureTimelineTotal,
  );
  const departureTimelinePercent = Math.round(
    (departureTimelineElapsed / departureTimelineTotal) * 100,
  );

  const heroCopy = {
    "지원 준비 중": {
      tag: "정보 탐색 단계",
      title: `${dispatchInfo.country} 파견 지원 준비 중`,
      subtitle: `지원 마감까지 D-${Math.max(0, applicationDday)}`,
      metric: `D-${Math.max(0, applicationDday)}`,
      progressLabel: "지원 준비 진행률",
      progressValue: "38%",
      progressWidth: "38%",
    },
    "출국 준비 중": {
      tag: "출국 준비 단계",
      title: `${dispatchInfo.country} 출국 준비 중`,
      subtitle: `출국까지 D-${Math.max(0, departureDday)}`,
      metric: `D-${Math.max(0, departureDday)}`,
      progressLabel: "출국 준비 진행률",
      progressValue: "72%",
      progressWidth: "72%",
    },
    "파견 중": {
      tag: `${dispatchInfo.university} 파견 중`,
      title: `${dispatchInfo.country} 교환학생 생활 중`,
      subtitle:
        returnDday >= 0
          ? `귀국까지 ${remainingDispatchDays}일 남았어요`
          : "파견 생활을 정리하고 있어요",
      metric: `D+${dispatchedDay}`,
      progressLabel: `파견 기간 ${dispatchProgress}% 경과`,
      progressValue: `${dispatchedDay} / ${totalDispatchDays}일`,
      progressWidth: `${dispatchProgress}%`,
    },
    귀국: {
      tag: "파견 완료",
      title: `${dispatchInfo.country} 교환학생 수료`,
      subtitle: `${getSemesterText(dashboardDates.returnDate)} 파견 완료`,
      metric: "완료",
      progressLabel: "후기와 정리 단계",
      progressValue: "100%",
      progressWidth: "100%",
    },
  }[lifecycleStatus];
  const heroTitle = `${dispatchInfo.country} ${currentSituationText}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <LogoIcon height="24" />
        <View style={styles.headerRight}>
          <TouchableOpacity
            accessibilityLabel={`알림, 읽지 않은 알림 ${unreadCount}개`}
            onPress={() => router.push("/notifications")}
          >
            <NotificationIcon />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge} pointerEvents="none">
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/home/profile-card" as any)}
            activeOpacity={0.82}
          >
            <SearchIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/home/profile-card" as any)}
            activeOpacity={0.82}
          >
            <PersonIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.homeTabs}>
        {(["정보", "상태", "추천"] as const).map((tab) => {
          const isSelected = selectedHomeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.homeTab, isSelected && styles.selectedHomeTab]}
              onPress={() => setSelectedHomeTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  {
                    fontSize: 22,
                    fontWeight: "600",
                    lineHeight: 26.4,
                    letterSpacing: -0.88,
                    color: isSelected ? "#000000" : "#8B95A1",
                  },
                ]}
              >
                {tab}
              </Text>
              {tab === "추천" && (
                <View style={styles.customTabBadge}>
                  <Text style={styles.customTabBadgeText}>맞춤형</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* <View style={styles.heroCard}>
        {isDispatched ? (
          <>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>{heroCopy.tag}</Text>
              </View>
              <Text style={styles.heroSmallMeta}>{heroCopy.progressValue}</Text>
            </View>

            <View style={styles.dispatchedDayRow}>
              <Text style={styles.dispatchedDay}>{dispatchedDay}</Text>
              <Text style={styles.dispatchedDayUnit}>일째</Text>
            </View>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{heroCopy.subtitle}</Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.dispatchedProgressFill,
                  { width: heroCopy.progressWidth as DimensionValue },
                ]}
              />
            </View>

            <View style={styles.progressInfoRow}>
              <Text style={styles.progressLabel}>{heroCopy.progressLabel}</Text>
              <Text style={styles.progressValue}>{heroCopy.progressValue}</Text>
            </View>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push("/home/profile-card" as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.heroButtonText}>내 프로필 보기</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>{heroCopy.tag}</Text>
              </View>
              <Text style={styles.heroDday}>{heroCopy.metric}</Text>
            </View>

            <Text style={styles.heroTitle}>{heroTitle}</Text>
            {!isDeparturePreparing ? (
              <Text style={styles.heroSubtitle}>{heroCopy.subtitle}</Text>
            ) : null}

            {isApplicationPreparing ? (
              <View style={styles.applicationTimeline}>
                <View style={styles.timelineTrack}>
                  <View style={styles.timelineTrackBase} />
                  <View
                    style={[
                      styles.timelineFill,
                      {
                        width:
                          `${applicationTimelinePercent}%` as DimensionValue,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        left: `${applicationTimelinePercent}%` as DimensionValue,
                      },
                    ]}
                  />
                </View>

                <View style={styles.timelineDateRow}>
                  <Text style={styles.timelineDate}>지원 기간 진행 중</Text>
                  <Text style={styles.timelineDate}>
                    {formatTimelineDate(dashboardDates.applicationDeadline)}{" "}
                    마감
                  </Text>
                </View>
              </View>
            ) : isDeparturePreparing ? (
              <View style={styles.departureTimeline}>
                <View style={styles.timelineLabelRow}>
                  <Text style={styles.timelineLabel}>출국 준비 시작</Text>
                  <Text style={styles.timelineLabel}>출국</Text>
                </View>

                <View style={styles.timelineTrack}>
                  <View style={styles.timelineTrackBase} />
                  <View
                    style={[
                      styles.timelineFill,
                      {
                        width: `${departureTimelinePercent}%` as DimensionValue,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        left: `${departureTimelinePercent}%` as DimensionValue,
                      },
                    ]}
                  />
                </View>

                <View style={styles.timelineDateRow}>
                  <Text style={styles.timelineDate}>
                    {formatTimelineDate(dashboardDates.departurePrepStartDate)}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatTimelineDate(dashboardDates.departureDate)}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.progressInfoRow}>
                  <Text style={styles.progressLabel}>
                    {heroCopy.progressLabel}
                  </Text>
                  <Text style={styles.progressValue}>
                    {heroCopy.progressValue}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: heroCopy.progressWidth as DimensionValue },
                    ]}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push("/home/profile-card" as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.heroButtonText}>내 프로필 보기</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </View> */}
      <TouchableOpacity
        onPress={() => router.push("/home/profile-card" as any)}
        activeOpacity={0.82}
        style={{
          width: "100%",
          borderWidth: 1,
          borderColor: "#D1D6DC",
          borderRadius: 16,
          paddingVertical: 14,
          paddingRight: 12,
          paddingLeft: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text
            style={[fonts.sub3_sb_16, { color: "#506AFF", lineHeight: 24 }]}
          >
            나의 상태
          </Text>
          <Text style={[fonts.body3_r_16, { lineHeight: 24 }]}>
            {dispatchInfo.country} {currentSituationText}
          </Text>
        </View>
        <ArrowRightIcon />
      </TouchableOpacity>

      <View style={styles.sectionBlock}>
        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>
          <TouchableOpacity
            style={styles.quickMoreButton}
            onPress={() => router.push("/more-menu" as any)}
            activeOpacity={0.82}
          >
            <Text style={styles.moreText}>더보기</Text>
            <Ionicons name="chevron-forward" size={14} color={BLUE} />
          </TouchableOpacity>
        </View> */}

        <View style={styles.quickGrid}>
          {quickActionsByStatus.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.quickItem]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.86}
            >
              <SoftServiceIcon Icon={item.icon} />
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.contentSurface}>
        <View style={styles.banner}>
          <Image
            source={require("../../../assets/images/middle-banner.png")}
            style={{ width: "100%", borderRadius: 16 }}
            resizeMode="contain"
          />
        </View>
        {/* <View style={[styles.sectionBlock, styles.contentFirstBlock]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {lifecycleStatus === "지원 준비 중"
                ? "지원 준비 인기 정보"
                : lifecycleStatus === "출국 준비 중"
                  ? "출국 전 많이 보는 글"
                  : lifecycleStatus === "파견 중"
                    ? "현지 생활 인기 게시글"
                    : "귀국 후 정리 팁"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/community" as any)}>
              <Text style={styles.moreText}>전체보기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.postList}>
            {popularPosts.slice(0, 2).map((post, index) => (
              <TouchableOpacity
                key={post.title}
                style={[styles.postItem, index === 1 && styles.lastItem]}
                activeOpacity={0.82}
              >
                <View style={styles.postTop}>
                  <View style={styles.countryBadge}>
                    <Text style={styles.countryBadgeText}>{post.country}</Text>
                  </View>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
                <Text style={styles.postTitle} numberOfLines={1}>
                  {post.title}
                </Text>
                <View style={styles.postMetaRow}>
                  <Ionicons name="heart-outline" size={14} color="#64748B" />
                  <Text style={styles.postMetaText}>{post.likes}</Text>
                  <Ionicons
                    name="chatbubble-outline"
                    size={13}
                    color="#64748B"
                  />
                  <Text style={styles.postMetaText}>{post.comments}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}

        <View
          style={showTradeBeforeCompanion && styles.reorderedContentSections}
        >
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {isReturned
                    ? "후배들이 기다리는 답변"
                    : "지금 모집 중인 동행"}
                </Text>
                <Text style={styles.sectionSub}>
                  {lifecycleStatus === "지원 준비 중"
                    ? "지원 전 궁금한 기준과 학교 경험을 확인해보세요"
                    : lifecycleStatus === "출국 준비 중"
                      ? "출국 전후 일정이 맞는 친구를 찾아보세요"
                      : lifecycleStatus === "파견 중"
                        ? "현지 일정과 여행을 함께할 친구를 찾아보세요"
                        : "내 경험이 다음 교환학생에게 좋은 길잡이가 돼요"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/community",
                    params: { tab: "companion" },
                  } as any)
                }
              >
                <Text style={styles.moreText}>더보기</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.companionScroll}
              contentContainerStyle={styles.companionContent}
            >
              {companionPosts.map((post) => (
                <TouchableOpacity
                  key={post.city}
                  style={styles.companionCard}
                  activeOpacity={0.88}
                >
                  <View style={styles.companionTop}>
                    <View style={styles.companionPin}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={NAVY}
                      />
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{post.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.companionCity}>{post.city}</Text>
                  <Text style={styles.companionPeriod}>{post.period}</Text>

                  <View style={styles.companionMetaGrid}>
                    <View style={styles.companionMetaItem}>
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color="#64748B"
                      />
                      <Text style={styles.companionMetaText}>
                        {post.people}
                      </Text>
                    </View>
                    <View style={styles.companionMetaItem}>
                      <Ionicons
                        name={
                          post.verified
                            ? "shield-checkmark-outline"
                            : "shield-outline"
                        }
                        size={14}
                        color="#64748B"
                      />
                      <Text style={styles.companionMetaText}>
                        {post.verified ? "학교 인증" : "인증 예정"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.companionFooter}>
                    <Text style={styles.joinText}>함께 일정 보기</Text>
                    <View style={styles.likeRow}>
                      <Ionicons
                        name="heart-outline"
                        size={14}
                        color="#64748B"
                      />
                      <Text style={styles.likeText}>{post.likes}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <BulkTradeSection items={tradeItems} isReturned={isReturned} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  banner: {
    width: "100%",
    height: 82,
    backgroundColor: "#1A14A5",
    borderRadius: 10,
    marginBottom: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  homeTabs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  homeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  selectedHomeTab: {
    borderBottomColor: "#111111",
  },
  homeTabText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#8B95A1",
  },
  selectedHomeTabText: {
    color: "#111111",
  },
  customTabBadge: {
    borderRadius: 6,
    backgroundColor: "#506AFF",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  customTabBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
  profileWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EDF1F5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },
  headerSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF1F5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.035,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  heroCard: {
    marginTop: 24,
    borderRadius: 24,
    backgroundColor: "#F2F7FF",
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTag: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#123F9F",
  },
  heroDday: {
    fontSize: 26,
    fontWeight: "900",
    color: "#123F9F",
  },
  heroSmallMeta: {
    fontSize: 13,
    fontWeight: "900",
    color: HERO_BLUE,
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "900",
    color: "#111111",
  },
  heroSubtitle: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  progressInfoRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "900",
    color: NAVY,
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DCE8FA",
    overflow: "hidden",
  },
  progressFill: {
    width: "72%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#123F9F",
  },
  applicationTimeline: {
    marginTop: 18,
  },
  departureTimeline: {
    marginTop: 20,
  },
  timelineLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: NAVY,
  },
  timelineTrack: {
    position: "relative",
    height: 18,
    marginTop: 12,
    justifyContent: "center",
  },
  timelineTrackBase: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DCE3ED",
  },
  timelineFill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#123F9F",
  },
  timelineDot: {
    position: "absolute",
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: "#123F9F",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  timelineDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  timelineDate: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  dispatchedProgressFill: {
    width: "26%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#123F9F",
  },
  dispatchedDayRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 14,
  },
  dispatchedDay: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "900",
    color: HERO_BLUE,
  },
  dispatchedDayUnit: {
    marginLeft: 5,
    marginBottom: 9,
    fontSize: 16,
    fontWeight: "900",
    color: NAVY,
  },
  heroButton: {
    marginTop: 22,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#123F9F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  sectionBlock: {
    marginTop: 10,
  },
  contentSurface: {
    marginTop: 34,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  contentFirstBlock: {
    marginTop: 0,
  },
  reorderedContentSections: {
    flexDirection: "column-reverse",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111111",
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  moreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4E5968",
  },
  quickMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    rowGap: 10,
  },
  quickItem: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191F28",
    textAlign: "center",
    lineHeight: 18,
  },
  postList: {
    borderRadius: 20,
    backgroundColor: "#F7F8FA",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  postItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  postTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countryBadge: {
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  countryBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: BLUE,
  },
  postTime: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  postTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
    color: NAVY,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 9,
  },
  postMetaText: {
    marginRight: 8,
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  companionScroll: {
    marginHorizontal: -20,
  },
  companionContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  companionCard: {
    width: 236,
    borderRadius: 20,
    backgroundColor: "#F7F8FA",
    padding: 17,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  companionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companionPin: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#F3F6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: BLUE,
  },
  companionCity: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "900",
    color: NAVY,
  },
  companionPeriod: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  companionMetaGrid: {
    marginTop: 15,
    gap: 8,
  },
  companionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  companionMetaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  companionFooter: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  joinText: {
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  tradeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tradeThumb: {
    width: 96,
    height: 96,
    borderRadius: 6,
    backgroundColor: "#F3F6FA",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  tradeImage: {
    width: 96,
    height: 96,
    resizeMode: "cover",
  },
  tradeBody: {
    flex: 1,
    flexDirection: "column",
    height: 96,
    justifyContent: "center",
    gap: 2,
  },
  tradeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191F28",
    marginBottom: 4,
  },
  tradeLocation: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8B95A1",
  },
  tradePrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
});
