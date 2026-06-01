import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 🔝 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(tabs)/home');
            }
          }}
        >
          <Image
            source={require('../../../assets/images/back.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <Text style={styles.title}>교환학생 정보 탐색</Text>

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

      {/* 🔍 검색창 */}
      <View style={styles.searchBox}>
        <Image
          source={require('../../../assets/images/info_search.png')}
          style={styles.searchIconImg}
        />
        <TextInput
          placeholder="교환학생 인기 파견지를 검색해보세요"
          style={styles.searchInput}
        />
      </View>

      {/* ⭐ 추천 카드 */}
      <View style={styles.recommendCard}>
        <View>
          <Text style={styles.recommendTitle}>서현 님에게</Text>
          <Text style={styles.recommendSub}>
            딱 맞는 파견 대학을 찾아보세요
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryText}>추천 학교 보기 ›</Text>
        </TouchableOpacity>
      </View>

      {/* 📌 섹션 */}
      <Text style={styles.sectionTitle}>정보 탐색하기</Text>

      {/* 카드 2개 */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(tabs)/home/school-info')}
        >
          <View style={styles.cardImg} />
          <Text style={styles.cardTitle}>파견교 정보</Text>
          <Text style={styles.cardDesc}>주요 대학 리스트와 상세 정보</Text>
          <Text style={styles.link}>바로 가기 ›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(tabs)/home/guide')}
        >
          <View style={styles.cardImg} />
          <Text style={styles.cardTitle}>교환학생 가이드</Text>
          <Text style={styles.cardDesc}>비자부터 생활 팁까지 한 곳에서</Text>
          <Text style={styles.link}>바로 가기 ›</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 카드 */}
      <TouchableOpacity
        style={styles.bigCard}
        onPress={() => router.push('/(tabs)/home/mentoring')}
      >
        <View style={styles.cardImg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>교환학생을 처음 준비하시나요?</Text>
          <Text style={styles.cardDesc}>선배들과 1:1로 직접 소통하기</Text>
        </View>

        <Text style={styles.link}>멘토링 신청하기 ›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  content: { padding: 20, paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  back: { fontSize: 22 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  searchIconImg: {
    width: 18,
    height: 18,
    marginRight: 8,
    resizeMode: 'contain',
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },

  searchBox: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1 },

  recommendCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendTitle: { fontSize: 16, fontWeight: '700' },
  recommendSub: { marginTop: 4, color: '#666' },

  primaryBtn: {
    backgroundColor: '#1E4ED8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryText: { color: '#fff', fontWeight: '600' },

  sectionTitle: {
    marginTop: 28,
    fontSize: 18,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  cardImg: {
    width: 50,
    height: 50,
    backgroundColor: '#DDE3EA',
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 12, fontWeight: '700' },
  cardDesc: { fontSize: 11, color: '#666', marginTop: 4 },
  link: { marginTop: 10, color: '#1E4ED8', fontSize: 12 },

  bigCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
