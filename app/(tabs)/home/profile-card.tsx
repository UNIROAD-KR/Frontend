import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
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

export default function ProfileCardScreen() {
  const [profile, setProfile] = useState({
    nickname: '서현',
    country: '독일',
    region: '베를린',
    university: '베를린 자유대학교',
    homeUniversity: '서울대학교',
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>내 프로필</Text>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={21} color={NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <Image
              source={require('../../../assets/images/profile.png')}
              style={styles.avatar}
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            <Text style={styles.profileMeta}>
              {profile.country} {profile.region} 파견 준비
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={BLUE} />
                <Text style={styles.verifiedText}>교환학생 인증 완료</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>인증 상태</Text>
            <Text style={styles.statusTitle}>파견교 승인 문서 확인됨</Text>
            <Text style={styles.statusDesc}>
              입학허가서 또는 파견 승인서를 통해 교환학생 프로필이 검증되었어요.
            </Text>
          </View>

          <View style={styles.statusIcon}>
            <Ionicons name="checkmark" size={26} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>파견 정보</Text>

          <View style={styles.infoCard}>
            <InfoRow label="소속 대학" value={profile.homeUniversity} icon="school-outline" />
            <InfoRow label="파견 국가" value={profile.country} icon="flag-outline" />
            <InfoRow label="파견 지역" value={profile.region} icon="location-outline" />
            <InfoRow label="파견 대학" value={profile.university} icon="business-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>준비 현황</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressTitle}>출국 준비도</Text>
              <Text style={styles.progressValue}>72%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <View style={styles.todoList}>
              <TodoRow done title="여권 유효기간 확인" />
              <TodoRow done title="입학허가서 저장" />
              <TodoRow title="비자 인터뷰 예약" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필 공개 정보</Text>

          <View style={styles.publicCard}>
            <View style={styles.publicItem}>
              <Ionicons name="people-outline" size={20} color={NAVY} />
              <View style={styles.publicTextBox}>
                <Text style={styles.publicTitle}>커뮤니티 신뢰 배지</Text>
                <Text style={styles.publicDesc}>
                  게시글과 동행 모집에서 인증 배지가 함께 표시됩니다.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.publicItem}>
              <Ionicons name="cart-outline" size={20} color={NAVY} />
              <View style={styles.publicTextBox}>
                <Text style={styles.publicTitle}>거래 안전 표시</Text>
                <Text style={styles.publicDesc}>
                  중고거래에서 파견 인증 사용자로 표시되어 신뢰도를 높여요.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={NAVY} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function TodoRow({ done, title }: { done?: boolean; title: string }) {
  return (
    <View style={styles.todoRow}>
      <View style={[styles.todoCheck, done && styles.todoCheckDone]}>
        {done && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text style={[styles.todoText, done && styles.todoTextDone]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
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
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
  },
  profileMeta: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '900',
    color: BLUE,
  },
  statusCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: NAVY,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#BFD0EA',
  },
  statusTitle: {
    marginTop: 7,
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statusDesc: {
    maxWidth: 245,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#DDE8FF',
  },
  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  infoRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoLabel: {
    width: 76,
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  progressCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '900',
    color: BLUE,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    width: '72%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: NAVY,
  },
  todoList: {
    gap: 10,
    marginTop: 16,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  todoCheckDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  todoText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  todoTextDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  publicCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  publicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  publicTextBox: {
    flex: 1,
  },
  publicTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  publicDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 15,
  },
});
