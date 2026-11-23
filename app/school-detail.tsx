import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppBackButton } from "@/components/ui/app-back-button";
import {
  bookmarkPartnerSchool,
  getPartnerSchool,
  PartnerSchoolDetailResponse,
  unbookmarkPartnerSchool,
} from "../src/api/partnerSchools";
import { getReviews } from "../src/api/reviews";

const reviewTabs = [
  { key: "oneLiner", label: "한줄평" },
  { key: "blog", label: "블로그 후기" },
  { key: "photo", label: "사진 후기" },
] as const;

// 🏫 대학교별 맞춤 상세 데이터베이스
const UNIVERSITY_DETAILS: Record<
  string,
  {
    name: string;
    country: string;
    city: string;
    rating: number;
    tags: string[];
    images: any[];
    basicInfo: {
      language: string;
      departments: string;
      semesterSystem: string;
      website: string;
      contact: string;
    };
    livingInfo: {
      dorm: string;
      transport: string;
      costLevel: "낮음" | "보통" | "높음";
      costDescription: string;
      environment: string;
    };
    reviews: {
      oneLiners: { user: string; rating: number; text: string }[];
      blogs: { title: string; views: number }[];
      photos: { title: string; image: any }[];
    };
  }
> = {
  "뮌헨 공과대학교 (TUM)": {
    name: "뮌헨 공과대학교 (TUM)",
    country: "독일",
    city: "뮌헨",
    rating: 4.8,
    tags: ["#기숙사좋음", "#영어수업많음", "#물가높음", "#학업강도높음"],
    images: [
      require("../assets/images/Munich.png"),
      require("../assets/images/freepass.png"),
      require("../assets/images/travel_holy.png"),
    ],
    basicInfo: {
      language: "영어 (컴퓨터공학, 자연과학 등 개설 과목의 80% 이상) / 독일어",
      departments: "공과대학 전 학과, 정보대학, 경영대학, 사회과학대학 등",
      semesterSystem: "2학기제 (겨울학기: 10월-3월 / 여름학기: 4월-9월)",
      website: "https://www.tum.de/en/",
      contact: "international.office@tum.de / +49 (89) 289-22245",
    },
    livingInfo: {
      dorm: "학생처(Studierendenwerk) 주관 기숙사 매칭 신청 가능. 대기 시간이 길어 합격 즉시 신청 권장 (월 380~480유로).",
      transport:
        "독일티켓(D-Ticket) 활용 시 월 49유로로 전국 전철, 버스, 트램 무제한 탑승 가능.",
      costLevel: "높음",
      costDescription:
        "외식비가 비싸나 마트(Lidl, Aldi) 식재료 물가는 한국보다 저렴함.",
      environment:
        "바이에른 주 특유의 평화롭고 안전한 치안. 잉글리시 가든과 알프스 산맥 인접으로 자연 친화적.",
    },
    reviews: {
      oneLiners: [
        {
          user: "Lumy_TUM",
          rating: 5,
          text: "수업 퀄리티가 정말 높고, 다양한 국가에서 온 유학생들과의 교류가 활발합니다!",
        },
        {
          user: "컴공생A",
          rating: 4,
          text: "기숙사 구하는 게 제일 힘든 것 빼곤 완벽한 교환생활이었습니다.",
        },
        {
          user: "방랑자",
          rating: 5,
          text: "뮌헨 지리적 이점이 좋아 매주 오스트리아, 스위스로 여행 다녔네요!",
        },
      ],
      blogs: [
        {
          title:
            "[독일] 뮌헨 공대 파견 첫 주 안멜둥(거주지 등록) 및 계좌 개설 가이드",
          views: 342,
        },
        {
          title: "TUM 컴퓨터학부 수강신청 팁 및 시험 통과 전략 정리",
          views: 289,
        },
        {
          title: "독일 교환학생 필수 준비 보험 TK 가입부터 활성화까지",
          views: 412,
        },
      ],
      photos: [
        {
          title: "메인 캠퍼스 전경",
          image: require("../assets/images/Munich.png"),
        },
        {
          title: "기숙사 내부 방 구조",
          image: require("../assets/images/freepass.png"),
        },
        {
          title: "뮌헨 마리엔 광장",
          image: require("../assets/images/travel_holy.png"),
        },
      ],
    },
  },
  "UCLA (University of California, LA)": {
    name: "UCLA (University of California, LA)",
    country: "미국",
    city: "로스앤젤레스",
    rating: 4.9,
    tags: ["#날씨최고", "#캠퍼스낭만", "#물가매우높음", "#서부로망"],
    images: [
      require("../assets/images/UCLA.png"),
      require("../assets/images/travel_holy.png"),
      require("../assets/images/background_school.png"),
    ],
    basicInfo: {
      language: "영어 (100% 영어 수업 개설)",
      departments: "경영학, 생명과학, 컴퓨터과학, 심리학, 정치학 등 전 분야",
      semesterSystem: "쿼터제 (Fall, Winter, Spring 3학기 등록제)",
      website: "https://www.ucla.edu/",
      contact: "studyabroad@ieo.ucla.edu / +1 (310) 825-4321",
    },
    livingInfo: {
      dorm: "온캠퍼스 기숙사(On-campus Housing) 신청 시 높은 확률로 배정. 식사 옵션(Meal Plan)이 매우 훌륭하기로 유명함.",
      transport:
        "LA 특성상 대중교통이 다소 불편하나 브루인 버스(BruinBus) 이용이 가능하며 우버나 렌트를 주로 사용.",
      costLevel: "높음",
      costDescription:
        "캘리포니아의 높은 텍스(tax)와 팁(tip) 문화로 매달 최소 1500~2000달러 지출 발생.",
      environment:
        "산타모니카 해변과 비버리 힐즈가 차로 20분 거리. 1년 내내 따뜻하고 쾌적한 캘리포니아 기후.",
    },
    reviews: {
      oneLiners: [
        {
          user: "LA드림",
          rating: 5,
          text: "학교 급식이 천국입니다. 날씨도 매일이 축복 같아요.",
        },
        {
          user: "BruinLove",
          rating: 5,
          text: "학비는 좀 들지만 평생 잊지 못할 추억을 선사해 주는 캠퍼스입니다.",
        },
      ],
      blogs: [
        { title: "UCLA 교환학생 F-1 비자 대사관 면접 원패스 후기", views: 512 },
        {
          title: "기숙사 밀플랜(Meal Plan) 19R vs 14P 전격 비교 요령",
          views: 403,
        },
      ],
      photos: [
        {
          title: "로이스 홀 전경",
          image: require("../assets/images/UCLA.png"),
        },
        {
          title: "산타모니카 해변 풍경",
          image: require("../assets/images/travel_holy.png"),
        },
      ],
    },
  },
  "와세다 대학교": {
    name: "와세다 대학교",
    country: "일본",
    city: "도쿄",
    rating: 4.7,
    tags: ["#WISH기숙사", "#신주쿠인접", "#한국유학생많음", "#도쿄라이프"],
    images: [
      require("../assets/images/japan.png"),
      require("../assets/images/background_school.png"),
      require("../assets/images/freepass.png"),
    ],
    basicInfo: {
      language: "일본어 / 영어 (국제학부의 경우 영어 수업 다수 개설)",
      departments:
        "정치경제학부, 법학부, 문학부, 이공학부, 국제교양학부(SILS) 등",
      semesterSystem: "2학기제 (봄학기: 4월-7월 / 가을학기: 9월-1월)",
      website: "https://www.waseda.jp/top/en/",
      contact: "in-cie@list.waseda.jp / +81-3-3203-7747",
    },
    livingInfo: {
      dorm: "국제 기숙사 WISH 배정 가능. 입실 경쟁이 치열하지만 합격 시 도쿄 한복판에서 쾌적한 주거 해결.",
      transport:
        "지하철 도자이선 와세다역 인근. 도쿄 메트로 학생 정기권(통학정기권) 구매 시 교통비 절감.",
      costLevel: "보통",
      costDescription:
        "식료품 물가는 한국과 비슷하거나 저렴하지만 교통비와 기숙사비는 비싼 편.",
      environment:
        "도쿄 신주쿠, 다카다노바바와 도보 이동 가능. 대학 주변 저렴하고 맛있는 라멘집 및 밥집이 많음.",
    },
    reviews: {
      oneLiners: [
        {
          user: "도쿄로간서현",
          rating: 5,
          text: "WISH 기숙사 시설이 진짜 호텔 같아요. 유학생 커뮤니티가 끈끈합니다!",
        },
        {
          user: "와세다이공",
          rating: 4,
          text: "학교 주변이 한인 친화적이라 외롭지 않게 적응 가능합니다.",
        },
      ],
      blogs: [
        {
          title: "도쿄 와세다 기숙사 WISH 입소 절차 및 필수 규칙 아웃라인",
          views: 245,
        },
        { title: "일본 통장 개설하기 (우체국 유초은행 개설 꿀팁)", views: 320 },
      ],
      photos: [
        {
          title: "오쿠마 강당",
          image: require("../assets/images/japan.png"),
        },
      ],
    },
  },
};

