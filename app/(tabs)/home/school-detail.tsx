import React, { useState, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🏫 대학교별 맞춤 상세 데이터베이스
const UNIVERSITY_DETAILS: Record<string, {
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
    costLevel: '낮음' | '보통' | '높음';
    costDescription: string;
    environment: string;
  };
  reviews: {
    oneLiners: { user: string; rating: number; text: string }[];
    blogs: { title: string; views: number }[];
    photos: { title: string; image: any }[];
  };
}> = {
  '뮌헨 공과대학교 (TUM)': {
    name: '뮌헨 공과대학교 (TUM)',
    country: '독일',
    city: '뮌헨',
    rating: 4.8,
    tags: ['#기숙사좋음', '#영어수업많음', '#물가높음', '#학업강도높음'],
    images: [
      require('../../../assets/images/Munich.png'),
      require('../../../assets/images/freepass.png'),
      require('../../../assets/images/travel_holy.png'),
    ],
    basicInfo: {
      language: '영어 (컴퓨터공학, 자연과학 등 개설 과목의 80% 이상) / 독일어',
      departments: '공과대학 전 학과, 정보대학, 경영대학, 사회과학대학 등',
      semesterSystem: '2학기제 (겨울학기: 10월-3월 / 여름학기: 4월-9월)',
      website: 'https://www.tum.de/en/',
      contact: 'international.office@tum.de / +49 (89) 289-22245',
    },
    livingInfo: {
      dorm: '학생처(Studierendenwerk) 주관 기숙사 매칭 신청 가능. 대기 시간이 길어 합격 즉시 신청 권장 (월 380~480유로).',
      transport: '독일티켓(D-Ticket) 활용 시 월 49유로로 전국 전철, 버스, 트램 무제한 탑승 가능.',
      costLevel: '높음',
      costDescription: '외식비가 비싸나 마트(Lidl, Aldi) 식재료 물가는 한국보다 저렴함.',
      environment: '바이에른 주 특유의 평화롭고 안전한 치안. 잉글리시 가든과 알프스 산맥 인접으로 자연 친화적.',
    },
    reviews: {
      oneLiners: [
        { user: 'Lumy_TUM', rating: 5, text: '수업 퀄리티가 정말 높고, 다양한 국가에서 온 유학생들과의 교류가 활발합니다!' },
        { user: '컴공생A', rating: 4, text: '기숙사 구하는 게 제일 힘든 것 빼곤 완벽한 교환생활이었습니다.' },
        { user: '방랑자', rating: 5, text: '뮌헨 지리적 이점이 좋아 매주 오스트리아, 스위스로 여행 다녔네요!' },
      ],
      blogs: [
        { title: '[독일] 뮌헨 공대 파견 첫 주 안멜둥(거주지 등록) 및 계좌 개설 가이드', views: 342 },
        { title: 'TUM 컴퓨터학부 수강신청 팁 및 시험 통과 전략 정리', views: 289 },
        { title: '독일 교환학생 필수 준비 보험 TK 가입부터 활성화까지', views: 412 },
      ],
      photos: [
        { title: '메인 캠퍼스 전경', image: require('../../../assets/images/Munich.png') },
        { title: '기숙사 내부 방 구조', image: require('../../../assets/images/freepass.png') },
        { title: '뮌헨 마리엔 광장', image: require('../../../assets/images/travel_holy.png') },
      ],
    },
  },
  'UCLA (University of California, LA)': {
    name: 'UCLA (University of California, LA)',
    country: '미국',
    city: '로스앤젤레스',
    rating: 4.9,
    tags: ['#날씨최고', '#캠퍼스낭만', '#물가매우높음', '#서부로망'],
    images: [
      require('../../../assets/images/UCLA.png'),
      require('../../../assets/images/travel_holy.png'),
      require('../../../assets/images/background_school.png'),
    ],
    basicInfo: {
      language: '영어 (100% 영어 수업 개설)',
      departments: '경영학, 생명과학, 컴퓨터과학, 심리학, 정치학 등 전 분야',
      semesterSystem: '쿼터제 (Fall, Winter, Spring 3학기 등록제)',
      website: 'https://www.ucla.edu/',
      contact: 'studyabroad@ieo.ucla.edu / +1 (310) 825-4321',
    },
    livingInfo: {
      dorm: '온캠퍼스 기숙사(On-campus Housing) 신청 시 높은 확률로 배정. 식사 옵션(Meal Plan)이 매우 훌륭하기로 유명함.',
      transport: 'LA 특성상 대중교통이 다소 불편하나 브루인 버스(BruinBus) 이용이 가능하며 우버나 렌트를 주로 사용.',
      costLevel: '높음',
      costDescription: '캘리포니아의 높은 텍스(tax)와 팁(tip) 문화로 매달 최소 1500~2000달러 지출 발생.',
      environment: '산타모니카 해변과 비버리 힐즈가 차로 20분 거리. 1년 내내 따뜻하고 쾌적한 캘리포니아 기후.',
    },
    reviews: {
      oneLiners: [
        { user: 'LA드림', rating: 5, text: '학교 급식이 천국입니다. 날씨도 매일이 축복 같아요.' },
        { user: 'BruinLove', rating: 5, text: '학비는 좀 들지만 평생 잊지 못할 추억을 선사해 주는 캠퍼스입니다.' },
      ],
      blogs: [
        { title: 'UCLA 교환학생 F-1 비자 대사관 면접 원패스 후기', views: 512 },
        { title: '기숙사 밀플랜(Meal Plan) 19R vs 14P 전격 비교 요령', views: 403 },
      ],
      photos: [
        { title: '로이스 홀 전경', image: require('../../../assets/images/UCLA.png') },
        { title: '산타모니카 해변 풍경', image: require('../../../assets/images/travel_holy.png') },
      ],
    },
  },
  '와세다 대학교': {
    name: '와세다 대학교',
    country: '일본',
    city: '도쿄',
    rating: 4.7,
    tags: ['#WISH기숙사', '#신주쿠인접', '#한국유학생많음', '#도쿄라이프'],
    images: [
      require('../../../assets/images/japan.png'),
      require('../../../assets/images/background_school.png'),
      require('../../../assets/images/freepass.png'),
    ],
    basicInfo: {
      language: '일본어 / 영어 (국제학부의 경우 영어 수업 다수 개설)',
      departments: '정치경제학부, 법학부, 문학부, 이공학부, 국제교양학부(SILS) 등',
      semesterSystem: '2학기제 (봄학기: 4월-7월 / 가을학기: 9월-1월)',
      website: 'https://www.waseda.jp/top/en/',
      contact: 'in-cie@list.waseda.jp / +81-3-3203-7747',
    },
    livingInfo: {
      dorm: '국제 기숙사 WISH 배정 가능. 입실 경쟁이 치열하지만 합격 시 도쿄 한복판에서 쾌적한 주거 해결.',
      transport: '지하철 도자이선 와세다역 인근. 도쿄 메트로 학생 정기권(통학정기권) 구매 시 교통비 절감.',
      costLevel: '보통',
      costDescription: '식료품 물가는 한국과 비슷하거나 저렴하지만 교통비와 기숙사비는 비싼 편.',
      environment: '도쿄 신주쿠, 다카다노바바와 도보 이동 가능. 대학 주변 저렴하고 맛있는 라멘집 및 밥집이 많음.',
    },
    reviews: {
      oneLiners: [
        { user: '도쿄로간서현', rating: 5, text: 'WISH 기숙사 시설이 진짜 호텔 같아요. 유학생 커뮤니티가 끈끈합니다!' },
        { user: '와세다이공', rating: 4, text: '학교 주변이 한인 친화적이라 외롭지 않게 적응 가능합니다.' },
      ],
      blogs: [
        { title: '도쿄 와세다 기숙사 WISH 입소 절차 및 필수 규칙 아웃라인', views: 245 },
        { title: '일본 통장 개설하기 (우체국 유초은행 개설 꿀팁)', views: 320 },
      ],
      photos: [
        { title: '오쿠마 강당', image: require('../../../assets/images/japan.png') },
      ],
    },
  },
};

