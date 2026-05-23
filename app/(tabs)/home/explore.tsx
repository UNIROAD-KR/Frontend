import React, { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createExchangeReviewComment,
  getExchangeReviewComments,
  getExchangeReviews,
  likeExchangeReview,
  unlikeExchangeReview,
} from '../../../src/api/exchangeReviews';
import { getPopularCountries } from '../../../src/api/exchangeInfo';

// 📝 모의 후기 데이터베이스
interface Review {
  id: string;
  title: string;
  content: string;
  country: string;
  type: string;
  author: string;
  date: string;
  likes: number;
  commentsCount: number;
  tags: string[];
  imageBg: string;
}

const REVIEW_DATA: Review[] = [
  {
    id: '1',
    title: '🇩🇪 뮌헨 공대 교환학생 현실 후기 (생활비 & 주거지)',
    content: `안녕하세요! 지난 학기 독일 뮌헨 공과대학교(TUM)로 교환학생을 다녀온 후기를 공유합니다.

1. 생활비
뮌헨은 독일에서 물가가 가장 비싼 도시 중 하나입니다.
• 월세(기숙사): 350 ~ 500 유로 (Studierendenwerk 기준)
• 식비 및 마트 장보기: 250 ~ 300 유로 (Aldi, Lidl 이용 시 저렴)
• 건강보험료: 약 125 유로 (TK/AOK 공보험 기준)
• 대중교통: 학기 티켓(Semester ticket) 또는 독일 티켓(Deutschland-Ticket) 활용 시 매우 저렴합니다.
총 월 평균 900 ~ 1100 유로 내외의 지출이 필요합니다.

2. 주거지 구하기 (매우 중요!)
독일의 방 구하기(Wohnungssuche)는 정말 헬(hell)입니다. 합격 메일을 받자마자 기숙사(Studierendenwerk)에 바로 등록하셔야 합니다. 사설 기숙사나 WG(룸쉐어)를 구할 때는 wg-gesucht.de 사이트를 매일 들여다보고 메일을 50개 이상 보내야 1~2개 답장이 옵니다.

3. 대학 생활
뮌헨 공대는 영어 개설 과목이 정말 많습니다. 컴퓨터공학 계열은 80% 이상 영어 수업이므로 독일어를 잘 못 해도 큰 무리가 없었습니다. 교수님들 열정도 대단하고 연구 환경이 최고 수준입니다.`,
    country: '독일',
    type: '후기',
    author: 'Lumy_TUM',
    date: '2026.05.15',
    likes: 42,
    commentsCount: 15,
    tags: ['#뮌헨공대', '#독일물가', '#기숙사꿀팁'],
    imageBg: '#E2E8F0',
  },
  {
    id: '2',
    title: '🇫🇷 파리 교환학생 한 달 생활비 정밀 분석 💳',
    content: `낭만의 도시 파리! 하지만 현실은 매달 빠져나가는 월세와 높은 생활비와의 싸움입니다. 파리 교환학생 6개월차 주관적인 생활비 분석입니다.

1. 집세 (Studio)
프랑스는 국가에서 학생들에게 월세 일부를 환급해 주는 알로(CAF) 제도가 아주 잘 되어 있습니다.
• 월세: 약 750 유로 (1구 외곽 원룸 기준)
• CAF 지원금 수령 후 실질 부담: 월 580 유로 수준.
프랑스에 도착하자마자 CAF 신청 서류(아포스티유 공증 필요)를 제출해야 합니다. 처리 속도가 엄청 느려서 귀국하기 전에 받는 사람도 수두룩하니 신속히 접수해야 합니다.

2. 식비 & 대중교통
• 교통비: 나비고(Navigo Imagine R) 학생 패스를 이용하면 연간/월 단위로 무제한 혜택을 봅니다.
• 식비: 파리의 외식비는 상상을 초월해 기본 15~20유로가 듭니다. 마트(Lidl, Franprix, Carrefour) 장보기를 일상화하면 식비를 획기적으로 줄일 수 있습니다. 파게뜨는 1.2유로 내외로 아주 저렴하고 맛있습니다.`,
    country: '프랑스',
    type: '생활팁',
    author: 'BonJour_Paris',
    date: '2026.05.20',
    likes: 35,
    commentsCount: 8,
    tags: ['#파리생활', '#프랑스물가', '#알로신청'],
    imageBg: '#FEE2E2',
  },
  {
    id: '3',
    title: '🇯🇵 와세다 대학교 기숙사(WISH) 리얼 라이프 후기 🏫',
    content: `도쿄 와세다 대학교의 대표적인 국제 학생 기숙사인 WISH(Waseda International Student House) 기숙사 후기입니다.

1. 시설 및 구조
2014년에 완공되어 시설이 웬만한 호텔 부럽지 않게 깨끗합니다.
• 4인 1유닛 구조: 4명이 거실과 욕실, 화장실을 공유하고, 개인 방은 완벽히 분리되어 있어 사생활이 보장됩니다.
• 공용 공간: 1층에 대형 라운지, 주방, 헬스장, 음악실 등이 갖추어져 있습니다.

2. 생활 규칙 및 통금
기숙사 매니저들이 매우 엄격하게 규칙을 관리합니다. 통금 시간은 따로 없지만 기숙사 입구 카드를 찍어야 하므로 외박 시 사전에 외박 신청을 모바일로 제출해야 합니다.

3. 장점 & 단점
• 장점: 전 세계에서 온 유학생들과 쉽게 친해질 수 있고, 매 학기 기숙사생 대상 문화 교류 액티비티(SI 프로그램)가 열립니다. 신주쿠와 가까워 최고의 입지를 자랑합니다.
• 단점: 4인 유닛 메이트를 누구를 만나느냐에 따라 생활 스트레스 편차가 있습니다. 그리고 방음이 다소 아쉽습니다.`,
    country: '일본',
    type: '준비팁',
    author: '도쿄로간서현',
    date: '2026.05.12',
    likes: 29,
    commentsCount: 11,
    tags: ['#와세다대', '#도쿄기숙사', '#일본교환'],
    imageBg: '#ECFDF5',
  },
  {
    id: '4',
    title: '🇺🇸 UCLA 교환학생 비자(F-1) 면접 한번에 패스한 꿀팁 🇺🇸',
    content: `미국 교환학생의 가장 큰 관문인 미국 학생 비자(F-1) 신청 및 대사관 면접 후기입니다.

1. 필수 제출 서류 체크리스트
• DS-2019 (파견교에서 발행하는 입학 허가서)
• SEVIS I-901 Fee 영수증 ($350 결제 필수)
• DS-160 온라인 비자 신청서 확인 페이지
• 미국 비자 규격 사진 1매 (최근 6개월 이내)
• 영문 은행 잔고 증명서 (보통 2만 달러 이상 요구)

2. 면접 예상 질문 및 답변 전략
대사관 인터뷰는 보통 2-3분 내외로 끝납니다. 가장 핵심은 "나는 공부 목적이 명확하며, 공부를 마치면 반드시 한국으로 돌아올 것(No Intent to Immigrate)"을 증명하는 것입니다.
• Q: 왜 하필 UCLA인가요?
• A: 전공 관련 우수한 교수진이 있고 특히 AI 연구 과목들이 많아 파견교로 선택했습니다.
• Q: 학비와 체재비는 누가 지원하나요?
• A: 부모님께서 전액 지원해 주시며, 재직증명서와 잔고 증명서를 가져왔습니다.

팁: 주눅 들지 말고 또박또박 웃는 얼굴로 답변하면 쉽게 통과됩니다.`,
    country: '미국',
    type: '준비팁',
    author: 'LA드림',
    date: '2026.05.10',
    likes: 55,
    commentsCount: 20,
    tags: ['#UCLA', '#미국비자', '#F1비자'],
    imageBg: '#EFF6FF',
  },
  {
    id: '5',
    title: '🇫🇷 교환학생 기간 동안 알차게 유럽 여행하는 루트 & 경비 ✈️',
    content: `유럽 교환학생의 최대 혜택인 틈새 여행 꿀팁과 경비 절약 노하우를 소개합니다!

1. 이동 수단 추천
• 플릭스버스(FlixBus): 파리에서 벨기에 브뤼셀까지 편도 15~20유로로 엄청 저렴합니다. 시간은 4시간 반 정도 걸리지만 돈을 아끼고 싶다면 무조건 추천합니다.
• 라이언에어 / 이지젯: 저가항공 얼리버드로 편도 19유로에 포르투갈, 스페인을 다녀왔습니다. 가방 크기 규정이 매우 까다로우니 백팩 규격을 꼭 지켜야 추가 수수료를 내지 않습니다.

2. 추천 주말 코스 (2박 3일)
• 금요일 아침 출발 -> 일요일 밤 귀국
• 프랑스 파리 출발 기준: 스트라스부르-콜마르 루트(열차 이용), 또는 비행기로 1시간 반 거리인 스페인 바르셀로나 루트를 강추합니다.`,
    country: '프랑스',
    type: '여행',
    author: '유럽방랑자',
    date: '2026.05.18',
    likes: 50,
    commentsCount: 14,
    tags: ['#유럽여행', '#저가항공', '#유레일패스'],
    imageBg: '#FAF5FF',
  },
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [selectedType, setSelectedType] = useState('후기');
  const [reviews, setReviews] = useState<Review[]>(REVIEW_DATA);
  const [popularCountries, setPopularCountries] = useState([
    { name: '독일', code: 'DE', flag: require('../../../assets/images/flag_germany.png') },
    { name: '프랑스', code: 'FR', flag: require('../../../assets/images/flag_france.png') },
    { name: '일본', code: 'JP', flag: require('../../../assets/images/japan.png') },
    { name: '미국', code: 'US', flag: require('../../../assets/images/flag_USA.png') },
  ]);
  
  // 💬 상세 모달 관련 상태
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, { id: string; user: string; text: string; time: string }[]>>({
    '1': [
      { id: '1-1', user: '코코아', text: '기숙사 신청 타이밍이 진짜 중요하군요 ㅠㅠ 정보 감사합니다!', time: '10분 전' },
      { id: '1-2', user: '독일러브', text: '독일 건강보험료가 생각보다 꽤 나오네요. 좋은 정보예요!', time: '3분 전' },
    ],
    '4': [
      { id: '4-1', user: '미국희망', text: '잔고 증명 서류 발급받을 때 원화로 떼어가도 괜찮을까요?', time: '20분 전' },
    ]
  });
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        const [reviewResponse, countryResponse] = await Promise.all([
          getExchangeReviews({ page: 0, size: 20 }),
          getPopularCountries(),
        ]);

        const apiReviews = reviewResponse.data.data.content.map((review) => ({
          id: String(review.id),
          title: review.title,
          content: review.content,
          country: review.country,
          type: review.type,
          author: review.authorName,
          date: review.createdAt?.slice(0, 10).replace(/-/g, '.') ?? '',
          likes: review.likeCount,
          commentsCount: review.commentCount,
          tags: review.tags ?? [],
          imageBg: '#EEF2F6',
        }));

        if (apiReviews.length > 0) {
          setReviews(apiReviews);
          setSelectedType(apiReviews[0].type);
        }

        const flagByCode: Record<string, any> = {
          DE: require('../../../assets/images/flag_germany.png'),
          FR: require('../../../assets/images/flag_france.png'),
          JP: require('../../../assets/images/japan.png'),
          US: require('../../../assets/images/flag_USA.png'),
          USA: require('../../../assets/images/flag_USA.png'),
        };

        const apiCountries = countryResponse.data.data.map((country) => ({
          name: country.name,
          code: country.code,
          flag: flagByCode[country.code] ?? require('../../../assets/images/etc.png'),
        }));

        if (apiCountries.length > 0) {
          setPopularCountries(apiCountries);
        }
      } catch (error: any) {
        console.log('정보 탐색 API 조회 실패:', error.response?.data || error.message);
      }
    };

    fetchExploreData();
  }, []);

  // 2. 국가 필터
  const countryFilters = useMemo(
    () => ['전체', ...Array.from(new Set(reviews.map((review) => review.country).filter(Boolean)))],
    [reviews],
  );

  // 3. 정보 유형 필터
  const typeFilters = useMemo(
    () => Array.from(new Set(reviews.map((review) => review.type).filter(Boolean))),
    [reviews],
  );

  // 🔍 실시간 필터링 로직
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchSearch =
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCountry = selectedCountry === '전체' || review.country === selectedCountry;
      const matchType = review.type === selectedType;

      return matchSearch && matchCountry && matchType;
    });
  }, [reviews, searchQuery, selectedCountry, selectedType]);

  // 🤍 좋아요 토글 핸들러
  const handleLikeToggle = async (id: string) => {
    const nextLiked = !likedReviews[id];
    setLikedReviews((prev) => ({
      ...prev,
      [id]: nextLiked,
    }));

    try {
      if (nextLiked) {
        await likeExchangeReview(Number(id));
      } else {
        await unlikeExchangeReview(Number(id));
      }
    } catch (error: any) {
      console.log('후기 좋아요 API 실패:', error.response?.data || error.message);
    }
  };

  // 💬 댓글 작성 핸들러
  const handleAddComment = (reviewId: string) => {
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `${reviewId}-${Date.now()}`,
      user: '나 (서현)',
      text: newCommentText,
      time: '방금 전',
    };

    const submitComment = async () => {
      try {
        const response = await createExchangeReviewComment(Number(reviewId), newCommentText);
        const apiComment = response.data.data;

        setComments((prev) => ({
          ...prev,
          [reviewId]: [
            ...(prev[reviewId] || []),
            {
              id: String(apiComment.id),
              user: apiComment.authorName,
              text: apiComment.content,
              time: apiComment.createdAt?.slice(0, 10) ?? '방금 전',
            },
          ],
        }));
      } catch (error: any) {
        console.log('후기 댓글 작성 API 실패:', error.response?.data || error.message);
        setComments((prev) => ({
          ...prev,
          [reviewId]: [...(prev[reviewId] || []), newComment],
        }));
      } finally {
        setNewCommentText('');
      }
    };

    submitComment();
  };

  const openReview = async (review: Review) => {
    setSelectedReview(review);

    try {
      const response = await getExchangeReviewComments(Number(review.id));
      setComments((prev) => ({
        ...prev,
        [review.id]: response.data.data.map((comment) => ({
          id: String(comment.id),
          user: comment.authorName,
          text: comment.content,
          time: comment.createdAt?.slice(0, 10) ?? '',
        })),
      }));
    } catch (error: any) {
      console.log('후기 댓글 조회 API 실패:', error.response?.data || error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔝 헤더 (네이비 톤 포인트) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(tabs)/home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F2042" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>정보 탐색</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.bellContainer}>
              <Image
                source={require('../../../assets/images/alarm.png')}
                style={styles.icon}
              />
              <View style={styles.redBadge} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Image
              source={require('../../../assets/images/menu.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 🔍 검색창 (네이비 포커스 디자인) */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            placeholder="국가명, 학교명, 키워드를 검색해보세요"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 📌 메인 3대 메뉴 카드 */}
        <View style={styles.cardSection}>
          {/* 1. 내 학교 정보 */}
          <TouchableOpacity
            style={[styles.menuCard, { borderColor: '#E2E8F0' }]}
            onPress={() => router.push('/(tabs)/home/my-school-info')}
          >
            <View style={[styles.cardIconBg, { backgroundColor: '#EEF2F6' }]}>
              <Ionicons name="school" size={26} color="#0F2042" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>내 학교 정보</Text>
              <Text style={styles.cardDesc}>우리 학교의 교환학생 지원 기준 및 절차 확인</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. 파견교 정보 */}
          <TouchableOpacity
            style={[styles.menuCard, { borderColor: '#E2E8F0' }]}
            onPress={() => router.push('/(tabs)/home/school-info')}
          >
            <View style={[styles.cardIconBg, { backgroundColor: '#EEF2F6' }]}>
              <Ionicons name="earth" size={26} color="#1E3A8A" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>파견교 정보</Text>
              <Text style={styles.cardDesc}>글로벌 파견교 리스트와 생생한 상세 항목 탐색</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 3. 장학금 정보 */}
          <TouchableOpacity
            style={[styles.menuCard, { borderColor: '#E2E8F0' }]}
            onPress={() => router.push('/(tabs)/home/scholarship-info')}
          >
            <View style={[styles.cardIconBg, { backgroundColor: '#EEF2F6' }]}>
              <Ionicons name="cash" size={26} color="#2F66D0" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>장학금 정보</Text>
              <Text style={styles.cardDesc}>교외 지원금 정보, 지원 시기, 자소서 꿀팁</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ✈️ 많이 찾는 국가 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>많이 찾는 국가</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
          contentContainerStyle={styles.countryContent}
        >
          {popularCountries.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={styles.countryPill}
              onPress={() => {
                // 파견교 정보로 이동하면서 국가 정보를 쿼리 파라미터로 넘김
                router.push({
                  pathname: '/(tabs)/home/school-info',
                  params: { initCountry: c.name }
                });
              }}
            >
              <Image source={c.flag} style={styles.countryFlag} />
              <Text style={styles.countryNameText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 💬 블로그 후기 탐색 섹션 */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>생생한 교환학생 라이프 엿보기</Text>
          <Text style={styles.sectionSubtitle}>경험자들이 직접 기록한 실제 후기 중심의 팁</Text>
        </View>

        {/* 1) 국가 필터 Pill */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {countryFilters.map((country) => (
            <TouchableOpacity
              key={country}
              style={[
                styles.pillBtn,
                selectedCountry === country ? styles.pillBtnActiveNavy : styles.pillBtnInactive
              ]}
              onPress={() => setSelectedCountry(country)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedCountry === country ? styles.pillTextActive : styles.pillTextInactive
                ]}
              >
                {country}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2) 정보 유형 필터 Pill */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filterScroll, { marginTop: 8 }]}
          contentContainerStyle={styles.filterContent}
        >
          {typeFilters.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typePill,
                selectedType === type ? styles.typePillActiveNavy : styles.typePillInactive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typePillText,
                  selectedType === type ? styles.typePillTextActive : styles.typePillTextInactive
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 후기 리스트 */}
        <View style={styles.reviewList}>
          {filteredReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>해당 필터에 부합하는 후기가 없습니다.</Text>
              <Text style={styles.emptySubText}>다른 조건의 필터나 검색어를 조합해보세요.</Text>
            </View>
          ) : (
            filteredReviews.map((item) => {
              const isLiked = likedReviews[item.id] || false;
              const currentLikes = item.likes + (isLiked ? 1 : 0);
              const postComments = comments[item.id] || [];
              const currentCommentsCount = Math.max(item.commentsCount, postComments.length);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.reviewCard}
                  onPress={() => openReview(item)}
                >
                  <View style={styles.reviewMain}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.type}</Text>
                      </View>
                      <Text style={styles.countryLabel}>{item.country}</Text>
                    </View>
                    
                    <Text style={styles.reviewTitleText} numberOfLines={2}>
                      {item.title}
                    </Text>
                    
                    <Text style={styles.reviewExcerpt} numberOfLines={2}>
                      {item.content.replace(/\n/g, ' ')}
                    </Text>

                    <View style={styles.reviewMetaRow}>
                      <Text style={styles.reviewAuthor}>{item.author}</Text>
                      <Text style={styles.metaDivider}>•</Text>
                      <Text style={styles.reviewDate}>{item.date}</Text>
                    </View>
                  </View>

                  <View style={styles.reviewFooter}>
                    <View style={styles.tagsRow}>
                      {item.tags.slice(0, 2).map((tag, idx) => (
                        <Text key={idx} style={styles.tagText}>{tag}</Text>
                      ))}
                    </View>

                    <View style={styles.statsRow}>
                      <TouchableOpacity 
                        style={styles.statItem} 
                        onPress={() => handleLikeToggle(item.id)}
                      >
                        <Ionicons 
                          name={isLiked ? "heart" : "heart-outline"} 
                          size={15} 
                          color={isLiked ? "#EF4444" : "#64748B"} 
                        />
                        <Text style={[styles.statText, isLiked && { color: '#EF4444' }]}>
                          {currentLikes}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.statItem}>
                        <Ionicons name="chatbubble-outline" size={14} color="#64748B" />
                        <Text style={styles.statText}>{currentCommentsCount}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 📚 블로그 후기 상세 독서 모달 */}
      <Modal
        visible={selectedReview !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedReview(null)}
      >
        {selectedReview && (
          <SafeAreaView style={styles.modalContainer}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedReview(null)}
              >
                <Ionicons name="close" size={24} color="#0F2042" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedReview.country} {selectedReview.type}
              </Text>
              <TouchableOpacity 
                style={styles.modalHeartBtn}
                onPress={() => handleLikeToggle(selectedReview.id)}
              >
                <Ionicons 
                  name={likedReviews[selectedReview.id] ? "heart" : "heart-outline"} 
                  size={24} 
                  color={likedReviews[selectedReview.id] ? "#EF4444" : "#0F2042"} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 타이틀 및 작성자 정보 */}
              <View style={styles.modalTitleBlock}>
                <View style={styles.typeBadgeLarge}>
                  <Text style={styles.typeBadgeLargeText}>{selectedReview.type}</Text>
                </View>
                <Text style={styles.modalMainTitle}>{selectedReview.title}</Text>
                
                <View style={styles.modalMetaRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{selectedReview.author[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalAuthorName}>{selectedReview.author}</Text>
                    <Text style={styles.modalDateText}>{selectedReview.date} • 조회 182회</Text>
                  </View>
                </View>
              </View>

              {/* 해시태그 */}
              <View style={styles.modalTagsRow}>
                {selectedReview.tags.map((tag, idx) => (
                  <View key={idx} style={styles.modalTagBadge}>
                    <Text style={styles.modalTagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* 본문 텍스트 */}
              <View style={styles.modalBody}>
                <Text style={styles.modalBodyText}>{selectedReview.content}</Text>
              </View>

              {/* 구분선 */}
              <View style={styles.modalDivider} />

              {/* 댓글 섹션 */}
              <View style={styles.commentSection}>
                <Text style={styles.commentSectionTitle}>
                  댓글 {(comments[selectedReview.id] || []).length}개
                </Text>

                {/* 댓글 목록 */}
                {(comments[selectedReview.id] || []).map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{comment.user}</Text>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))}

                {/* 댓글이 없을 때 */}
                {(!comments[selectedReview.id] || comments[selectedReview.id].length === 0) && (
                  <Text style={styles.noCommentsText}>첫 댓글을 작성해보세요!</Text>
                )}
              </View>
            </ScrollView>

            {/* 댓글 입력 영역 (키보드 대응 포함) */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글을 입력해보세요..."
                placeholderTextColor="#94A3B8"
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity
                style={styles.commentSendBtn}
                onPress={() => handleAddComment(selectedReview.id)}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2042',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  bellContainer: {
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },

  // 🔍 검색창
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2042',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F2042',
    fontWeight: '500',
  },

  // 📌 카드 섹션
  cardSection: {
    marginTop: 20,
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#0F2042',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBox: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2042',
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },

  // ✈️ 많이 찾는 국가
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2042',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  countryScroll: {
    marginHorizontal: -20,
  },
  countryContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  countryFlag: {
    width: 22,
    height: 15,
    borderRadius: 2,
    marginRight: 8,
    resizeMode: 'cover',
  },
  countryNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F2042',
  },

  // 💬 필터 스크롤
  filterScroll: {
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pillBtn: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  pillBtnActiveNavy: {
    backgroundColor: '#0F2042',
    borderColor: '#0F2042',
  },
  pillBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: '#64748B',
  },

  // 정보유형 필터
  typePill: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  typePillActiveNavy: {
    backgroundColor: '#EEF2F6',
    borderColor: '#0F2042',
  },
  typePillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typePillTextActive: {
    color: '#0F2042',
  },
  typePillTextInactive: {
    color: '#94A3B8',
  },

  // 후기 리스트
  reviewList: {
    marginTop: 16,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 16,
    shadowColor: '#0F2042',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewMain: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  countryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F2042',
  },
  reviewTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2042',
    marginTop: 8,
    lineHeight: 20,
  },
  reviewExcerpt: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  reviewAuthor: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  metaDivider: {
    marginHorizontal: 5,
    color: '#CBD5E1',
    fontSize: 10,
  },
  reviewDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#2F66D0',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // 비어있는 상태
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  emptySubText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // 📚 모달 디자인
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2042',
    maxWidth: '60%',
  },
  modalHeartBtn: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalTitleBlock: {
    gap: 10,
  },
  typeBadgeLarge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeLargeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F2042',
  },
  modalMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2042',
    lineHeight: 26,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F2042',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2042',
  },
  modalDateText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  modalTagBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalTagText: {
    fontSize: 11,
    color: '#2F66D0',
    fontWeight: '700',
  },
  modalBody: {
    marginTop: 24,
  },
  modalBodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 24,
  },
  commentSection: {
    gap: 14,
  },
  commentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2042',
  },
  commentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUser: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F2042',
  },
  commentTime: {
    fontSize: 9,
    color: '#94A3B8',
  },
  commentText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  noCommentsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#0F2042',
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F2042',
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
