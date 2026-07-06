import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

const NAVY = '#0F2042';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

const terms = [
  {
    title: '서비스 이용',
    body: 'UNIROAD는 교환학생 준비, 정보 탐색, 커뮤니티, 중고거래 기능을 제공합니다. 사용자는 서비스 이용 중 타인의 권리와 안전을 침해하지 않아야 합니다.',
  },
  {
    title: '계정 관리',
    body: '회원은 본인의 계정 정보를 안전하게 관리해야 하며, 계정 사용으로 발생하는 활동에 책임을 집니다.',
  },
  {
    title: '게시글과 거래',
    body: '게시글 작성자는 정확한 정보를 제공해야 하며, 중고거래와 티켓 양도는 사용자 간 합의와 확인을 바탕으로 진행됩니다.',
  },
  {
    title: '운영 정책',
    body: '서비스 운영상 필요한 경우 게시글 숨김, 이용 제한, 정책 변경이 이루어질 수 있으며 주요 변경 사항은 공지사항을 통해 안내됩니다.',
  },
];

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>서비스 이용약관</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {terms.map((item) => (
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
