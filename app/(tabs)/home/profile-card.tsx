import { SessionExpiredError } from "@/src/api/client";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, type ComponentType } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';

import ArrowRightIcon from '@/assets/icon/Property 1=arrow2, Property 2=right.svg';
import AllServicesIcon from '@/assets/icon/profile/all-services.svg';
import AccountSettingsIcon from '@/assets/icon/profile/account-settings.svg';
import AppVersionIcon from '@/assets/icon/profile/app-version.svg';
import ContactIcon from '@/assets/icon/profile/contact.svg';
import FreePostsIcon from '@/assets/icon/profile/free-posts.svg';
import HeartIcon from '@/assets/icon/profile/heart.svg';
import LogoutIcon from '@/assets/icon/profile/logout.svg';
import NoticesIcon from '@/assets/icon/profile/notices.svg';
import NotificationsIcon from '@/assets/icon/profile/notifications.svg';
import PrivacyIcon from '@/assets/icon/profile/privacy.svg';
import ProfileEditButton from '@/assets/icon/profile/profile-edit-button.svg';
import TermsIcon from '@/assets/icon/profile/terms.svg';
import VerificationApprovedCardIcon from '@/assets/icon/profile/verification-approved-card.svg';
import VerificationIcon from '@/assets/icon/profile/verification.svg';
import VerificationPendingIcon from '@/assets/icon/profile/verification-pending.svg';
import WrittenPostsIcon from '@/assets/icon/profile/written-posts.svg';
import { AppBackButton } from '@/components/ui/app-back-button';
import { getMemberMe, logout } from '../../../src/api/auth';
import { getMyVerifications } from '../../../src/api/verification';
import { openKakaoContact } from '../../../src/utils/contact';

const NAVY = '#18202B';
const INK = '#141416';
const MUTED = '#64748B';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type RouteTarget = unknown;
type SvgIcon = ComponentType<SvgProps>;
type MenuIcon = SvgIcon | number;

type MenuItem = {
  title: string;
  icon: MenuIcon;
  route?: RouteTarget;
  action?: 'logout' | 'contact';
  value?: string;
};

const activityItems: MenuItem[] = [
  {
    title: '좋아요 누른 글',
    icon: HeartIcon,
    route: {
      pathname: '/home/profile-list',
      params: { type: 'liked' },
    },
  },
  {
    title: '자유게시판 작성글',
    icon: FreePostsIcon,
    route: {
      pathname: '/home/profile-list',
      params: { type: 'free' },
    },
  },
  {
    title: '내가 쓴 글',
    icon: WrittenPostsIcon,
    route: {
      pathname: '/home/profile-list',
      params: { type: 'written' },
    },
  },
];

const accountItems: MenuItem[] = [
  {
    title: '계정 설정',
    icon: AccountSettingsIcon,
    route: '/home/account-settings',
  },
  {
    title: '알림 설정',
    icon: NotificationsIcon,
    route: '/home/profile-notifications',
  },
  {
    title: '파견교 인증',
    icon: VerificationIcon,
    route: '/verification',
  },
];

const serviceItems: MenuItem[] = [
  {
    title: '전체 서비스',
    icon: AllServicesIcon,
    route: '/home/more-menu',
  },
];

const guideItems: MenuItem[] = [
  {
    title: '앱 버전',
    icon: AppVersionIcon,
    value: `v${APP_VERSION}`,
  },
  {
    title: '문의하기',
    icon: ContactIcon,
    action: 'contact',
  },
  {
    title: '공지사항',
    icon: NoticesIcon,
    route: '/home/notices',
  },
  {
    title: '서비스 이용약관',
    icon: TermsIcon,
    route: '/home/terms',
  },
];

