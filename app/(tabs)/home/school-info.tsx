import { useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

export default function SchoolInfoScreen() {
  const countries = [
    '독일',
    '일본',
    '미국',
    '프랑스',
    '호주',
    '중국',
    '영국',
    '캐나다',
  ];

  const [selectedCountry, setSelectedCountry] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.dismissTo('/(tabs)/home/explore')}
          >
            <Image
              source={require('../../../assets/images/back.png')}
              style={styles.icon}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>파견교 정보 찾기</Text>

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

        <Text style={styles.sectionTitle}>내 목적지 찾기</Text>

        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => setIsCountryOpen(!isCountryOpen)}
        >
          <Text style={styles.placeholder}>
            {selectedCountry || '국가를 선택하세요'}
          </Text>
          <Text style={styles.chevron}>{isCountryOpen ? '⌃' : '⌄'}</Text>
        </TouchableOpacity>

        {isCountryOpen && (
          <View style={styles.dropdown}>
            {countries.map((country) => (
              <TouchableOpacity
                key={country}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCountry(country);
                  setIsCountryOpen(false);
                }}
              >
                <Text style={styles.dropdownText}>{country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.selectBox}>
          <Text style={styles.placeholder}>파견 대학을 검색하세요</Text>
          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>

        {!selectedCountry && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.bigTitle}>인기 국가</Text>
              <TouchableOpacity>
                <Text style={styles.more}>전체보기 ›</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['독일', '미국', '프랑스', '일본'].map((name, index) => (
                <TouchableOpacity
                  key={name}
                  style={styles.countryItem}
                  onPress={() => setSelectedCountry(name)}
                >
                  <Image
                    source={
                      index === 0
                        ? require('../../../assets/images/germany.png')
                        : index === 1
                          ? require('../../../assets/images/USA.png')
                          : index === 2
                            ? require('../../../assets/images/franch.png')
                            : require('../../../assets/images/japan.png')
                    }
                    style={styles.countryImage}
                  />
                  <Text style={styles.countryName}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.bigTitle}>추천 테마</Text>
              <TouchableOpacity>
                <Text style={styles.more}>더보기 ›</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity style={styles.themeCard}>
                <Image
                  source={require('../../../assets/images/freepass.png')}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.themeTitle}>기숙사 프리패스</Text>
                <Text style={styles.themeSub}>기숙사 제공 대학 리스트</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.themeCard}>
                <Image
                  source={require('../../../assets/images/travel_holy.png')}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.themeTitle}>여행의 성지</Text>
                <Text style={styles.themeSub}>인접 국가 이동 쉬운 곳</Text>
              </TouchableOpacity>
            </ScrollView>
            <Text style={styles.topTitle}>이번 주 인기 파견교 TOP 5</Text>

            {[1, 2, 3].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.schoolCard}
                onPress={() => {
                  if (item === 1) {
                    router.push('/(tabs)/home/school-detail');
                  }
                }}
              >
                <Image
                  source={
                    item === 1
                      ? require('../../../assets/images/Munich.png')
                      : require('../../../assets/images/UCLA.png')
                  }
                  style={styles.schoolImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.schoolName}>
                    {item === 1
                      ? '1위 뮌헨 공과 대학교'
                      : item === 2
                        ? '2위 UCLA'
                        : '3위 아우크스부르크 공과 대학교'}
                  </Text>
                  <Text style={styles.schoolMeta}>
                    {item === 1
                      ? '독일 / 뮌헨'
                      : item === 2
                        ? '미국 / 로스엔젤레스'
                        : '독일 / 아우크스부르크'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {selectedCountry && (
          <>
            <Text style={styles.topTitle}>{selectedCountry} 파견교 모음</Text>

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.schoolCard}
                onPress={() => {
                  if (item % 3 === 1) {
                    router.push('/(tabs)/home/school-detail');
                  }
                }}
              >
                <Image
                  source={
                    item % 3 === 1
                      ? require('../../../assets/images/Munich.png')
                      : require('../../../assets/images/UCLA.png')
                  }
                  style={styles.schoolImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.schoolName}>
                    {item % 3 === 1
                      ? '뮌헨 공과 대학교'
                      : item % 3 === 2
                        ? '콘스탄츠 대학교'
                        : '아우크스부르크 공과 대학교'}
                  </Text>
                  <Text style={styles.schoolMeta}>
                    {item % 3 === 1
                      ? `${selectedCountry} / 뮌헨`
                      : item % 3 === 2
                        ? `${selectedCountry} / 콘스탄츠`
                        : `${selectedCountry} / 아우크스부르크`}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: -6,
    marginBottom: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  dropdownItem: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  dropdownText: {
    fontSize: 15,
    color: '#222',
  },
  icon: { width: 20, height: 20, resizeMode: 'contain' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  headerRight: { flexDirection: 'row', gap: 10 },

  sectionTitle: {
    marginTop: 34,
    marginBottom: 18,
    fontSize: 20,
    fontWeight: '800',
  },

  selectBox: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: { flex: 1, color: '#777', fontSize: 15 },
  chevron: { fontSize: 28, color: '#666', top: -7 },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigTitle: { flex: 1, fontSize: 24, fontWeight: '800' },
  more: { color: '#666', fontSize: 14 },

  countryItem: { width: 148, marginRight: 18, alignItems: 'center' },
  countryImage: {
    width: 148,
    height: 132,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  countryName: { marginTop: 12, fontSize: 17, fontWeight: '700' },

  themeCard: {
    width: 430,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden', // ⭐ 중요
    justifyContent: 'flex-end',
    padding: 24,
  },
  themeCardSmall: { width: 240 },
  themeTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  themeSub: { color: '#fff', marginTop: 6, fontSize: 15 },

  topTitle: {
    marginTop: 38,
    marginBottom: 22,
    fontSize: 24,
    fontWeight: '800',
  },

  schoolCard: {
    height: 104,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  schoolImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  schoolName: { fontSize: 13, fontWeight: '700' },
  schoolMeta: { marginTop: 8, color: '#777', fontSize: 13 },
  arrow: { fontSize: 38, color: '#666' },
});
