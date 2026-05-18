import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState('서현');

  useFocusEffect(
    useCallback(() => {
      const loadNickname = async () => {
        const savedNickname = await AsyncStorage.getItem('nickname');

        if (savedNickname) {
          setDisplayName(savedNickname);
        }
      };

      loadNickname();
    }, []),
  );
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/profile.png')}
          style={styles.profile}
        />

        <View>
          <Text style={styles.title}>안녕, {displayName} !</Text>
          <Text style={styles.sub}> 새로운 모험을 떠날 준비 됐나요?</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Image
              source={require('../../../assets/images/search.png')}
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

      <TouchableOpacity style={styles.banner}>
        <Image
          source={require('../../../assets/images/background_school.png')}
          style={styles.bannerImage}
        />

        <View style={styles.bannerTextBox}>
          <Text style={styles.bannerTitle}>D-67 to Munich</Text>
          <Text style={styles.bannerSub}>독일 뮌헨 대학교 파견까지</Text>
        </View>

        <View style={styles.profileBtn}>
          <Text style={styles.profileText}>프로필 설정</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.cardRow}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(tabs)/home/explore')}
        >
          <Image
            source={require('../../../assets/images/info_serch.png')}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>교환학생 정보 탐색하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/market')}
        >
          <Image
            source={require('../../../assets/images/trade.png')}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>교환학생 전용 거래</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.chatBtn}>
        <Text style={styles.chatText}>오픈 채팅방 바로가기</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickItem}>
          <Image
            source={require('../../../assets/images/recru_schedule.png')}
            style={styles.quickIcon}
          />
          <Text style={styles.quickText}>대학별{'\n'}모집 일정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem}>
          <Image
            source={require('../../../assets/images/scholarship_info.png')}
            style={styles.quickIcon}
          />
          <Text style={styles.quickText}>장학금{'\n'}정보</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem}>
          <Image
            source={require('../../../assets/images/travel_info.png')}
            style={styles.quickIcon}
          />
          <Text style={styles.quickText}>교환학생{'\n'}여행 정보</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            파견 준비생을 위한 맞춤 콘텐츠
          </Text>
          <TouchableOpacity>
            <Text style={styles.more}>더보기 ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.article}>
              <View style={styles.articleImage} />
              <Text style={styles.articleTitle}>
                [독일 교환학생] 비자신청부터 수령까지
              </Text>
              <Text style={styles.articleMeta}>2026.02.25 / 작성자: Lumy</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 120, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 28 },
  profileCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#000',
    marginRight: 14,
  },
  title: {
    fontSize: 18,
    right: -6,
    fontWeight: '800',
    color: '#111111',
  },
  bannerTextBox: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 48,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  quickIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  cardImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },
  hello: { fontSize: 18, fontWeight: '700' },
  sub: { marginTop: 4, fontSize: 14, color: '#666' },
  headerIcons: { marginLeft: 'auto', flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },

  banner: {
    marginTop: 48,
    height: 185,
    borderRadius: 8,
    overflow: 'hidden', // 이거 반드시 추가
    justifyContent: 'center',
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bannerSub: { color: '#fff', marginTop: 8, fontSize: 12, fontWeight: '600' },
  profileBtn: {
    position: 'absolute',
    right: 40,
    top: 72,
    backgroundColor: '#0648d8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  profileText: { color: '#fff', fontWeight: '700' },

  cardRow: { flexDirection: 'row', gap: 16, marginTop: 40 },
  card: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 14,
  },
  emoji: { fontSize: 48 },
  cardText: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  chatBtn: {
    marginTop: 18,
    height: 70,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  chatText: { fontSize: 16 },
  arrow: { marginLeft: 'auto', fontSize: 30, color: '#666' },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
  },
  quickItem: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickEmoji: { fontSize: 34 },
  quickText: { fontSize: 14, fontWeight: '600', lineHeight: 22 },

  section: { marginTop: 44 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 22, fontWeight: '800', flex: 1 },
  more: { fontSize: 14, color: '#666' },

  article: { width: 220, marginRight: 18 },
  articleImage: { width: '100%', height: 220, backgroundColor: '#d8d8d8' },
  articleTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  articleMeta: { marginTop: 8, fontSize: 12, color: '#888' },
  profile: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
});
