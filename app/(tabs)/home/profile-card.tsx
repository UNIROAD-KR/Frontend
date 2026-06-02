import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { getMemberMe, logout } from '../../../src/api/auth';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const SOFT = '#F6F8FC';
const CARD = '#FAFBFC';

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
  action?: 'logout';
};

const quickActions: QuickAction[] = [
  { title: '좋아요한 글', icon: 'heart-outline', route: null },
  { title: '좋아요한 파견교', icon: 'school-outline', route: '/(tabs)/home/my-school-info' },
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
    title: '동행 모집글',
    description: '출국, 여행, 정착 동행 모집 현황',
    icon: 'people-outline',
    route: '/(tabs)/community',
  },
  {
    title: '중고거래 작성글',
    description: '판매 중인 물품과 거래 상태 확인',
    icon: 'bag-handle-outline',
    route: '/(tabs)/market',
  },
];

const accountItems: MenuItem[] = [
  {
    title: '파견교 인증',
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
    title: '비밀번호 수정',
    description: '이름, 학교, 파견 정보를 수정',
    icon: 'person-outline',
    route: '/(tabs)/home/profile-edit',
  },
  {
    title: '로그아웃하기',
    description: '현재 계정에서 로그아웃',
    icon: 'log-out-outline',
    route: null,
    action: 'logout',
  },
];

const statusDisplayMap: Record<string, LifecycleStatus> = {
  preparing: '지원 준비 중',
  accepted: '출국 준비 중',
  dispatched: '파견 중',
  returned: '귀국',
};

export default function ProfileCardScreen() {
  const [isVerified, setIsVerified] = useState(false);
  const [profile, setProfile] = useState({
    nickname: '닉네임',
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
          savedIsVerified,
          savedOverrides,
        ] = await Promise.all([
          AsyncStorage.getItem('nickname'),
          AsyncStorage.getItem('dispatchedCountry'),
          AsyncStorage.getItem('dispatchedRegion'),
          AsyncStorage.getItem('dispatchedUniversity'),
          AsyncStorage.getItem('university'),
          AsyncStorage.getItem('profileStatus'),
          AsyncStorage.getItem('profileAvatarUri'),
          AsyncStorage.getItem('exchangeStatus'),
          AsyncStorage.getItem('isVerified'),
          AsyncStorage.getItem('profileFieldOverrides'),
        ]);

        setIsVerified(savedIsVerified === 'true');
        const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

        let apiProfile = {
          nickname: null as string | null,
          country: null as string | null,
          region: null as string | null,
          university: null as string | null,
          homeUniversity: null as string | null,
        };

        try {
          const memberRes = await getMemberMe();
          const member = memberRes.data?.data;

          if (member) {
            apiProfile = {
              nickname: member.nickname?.trim() || null,
              country: member.dispatchedCountry || null,
              region: member.dispatchedRegion || null,
              university: member.dispatchedUniversity || null,
              homeUniversity: member.homeUniversity || member.domesticUniversity || null,
            };

            if (apiProfile.nickname) {
              await AsyncStorage.setItem('nickname', apiProfile.nickname);
            }
          }
        } catch (error: any) {
          console.log('회원 정보 조회 실패:', error.response?.data || error.message);
        }

        setProfile((prev) => ({
          ...prev,
          nickname: overrides.nickname ? nickname || prev.nickname : apiProfile.nickname || nickname || prev.nickname,
          country: overrides.country ? dispatchedCountry || prev.country : apiProfile.country || dispatchedCountry || prev.country,
          region: overrides.region ? dispatchedRegion || prev.region : apiProfile.region || dispatchedRegion || prev.region,
          university: overrides.dispatchedUniversity ? dispatchedUniversity || prev.university : apiProfile.university || dispatchedUniversity || prev.university,
          homeUniversity: overrides.homeUniversity ? homeUniversity || prev.homeUniversity : apiProfile.homeUniversity || homeUniversity || prev.homeUniversity,
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

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.log('로그아웃 API 호출 실패:', error);
          } finally {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'nickname']);
            router.replace('/login');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>내 프로필</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.profileMain}
            onPress={() => router.push('/(tabs)/home/profile-edit' as any)}
            activeOpacity={0.86}
          >
            <View style={styles.avatarWrap}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={25} color={INK} />
              )}
              {isVerified ? (
                <View style={styles.exchangeBadge}>
                  <Ionicons name="shield-checkmark" size={11} color={BLUE} />
                </View>
              ) : null}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.profileMeta} numberOfLines={1}>
                {profile.homeUniversity} · {profile.country} {profile.region}
              </Text>
            </View>

            <View style={styles.profileManage}>
              <Ionicons name="pencil-outline" size={16} color={NAVY} />
            </View>
          </TouchableOpacity>

          <View style={styles.quickCard}>
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.quickItem}
                onPress={() => openRoute(item.route)}
                activeOpacity={0.86}
              >
                <Text style={styles.quickTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.verificationCard,
            isVerified ? styles.verificationCardDone : styles.verificationCardPending,
          ]}
          onPress={() => {
            if (!isVerified) {
              router.push('/verification' as any);
            }
          }}
          activeOpacity={isVerified ? 1 : 0.86}
        >
          <View
            style={[
              styles.verificationIconBox,
              isVerified
                ? styles.verificationIconBoxDone
                : styles.verificationIconBoxPending,
            ]}
          >
            <Ionicons
              name={isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={20}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.verificationTextBox}>
            <Text style={styles.verificationTitle}>
              {isVerified ? '교환학생 인증 완료' : '교환학생 인증이 필요해요'}
            </Text>
            <Text style={styles.verificationDesc} numberOfLines={2}>
              {isVerified
                ? '파견교 인증이 완료되어 안전한 교환학생 멤버로 표시됩니다.'
                : '인증하고 중고거래·동행 모집 이용하기'}
            </Text>
          </View>

          {isVerified ? (
            <View style={styles.verificationPill}>
              <Text style={styles.verificationPillText}>완료</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.78)" />
          )}
        </TouchableOpacity>

        <MenuSection
          title="내 활동"
          items={activityItems}
          onPressItem={openRoute}
        />
        <MenuSection
          title="계정 / 설정"
          items={accountItems}
          onPressItem={openRoute}
          onLogout={handleLogout}
        />
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
  onLogout?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {items.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.menuRow, index < items.length - 1 && styles.menuDivider]}
            onPress={() => (item.action === 'logout' ? onLogout?.() : onPressItem(item.route))}
            activeOpacity={0.82}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon} size={18} color={NAVY} />
            </View>

            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={17} color={INK} />
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 17,
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 7,
    paddingBottom: 130,
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: '#F2F7FF',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  exchangeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
    paddingRight: 10,
  },
  nickname: {
    fontSize: 16,
    fontWeight: '900',
    color: INK,
    textAlign: 'left',
  },
  profileMeta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: INK,
    textAlign: 'left',
  },
  profileManage: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationCard: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  verificationCardDone: {
    backgroundColor: '#123F9F',
  },
  verificationCardPending: {
    backgroundColor: '#123F9F',
  },
  verificationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verificationIconBoxDone: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  verificationIconBoxPending: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  verificationTextBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  verificationDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    color: 'rgba(255,255,255,0.78)',
  },
  verificationPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  verificationPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: BLUE,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e7f1ff',
    gap: 8,
  },
  quickItem: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    gap: 4,
  },
  quickTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: MUTED,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: CARD,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  menuRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDF2',
  },
  menuIconBox: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuTextBox: {
    flex: 1,
    paddingRight: 10,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
});