export default function SchoolDetailScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const imageWidth = width - 32;
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const [apiSchool, setApiSchool] =
    useState<PartnerSchoolDetailResponse | null>(null);
  const [apiBlogs, setApiBlogs] = useState<{ title: string; views: number }[]>(
    [],
  );

  // 🏫 기본 대학교 설정 (TUM)
  const schoolName = name || "뮌헨 공과대학교 (TUM)";
  // DB에서 데이터 조회, 없으면 기본값인 TUM 데이터 사용
  const fallbackSchoolData =
    UNIVERSITY_DETAILS[schoolName] ||
    UNIVERSITY_DETAILS["뮌헨 공과대학교 (TUM)"];
  const schoolData = useMemo(() => {
    if (!apiSchool) return fallbackSchoolData;

    const images =
      apiSchool.imageUrls?.length > 0
        ? apiSchool.imageUrls.map((url) => ({ uri: url }))
        : [require("../assets/images/background_school.png")];

    const costLevel =
      apiSchool.livingInfo?.costLevel === "LOW"
        ? "낮음"
        : apiSchool.livingInfo?.costLevel === "MEDIUM"
          ? "보통"
          : apiSchool.livingInfo?.costLevel === "HIGH"
            ? "높음"
            : (apiSchool.livingInfo?.costLevel ?? "보통");

    return {
      name: apiSchool.name,
      country: apiSchool.country,
      city: apiSchool.city,
      rating: apiSchool.rating,
      tags: apiSchool.tags ?? [],
      images,
      basicInfo: {
        language: apiSchool.basicInfo?.language ?? "-",
        departments: apiSchool.basicInfo?.departments ?? "-",
        semesterSystem: apiSchool.basicInfo?.semesterSystem ?? "-",
        website: apiSchool.basicInfo?.website ?? "",
        contact: apiSchool.basicInfo?.contact ?? "-",
      },
      livingInfo: {
        dorm: apiSchool.livingInfo?.dorm ?? "-",
        transport: apiSchool.livingInfo?.transport ?? "-",
        costLevel,
        costDescription: apiSchool.livingInfo?.costDescription ?? "-",
        environment:
          apiSchool.livingInfo?.environment ??
          apiSchool.livingInfo?.safetyDescription ??
          "-",
      },
      reviews: {
        ...fallbackSchoolData.reviews,
        blogs:
          apiBlogs.length > 0 ? apiBlogs : fallbackSchoolData.reviews.blogs,
      },
    };
  }, [apiBlogs, apiSchool, fallbackSchoolData]);

  // 🤍 북마크 상태 및 토스트 팝업 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // 💬 후기 섹션 서브 탭 상태
  const [activeTab, setActiveTab] = useState<"oneLiner" | "blog" | "photo">(
    "oneLiner",
  );

  // 캐러셀 페이지 인덱스용 스크롤 트래킹
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchSchoolDetail = async () => {
      try {
        const schoolId = Number(id);
        const [detailResponse, reviewResponse] = await Promise.all([
          getPartnerSchool(schoolId),
          getReviews({ partnerUniversityId: schoolId, page: 0, size: 5 }),
        ]);

        setApiSchool(detailResponse.data.data);
        setIsBookmarked(detailResponse.data.data.bookmarkedByMe);
        setApiBlogs(
          reviewResponse.data.data.content.map((review) => ({
            title: review.title,
            views: 0,
          })),
        );
      } catch (error: any) {
        console.log(
          "파견교 상세 API 조회 실패:",
          error.response?.data || error.message,
        );
      }
    };

    fetchSchoolDetail();
  }, [id]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    if (layoutMeasurement.width > 0) {
      setCurrentSlideIndex(
        Math.max(0, Math.round(contentOffset.x / layoutMeasurement.width)),
      );
    }
  };

  // 북마크 토글 및 토스트 알림
  const toggleBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage(
      nextState
        ? "관심 대학에 등록되었습니다. ⭐️"
        : "관심 대학 등록이 취소되었습니다.",
    );

    if (id) {
      try {
        if (nextState) {
          await bookmarkPartnerSchool(Number(id));
        } else {
          await unbookmarkPartnerSchool(Number(id));
        }
      } catch (error: any) {
        console.log(
          "파견교 북마크 API 실패:",
          error.response?.data || error.message,
        );
      }
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const basicInfo = [
    ["수업 언어", schoolData.basicInfo.language],
    ["지원 학과", schoolData.basicInfo.departments],
    ["학기제", schoolData.basicInfo.semesterSystem],
    ["국제교류처", schoolData.basicInfo.contact],
  ];
  const livingInfo = [
    ["기숙사", schoolData.livingInfo.dorm],
    ["교통", schoolData.livingInfo.transport],
    ["체감 물가", schoolData.livingInfo.costDescription],
    ["주변 환경 및 치안", schoolData.livingInfo.environment],
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerSide}>
          <AppBackButton />
        </View>
        <Text style={styles.headerTitle}>상세 정보</Text>
        <View style={[styles.headerSide, styles.headerActions]}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel="관심 대학"
            accessibilityState={{ selected: isBookmarked }}
            onPress={toggleBookmark}
          >
            <Ionicons
              name={isBookmarked ? "heart" : "heart-outline"}
              size={22}
              color={isBookmarked ? Colors.primary.default : Colors.gray[10]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel="공유"
            onPress={() => alert("공유하기 링크가 복사되었습니다.")}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.gray[10]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        <View style={styles.hero}>
          <View style={styles.carousel}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {schoolData.images.map((image, index) => (
                <Image
                  key={index}
                  source={image}
                  style={[styles.slideImage, { width: imageWidth }]}
                />
              ))}
            </ScrollView>
            {schoolData.images.length > 1 && (
              <Text style={styles.imageCount}>
                {Math.min(currentSlideIndex + 1, schoolData.images.length)} / {schoolData.images.length}
              </Text>
            )}
          </View>
          <View style={styles.schoolHeading}>
            <Text style={styles.schoolName}>{schoolData.name}</Text>
            <Text style={styles.mutedText}>
              {[schoolData.country, schoolData.city].filter(Boolean).join(" · ")}
            </Text>
            {schoolData.tags.length > 0 && (
              <View style={styles.tags}>
                {schoolData.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>{tag.replace(/^#/, "")}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학교 기본 정보</Text>
          <View style={styles.card}>
            {basicInfo.map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
            {schoolData.basicInfo.website ? (
              <TouchableOpacity
                style={styles.website}
                activeOpacity={0.86}
                accessibilityRole="link"
                onPress={() => Linking.openURL(schoolData.basicInfo.website)}
              >
                <Text style={styles.websiteText}>공식 홈페이지</Text>
                <Ionicons name="open-outline" size={16} color={Colors.primary.default} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>생활 정보</Text>
          <View style={styles.card}>
            {livingInfo.map(([label, value]) => (
              <View key={label} style={styles.lifeItem}>
                <View style={styles.lifeHeading}>
                  <Text style={styles.itemTitle}>{label}</Text>
                  {label === "체감 물가" && schoolData.livingInfo.costLevel ? (
                    <Text style={styles.tag}>{schoolData.livingInfo.costLevel}</Text>
                  ) : null}
                </View>
                <Text style={styles.mutedText}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>파견 후기</Text>
          <View style={styles.tabs}>
            {reviewTabs.map(({ key, label }) => {
              const selected = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.86}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={[styles.tab, selected && styles.activeTab]}
                  onPress={() => setActiveTab(key)}
                >
                  <Text style={[styles.tabText, selected && styles.activeTabText]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === "oneLiner" && (
            <View style={styles.reviewList}>
              {schoolData.reviews.oneLiners.map((review, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.reviewHeading}>
                    <Text style={styles.itemTitle}>{review.user}</Text>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }, (_, star) => (
                        <Ionicons
                          key={star}
                          name={star < review.rating ? "star" : "star-outline"}
                          size={13}
                          color={Colors.primary.default}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.mutedText}>{review.text}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "blog" && (
            <View style={styles.reviewList}>
              {schoolData.reviews.blogs.map((blog, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.card, styles.blogRow]}
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  onPress={() => router.push("/(tabs)/management")}
                >
                  <Ionicons name="document-text-outline" size={20} color={Colors.gray[8]} />
                  <View style={styles.blogText}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{blog.title}</Text>
                    <Text style={styles.mutedText}>조회수 {blog.views}회</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray[6]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "photo" && (
            <View style={styles.photoGrid}>
              {schoolData.reviews.photos.map((photo, index) => (
                <View key={index} style={[styles.photoCard, { width: (imageWidth - 10) / 2 }]}>
                  <Image source={photo.image} style={styles.photo} />
                  <Text style={styles.photoLabel} numberOfLines={1}>{photo.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {toastMessage && (
        <View style={[styles.toast, { bottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.common.white },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSide: { width: 76 },
  headerActions: { flexDirection: "row", justifyContent: "flex-end" },
  headerTitle: { ...fonts.sub3_sb_16, color: Colors.gray[10] },
  iconButton: { width: 38, height: 44, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 28 },
  hero: { gap: 16 },
  carousel: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.gray[2],
  },
  slideImage: { height: 208, resizeMode: "cover" },
  imageCount: {
    ...fonts.caption4_m_12,
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(25, 31, 40, 0.72)",
    color: Colors.common.white,
  },
  schoolHeading: { gap: 6 },
  schoolName: { ...fonts.title4_sb_24, color: Colors.gray[10] },
  mutedText: { ...fonts.body4_r_14, color: Colors.gray[7] },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
  },
  section: { gap: 12 },
  sectionTitle: { ...fonts.sub1_sb_18, color: Colors.gray[10] },
  card: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: { flexDirection: "row", gap: 8 },
  infoLabel: { ...fonts.body2_m_14, color: Colors.gray[7], width: 78 },
  infoValue: { ...fonts.body4_r_14, color: Colors.gray[10], flex: 1 },
  website: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  websiteText: { ...fonts.body2_m_14, color: Colors.primary.default },
  lifeItem: { gap: 4 },
  lifeHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { ...fonts.sub4_sb_14, color: Colors.gray[10] },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tab: {
    borderRadius: 100,
    backgroundColor: Colors.gray[1],
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  activeTab: { backgroundColor: Colors.gray[11] },
  tabText: { ...fonts.body2_m_14, color: Colors.gray[7] },
  activeTabText: { color: Colors.common.white },
  reviewList: { gap: 8 },
  reviewHeading: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  blogRow: { flexDirection: "row", alignItems: "center" },
  blogText: { flex: 1, gap: 4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    overflow: "hidden",
  },
  photo: { width: "100%", height: 100, resizeMode: "cover" },
  photoLabel: { ...fonts.caption4_m_12, color: Colors.gray[9], padding: 8 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: Colors.gray[10],
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  toastText: { ...fonts.body2_m_14, color: Colors.common.white },
});
