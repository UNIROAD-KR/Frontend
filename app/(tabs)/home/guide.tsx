import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';

import { BackButton } from '@/components/back-button';

export default function GuideScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton fallbackHref="/(tabs)/home/explore" />

          <Text style={styles.headerTitle}>교환학생 가이드</Text>

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

        <View style={styles.searchBox}>
          <Image
            source={require('../../../assets/images/info_search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="교환학생 궁금한 것이 있나요?"
            placeholderTextColor="#777"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sliderWrap}>
          <View style={styles.sideCard} />
          <View style={styles.mainSlide}>
            <Text style={styles.slideText}>교환학생{'\n'}장학금 정보 모음</Text>
          </View>
          <View style={styles.sideCard} />
        </View>

        <Text style={styles.pageIndicator}>{'< 3 / 10 >'}</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEW! 새로 발행된 콘텐츠</Text>
          <TouchableOpacity>
            <Text style={styles.more}>더보기 ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.newCard}>
            <View style={styles.newImage}>
              <Text style={styles.newText}>
                교환학생 가기 전에{'\n'}꼭 읽어야 할 현실 가이드
              </Text>
            </View>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>필독</Text>
              <Text style={styles.newTitle}>교환학생 체크리스트</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newCardSmall}>
            <View style={styles.newImage}>
              <Text style={styles.newText}>
                파견 전+후{'\n'}영어 완전 정보 가
              </Text>
            </View>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>영어 공부</Text>
              <Text style={styles.newTitle}>파견 전 영어</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>콘텐츠 모아보기</Text>
          <View style={styles.sortRow}>
            <Text style={styles.sortActive}>최신순</Text>
            <Text style={styles.sort}>만족도순</Text>
          </View>
        </View>

        <View style={styles.contentGrid}>
          <TouchableOpacity style={styles.contentCard}>
            <View style={styles.contentImage}>
              <View style={styles.bookmark} />
              <Text style={styles.contentText}>
                교환학생 준비{'\n'}타임라인 확 눈에 확인
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contentCard}>
            <View style={styles.contentImage}>
              <View style={styles.bookmark} />
              <Text style={styles.contentText}>
                교환학생 놀면서도{'\n'}학점 잘 받은 방법
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },

  searchBox: {
    marginTop: 28,
    marginHorizontal: 34,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  searchIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  sliderWrap: {
    marginTop: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  sideCard: {
    width: 32,
    height: 168,
    borderRadius: 8,
    backgroundColor: '#EDF3FA',
  },
  mainSlide: {
    flex: 1,
    height: 168,
    borderRadius: 8,
    backgroundColor: '#EDF3FA',
    justifyContent: 'center',
    paddingLeft: 44,
  },
  slideText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 36,
  },
  pageIndicator: {
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
    color: '#666',
  },

  sectionHeader: {
    marginTop: 38,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
  },
  more: {
    color: '#777',
    fontSize: 15,
  },

  newCard: {
    width: 386,
    marginRight: 22,
  },
  newCardSmall: {
    width: 260,
    marginRight: 22,
  },
  newImage: {
    height: 156,
    borderRadius: 8,
    backgroundColor: '#EDF3FA',
    padding: 24,
    justifyContent: 'center',
  },
  newText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 34,
  },
  tagRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tag: {
    backgroundColor: '#777',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '700',
  },
  newTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  sortRow: {
    flexDirection: 'row',
    gap: 14,
  },
  sortActive: {
    color: '#0648D8',
    fontSize: 16,
    fontWeight: '800',
  },
  sort: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },

  contentGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  contentCard: {
    flex: 1,
  },
  contentImage: {
    aspectRatio: 0.78,
    borderRadius: 4,
    backgroundColor: '#C9D4DF',
    padding: 20,
    justifyContent: 'flex-end',
  },
  bookmark: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2F6',
  },
  contentText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
  },
});
