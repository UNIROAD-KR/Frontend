import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SoftServiceIcon } from '@/components/soft-service-icon';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type DimensionValue,
} from 'react-native';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const HERO_BLUE = '#1D4ED8';

type LifecycleStatus = '지원 준비 중' | '출국 준비 중' | '파견 중' | '귀국';

const quickActionsByStatus = {
  '지원 준비 중': [
    {
      title: '파견교 정보',
      icon: 'school-outline',
      route: '/(tabs)/home/school-info',
    },
    {
      title: '장학금 정보',
      icon: 'ribbon-outline',
      route: '/(tabs)/home/scholarship-info',
    },
    {
      title: '지원 기준',
      icon: 'business-outline',
      route: '/(tabs)/home/my-school-info',
    },
  ],
  '출국 준비 중': [
    {
      title: '비자 가이드',
      icon: 'document-text-outline',
      route: '/(tabs)/home/visa-guide',
    },
    {
      title: '체크리스트',
      icon: 'checkmark-done-outline',
      route: '/(tabs)/home/departure-checklist',
    },
    {
      title: '중고 구매',
      icon: 'cart-outline',
      route: '/market',
    },
  ],
  '파견 중': [
    {
      title: '동행 구하기',
      icon: 'people-outline',
      route: {
        pathname: '/(tabs)/community',
        params: { tab: 'companion' },
      },
    },
    {
      title: '지출 관리',
      icon: 'wallet-outline',
      route: '/(tabs)/mypage',
    },
    {
      title: '티켓 양도하기',
      icon: 'ticket-outline',
      route: {
        pathname: '/(tabs)/market',
        params: { tab: 'ticket' },
      },
    },
  ],
  귀국: [
    {
      title: '후기 작성',
      icon: 'create-outline',
      route: '/(tabs)/community',
    },
    {
      title: '중고 판매',
      icon: 'storefront-outline',
      route: '/market',
    },
    {
      title: '후배 질문 답변',
      icon: 'chatbubbles-outline',
      route: '/(tabs)/community',
    },
  ],
} as const;

const popularPosts = [
  {
    title: '독일 비자 인터뷰 예약 가능한 날짜 공유합니다',
    country: '독일',
    likes: 34,
    comments: 12,
    time: '8분 전',
  },
  {
    title: '파리 기숙사 보증금 송금할 때 수수료 줄이는 법',
    country: '프랑스',
    likes: 21,
    comments: 7,
    time: '19분 전',
  },
  {
    title: '출국 전 꼭 챙겨야 하는 영문 서류 체크',
    country: '공통',
    likes: 42,
    comments: 18,
    time: '31분 전',
  },
  {
    title: '뮌헨 도착 첫날 교통권은 이렇게 사면 편해요',
    country: '독일',
    likes: 16,
    comments: 5,
    time: '45분 전',
  },
];

const companionPosts = [
  {
    city: '독일 뮌헨',
    period: '7.18 - 7.21',
    status: '모집중',
    people: '2/4명',
    verified: true,
    likes: 18,
  },
  {
    city: '프랑스 파리',
    period: '8.02 - 8.05',
    status: '모집중',
    people: '1/3명',
    verified: true,
    likes: 11,
  },
  {
    city: '일본 도쿄',
    period: '7.27 하루',
    status: '마감임박',
    people: '3/4명',
    verified: false,
    likes: 9,
  },
];

const bulkTradeItems = [
  {
    title: '독일 초기정착 일괄 세트',
    price: '48,000원',
    location: '뮌헨',
    image: require('../../../assets/images/used_all.png'),
  },
  {
    title: '기숙사 주방용품 일괄',
    price: '32,000원',
    location: '베를린',
    image: require('../../../assets/images/used_all.png'),
  },
  {
    title: '침구 + 멀티탭 + 수납함 일괄',
    price: '25,000원',
    location: '프랑크푸르트',
    image: require('../../../assets/images/used_all.png'),
  },
];

const ticketTradeItems = [
  {
    title: '파리 루브르 입장권 양도',
    price: '€12',
    location: '파리',
    image: require('../../../assets/images/ticket.png'),
  },
  {
    title: '뮌헨 Coldplay 콘서트 티켓',
    price: '€90',
    location: '뮌헨',
    image: require('../../../assets/images/ticket.png'),
  },
  {
    title: '바르셀로나 가우디 투어 양도',
    price: '€18',
    location: '바르셀로나',
    image: require('../../../assets/images/ticket.png'),
  },
];

