import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BackButton } from '@/components/back-button';

export default function MarketDetailPage() {
  const [tab, setTab] = useState<'trade' | 'items' | 'seller'>('trade');
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <BackButton />
        </View>

        <View style={styles.imageArea}>
          <View style={styles.dots}>
            <Text style={styles.dot}>• • •</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>독일</Text>
            <Text style={styles.tag}>26-2학기</Text>
            <Text style={styles.tag}>귀국 D-18</Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>독일 아샤펜부르크 중고 물품</Text>
            <Image
              source={require('../../../assets/images/share.png')}
              style={styles.shareIcon}
            />
          </View>

          <Text style={styles.price}>21만 원</Text>

          <View style={styles.tabRow}>
            <Pressable style={styles.tabButton} onPress={() => setTab('trade')}>
              <Text style={styles.tabText}>거래 정보</Text>
              {tab === 'trade' && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable style={styles.tabButton} onPress={() => setTab('items')}>
              <Text style={styles.tabText}>물품 목록</Text>
              {tab === 'items' && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => setTab('seller')}
            >
              <Text style={styles.tabText}>판매자 정보</Text>
              {tab === 'seller' && <View style={styles.activeLine} />}
            </Pressable>
          </View>

          {tab === 'trade' && <TradeInfo />}
          {tab === 'items' && <ItemList />}
          {tab === 'seller' && <SellerInfo />}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => setLiked((prev) => !prev)}>
          <Image
            source={require('../../../assets/images/heart.png')}
            style={[
              styles.bottomHeartImage,
              liked && styles.bottomHeartImageActive,
            ]}
          />
        </Pressable>

        <Pressable style={styles.chatButton}>
          <Text style={styles.chatText}>채팅 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TradeInfo() {
  return (
    <View>
      <Text style={styles.sectionTitle}>거래 정보</Text>
      <Text style={styles.sectionDesc}>
        기본 거래 정보 및 판매자가 직접 작성한 내용이에요
      </Text>

      <Text style={styles.subTitle}>거래 조건</Text>

      <View style={styles.conditionRow}>
        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Image
              source={require('../../../assets/images/place.png')}
              style={styles.conditionIcon}
            />
            <Text style={styles.conditionLabel}>거래 장소</Text>
          </View>
          <Text style={styles.conditionValue}>
            쏜트룸{'\n'}(Bessenbacher Weg 10)
          </Text>
        </View>

        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Image
              source={require('../../../assets/images/date.png')}
              style={styles.conditionIcon}
            />
            <Text style={styles.conditionLabel}>귀국일</Text>
          </View>
          <Text style={styles.conditionValue}>2026. 02. 25 (수)</Text>
        </View>
      </View>

      <Text style={styles.subTitle}>판매자 글</Text>

      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          안녕하세요, 새해 복 많이 받으세요~{'\n\n'}
          25-02학기 아샤펜부르크 교환 학생 생활 동안 사용하던 물품들을 일괄
          17만원(100유로)에 양도합니다!{'\n\n'}
          전체 제가 직접 구매한 물품들이고 최대한 깨끗하게 사용했습니다. 친구의
          경우 전부 새로 세탁할 예정이며, 다른 물품들도 최대한 깨끗하게 세척 및
          정리하여 전달해 드리겠습니다.{'\n\n'}
          일괄 판매만 가능하며 중고 물품 특성상 상태는 어렵습니다. 물건의 상세한
          상태가 궁금하신 분들은 연락 주시면 자세하게 안내 도와드리겠습니다 :)
          {'\n\n'}
          2월 24일까지 대면 거래 가능하며, 그 이후에 오시는 경우에는 배정 받으신
          버디가 지인, 물품 보관할 등으로 전달 가능합니다.{'\n\n'}
          거래 장소는 쏜트룸(Bessenbacher Weg 10)입니다.{'\n\n'}더 궁금하신 사항
          있으시면 채팅으로 연락 주세요!
        </Text>
      </View>
    </View>
  );
}

