import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

export default function SchoolDetailScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Image
              source={require('../../../assets/images/back.png')}
              style={styles.icon}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>상세 정보</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Image
                source={require('../../../assets/images/alarm.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Image
                source={require('../../../assets/images/menu.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.schoolTitle}>{name || '학교명'}</Text>

        <View style={styles.photoBox}>
          <Text style={styles.photoText}>사진</Text>
        </View>

        <Text style={styles.sectionTitle}>캠퍼스 상세 항목</Text>

        {['기숙사 시설', '학교 시설', '비자 신청'].map((item) => (
          <TouchableOpacity key={item} style={styles.infoRow}>
            <View style={styles.checkBox}>
              <Text style={styles.check}>✓</Text>
            </View>
            <Text style={styles.infoText}>{item}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.lifeTitle}>라이프 항목</Text>

        <View style={styles.lifeRow}>
          <View style={styles.lifeCard}>
            <Text style={styles.lifeCardTitle}>체감 물가</Text>

            <View style={styles.barBg}>
              <View style={styles.barFill} />
            </View>

            <View style={styles.barLabels}>
              <Text style={styles.barLabel}>낮음</Text>
              <Text style={styles.barLabel}>보통</Text>
              <Text style={styles.barLabel}>높음</Text>
            </View>
          </View>

          <View style={styles.lifeCard}>
            <Text style={styles.lifeCardTitle}>치안 점수</Text>

            <View style={styles.scoreWrap}>
              <View style={styles.circle}>
                <Text style={styles.scoreText}>9/10</Text>
              </View>

              <View>
                <Text style={styles.safeLabel}>체감 정도</Text>
                <Text style={styles.safeText}>매우 안전</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 130 },

  header: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 22, height: 22, resizeMode: 'contain' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '800',
  },
  headerRight: { flexDirection: 'row', gap: 8 },

  schoolTitle: {
    marginTop: 28,
    fontSize: 18,
    fontWeight: '800',
  },

  photoBox: {
    marginTop: 34,
    width: '100%',
    aspectRatio: 1.65,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { fontSize: 18, fontWeight: '700' },

  sectionTitle: {
    marginTop: 38,
    marginBottom: 18,
    fontSize: 20,
    fontWeight: '800',
  },
  infoRow: {
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#16B514',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  check: { color: '#fff', fontSize: 18, fontWeight: '900' },
  infoText: { flex: 1, fontSize: 16, fontWeight: '500' },
  arrow: { fontSize: 36, color: '#666' },

  lifeTitle: {
    marginTop: 96,
    marginBottom: 20,
    fontSize: 20,
    fontWeight: '800',
  },
  lifeRow: { flexDirection: 'row', gap: 22 },
  lifeCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  lifeCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 24 },

  barBg: {
    height: 7,
    borderRadius: 8,
    backgroundColor: '#D7D7D7',
    overflow: 'hidden',
  },
  barFill: {
    width: '82%',
    height: '100%',
    backgroundColor: '#1526F3',
    borderRadius: 8,
  },
  barLabels: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: { fontSize: 10, color: '#777' },

  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: '#18B51B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontSize: 14, fontWeight: '700' },
  safeLabel: { fontSize: 11, color: '#777' },
  safeText: { marginTop: 4, fontSize: 14, fontWeight: '800' },
});
