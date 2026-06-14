import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { logout } from '../../../src/api/auth';

const NAVY = '#0F2042';
const BLUE = '#1747AD';
const SOFT_BLUE = '#EEF5FF';
const CARD = '#F8FAFC';
const LINE = '#E7EDF5';
const MUTED = '#697789';

type RouteTarget = unknown;

type QuickAction = {
  title: string;
  route: RouteTarget;
};

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: RouteTarget;
  action?: 'logout';
};

const quickActions: QuickAction[] = [
  {
    title: '좋아요한 글',
    route: {
      pathname: '/(tabs)/home/profile-list',
      params: { type: 'saved' },
    },
  },
  {
    title: '좋아요한 파견교',
    route: '/(tabs)/home/my-school-info',
  },
  {
    title: '여행 혜택',
    route: '/(tabs)/home/guide',
  },
];

const activityItems: MenuItem[] = [
  {
    title: '커뮤니티 작성글',
    icon: 'chatbubbles-outline',
    route: {
      pathname: '/(tabs)/home/profile-list',
      params: { type: 'free' },
    },
  },
  {
    title: '동행 모집글',
    icon: 'people-outline',
    route: {
      pathname: '/(tabs)/home/profile-list',
      params: { type: 'companion' },
    },
  },
  {
    title: '중고거래 작성글',
    icon: 'bag-handle-outline',
    route: {
      pathname: '/(tabs)/home/profile-list',
      params: { type: 'market' },
    },
  },
];

const accountItems: MenuItem[] = [
  {
    title: '파견교 인증',
    icon: 'shield-checkmark-outline',
    route: '/verification',
  },
  {
    title: '알림 설정',
    icon: 'notifications-outline',
    route: '/(tabs)/home/profile-notifications',
  },
  {
    title: '비밀번호 수정',
    icon: 'person-outline',
    route: '/(tabs)/home/profile-password',
  },
  {
    title: '로그아웃하기',
    icon: 'log-out-outline',
    action: 'logout',
  },
];

const statusDisplayMap: Record<string, string> = {
  preparing: '지원 준비 중',
  accepted: '출국 준비 중',
  dispatched: '파견 중',
  returned: '귀국',
};

export default function ProfileCardScreen() {
  const [profile, setProfile] = useState({
    nickname: '확인요구',
    country: '프랑스',
    region: '파리',
    university: '파리 시테 대학교',
    homeUniversity: '서울과기대',
    status: '파견 중',
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
          status:
            profileStatus ||
            (exchangeStatus ? statusDisplayMap[exchangeStatus] : null) ||
            prev.status,
          avatarUri: profileAvatarUri || prev.avatarUri,
        }));
      };

      loadProfile();
    }, []),
  );

  const openRoute = (route?: RouteTarget) => {
    if (!route) return;
    router.push(route as any);
  };

  const performLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      console.log('로그아웃 API 실패:', error.response?.data || error.message);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'nickname']);
      router.replace('/login' as any);
    }
  };

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', style: 'destructive', onPress: performLogout },
    ]);
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.action === 'logout') {
      confirmLogout();
      return;
    }

    openRoute(item.route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>내 프로필</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarBox}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={36} color="#111111" />
              )}
            </View>

            <View style={styles.profileTextBox}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.profileMeta} numberOfLines={1}>
                {profile.homeUniversity} · {profile.country} {profile.region}
              </Text>
            </View>

            <Pressable
              style={styles.editButton}
              onPress={() => openRoute('/(tabs)/home/profile-edit')}
              hitSlop={8}
            >
              <Ionicons name="pencil" size={20} color={NAVY} />
            </Pressable>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.quickRow}>
            {quickActions.map((item) => (
              <Pressable
                key={item.title}
                style={styles.quickButton}
                onPress={() => openRoute(item.route)}
              >
                <Text style={styles.quickText}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={styles.verifyBanner}
          onPress={() => openRoute('/verification')}
        >
          <View style={styles.verifyIconBox}>
            <Ionicons name="shield-outline" size={25} color="#FFFFFF" />
          </View>

          <View style={styles.verifyTextBox}>
            <Text style={styles.verifyTitle}>교환학생 인증이 필요해요</Text>
            <Text style={styles.verifyDesc}>
              인증하고 중고거래·동행 모집 이용하기
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={25} color="#BBD1FF" />
        </Pressable>

        <MenuSection
          title="내 활동"
          items={activityItems}
          onPressItem={handleMenuPress}
        />
        <MenuSection
          title="계정 / 설정"
          items={accountItems}
          onPressItem={handleMenuPress}
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
  onPressItem: (item: MenuItem) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item, index) => (
        <Pressable
          key={item.title}
          style={[styles.menuRow, index < items.length - 1 && styles.menuDivider]}
          onPress={() => onPressItem(item)}
        >
          <View style={styles.menuIconCircle}>
            <Ionicons name={item.icon} size={22} color={NAVY} />
          </View>

          <Text style={styles.menuTitle}>{item.title}</Text>

          <Ionicons name="chevron-forward" size={24} color="#111111" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 104,
    paddingTop: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F7FB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: NAVY,
    letterSpacing: 0,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 130,
  },
  profileCard: {
    borderRadius: 20,
    backgroundColor: SOFT_BLUE,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 18,
  },
  profileTop: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  profileTextBox: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
  },
  profileMeta: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#111111',
  },
  editButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#DDE8F7',
    marginTop: 18,
    marginBottom: 16,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    height: 48,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
  },
  verifyBanner: {
    marginTop: 18,
    minHeight: 62,
    borderRadius: 11,
    backgroundColor: BLUE,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  verifyTextBox: {
    flex: 1,
    minWidth: 0,
  },
  verifyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verifyDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#CFE0FF',
  },
  sectionCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: CARD,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 11,
    fontSize: 16,
    fontWeight: '900',
    color: MUTED,
  },
  menuRow: {
    minHeight: 62,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: NAVY,
  },
});
