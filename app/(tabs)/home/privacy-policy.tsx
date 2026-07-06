import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

const NAVY = '#0F2042';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

const policies = [
  {
    title: '수집하는 정보',
    body: '서비스 이용을 위해 아이디, 닉네임, 소속대학, 파견 국가와 지역, 파견교, 파견학기 등 회원 정보가 수집될 수 있습니다.',
  },
  {
    title: '이용 목적',
    body: '수집된 정보는 회원 식별, 온보딩 정보 저장, 프로필 표시, 교환학생 맞춤 기능 제공, 고객 문의 응대에 사용됩니다.',
  },
  {
    title: '보관과 삭제',
    body: '회원 정보는 서비스 제공에 필요한 기간 동안 보관되며, 탈퇴 또는 법령상 보관 기간 종료 시 삭제됩니다.',
  },
  {
    title: '회원의 권리',
    body: '회원은 본인의 개인정보 조회, 수정, 삭제를 요청할 수 있으며 서비스 내 프로필 수정과 문의 기능을 통해 요청할 수 있습니다.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {policies.map((item) => (
          <View key={item.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.sectionBody}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 130,
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: MUTED,
  },
});
