import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

type RouteTarget = string | null;

type QuickAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: RouteTarget;
};

type MenuItem = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: RouteTarget;
};

const quickActions: QuickAction[] = [
  { title: '관심목록', icon: 'heart-outline', route: null },
  { title: '최근 본 글', icon: 'time-outline', route: null },
  { title: '여행 혜택', icon: 'sparkles-outline', route: '/(tabs)/home/guide' },
];

const activityItems: MenuItem[] = [
  {
    title: '커뮤니티 작성글',
    description: '질문, 후기, 정보 공유 글 관리',
    icon: 'chatbubbles-outline',
    route: '/(tabs)/community',
  },
  {
    title: '중고거래 작성글',
    description: '판매 중인 물품과 거래 상태 확인',
    icon: 'bag-handle-outline',
    route: '/(tabs)/market',
  },
  {
    title: '동행 모집글',
    description: '출국, 여행, 정착 동행 모집 현황',
    icon: 'people-outline',
    route: '/(tabs)/community',
  },
];

const savedItems: MenuItem[] = [
  {
    title: '관심 게시글',
    description: '다시 볼 게시글 모아보기',
    icon: 'bookmark-outline',
    route: null,
  },
  {
    title: '저장한 파견교',
    description: '비교 중인 학교와 지역 정보',
    icon: 'school-outline',
    route: '/(tabs)/home/my-school-info',
  },
  {
    title: '저장한 장학금',
    description: '지원 일정과 조건 확인',
    icon: 'ribbon-outline',
    route: '/(tabs)/home/scholarship-info',
  },
];

const tradeItems: MenuItem[] = [
  {
    title: '구매내역',
    description: '구매한 물품과 진행 중인 거래',
    icon: 'receipt-outline',
    route: '/(tabs)/market',
  },
  {
    title: '판매내역',
    description: '판매글, 예약, 완료 거래 관리',
    icon: 'storefront-outline',
    route: '/(tabs)/market',
  },
  {
    title: '티켓 양도 내역',
    description: '티켓 거래와 양도 진행 상황',
    icon: 'ticket-outline',
    route: '/(tabs)/market/ticket-preview',
  },
];

const accountItems: MenuItem[] = [
  {
    title: '프로필 수정',
    description: '학교, 국가, 공개 정보를 관리',
    icon: 'person-circle-outline',
    route: null,
  },
  {
    title: '학교 인증',
    description: '파견교 인증 상태 확인',
    icon: 'shield-checkmark-outline',
    route: '/verification',
  },
  {
    title: '알림 설정',
    description: '관심 글과 거래 알림 관리',
    icon: 'notifications-outline',
    route: null,
  },
  {
    title: '로그아웃',
    description: '현재 계정에서 나가기',
    icon: 'log-out-outline',
    route: null,
  },
];

export default function ProfileCardScreen() {
  const [profile, setProfile] = useState({
    nickname: '서현',
    country: '독일',
    region: '베를린',
    university: '베를린 자유대학교',
    homeUniversity: '서울대학교',
    status: '파견 준비 중',
  });

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const [
          nickname,
          dispatchedCountry,
          dispatchedRegion,
          dispatchedUniversity,
          homeUniversity,
        ] = await Promise.all([
          AsyncStorage.getItem('nickname'),
          AsyncStorage.getItem('dispatchedCountry'),
          AsyncStorage.getItem('dispatchedRegion'),
          AsyncStorage.getItem('dispatchedUniversity'),
          AsyncStorage.getItem('university'),
        ]);

        setProfile((prev) => ({
          ...prev,
          nickname: nickname || prev.nickname,
          country: dispatchedCountry || prev.country,
          region: dispatchedRegion || prev.region,
          university: dispatchedUniversity || prev.university,
          homeUniversity: homeUniversity || prev.homeUniversity,
        }));
      };

      loadProfile();
    }, []),
  );

  const openRoute = (route: RouteTarget) => {
    if (!route) {
      Alert.alert('준비 중', '이 목록 화면은 곧 연결될 예정입니다.');
      return;
    }

    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>내 프로필</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={() => openRoute(null)}>
          <Ionicons name="settings-outline" size={21} color={NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={require('../../../assets/images/profile.png')}
              style={styles.avatar}
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            <Text style={styles.profileMeta} numberOfLines={1}>
              {profile.homeUniversity} · {profile.country} {profile.region}
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{profile.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickCard}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.quickItem, index < quickActions.length - 1 && styles.quickDivider]}
              onPress={() => openRoute(item.route)}
              activeOpacity={0.86}
            >
              <Ionicons name={item.icon} size={25} color="#FFFFFF" />
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.hubCard}>
          <View>
            <Text style={styles.hubLabel}>교환학생 활동 허브</Text>
            <Text style={styles.hubTitle}>내가 남긴 글과 관심 정보를 한곳에서 관리해요</Text>
          </View>

          <View style={styles.hubStats}>
            <View style={styles.hubStat}>
              <Text style={styles.hubStatValue}>12</Text>
              <Text style={styles.hubStatLabel}>작성글</Text>
            </View>
            <View style={styles.hubStat}>
              <Text style={styles.hubStatValue}>8</Text>
              <Text style={styles.hubStatLabel}>관심</Text>
            </View>
            <View style={styles.hubStat}>
              <Text style={styles.hubStatValue}>3</Text>
              <Text style={styles.hubStatLabel}>거래</Text>
            </View>
          </View>
        </View>

        <View style={styles.exchangeCard}>
          <View style={styles.exchangeIcon}>
            <Ionicons name="shield-checkmark" size={20} color={BLUE} />
          </View>
          <View style={styles.exchangeText}>
            <Text style={styles.exchangeTitle}>교환학생 인증 완료</Text>
            <Text style={styles.exchangeDesc} numberOfLines={2}>
              {profile.university} 파견 정보가 프로필에 표시됩니다.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A4ADBA" />
        </View>

        <MenuSection title="내 활동" items={activityItems} onPressItem={openRoute} />
        <MenuSection title="관심 / 저장" items={savedItems} onPressItem={openRoute} />
        <MenuSection title="거래 관리" items={tradeItems} onPressItem={openRoute} />
        <MenuSection title="계정 / 설정" items={accountItems} onPressItem={openRoute} />
      </ScrollView>
    </View>
  );
}

function MenuSection({
  title,
  items,
  onPressItem,
}: {
  title: string;
  items: MenuItem[];
  onPressItem: (route: RouteTarget) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.menuRow, index < items.length - 1 && styles.menuDivider]}
            onPress={() => onPressItem(item.route)}
            activeOpacity={0.82}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon} size={21} color={NAVY} />
            </View>

            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc} numberOfLines={1}>
                {item.description}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={19} color="#A4ADBA" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 106,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    padding: 18,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '900',
    color: INK,
  },
  profileMeta: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: NAVY,
    overflow: 'hidden',
  },
  quickItem: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.16)',
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  hubCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DCE6F7',
    padding: 18,
  },
  hubLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
    marginBottom: 6,
  },
  hubTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
    color: INK,
  },
  hubStats: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  hubStat: {
    flex: 1,
    minHeight: 68,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: NAVY,
  },
  hubStatLabel: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
  },
  exchangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exchangeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exchangeText: {
    flex: 1,
    paddingRight: 10,
  },
  exchangeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  exchangeDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: MUTED,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: INK,
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },
  menuRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextBox: {
    flex: 1,
    paddingRight: 10,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
  },
});
