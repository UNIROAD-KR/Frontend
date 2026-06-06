import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Stack } from 'expo-router'; // ⭐ Stack 추가

import { BackButton } from '@/components/back-button';

export default function MentoringScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Stack.Screen options={{ headerShown: false }} />
          <BackButton fallbackHref="/(tabs)/home/explore" />

          <Text style={styles.headerTitle}>멘토링</Text>

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

        <Text style={styles.title}>교환학생 선배에게 듣는 생생한 후기</Text>

        <TouchableOpacity style={styles.selectBox}>
          <Text style={styles.placeholder}>국가를 선택하세요</Text>
          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectBox}>
          <Text style={styles.placeholder}>파견 대학을 검색하세요</Text>
          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <TouchableOpacity key={index} style={styles.mentorCard}>
              <Text style={styles.mentorName}>
                {index % 2 === 0 ? '정O현' : '박O수'}
              </Text>
              <Text style={styles.mentorTag}>#25-2학기 #독일</Text>
              <Text style={styles.mentorDesc}>
                비자부터 생활 팁까지 한 곳에서
              </Text>

              <View style={styles.applyRow}>
                <View style={styles.thumb} />
                <TouchableOpacity style={styles.applyBtn}>
                  <Text style={styles.applyText}>멘토링 신청하기 ›</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.supportBanner}>
          <View>
            <Text style={styles.badge}>멘토 지원하기</Text>
            <Text style={styles.supportTitle}>나도 멘토가 될 수 있어요</Text>
            <Text style={styles.supportSub}>
              교환학생 경험 나누고 수익 창출!
            </Text>
          </View>
          <View style={styles.supportImage} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingHorizontal: 32, paddingTop: 36, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 22, height: 22, resizeMode: 'contain' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  headerRight: { flexDirection: 'row', gap: 10 },

  title: {
    marginTop: 54,
    marginBottom: 28,
    fontSize: 22,
    fontWeight: '800',
  },

  selectBox: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: { flex: 1, fontSize: 15, color: '#777' },
  chevron: { fontSize: 28, color: '#666' },

  grid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  mentorCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16, // ⭐ 줄임 (기존 24 → 16)
    minHeight: 180, // ⭐ 높이 확보
  },
  mentorName: { fontSize: 15, fontWeight: '700' },
  mentorTag: { marginTop: 6, fontSize: 12 },
  mentorDesc: { marginTop: 4, fontSize: 12 },
  applyRow: {
    marginTop: 12, // ⭐ 간격 줄이기
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#E8F2FF' },
  applyBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  applyText: { color: '#0B4DDB', fontWeight: '700', fontSize: 12 },

  supportBanner: {
    marginTop: 28,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F0F6FF',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#9DAEC5',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 13,
  },
  supportTitle: { marginTop: 12, fontSize: 18, fontWeight: '700' },
  supportSub: { marginTop: 8, fontSize: 13 },
  supportImage: {
    width: 126,
    height: 88,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});
