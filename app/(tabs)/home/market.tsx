import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';

import { canUseMarketWithoutVerification } from '../../../src/utils/verification';

export default function MarketScreen() {
  const [isVerified, setIsVerified] = useState(false);
  const [marketMode, setMarketMode] = useState<'buy' | 'sell'>('buy');

  useFocusEffect(
    useCallback(() => {
      const checkVerification = async () => {
        try {
          const canUseMarket = await canUseMarketWithoutVerification();
          setIsVerified(canUseMarket);
        } catch (error: any) {
          console.log('내 정보 조회 실패:', error.response?.data || error.message);
          setIsVerified(false);
        }
      };

      checkVerification();
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />

          <Text style={styles.headerTitle}>중고 거래</Text>

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

        <View style={styles.verifyBox}>
          <View style={styles.verifyIconBox}>
            <Text style={styles.verifyEmoji}>🎓</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.verifyTitle}>
              {isVerified ? '교환학생 인증 완료' : '교환학생 인증이 필요해요'}
            </Text>

            <Text style={styles.verifyDesc}>
              {isVerified
                ? '파견교 승인 문서로 검증을 마친 안전한 사용자입니다.'
                : '중고거래를 안전하게 이용하려면 파견교 인증을 먼저 완료해주세요.'}
            </Text>

            <Text style={styles.verifySub}>
              {isVerified
                ? '내가 구매했던 물건들을 모아서 일괄 판매로 등록해보세요.'
                : '인증 후 물품 구매·판매와 일괄 거래 기능을 사용할 수 있어요.'}
            </Text>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() =>
                isVerified
                  ? router.push('/market/write' as any)
                  : router.push('/verification' as any)
              }
            >
              <Text style={styles.verifyButtonText}>
                {isVerified
                  ? '내 물건 일괄 판매하기 ⊞'
                  : '교환학생 인증하러 가기 ›'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Image
              source={require('../../../assets/images/info_search.png')}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="국가 및 지역명 검색 ..."
              placeholderTextColor="#777"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterIcon}>☷</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
        >
          {['독일', '미국', '스페인', '네덜란드', '영국', '프랑스'].map(
            (country, index) => (
              <TouchableOpacity key={country} style={styles.countryItem}>
                <Image
                  source={
                    index === 0
                      ? require('../../../assets/images/flag_germany.png')
                      : index === 1
                        ? require('../../../assets/images/flag_USA.png')
                        : index === 2
                          ? require('../../../assets/images/flag_spain.png')
                          : index === 3
                            ? require('../../../assets/images/flag_Neth.png')
                            : index === 4
                              ? require('../../../assets/images/flag_england.png')
                              : require('../../../assets/images/flag_france.png')
                  }
                  style={styles.flagImage}
                />
                <Text style={styles.countryText}>{country}</Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={
              marketMode === 'buy' ? styles.marketTabActive : styles.marketTab
            }
            onPress={() => setMarketMode('buy')}
          >
            <Text
              style={
                marketMode === 'buy'
                  ? styles.marketTabActiveText
                  : styles.marketTabText
              }
            >
              일괄 거래 구매하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              marketMode === 'sell' ? styles.marketTabActive : styles.marketTab
            }
            onPress={() => setMarketMode('sell')}
          >
            <Text
              style={
                marketMode === 'sell'
                  ? styles.marketTabActiveText
                  : styles.marketTabText
              }
            >
              판매 하기
            </Text>
          </TouchableOpacity>
        </View>

        {marketMode === 'buy' ? (
          <>
            <Text style={styles.sectionTitle}>최근 올라온 일괄 거래</Text>

            <View style={styles.productGrid}>
              {[1, 2, 3, 4].map((item) => (
                <TouchableOpacity key={item} style={styles.productCard}>
                  <View style={styles.productImage}>
                    <Text style={styles.productImageText}>사진</Text>
                  </View>

                  <View style={styles.badgeRow}>
                    <Text style={styles.badge}>2026-1학기</Text>
                    <Text style={styles.badge}>
                      {item === 2 ? '체코' : item === 4 ? '스페인' : '독일'}
                    </Text>
                  </View>

                  <Text style={styles.productTitle}>
                    {item === 1
                      ? '독일 아샤펜부르크 중고물품 양도'
                      : item === 2
                        ? '체코 오스트라바 교환 물품'
                        : item === 3
                          ? '26-1 베를린자유대 교환학생 물품 판매'
                          : '2026 바르셀로나 중고 물품'}
                  </Text>

                  <Text style={styles.price}>
                    {item === 2 ? '€117' : '€110'}
                  </Text>
                  <Text style={styles.meta}>2026.02.25 / Min.u</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.sellSection}>
            <Text style={styles.aiBadge}>● AI 자동 완성</Text>

            <Text style={styles.sellTitle}>어떤 방식으로 등록할까요?</Text>
            <Text style={styles.sellSub}>
              쉽고 빠르게 판매글을 작성해보세요
            </Text>

            <TouchableOpacity style={styles.sellCard}>
              <View style={styles.sellLeft}>
                <Text style={styles.sellIcon}>📋</Text>
                <Text style={styles.sellCardTitle}>신규 물품 등록</Text>
                <Text style={styles.sellCardLink}>
                  AI로 간편하게 내 물건 팔기
                </Text>
              </View>

              <View style={styles.sellDivider} />

              <View style={styles.sellRight}>
                <Text style={styles.sellDesc}>
                  사진 업로드 후 <Text style={styles.bold}>품목 · 상태만</Text>{' '}
                  선택하면{'\n'}
                  AI가 판매글을 자동으로 작성해드려요.
                </Text>
                <Text style={styles.sellSteps}>
                  1) 사진 업로드{'\n'}2) 키워드 선택{'\n'}3) 바로 등록
                </Text>
              </View>

              <Text style={styles.sellArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>또는</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity style={styles.sellCard}>
              <View style={styles.sellLeft}>
                <Text style={styles.sellIcon}>🧾</Text>
                <Text style={styles.sellCardTitle}>구내 내역에서 가져오기</Text>
                <Text style={styles.sellCardLink}>
                  이전 구매 이력으로 다시 팔기
                </Text>
              </View>

              <View style={styles.sellDivider} />

              <View style={styles.sellRight}>
                <Text style={styles.sellDesc}>
                  예전에 구매한 물건, 다시 팔고 싶다면?{'\n'}
                  <Text style={styles.bold}>변동 사항만 체크</Text>하면 즉시
                  등록돼요.
                </Text>
                <Text style={styles.sellSteps}>
                  1) 이력 불러오기{'\n'}2) 변동사항 체크{'\n'}3) 바로 등록
                </Text>
              </View>

              <Text style={styles.sellArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 130,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerSpacer: {
    width: 88,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    top: 10,
  },

  headerRight: {
    width: 88,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  icon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
  },

  verifyBox: {
    marginTop: 26,
    borderRadius: 10,
    backgroundColor: '#F5F8FC',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
  },

  verifyIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E7F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyEmoji: {
    fontSize: 28,
  },

  verifyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  verifyDesc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },

  verifySub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },

  verifyButton: {
    marginTop: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0B48B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  searchRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  searchBox: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  searchIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  filterBtn: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterIcon: {
    fontSize: 26,
  },

  countryScroll: {
    marginTop: 22,
  },

  countryItem: {
    width: 78,
    alignItems: 'center',
    marginRight: 14,
  },

  flagBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  flagImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },

  flagGloss: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },

  countryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },

  tabRow: {
    marginTop: 24,
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  marketTabActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#1554D1',
  },

  marketTabActiveText: {
    color: '#1554D1',
    fontSize: 16,
    fontWeight: '800',
  },

  marketTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  marketTabText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 18,
    fontSize: 20,
    fontWeight: '800',
  },

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 22,
  },

  productCard: {
    width: '48%',
  },

  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productImageText: {
    fontSize: 15,
    color: '#777',
  },

  badgeRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 6,
  },

  badge: {
    backgroundColor: '#EDF3FF',
    color: '#0B48B8',
    fontSize: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },

  productTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },

  price: {
    marginTop: 8,
    color: '#0B48B8',
    fontSize: 22,
    fontWeight: '900',
  },

  meta: {
    marginTop: 4,
    color: '#777',
    fontSize: 11,
    textAlign: 'right',
  },
  sellSection: {
    paddingTop: 28,
  },

  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B48D8',
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },

  sellTitle: {
    fontSize: 20,
    fontWeight: '900',
  },

  sellSub: {
    marginTop: 6,
    color: '#666',
    fontSize: 14,
  },

  sellCard: {
    marginTop: 28,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  sellLeft: {
    width: '42%',
    alignItems: 'center',
  },

  sellIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  sellCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  sellCardLink: {
    marginTop: 8,
    color: '#0B48D8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  sellDivider: {
    width: 1,
    height: 118,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 14,
  },

  sellRight: {
    flex: 1,
  },

  sellDesc: {
    fontSize: 12,
    lineHeight: 18,
  },

  bold: {
    fontWeight: '900',
  },

  sellSteps: {
    marginTop: 12,
    color: '#777',
    fontSize: 11,
    lineHeight: 18,
  },

  sellArrow: {
    position: 'absolute',
    right: 12,
    bottom: 18,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1554D1',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 24,
    fontWeight: '800',
    overflow: 'hidden',
  },

  orRow: {
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },

  orText: {
    color: '#777',
    fontSize: 12,
  },
});