function ItemList() {
  return (
    <View>
      <Text style={styles.sectionTitle}>물품 목록</Text>
      <Text style={styles.sectionDesc}>판매 물품 리스트예요</Text>

      <Text style={styles.subTitle}>보유 카테고리</Text>

      <View style={styles.categoryPillRow}>
        {['주방 용품', '욕실/청소 용품', '침구 용품', '생활 용품'].map(
          (item) => (
            <Text key={item} style={styles.categoryPill}>
              {item}
            </Text>
          ),
        )}
      </View>

      <Text style={styles.subTitle}>주방 용품</Text>

      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoText}>사진</Text>
        <Text style={styles.dotText}>• • •</Text>
      </View>

      <View style={styles.itemGrid}>
        {[
          '냄비 2개',
          '브리타 + 필터 1개',
          '프라이팬 1개',
          '주방 소도구(주걱·집게)',
          '밥솥 (1인용) 1개',
          '주방 칼 1개',
          '밥·국 그릇 2개',
          '락앤락 통 2개',
          '접시 2개',
          '수저세트 1개',
          '컵 2개',
          '식기 건조대 1개',
        ].map((item) => (
          <Text key={item} style={styles.itemText}>
            • {item}
          </Text>
        ))}
      </View>

      <Text style={styles.subTitle}>욕실/청소 용품</Text>
    </View>
  );
}

function SellerInfo() {
  return (
    <View>
      <Text style={styles.sectionTitle}>판매자 정보</Text>
      <Text style={styles.sectionDesc}>
        교환학생 선배 판매자의 기본 정보예요
      </Text>

      <Text style={styles.nickname}>may.be</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileImage} />

        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>may.be</Text>
          <Text style={styles.profileMeta}>
            독일　아샤펜부르크　26-2학기 파견생
          </Text>
        </View>

        <Text style={styles.profileArrow}>›</Text>
      </View>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  shareIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  conditionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  conditionIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    marginRight: 5,
  },

  conditionLabel: {
    fontSize: 10,
    color: '#555',
    fontWeight: '700',
  },

  bottomHeartImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: '#111111',
    marginTop: 10,
  },

  bottomHeartImageActive: {
    tintColor: '#FF4F7B',
  },

  top: {
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  imageArea: {
    height: 250,
    backgroundColor: '#F2F2F2',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },

  dots: {
    alignItems: 'center',
  },

  dot: {
    color: '#C4C4C4',
    fontSize: 22,
  },

  body: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 120,
  },

  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: '#555',
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },

  share: {
    fontSize: 25,
    color: '#111',
  },

  price: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '900',
    color: BLUE,
  },

  tabRow: {
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: 22,
    marginBottom: 18,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },

  activeLine: {
    position: 'absolute',
    bottom: -1,
    height: 4,
    width: '100%',
    borderRadius: 99,
    backgroundColor: '#102BE0',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    marginBottom: 7,
  },

  sectionDesc: {
    fontSize: 11,
    color: '#777',
    marginBottom: 24,
  },

  subTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
    marginBottom: 12,
    marginTop: 8,
  },

  conditionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 34,
  },

  conditionCard: {
    flex: 1,
    height: 82,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    padding: 11,
  },

  conditionValue: {
    fontSize: 11,
    color: '#111',
    fontWeight: '800',
    lineHeight: 17,
  },

  descriptionBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  descriptionText: {
    fontSize: 11,
    lineHeight: 22,
    textAlign: 'center',
    color: '#111',
    fontWeight: '600',
  },

  categoryPillRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 28,
  },

  categoryPill: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#111',
  },

  photoPlaceholder: {
    height: 145,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },

  photoText: {
    fontSize: 12,
    color: '#777',
  },

  dotText: {
    marginTop: 45,
    color: '#C4C4C4',
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
  },

  itemText: {
    width: '50%',
    fontSize: 11,
    lineHeight: 21,
    color: '#111',
  },

  nickname: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 16,
  },

  profileCard: {
    height: 78,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D9D9D9',
    marginRight: 14,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },

  profileMeta: {
    marginTop: 5,
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
  },

  profileArrow: {
    fontSize: 30,
    color: '#111',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 86,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bottomHeart: {
    width: 48,
    fontSize: 32,
    color: '#111',
    lineHeight: 48,
  },

  bottomHeartActive: {
    color: '#FF4F7B',
  },

  chatButton: {
    flex: 1,
    height: 48,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
