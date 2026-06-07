import React, { useState, useMemo, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppBackButton } from '@/components/ui/app-back-button';
import { getPartnerSchools } from '../../../src/api/partnerSchools';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🏫 파견교 데이터 구조
interface PartnerSchool {
  id: string;
  name: string;
  country: string;
  city: string;
  rating: number;
  tags: string[];
  image: any;
}

const SCHOOL_DATA: PartnerSchool[] = [
  {
    id: '1',
    name: '뮌헨 공과대학교 (TUM)',
    country: '독일',
    city: '뮌헨',
    rating: 4.8,
    tags: ['#기숙사좋음', '#영어수업많음', '#물가높음'],
    image: require('../../../assets/images/Munich.png'),
  },
  {
    id: '2',
    name: '베를린 자유대학교',
    country: '독일',
    city: '베를린',
    rating: 4.6,
    tags: ['#기숙사보장', '#도시라이프', '#역사깊음'],
    image: require('../../../assets/images/Munich.png'),
  },
  {
    id: '3',
    name: '콘스탄츠 공과대학교',
    country: '독일',
    city: '콘스탄츠',
    rating: 4.5,
    tags: ['#호수근처', '#소도시감성', '#치안좋음'],
    image: require('../../../assets/images/Munich.png'),
  },
  {
    id: '4',
    name: '아우크스부르크 공과대학교',
    country: '독일',
    city: '아우크스부르크',
    rating: 4.4,
    tags: ['#물가저렴', '#친절한버디', '#조용한캠퍼스'],
    image: require('../../../assets/images/Munich.png'),
  },
  {
    id: '5',
    name: 'UCLA (University of California, LA)',
    country: '미국',
    city: '로스앤젤레스',
    rating: 4.9,
    tags: ['#날씨최고', '#캠퍼스낭만', '#물가매우높음'],
    image: require('../../../assets/images/UCLA.png'),
  },
  {
    id: '6',
    name: '캘리포니아 주립대 롱비치 (CSULB)',
    country: '미국',
    city: '롱비치',
    rating: 4.5,
    tags: ['#해변근접', '#서핑천국', '#따뜻한기후'],
    image: require('../../../assets/images/UCLA.png'),
  },
  {
    id: '7',
    name: '파리 1대학 판테온 소르본',
    country: '프랑스',
    city: '파리',
    rating: 4.7,
    tags: ['#파리중심', '#예술인문', '#유럽여행쉬움'],
    image: require('../../../assets/images/franch.png'),
  },
  {
    id: '8',
    name: '리옹 3대학',
    country: '프랑스',
    city: '리옹',
    rating: 4.4,
    tags: ['#미식의도시', '#프랑스남부', '#적당한물가'],
    image: require('../../../assets/images/franch.png'),
  },
  {
    id: '9',
    name: '와세다 대학교',
    country: '일본',
    city: '도쿄',
    rating: 4.7,
    tags: ['#WISH기숙사', '#신주쿠인접', '#한국유학생많음'],
    image: require('../../../assets/images/japan.png'),
  },
  {
    id: '10',
    name: '교토 대학교',
    country: '일본',
    city: '교토',
    rating: 4.8,
    tags: ['#전통적캠퍼스', '#벚꽃명소', '#조용한생활'],
    image: require('../../../assets/images/japan.png'),
  },
];

