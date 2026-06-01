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
type LifecycleStatus = '지원 준비 중' | '출국 준비 중' | '파견 중' | '귀국';

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

const accountItems: MenuItem[] = [
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
    title: '비밀번호 관리',
    description: '계정 비밀번호 변경 및 보안 관리',
    icon: 'lock-closed-outline',
    route: null,
  },
  {
    title: '로그아웃',
    description: '현재 계정에서 나가기',
    icon: 'log-out-outline',
    route: null,
  },
];

const statusDisplayMap: Record<string, LifecycleStatus> = {
  preparing: '지원 준비 중',
  accepted: '출국 준비 중',
  dispatched: '파견 중',
  returned: '귀국',
};

export default function ProfileCardScreen() {
  const [profile, setProfile] = useState({
    nickname: '서현',
    country: '독일',
    region: '베를린',
    university: '베를린 자유대학교',
    homeUniversity: '서울대학교',
    status: '출국 준비 중',
    avatarUri: null as string | null,
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
          profileStatus,
          profileAvatarUri,
          exchangeStatus,
        ] = await Promise.all([
          AsyncStorage.getItem('nickname'),
          AsyncStorage.getItem('dispatchedCountry'),
          AsyncStorage.getItem('dispatchedRegion'),
          AsyncStorage.getItem('dispatchedUniversity'),
          AsyncStorage.getItem('university'),
          AsyncStorage.getItem('profileStatus'),
          AsyncStorage.getItem('profileAvatarUri'),
          AsyncStorage.getItem('exchangeStatus'),
        ]);

        setProfile((prev) => ({
          ...prev,
          nickname: nickname || prev.nickname,
          country: dispatchedCountry || prev.country,
          region: dispatchedRegion || prev.region,
          university: dispatchedUniversity || prev.university,
          homeUniversity: homeUniversity || prev.homeUniversity,
          status: profileStatus || (exchangeStatus ? statusDisplayMap[exchangeStatus] : null) || prev.status,
          avatarUri: profileAvatarUri || prev.avatarUri,
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
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(tabs)/home/profile-edit' as any)}
          activeOpacity={0.86}
        >
          <View style={styles.avatarWrap}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={30} color={INK} />
            )}
            <View style={styles.exchangeBadge}>
              <Ionicons name="shield-checkmark" size={14} color={BLUE} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            <Text style={styles.profileMeta} numberOfLines={1}>
              {profile.homeUniversity} · {profile.country} {profile.region}
            </Text>
          </View>

          <View style={styles.profileManage}>
            <Text style={styles.profileManageText}>내 정보 수정</Text>
          </View>
        </TouchableOpacity>

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

        <MenuSection title="내 활동" items={activityItems} onPressItem={openRoute} />
        <MenuSection title="관심 / 저장" items={savedItems} onPressItem={openRoute} />
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 214,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 22,
    paddingVertical: 24,
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
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  exchangeBadge: {
    position: 'absolute',
    right: -3,
    bottom: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    minWidth: 0,
    width: '100%',
  },
  nickname: {
    fontSize: 23,
    fontWeight: '900',
    color: INK,
    textAlign: 'center',
  },
  profileMeta: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
  },
  profileManage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: '#F3F6FB',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  profileManageText: {
    fontSize: 11,
    fontWeight: '900',
    color: NAVY,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#123F9F',
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