const statusDisplayMap: Record<string, LifecycleStatus> = {
  preparing: '지원 준비 중',
  applying: '지원 준비 중',
  beforeAccepted: '지원 준비 중',
  support: '지원 준비 중',
  preApply: '지원 준비 중',
  accepted: '출국 준비 중',
  dispatched: '파견 중',
  returned: '귀국',
};

const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);
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

  return hasDispatchedUniversity ? '파견 중' : '지원 준비 중';
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

const getSemesterText = (date: Date) => {
  const month = date.getMonth() + 1;
  return `${date.getFullYear()} ${month <= 6 ? '봄학기' : '가을학기'}`;
};

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState('서현');
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus>('지원 준비 중');
  const [dispatchInfo, setDispatchInfo] = useState({
    country: '독일',
    university: '베를린 자유대학교',
  });
  const [dashboardDates, setDashboardDates] = useState({
    applicationDeadline: createDate(2026, 3, 18),
    departureDate: createDate(2026, 8, 21),
    dispatchStartDate: createDate(2026, 9, 1),
    returnDate: createDate(2027, 1, 15),
  });
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

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
          dispatchedCountry,
          dispatchedUniversity,
          applicationDeadline,
          departureDate,
          dispatchStartDate,
          returnDate,
        ] = await Promise.all([
          AsyncStorage.getItem('nickname'),
          AsyncStorage.getItem('exchangeStatus'),
          AsyncStorage.getItem('profileStatus'),
          AsyncStorage.getItem('dispatchedCountry'),
          AsyncStorage.getItem('dispatchedUniversity'),
          AsyncStorage.getItem('applicationDeadline'),
          AsyncStorage.getItem('departureDate'),
          AsyncStorage.getItem('dispatchStartDate'),
          AsyncStorage.getItem('returnDate'),
        ]);

        if (savedNickname) {
          setDisplayName(savedNickname);
        }

        if (dispatchedCountry || dispatchedUniversity) {
          setDispatchInfo({
            country: dispatchedCountry || '독일',
            university: dispatchedUniversity || '베를린 자유대학교',
          });
        }

        setLifecycleStatus(
          normalizeStatus(profileStatus, onboardingStatus, Boolean(dispatchedUniversity)),
        );
        setDashboardDates({
          applicationDeadline: parseDate(applicationDeadline, createDate(2026, 3, 18)),
          departureDate: parseDate(departureDate, createDate(2026, 8, 21)),
          dispatchStartDate: parseDate(dispatchStartDate, createDate(2026, 9, 1)),
          returnDate: parseDate(returnDate, createDate(2027, 1, 15)),
        });
      };

      loadNickname();
    }, []),
  );

  const isDispatched = lifecycleStatus === '파견 중';
  const isReturned = lifecycleStatus === '귀국';
  const showTradeBeforeCompanion = !isDispatched && !isReturned;
  const tradeItems = isDispatched ? ticketTradeItems : bulkTradeItems;
  const quickActions = quickActionsByStatus[lifecycleStatus];
  const applicationDday = diffDays(dashboardDates.applicationDeadline);
  const departureDday = diffDays(dashboardDates.departureDate);
  const dispatchedDay = Math.max(0, Math.abs(diffDays(dashboardDates.dispatchStartDate)));
  const returnDday = diffDays(dashboardDates.returnDate);
  const totalDispatchDays = Math.max(
    1,
    Math.ceil(
      (dashboardDates.returnDate.getTime() - dashboardDates.dispatchStartDate.getTime()) / oneDay,
    ),
  );
  const dispatchProgress = Math.min(100, Math.round((dispatchedDay / totalDispatchDays) * 100));
  const remainingDispatchDays = Math.max(0, returnDday);

  const heroCopy = {
    '지원 준비 중': {
      tag: '정보 탐색 단계',
      title: `${dispatchInfo.country} 파견 지원 준비 중`,
      subtitle: `지원 마감까지 D-${Math.max(0, applicationDday)}`,
      metric: `D-${Math.max(0, applicationDday)}`,
      progressLabel: '지원 준비 진행률',
      progressValue: '38%',
      progressWidth: '38%',
    },
    '출국 준비 중': {
      tag: '출국 준비 단계',
      title: `${dispatchInfo.country} 출국 준비 중`,
      subtitle: `출국까지 D-${Math.max(0, departureDday)}`,
      metric: `D-${Math.max(0, departureDday)}`,
      progressLabel: '출국 준비 진행률',
      progressValue: '72%',
      progressWidth: '72%',
    },
    '파견 중': {
      tag: `${dispatchInfo.university} 파견 중`,
      title: `${dispatchInfo.country} 교환학생 생활 중`,
      subtitle:
        returnDday >= 0
          ? `귀국까지 ${remainingDispatchDays}일 남았어요`
          : '파견 생활을 정리하고 있어요',
      metric: `D+${dispatchedDay}`,
      progressLabel: `파견 기간 ${dispatchProgress}% 경과`,
      progressValue: `${dispatchedDay} / ${totalDispatchDays}일`,
      progressWidth: `${dispatchProgress}%`,
    },
    귀국: {
      tag: '파견 완료',
      title: `${dispatchInfo.country} 교환학생 수료`,
      subtitle: `${getSemesterText(dashboardDates.returnDate)} 파견 완료`,
      metric: '완료',
      progressLabel: '후기와 정리 단계',
      progressValue: '100%',
      progressWidth: '100%',
    },
  }[lifecycleStatus];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileWrap}
          onPress={() => router.push('/(tabs)/mypage' as any)}
          activeOpacity={0.82}
        >
          <Image
            source={require('../../../assets/images/profile.png')}
            style={styles.profile}
          />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.greeting}>안녕하세요, {displayName}님</Text>
          <Text style={styles.headerSub}>
            {isDispatched
              ? `${dispatchInfo.country} 교환학생 생활 중`
              : isReturned
                ? '파견을 마치고 경험을 정리해보세요'
                : '오늘 준비해야 할 일을 확인해보세요'}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search" size={21} color={NAVY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={NAVY} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.heroCard}>
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
            <Text style={styles.heroTitle}>{heroCopy.title}</Text>
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
              onPress={() => router.push('/(tabs)/home/profile-card' as any)}
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

            <Text style={styles.heroTitle}>{heroCopy.title}</Text>
            <Text style={styles.heroSubtitle}>{heroCopy.subtitle}</Text>

            <View style={styles.progressInfoRow}>
              <Text style={styles.progressLabel}>{heroCopy.progressLabel}</Text>
              <Text style={styles.progressValue}>{heroCopy.progressValue}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: heroCopy.progressWidth as DimensionValue }]} />
            </View>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push('/(tabs)/home/profile-card' as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.heroButtonText}>내 프로필 보기</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>
          <TouchableOpacity
            style={styles.quickMoreButton}
            onPress={() => router.push('/(tabs)/home/more-menu' as any)}
            activeOpacity={0.82}
          >
            <Text style={styles.moreText}>더보기</Text>
            <Ionicons name="chevron-forward" size={14} color={BLUE} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.quickCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.86}
            >
              <SoftServiceIcon name={item.icon} iconSize={24} style={styles.quickIconBox} />
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.contentSurface}>
      <View style={[styles.sectionBlock, styles.contentFirstBlock]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {lifecycleStatus === '지원 준비 중'
              ? '지원 준비 인기 정보'
              : lifecycleStatus === '출국 준비 중'
                ? '출국 전 많이 보는 글'
                : lifecycleStatus === '파견 중'
                  ? '현지 생활 인기 게시글'
                  : '귀국 후 정리 팁'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/community' as any)}>
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
                <Ionicons name="chatbubble-outline" size={13} color="#64748B" />
                <Text style={styles.postMetaText}>{post.comments}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={showTradeBeforeCompanion && styles.reorderedContentSections}>
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {isReturned ? '후배들이 기다리는 답변' : '지금 모집 중인 동행'}
            </Text>
            <Text style={styles.sectionSub}>
              {lifecycleStatus === '지원 준비 중'
                ? '지원 전 궁금한 기준과 학교 경험을 확인해보세요'
                : lifecycleStatus === '출국 준비 중'
                  ? '출국 전후 일정이 맞는 친구를 찾아보세요'
                  : lifecycleStatus === '파견 중'
                    ? '현지 일정과 여행을 함께할 친구를 찾아보세요'
                    : '내 경험이 다음 교환학생에게 좋은 길잡이가 돼요'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/community',
                params: { tab: 'companion' },
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
            <TouchableOpacity key={post.city} style={styles.companionCard} activeOpacity={0.88}>
              <View style={styles.companionTop}>
                <View style={styles.companionPin}>
                  <Ionicons name="location-outline" size={18} color={NAVY} />
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{post.status}</Text>
                </View>
              </View>

              <Text style={styles.companionCity}>{post.city}</Text>
              <Text style={styles.companionPeriod}>{post.period}</Text>

              <View style={styles.companionMetaGrid}>
                <View style={styles.companionMetaItem}>
                  <Ionicons name="people-outline" size={14} color="#64748B" />
                  <Text style={styles.companionMetaText}>{post.people}</Text>
                </View>
                <View style={styles.companionMetaItem}>
                  <Ionicons
                    name={post.verified ? 'shield-checkmark-outline' : 'shield-outline'}
                    size={14}
                    color="#64748B"
                  />
                  <Text style={styles.companionMetaText}>
                    {post.verified ? '학교 인증' : '인증 예정'}
                  </Text>
                </View>
              </View>

              <View style={styles.companionFooter}>
                <Text style={styles.joinText}>함께 일정 보기</Text>
                <View style={styles.likeRow}>
                  <Ionicons name="heart-outline" size={14} color="#64748B" />
                  <Text style={styles.likeText}>{post.likes}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isReturned
              ? '귀국 전후 중고 판매'
              : isDispatched
                ? '최근 올라온 티켓 양도'
                : '최근 올라온 일괄거래'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/market' as any)}>
            <Text style={styles.moreText}>전체보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tradeList}>
          {tradeItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.tradeItem, index === tradeItems.length - 1 && styles.lastItem]}
              onPress={() => router.push('/market' as any)}
              activeOpacity={0.84}
            >
              <View style={styles.tradeThumb}>
                <Image source={item.image} style={styles.tradeImage} />
              </View>
              <View style={styles.tradeBody}>
                <Text style={styles.tradeTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.tradeLocation}>{item.location}</Text>
                <Text style={styles.tradePrice}>{item.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDF1F5',
    shadowColor: '#0F172A',
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
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  heroCard: {
    marginTop: 24,
    borderRadius: 24,
    backgroundColor: '#F2F7FF',
    padding: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTag: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: HERO_BLUE,
  },
  heroDday: {
    fontSize: 26,
    fontWeight: '900',
    color: HERO_BLUE,
  },
  heroSmallMeta: {
    fontSize: 13,
    fontWeight: '900',
    color: HERO_BLUE,
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '900',
    color: '#111111',
  },
  heroSubtitle: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  progressInfoRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DCE8FA',
    overflow: 'hidden',
  },
  progressFill: {
    width: '72%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: HERO_BLUE,
  },
  dispatchedProgressFill: {
    width: '26%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: HERO_BLUE,
  },
  dispatchedDayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  dispatchedDay: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '900',
    color: HERO_BLUE,
  },
  dispatchedDayUnit: {
    marginLeft: 5,
    marginBottom: 9,
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  heroButton: {
    marginTop: 22,
    height: 48,
    borderRadius: 16,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sectionBlock: {
    marginTop: 32,
  },
  contentSurface: {
    marginTop: 34,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 120,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#E8EDF3',
  },
  contentFirstBlock: {
    marginTop: 0,
  },
  reorderedContentSections: {
    flexDirection: 'column-reverse',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
  },
  quickMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minHeight: 112,
    paddingHorizontal: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
    lineHeight: 17,
  },
  postList: {
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  postItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryBadge: {
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  countryBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: BLUE,
  },
  postTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  postTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 9,
  },
  postMetaText: {
    marginRight: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#F7F8FA',
    padding: 17,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  companionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companionPin: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: BLUE,
  },
  companionCity: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
  },
  companionPeriod: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  companionMetaGrid: {
    marginTop: 15,
    gap: 8,
  },
  companionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companionMetaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  companionFooter: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinText: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  tradeList: {
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  tradeItem: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tradeThumb: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  tradeImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  tradeBody: {
    flex: 1,
  },
  tradeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  tradeLocation: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tradePrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },
});
