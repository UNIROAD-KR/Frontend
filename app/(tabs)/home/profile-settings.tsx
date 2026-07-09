import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { getMemberMe, logout } from '../../../src/api/auth';
import { openKakaoContact } from '../../../src/utils/contact';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type SettingItem = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: unknown;
  action?: 'logout' | 'contact';
  value?: string;
  danger?: boolean;
};

const accountItems: SettingItem[] = [
  {
    title: '계정 설정',
    description: '아이디 확인 및 비밀번호 변경',
    icon: 'settings-outline',
    route: '/home/account-settings',
  },
  {
    title: '알림 설정',
    description: '채팅, 거래, 출국 준비 알림 관리',
    icon: 'notifications-outline',
    route: '/home/profile-notifications',
  },
  {
    title: '학교 인증',
    description: '교환학생 인증 상태 확인',
    icon: 'shield-checkmark-outline',
    route: '/verification',
  },
];

const serviceItems: SettingItem[] = [
  {
    title: '전체 서비스',
    description: '유니로드의 모든 기능 보기',
    icon: 'apps-outline',
    route: '/home/more-menu',
  },
];

const guideItems: SettingItem[] = [
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

const extraItems: SettingItem[] = [
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
];

export default function ProfileSettingsScreen() {
  const [nickname, setNickname] = useState('서현');
  const [email, setEmail] = useState('로그인 계정');
  const [school, setSchool] = useState('파견교 정보 미등록');

  useFocusEffect(
    useCallback(() => {
      const loadMember = async () => {
        const [savedNickname, savedSchool] = await Promise.all([
          AsyncStorage.getItem('nickname'),
          AsyncStorage.getItem('dispatchedUniversity'),
        ]);

        try {
          const response = await getMemberMe();
          const member = response.data.data;
          setNickname(member.nickname || member.name || savedNickname || '서현');
          setEmail(member.email || member.username || '로그인 계정');
          setSchool(
            member.dispatchedUniversity ||
              savedSchool ||
              member.domesticUniversity ||
              '파견교 정보 미등록',
          );
        } catch (error: any) {
          console.log('설정 회원 정보 조회 실패:', error.response?.data || error.message);
          setNickname(savedNickname || '서현');
          setSchool(savedSchool || '파견교 정보 미등록');
        }
      };

      loadMember();
    }, []),
  );

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

  const handleItemPress = (item: SettingItem) => {
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

    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={28} color={NAVY} />
          </View>
          <View style={styles.profileTextBox}>
            <Text style={styles.nickname}>{nickname}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
            <View style={styles.schoolPill}>
              <Ionicons name="school-outline" size={13} color={BLUE} />
              <Text style={styles.schoolText} numberOfLines={1}>
                {school}
              </Text>
            </View>
          </View>
        </View>

        <SettingSection
          title="계정"
          items={accountItems}
          onPressItem={handleItemPress}
        />
        <SettingSection
          title="서비스"
          items={serviceItems}
          onPressItem={handleItemPress}
        />
        <SettingSection
          title="이용 안내"
          items={guideItems}
          onPressItem={handleItemPress}
        />
        <SettingSection
          title="기타"
          items={extraItems}
          onPressItem={handleItemPress}
        />

        <Text style={styles.versionText}>UNIROAD 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingSection({
  title,
  items,
  onPressItem,
}: {
  title: string;
  items: SettingItem[];
  onPressItem: (item: SettingItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionCard}>
        {items.map((item, index) => {
          const interactive = !!item.route || !!item.action;

          return (
            <Pressable
              key={item.title}
              style={[styles.row, index < items.length - 1 && styles.divider]}
              onPress={() => onPressItem(item)}
              disabled={!interactive}
            >
              <View style={[styles.rowIconBox, item.danger && styles.rowIconDanger]}>
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={item.danger ? '#E5484D' : NAVY}
                />
              </View>

              <View style={styles.rowTextBox}>
                <Text style={[styles.rowTitle, item.danger && styles.dangerText]}>
                  {item.title}
                </Text>
                <Text style={styles.rowDesc} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>

              {item.value ? (
                <Text style={styles.rowValue}>{item.value}</Text>
              ) : interactive ? (
                <Ionicons name="chevron-forward" size={19} color="#A4ADBA" />
              ) : null}
            </Pressable>
          );
        })}
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
  headerSpacer: {
    width: 38,
    height: 38,
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
    borderRadius: 20,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileTextBox: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    fontSize: 19,
    fontWeight: '900',
    color: INK,
  },
  email: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
  },
  schoolPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  schoolText: {
    fontSize: 11,
    fontWeight: '900',
    color: BLUE,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
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
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  rowIconBox: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconDanger: {
    backgroundColor: '#FFF1F1',
  },
  rowTextBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  dangerText: {
    color: '#E5484D',
  },
  rowDesc: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '900',
    color: MUTED,
  },
  versionText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#A4ADBA',
  },
});
