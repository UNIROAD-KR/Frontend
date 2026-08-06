import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
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

import { AppBackButton } from '@/components/ui/app-back-button';
import { deleteMyAccount, getMemberMe, logout } from '../../../src/api/auth';
import { getMyVerifications } from '../../../src/api/verification';
import { openKakaoContact } from '../../../src/utils/contact';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const SOFT = '#F6F8FC';
const CARD = '#FAFBFC';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type RouteTarget = unknown;

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  route?: RouteTarget;
  action?: 'logout' | 'contact' | 'withdraw';
  value?: string;
  danger?: boolean;
};

const activityItems: MenuItem[] = [
  {
    title: '스크랩/저장한 글',
    description: '나중에 다시 볼 글을 카테고리별로 확인',
    icon: 'bookmark-outline',
    route: {
      pathname: '/home/profile-list',
      params: { type: 'saved' },
    },
  },
  {
    title: '내가 쓴 글',
    description: '커뮤니티와 중고마켓 작성글을 한 번에 확인',
    icon: 'create-outline',
    route: {
      pathname: '/home/profile-list',
      params: { type: 'written' },
    },
  },
];

const accountItems: MenuItem[] = [
  {
    title: '계정 설정',
    description: '아이디 확인 및 비밀번호 변경',
    icon: 'settings-outline',
    route: '/home/account-settings',
  },
  {
    title: '파견교 인증',
    description: '파견교 인증 상태 확인',
    icon: 'shield-checkmark-outline',
    route: '/verification',
  },
  {
    title: '알림 설정',
    icon: 'notifications-outline',
    route: '/home/profile-notifications',
  },
  {
    title: '프로필 수정',
    description: '이름, 학교, 파견 정보를 수정',
    icon: 'person-outline',
    route: '/home/profile-edit',
  },
];

const serviceItems: MenuItem[] = [
  {
    title: '전체 서비스',
    description: '유니로드의 모든 기능 보기',
    icon: 'apps-outline',
    route: '/home/more-menu',
  },
];

const guideItems: MenuItem[] = [
  {
    title: '앱 버전',
    description: '현재 앱 버전',
    icon: 'phone-portrait-outline',
    value: `v${APP_VERSION}`,
  },
  {
    title: '문의하기',
    description: '오픈채팅방으로 이동',
    icon: 'chatbubble-ellipses-outline',
    action: 'contact',
  },
  {
    title: '공지사항',
    description: '서비스 업데이트와 운영 안내',
    icon: 'megaphone-outline',
    route: '/home/notices',
  },
  {
    title: '서비스 이용약관',
    description: '유니로드 이용 약관 확인',
    icon: 'document-text-outline',
    route: '/home/terms',
  },
];