export default function SchoolInfoScreen() {
  const { initCountry } = useLocalSearchParams<{ initCountry?: string }>();

  // 상태 관리
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<PartnerSchool[]>(SCHOOL_DATA);

  // 메인 explore 화면 등에서 특정 국가를 선택해서 넘어왔을 때 자동 필터링
  useEffect(() => {
    if (
      initCountry &&
      ['독일', '프랑스', '일본', '미국'].includes(initCountry)
    ) {
      setSelectedCountry(initCountry);
    }
  }, [initCountry]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await getPartnerSchools({ page: 0, size: 50 });
        const apiSchools = response.data.data.content.map((school) => ({
          id: String(school.id),
          name: school.name,
          country: school.country,
          city: school.city,
          rating: school.rating,
          tags: school.tags ?? [],
          image: school.thumbnailImageUrl
            ? { uri: school.thumbnailImageUrl }
            : require('../../../assets/images/background_school.png'),
        }));

        if (apiSchools.length > 0) {
          setSchools(apiSchools);
        }
      } catch (error: any) {
        console.log(
          '파견교 목록 API 조회 실패:',
          error.response?.data || error.message,
        );
      }
    };

    fetchSchools();
  }, []);

  // 국가 목록 필터
  const countries = useMemo(
    () => [
      '전체',
      ...Array.from(
        new Set(schools.map((school) => school.country).filter(Boolean)),
      ),
    ],
    [schools],
  );

  // 🔍 검색 & 필터 적용된 결과 리스트
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchCountry =
        selectedCountry === '전체' || school.country === selectedCountry;
      const matchSearch =
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchCountry && matchSearch;
    });
  }, [schools, selectedCountry, searchQuery]);

  const handleCountrySelect = (country: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCountry(country);
  };

  return (
    <View style={styles.container}>
      {/* 🔝 헤더 */}
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />

        <Text style={styles.headerTitle}>파견교 정보</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              router.push('/notifications' as any)
            }
          >
            <Image
              source={require('../../../assets/images/alarm.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔍 검색 및 필터 패널 */}
      <View style={styles.filterSection}>
        <Text style={styles.subTitle}>내 목적지 찾기</Text>

        {/* 국가선택 가로 스크롤 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
          contentContainerStyle={styles.countryContent}
        >
          {countries.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.countryPill,
                selectedCountry === c
                  ? styles.countryPillActive
                  : styles.countryPillInactive,
              ]}
              onPress={() => handleCountrySelect(c)}
            >
              <Text
                style={[
                  styles.countryPillText,
                  selectedCountry === c
                    ? styles.countryPillTextActive
                    : styles.countryPillTextInactive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 학교명 검색 바 */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color="#94A3B8"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="학교명, 도시 또는 키워드를 입력하세요"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 🏫 파견교 리스트 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listCountText}>
            검색 결과{' '}
            <Text style={styles.countNumber}>{filteredSchools.length}</Text>건
          </Text>
        </View>

        {filteredSchools.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              조건에 부합하는 파견 대학이 없습니다.
            </Text>
            <Text style={styles.emptySubText}>
              검색어나 국가 필터를 다시 설정해보세요.
            </Text>
          </View>
        ) : (
          filteredSchools.map((school) => (
            <TouchableOpacity
              key={school.id}
              style={styles.schoolCard}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/home/school-detail',
                  params: { id: school.id, name: school.name },
                });
              }}
            >
              {/* 대표 썸네일 이미지 */}
              <Image source={school.image} style={styles.schoolImage} />

              <View style={styles.cardInfoBox}>
                <Text style={styles.schoolName} numberOfLines={1}>
                  {school.name}
                </Text>

                <Text style={styles.schoolLocation}>
                  {school.country} / {school.city}
                </Text>

                <View style={styles.tagsRow}>
                  {school.tags.slice(0, 2).map((tag, idx) => (
                    <Text key={idx} style={styles.tagText}>
                      {tag}
                    </Text>
                  ))}
                </View>
              </View>

              {/* 평점 및 화살표 */}
              <View style={styles.cardRightCol}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#EAB308" />
                  <Text style={styles.ratingText}>{school.rating}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2042',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#0F2042',
  },
  headerRight: {
    flexDirection: 'row',
  },

  // 🔍 검색 및 필터 패널
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 12,
  },
  countryScroll: {
    marginHorizontal: -20,
    marginBottom: 14,
  },
  countryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  countryPill: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  countryPillActive: {
    backgroundColor: '#0F2042',
    borderColor: '#0F2042',
  },
  countryPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  countryPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  sectionTitle: {
    marginTop: 34,
    marginBottom: 18,
    fontSize: 20,
    fontWeight: '800',
  },
  countryPillTextActive: {
    color: '#FFFFFF',
  },
  countryPillTextInactive: {
    color: '#64748B',
  },

  // 검색 박스
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F2042',
    fontWeight: '500',
  },

  // 🏫 파견교 리스트
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  listHeader: {
    marginBottom: 14,
  },
  listCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  countNumber: {
    color: '#2F66D0',
    fontWeight: '800',
  },

  // 파견교 카드
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F2042',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  schoolImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  cardInfoBox: {
    flex: 1,
    marginLeft: 14,
    marginRight: 6,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2042',
  },
  schoolLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagText: {
    fontSize: 9,
    color: '#2F66D0',
    fontWeight: '700',
    backgroundColor: '#EEF2F6',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2042',
  },

  // 비어있는 상태
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  emptySubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
