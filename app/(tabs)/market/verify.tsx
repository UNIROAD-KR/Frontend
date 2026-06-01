import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AppBackButton } from '@/components/ui/app-back-button';

export default function MarketVerifyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppBackButton style={styles.iconBtn} />

          <Text style={styles.headerTitle}>교환학생 인증</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>교환학생 판매자 인증</Text>
          <Text style={styles.desc}>
            허위 매물 방지를 위해 공식 서류를 제출해주세요.{'\n'}
            제출된 정보는 인증 목적으로만 사용됩니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>인증 방식 선택</Text>

        <TouchableOpacity style={styles.methodCard}>
          <Text style={styles.methodEmoji}>📷</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>서류 촬영하기</Text>
            <Text style={styles.methodSub}>카메라로 직접 촬영하기</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.methodCard}>
          <Text style={styles.methodEmoji}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>PDF 파일 첨부</Text>
            <Text style={styles.methodSub}>파일함에서 불러오기</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>ⓘ 인증 가능 서류:</Text>
          <Text style={styles.noticeText}>
            • 파견 대학 입학허가서 (Letter of Admission)
          </Text>
          <Text style={styles.noticeText}>• 재학 대학교 파견 승인서</Text>
          <Text style={styles.noticeText}>• 교환학생 비자 사본</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>제출하기 ›</Text>
        </TouchableOpacity>

        <Text style={styles.bottomNotice}>
          서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  content: {
    paddingHorizontal: 32,
    paddingTop: 34,
    paddingBottom: 180,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 40,
  },

  intro: {
    marginTop: 92,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
  },

  desc: {
    marginTop: 14,
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },

  sectionTitle: {
    marginTop: 54,
    marginBottom: 22,
    fontSize: 21,
    fontWeight: '900',
  },

  methodCard: {
    height: 116,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  methodEmoji: {
    fontSize: 42,
    marginRight: 28,
  },

  methodTitle: {
    fontSize: 19,
    fontWeight: '900',
  },

  methodSub: {
    marginTop: 8,
    fontSize: 15,
    color: '#333',
  },

  arrow: {
    fontSize: 44,
    color: '#D0D0D0',
  },

  noticeBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    padding: 22,
  },

  noticeTitle: {
    fontSize: 16,
    marginBottom: 12,
  },

  noticeText: {
    fontSize: 14,
    lineHeight: 26,
  },

  bottomArea: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 28,
  },

  submitBtn: {
    height: 64,
    borderRadius: 8,
    backgroundColor: '#0A20E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  submitText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },

  bottomNotice: {
    marginTop: 18,
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
  },
});