const extraItems: MenuItem[] = [
  {
    title: '개인정보 처리방침',
    description: '개인정보 수집 및 이용 안내',
    icon: 'shield-outline',
    route: '/home/privacy-policy',
  },
  {
    title: '로그아웃',
    description: '현재 계정에서 나가기',
    icon: 'log-out-outline',
    action: 'logout',
    danger: true,
  },
  {
    title: '회원탈퇴하기',
    description: '계정과 이용 기록 삭제',
    icon: 'person-remove-outline',
    action: 'withdraw',
    danger: true,
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
    void logout().catch((error: any) => {
      console.log('로그아웃 API 실패:', error.response?.data || error.message);
    });

    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'nickname']);
    router.replace('/login' as any);
  };

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', style: 'destructive', onPress: performLogout },
    ]);
  };

  const performWithdraw = async () => {
    try {
      await deleteMyAccount();
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'nickname']);
      Alert.alert('회원탈퇴 완료', '계정이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.replace('/login' as any) },
      ]);
    } catch (error: any) {
      console.log('회원탈퇴 실패:', error.response?.data || error.message);
      Alert.alert(
        '회원탈퇴 실패',
        error.response?.data?.message ?? '잠시 후 다시 시도해주세요.',
      );
    }
  };

  const confirmWithdraw = () => {
    Alert.alert(
      '회원탈퇴하기',
      '탈퇴하면 계정과 연관 데이터가 삭제돼요. 정말 탈퇴하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴하기', style: 'destructive', onPress: performWithdraw },
      ],
    );
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.action === 'logout') {
      confirmLogout();
      return;
    }

    if (item.action === 'withdraw') {
      confirmWithdraw();
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

  const verificationIconName: keyof typeof Ionicons.glyphMap = isVerified
    ? 'shield-checkmark'
    : isVerificationPending
      ? 'time-outline'
      : 'shield-outline';
  const verificationTitle = isVerified
    ? '교환학생 인증 완료'
    : isVerificationPending
      ? '교환학생 인증 검토중'
      : '교환학생 인증이 필요해요';
  const verificationDescription = isVerified
    ? '파견교 인증이 완료되어 안전한 교환학생 멤버로 표시됩니다.'
    : isVerificationPending
      ? '제출한 인증 서류를 확인하고 있어요.'
      : '인증하고 중고거래·동행 모집 이용하기';
  const verificationPillLabel = isVerified ? '완료' : '검토중';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.backButton} />
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
            onPress={() => router.push('/home/profile-edit' as any)}
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
              <Text style={styles.profileManageText}>프로필 편집</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.verificationCard,
            isVerified ? styles.verificationCardDone : styles.verificationCardPending,
          ]}
          onPress={() => router.push('/verification' as any)}
          activeOpacity={0.86}
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
              name={verificationIconName}
              size={20}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.verificationTextBox}>
            <Text style={styles.verificationTitle}>
              {verificationTitle}
            </Text>
            <Text style={styles.verificationDesc} numberOfLines={2}>
              {verificationDescription}
            </Text>
          </View>

          {isVerified || isVerificationPending ? (
            <View style={styles.verificationPill}>
              <Text style={styles.verificationPillText}>{verificationPillLabel}</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.78)" />
          )}
        </TouchableOpacity>

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
        <MenuSection
          title="서비스"
          items={serviceItems}
          onPressItem={handleMenuPress}
        />
        <MenuSection
          title="이용 안내"
          items={guideItems}
          onPressItem={handleMenuPress}
        />
        <MenuSection
          title="기타"
          items={extraItems}
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
    <View style={styles.section}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {items.map((item, index) => {
          const interactive = !!item.route || !!item.action;

          return (
            <TouchableOpacity
              key={item.title}
              style={[styles.menuRow, index < items.length - 1 && styles.menuDivider]}
              onPress={() => onPressItem(item)}
              activeOpacity={interactive ? 0.82 : 1}
              disabled={!interactive}
            >
              <View style={[styles.menuIconBox, item.danger && styles.menuIconDanger]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.danger ? '#E5484D' : NAVY}
                />
              </View>

              <View style={styles.menuTextBox}>
                <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>
                  {item.title}
                </Text>
              </View>

              {item.value ? (
                <Text style={styles.menuValue}>{item.value}</Text>
              ) : interactive ? (
                <Ionicons name="chevron-forward" size={17} color={INK} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    height: 94,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
    position: 'relative',
  },
  backButton: {
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 104,
  },
  profileCard: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
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
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'left',
  },
  profileManage: {
    minWidth: 57,
    height: 26,
    borderWidth: 1,
    borderColor: '#DCE1E7',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  profileManageText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5A6470',
  },
  verificationCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  verificationCardDone: {
    backgroundColor: '#171F2A',
  },
  verificationCardPending: {
    backgroundColor: '#171F2A',
  },
  verificationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  verificationDesc: {
    fontSize: 11,
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
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 5,
  },
  sectionCard: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDF2',
  },
  menuIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F1F3F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  menuIconDanger: {
    backgroundColor: '#FFF1F1',
  },
  menuTextBox: {
    flex: 1,
    paddingRight: 10,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#26303C',
  },
  menuTitleDanger: {
    color: '#E5484D',
  },
  menuValue: {
    fontSize: 13,
    fontWeight: '900',
    color: MUTED,
  },
});