const extraItems: MenuItem[] = [
  {
    title: '개인정보 처리방침',
    icon: PrivacyIcon,
    route: '/home/privacy-policy',
  },
  {
    title: '로그아웃',
    icon: LogoutIcon,
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
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = preview === 'true';
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [profile, setProfile] = useState({
    nickname: '닉네임',
    country: '국가 미등록',
    region: '지역 미등록',
    university: '파견교 미등록',
    homeUniversity: '소속 대학 미등록',
    status: '상태 미등록',
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
        setIsVerificationPending(false);
        const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

        if (isPreview) {
          setIsVerified(true);
          setProfile((prev) => ({
            ...prev,
            nickname: nickname || '김하니',
            country: dispatchedCountry || '독일',
            region: dispatchedRegion || '베를린',
            university: dispatchedUniversity || '베를린 자유대학교',
            homeUniversity: homeUniversity || '한국대학교',
            status: profileStatus || '출국 준비 중',
            avatarUri: profileAvatarUri || null,
          }));
          return;
        }

        let apiProfile = {
          nickname: null as string | null,
          country: null as string | null,
          region: null as string | null,
          university: null as string | null,
          homeUniversity: null as string | null,
        };

        try {
          const verificationRes = await getMyVerifications();
          const hasApprovedVerification = verificationRes.data.data.some(
            (verification) => verification.status === 'APPROVED',
          );
          const hasPendingVerification =
            !hasApprovedVerification &&
            verificationRes.data.data.some((verification) => verification.status === 'PENDING');

          setIsVerified(hasApprovedVerification);
          setIsVerificationPending(hasPendingVerification);
          await AsyncStorage.setItem('isVerified', hasApprovedVerification ? 'true' : 'false');
        } catch (error: any) {
          if (error instanceof SessionExpiredError) return;
          console.log('인증 내역 조회 실패:', error.response?.data || error.message);
        }

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
          if (error instanceof SessionExpiredError) return;
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
    }, [isPreview]),
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
      Alert.alert('로그아웃 실패', '잠시 후 다시 시도해주세요.');
      return;
    }

    console.log('[Auth] 로그아웃: 저장된 액세스·리프레시 토큰 삭제 시작');
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'nickname']);
    console.log('[Auth] 로그인 토큰 삭제 완료 → 로그인 화면 이동');
    router.replace('/login' as any);
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

    if (item.action === 'contact') {
      openKakaoContact().catch(() => {
        Alert.alert('연결 실패', '문의 링크를 열 수 없어요.');
      });
      return;
    }

    openRoute(item.route);
  };

  const isVerificationApproved = isVerified;
  const VerificationStatusIcon = isVerificationApproved
    ? VerificationApprovedCardIcon
    : VerificationPendingIcon;
  const verificationTitle = isVerificationApproved ? '교환학생 인증 완료' : '교환학생 인증 검토 중';
  const verificationDescription = isVerificationApproved
    ? '인증이 완료되어 안전한 교환학생으로 표시됨'
    : '제출하신 인증 서류를 확인하고 있어요';
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton fallbackHref="/home" style={styles.backButton} />
        <Text style={styles.headerTitle}>내 프로필</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/home/profile-edit' as any)}
          activeOpacity={0.86}
        >
          <View style={styles.profileMain}>
            <View style={styles.avatarWrap}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
              ) : null}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.profileMeta} numberOfLines={1}>
                {profile.homeUniversity} · {profile.country} {profile.region}
              </Text>
            </View>

            <ProfileEditButton width={86} height={36} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.verificationCard,
            isVerificationApproved && styles.verificationCardApproved,
          ]}
          onPress={() => router.push('/verification' as any)}
          activeOpacity={0.86}
        >
          <VerificationStatusIcon width={40} height={40} style={styles.verificationIcon} />

          <View style={styles.verificationTextBox}>
            <Text style={[
              styles.verificationTitle,
              isVerificationApproved && styles.verificationTitleApproved,
            ]}>
              {verificationTitle}
            </Text>
            <Text style={[
              styles.verificationDesc,
              isVerificationApproved && styles.verificationDescApproved,
            ]} numberOfLines={2}>
              {verificationDescription}
            </Text>
          </View>

          <ArrowRightIcon
            width={18}
            height={18}
            color={isVerificationApproved ? '#FFFFFF' : '#64748B'}
          />
        </TouchableOpacity>

        <MenuSection
          title="내 활동"
          items={activityItems}
          onPressItem={handleMenuPress}
        />
        <MenuSection
          title="계정 및 설정"
          items={accountItems}
          onPressItem={handleMenuPress}
          separated
        />
        <MenuSection
          title="이용 안내"
          items={guideItems}
          onPressItem={handleMenuPress}
          separated
        />
        <MenuSection
          title="서비스"
          items={serviceItems}
          onPressItem={handleMenuPress}
          separated
        />
        <MenuSection
          title="기타"
          items={extraItems}
          onPressItem={handleMenuPress}
          separated
        />
      </ScrollView>
    </View>
  );
}

function MenuSection({
  title,
  items,
  onPressItem,
  separated = false,
}: {
  title: string;
  items: MenuItem[];
  onPressItem: (item: MenuItem) => void;
  separated?: boolean;
}) {
  return (
    <View style={[styles.section, separated && styles.sectionSeparated]}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item) => {
        const interactive = !!item.route || !!item.action;
        const MenuIcon = item.icon;

        return (
          <TouchableOpacity
            key={item.title}
            style={styles.menuRow}
            onPress={() => onPressItem(item)}
            activeOpacity={interactive ? 0.82 : 1}
            disabled={!interactive}
          >
            <View style={styles.menuIconBox}>
              {typeof MenuIcon === 'number' ? (
                <Image source={MenuIcon} style={styles.menuRasterIcon} resizeMode="contain" />
              ) : (
                <MenuIcon width={21} height={21} />
              )}
            </View>

            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>

            {item.value ? (
              <Text style={styles.menuValue}>{item.value}</Text>
            ) : interactive ? (
              <ArrowRightIcon width={18} height={18} color={INK} />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  header: {
    height: 118,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 43,
    paddingBottom: 12,
    backgroundColor: '#F6F8FA',
    position: 'relative',
  },
  backButton: {
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 57,
    height: 34,
    lineHeight: 34,
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 120,
  },
  profileCard: {
    marginHorizontal: 16,
    minHeight: 60,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1E4E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
    paddingRight: 8,
  },
  nickname: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    color: INK,
    textAlign: 'left',
  },
  profileMeta: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'left',
  },
  verificationCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE4EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  verificationCardApproved: {
    borderColor: '#18202B',
    backgroundColor: '#18202B',
  },
  verificationIcon: {
    marginRight: 12,
  },
  verificationTextBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18202B',
    marginBottom: 2,
  },
  verificationTitleApproved: {
    color: '#FFFFFF',
  },
  verificationDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    color: '#64748B',
  },
  verificationDescApproved: {
    color: '#ABB4C0',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionSeparated: {
    borderTopWidth: 8,
    borderTopColor: '#F0F2F6',
    marginTop: 20,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    paddingBottom: 8,
  },
  menuRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuRasterIcon: {
    width: 22,
    height: 22,
  },
  menuTextBox: {
    flex: 1,
    paddingRight: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#27303C',
  },
  menuValue: {
    fontSize: 13,
    fontWeight: '800',
    color: MUTED,
  },
});
