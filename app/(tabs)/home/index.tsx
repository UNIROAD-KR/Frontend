import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
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
} from 'react-native';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const HERO_BLUE = '#2446B8';

type QuickMenuStage = 'applying' | 'accepted' | 'dispatched';

const quickActionsByStage = {
  applying: [
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
      title: '내 학교 지원 기준',
      icon: 'business-outline',
      route: '/(tabs)/home/my-school-info',
    },
  ],
  accepted: [
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
      title: '중고거래 구매',
      icon: 'cart-outline',
      route: '/market',
    },
  ],
  dispatched: [
    {
      title: '동행 구하기',
      icon: 'people-outline',
      route: '/(tabs)/community',
    },
    {
      title: '지출 관리',
      icon: 'wallet-outline',
      route: '/(tabs)/mypage',
    },
    {
      title: '티켓 양도하기',
      icon: 'ticket-outline',
      route: '/market/ticket-preview',
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

function resolveQuickMenuStage(status: string | null): QuickMenuStage {
  if (status === 'dispatched') {
    return 'dispatched';
  }

  if (
    status === 'applying' ||
    status === 'beforeAccepted' ||
    status === 'support' ||
    status === 'preApply'
  ) {
    return 'applying';
  }

  return 'accepted';
}

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState('서현');
  const [exchangeStatus, setExchangeStatus] = useState<'preparing' | 'dispatched'>('preparing');
  const [quickMenuStage, setQuickMenuStage] = useState<QuickMenuStage>('accepted');
  const [dispatchInfo, setDispatchInfo] = useState({
    country: '독일',
    university: '베를린 자유대학교',
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
        const savedNickname = await AsyncStorage.getItem('nickname');
        const savedStatus = await AsyncStorage.getItem('exchangeStatus');
        const dispatchedCountry = await AsyncStorage.getItem('dispatchedCountry');
        const dispatchedUniversity = await AsyncStorage.getItem('dispatchedUniversity');

        if (savedNickname) {
          setDisplayName(savedNickname);
        }

        if (dispatchedCountry || dispatchedUniversity) {
          setDispatchInfo({
            country: dispatchedCountry || '독일',
            university: dispatchedUniversity || '베를린 자유대학교',
          });
        }

        if (savedStatus === 'dispatched' || dispatchedUniversity) {
          setExchangeStatus('dispatched');
          setQuickMenuStage('dispatched');
        } else {
          setExchangeStatus('preparing');
          setQuickMenuStage(resolveQuickMenuStage(savedStatus));
        }
      };

      loadNickname();
    }, []),
  );

  const isDispatched = exchangeStatus === 'dispatched';
  const tradeItems = isDispatched ? ticketTradeItems : bulkTradeItems;
  const quickActions = quickActionsByStage[quickMenuStage];

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
            {isDispatched ? `${dispatchInfo.country} 파견 중` : '오늘 준비해야 할 일을 확인해보세요'}
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
                <Text style={styles.heroTagText}>{dispatchInfo.university} 파견 중</Text>
              </View>
              <Text style={styles.heroSmallMeta}>47 / 180일</Text>
            </View>

            <View style={styles.dispatchedDayRow}>
              <Text style={styles.dispatchedDay}>47</Text>
              <Text style={styles.dispatchedDayUnit}>일째</Text>
            </View>
            <Text style={styles.heroSubtitle}>귀국까지 133일 남았어요</Text>

            <View style={styles.progressTrack}>
              <View style={styles.dispatchedProgressFill} />
            </View>

            <View style={styles.progressInfoRow}>
              <Text style={styles.progressLabel}>파견 기간 26% 경과</Text>
              <Text style={styles.progressValue}>47 / 180일</Text>
            </View>

            <View style={styles.dispatchStatusGrid}>
              <View style={styles.dispatchStatusCard}>
                <Text style={styles.dispatchStatusLabel}>학점 이수 현황</Text>
                <Text style={styles.dispatchStatusValue}>12학점</Text>
                <Text style={styles.dispatchStatusSub}>목표 18학점</Text>
              </View>
              <View style={styles.dispatchStatusCard}>
                <Text style={styles.dispatchStatusLabel}>남은 파견 기간</Text>
                <Text style={styles.dispatchStatusValue}>133일</Text>
                <Text style={styles.dispatchStatusSub}>귀국 07/26</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>파견 준비 중</Text>
              </View>
              <Text style={styles.heroDday}>D-58</Text>
            </View>

            <Text style={styles.heroTitle}>독일 파견 준비 중</Text>
            <Text style={styles.heroSubtitle}>다음 해야 할 일: 비자 인터뷰 예약하기</Text>

            <View style={styles.progressInfoRow}>
              <Text style={styles.progressLabel}>준비 진행률</Text>
              <Text style={styles.progressValue}>72%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push('/(tabs)/home/profile-card' as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.heroButtonText}>내 프로필 보기</Text>
              <Ionicons name="arrow-forward" size={17} color={NAVY} />
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
              <View style={styles.quickIconBox}>
                <Ionicons name={item.icon} size={24} color={NAVY} />
              </View>
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>실시간 인기 게시글</Text>
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

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>지금 모집 중인 동행</Text>
            <Text style={styles.sectionSub}>출국 전후 일정이 맞는 친구를 찾아보세요</Text>
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
            {isDispatched ? '최근 올라온 티켓 양도' : '최근 올라온 일괄거래'}
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
    paddingTop: 52,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  profile: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    borderColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: HERO_BLUE,
    padding: 22,
    shadowColor: '#2446B8',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTag: {
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DDE8FF',
  },
  heroDday: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSmallMeta: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#DDE8FF',
  },
  progressInfoRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#BFD0EA',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '72%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dispatchedProgressFill: {
    width: '26%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  dispatchedDayUnit: {
    marginLeft: 5,
    marginBottom: 9,
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dispatchStatusGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  dispatchStatusCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  dispatchStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  dispatchStatusValue: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
  },
  dispatchStatusSub: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  heroButton: {
    marginTop: 20,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  sectionBlock: {
    marginTop: 30,
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
    gap: 10,
  },
  quickCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOpacity: 0.015,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F6F8FC',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
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
    backgroundColor: '#EEF2FF',
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: NAVY,
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
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
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
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
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
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