export default function SchoolDetailScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  
  // 🏫 기본 대학교 설정 (TUM)
  const schoolName = name || '뮌헨 공과대학교 (TUM)';
  // DB에서 데이터 조회, 없으면 기본값인 TUM 데이터 사용
  const schoolData = UNIVERSITY_DETAILS[schoolName] || UNIVERSITY_DETAILS['뮌헨 공과대학교 (TUM)'];

  // 🤍 북마크 상태 및 토스트 팝업 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // 💬 후기 섹션 서브 탭 상태
  const [activeTab, setActiveTab] = useState<'oneLiner' | 'blog' | 'photo'>('oneLiner');

  // 캐러셀 페이지 인덱스용 스크롤 트래킹
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentSlideIndex(index);
      },
    }
  );

  // 북마크 토글 및 토스트 알림
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    const nextState = !isBookmarked;
    setToastMessage(
      nextState 
        ? '관심 대학에 등록되었습니다. ⭐️' 
        : '관심 대학 등록이 취소되었습니다.'
    );

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* 🔝 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#0F2042" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>상세 정보</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleBookmark}>
            <Ionicons
              name={isBookmarked ? 'heart' : 'heart-outline'}
              size={22}
              color={isBookmarked ? '#EF4444' : '#0F2042'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => alert('공유하기 링크가 복사되었습니다.')}>
            <Ionicons name="share-social-outline" size={20} color="#0F2042" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* 1. 상단 대표 사진 캐러셀 */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {schoolData.images.map((img, index) => (
              <View key={index} style={styles.slideFrame}>
                <Image source={img} style={styles.slideImage} />
                <View style={styles.imageOverlay} />
              </View>
            ))}
          </ScrollView>

          {/* 캐러셀 하단 학교 이름 텍스트 오버레이 */}
          <View style={styles.carouselTitleContainer}>
            <Text style={styles.carouselSchoolName}>{schoolData.name}</Text>
            <Text style={styles.carouselLocation}>
              📍 {schoolData.country} / {schoolData.city}
            </Text>
          </View>

          {/* 슬라이드 도트 인디케이터 */}
          <View style={styles.indicatorContainer}>
            {schoolData.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  currentSlideIndex === index ? styles.indicatorDotActive : styles.indicatorDotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* 🏷️ 태그 리스트 */}
        <View style={styles.tagsContainer}>
          {schoolData.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 2. 학교 기본 정보 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle" size={20} color="#0F2042" />
            <Text style={styles.sectionTitle}>학교 기본 정보</Text>
          </View>
          
          <View style={styles.infoTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>수업 언어</Text>
              <Text style={styles.tableValue}>{schoolData.basicInfo.language}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>지원 학과</Text>
              <Text style={styles.tableValue}>{schoolData.basicInfo.departments}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>학기제</Text>
              <Text style={styles.tableValue}>{schoolData.basicInfo.semesterSystem}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>국제교류처</Text>
              <Text style={styles.tableValue}>{schoolData.basicInfo.contact}</Text>
            </View>

            <TouchableOpacity
              style={styles.webLinkBtn}
              onPress={() => Linking.openURL(schoolData.basicInfo.website)}
            >
              <Text style={styles.webLinkText}>공식 홈페이지 방문하기</Text>
              <Ionicons name="open-outline" size={14} color="#2F66D0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 생활 정보 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="home" size={19} color="#0F2042" />
            <Text style={styles.sectionTitle}>생생한 현지 라이프 정보</Text>
          </View>

          {/* 기숙사 */}
          <View style={styles.lifeItem}>
            <Text style={styles.lifeLabel}>🏠 기숙사 현황</Text>
            <Text style={styles.lifeValueText}>{schoolData.livingInfo.dorm}</Text>
          </View>

          {/* 교통 */}
          <View style={styles.lifeItem}>
            <Text style={styles.lifeLabel}>🚇 교통 편의성</Text>
            <Text style={styles.lifeValueText}>{schoolData.livingInfo.transport}</Text>
          </View>

          {/* 체감 물가 (슬라이더 바 UI) */}
          <View style={styles.lifeItem}>
            <Text style={styles.lifeLabel}>💰 체감 물가 레벨</Text>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack} />
              
              {/* 슬라이더 채워짐 표시 */}
              <View 
                style={[
                  styles.sliderFill, 
                  schoolData.livingInfo.costLevel === '낮음' && { width: '15%' },
                  schoolData.livingInfo.costLevel === '보통' && { width: '50%' },
                  schoolData.livingInfo.costLevel === '높음' && { width: '85%' },
                ]}
              />

              {/* 슬라이더 노드 포인터 */}
              <View 
                style={[
                  styles.sliderNode,
                  schoolData.livingInfo.costLevel === '낮음' && { left: '15%' },
                  schoolData.livingInfo.costLevel === '보통' && { left: '50%' },
                  schoolData.livingInfo.costLevel === '높음' && { left: '85%' },
                ]}
              />
            </View>

            <View style={styles.sliderLabelRow}>
              <Text style={[styles.sliderLabel, schoolData.livingInfo.costLevel === '낮음' && styles.sliderLabelActive]}>낮음</Text>
              <Text style={[styles.sliderLabel, schoolData.livingInfo.costLevel === '보통' && styles.sliderLabelActive]}>보통</Text>
              <Text style={[styles.sliderLabel, schoolData.livingInfo.costLevel === '높음' && styles.sliderLabelActive]}>높음</Text>
            </View>
            <Text style={styles.costTipText}>💡 {schoolData.livingInfo.costDescription}</Text>
          </View>

          {/* 주변 환경 */}
          <View style={styles.lifeItem}>
            <Text style={styles.lifeLabel}>🌳 주변 환경 및 치안</Text>
            <Text style={styles.lifeValueText}>{schoolData.livingInfo.environment}</Text>
          </View>
        </View>

        {/* 4. 후기 섹션 (탭 전환 구조) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="chatbubbles" size={20} color="#0F2042" />
            <Text style={styles.sectionTitle}>경험자들의 리얼 후기</Text>
          </View>

          {/* 후기 서브 탭 헤더 */}
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'oneLiner' && styles.tabBtnActive]}
              onPress={() => setActiveTab('oneLiner')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'oneLiner' && styles.tabBtnTextActive]}>한줄평</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'blog' && styles.tabBtnActive]}
              onPress={() => setActiveTab('blog')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'blog' && styles.tabBtnTextActive]}>블로그 후기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'photo' && styles.tabBtnActive]}
              onPress={() => setActiveTab('photo')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'photo' && styles.tabBtnTextActive]}>사진 후기</Text>
            </TouchableOpacity>
          </View>

          {/* 후기 탭 콘텐츠 */}
          <View style={styles.tabContent}>
            
            {/* 1) 한줄평 리스트 */}
            {activeTab === 'oneLiner' && (
              <View style={styles.oneLinerList}>
                {schoolData.reviews.oneLiners.map((review, index) => (
                  <View key={index} style={styles.oneLinerCard}>
                    <View style={styles.oneLinerHeader}>
                      <Text style={styles.oneLinerUser}>{review.user}</Text>
                      <View style={styles.starsRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={12}
                            color="#EAB308"
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.oneLinerText}>"{review.text}"</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 2) 블로그 후기 리스트 */}
            {activeTab === 'blog' && (
              <View style={styles.blogLinkList}>
                {schoolData.reviews.blogs.map((blog, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.blogLinkItem}
                    onPress={() => router.push('/(tabs)/explore')} // 메인 후기 탐색으로 리다이렉트
                  >
                    <View style={styles.blogIconCircle}>
                      <Ionicons name="document-text" size={16} color="#0F2042" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.blogItemTitle} numberOfLines={1}>
                        {blog.title}
                      </Text>
                      <Text style={styles.blogItemViews}>조회수 {blog.views}회</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 3) 사진 후기 그리드 */}
            {activeTab === 'photo' && (
              <View style={styles.photoGrid}>
                {schoolData.reviews.photos.map((item, index) => (
                  <View key={index} style={styles.photoGridCard}>
                    <Image source={item.image} style={styles.gridImage} />
                    <View style={styles.gridLabelBox}>
                      <Text style={styles.gridLabelText} numberOfLines={1}>{item.title}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 🔔 관심 등록 토스트 알림 팝업 */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    maxWidth: '50%',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },

  content: {
    paddingBottom: 130,
  },

  // 1. 캐러셀 디자인
  carouselContainer: {
    width: width,
    height: 240,
    position: 'relative',
  },
  slideFrame: {
    width: width,
    height: 240,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 32, 66, 0.45)', // Navy Gradation Overlay
  },
  carouselTitleContainer: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    zIndex: 2,
  },
  carouselSchoolName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  carouselLocation: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  indicatorContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorDotActive: {
    backgroundColor: '#FFFFFF',
    width: 14,
  },
  indicatorDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // 태그 컨테이너
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    color: '#0F2042',
    fontWeight: '700',
  },

  // 공통 섹션 카드 스타일
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F2042',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2042',
  },

  // 2. 학교 기본 정보 표 스타일
  infoTable: {
    gap: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableLabel: {
    width: 80,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  tableValue: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F5FF',
    borderRadius: 10,
    height: 40,
    marginTop: 8,
  },
  webLinkText: {
    fontSize: 12,
    color: '#2F66D0',
    fontWeight: '700',
  },

  // 3. 생활 정보 스타일
  lifeItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 14,
  },
  lifeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 6,
  },
  lifeValueText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },

  // 물가 바 UI
  sliderContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    position: 'relative',
    marginTop: 12,
    marginBottom: 6,
  },
  sliderTrack: {
    ...StyleSheet.absoluteFillObject,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#0F2042', // Navy Point cost level indicator
    borderRadius: 3,
  },
  sliderNode: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0F2042',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: -8, // Center node
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  sliderLabelActive: {
    color: '#0F2042',
    fontWeight: '800',
  },
  costTipText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  // 4. 후기 탭 UI
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F2042',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#0F2042',
  },
  tabContent: {
    marginTop: 4,
  },

  // 한줄평 스타일
  oneLinerList: {
    gap: 10,
  },
  oneLinerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  oneLinerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  oneLinerUser: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F2042',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  oneLinerText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // 블로그 링크 스타일
  blogLinkList: {
    gap: 8,
  },
  blogLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  blogIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2042',
  },
  blogItemViews: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // 사진 후기 그리드 스타일
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoGridCard: {
    width: (width - 90) / 2, // 2 컬럼 배치
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  gridLabelBox: {
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  gridLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F2042',
  },

  // 🔔 토스트 메시지
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 32, 66, 0.9)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
