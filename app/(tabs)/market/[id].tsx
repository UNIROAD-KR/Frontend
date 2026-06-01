import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getLocalMarketPost,
  LocalMarketPost,
} from '../../../src/storage/marketPosts';
import { AppBackButton } from '@/components/ui/app-back-button';

const BLUE = '#123F9F';
const SCREEN_WIDTH = Dimensions.get('window').width;
const DETAIL_IMAGE_HEIGHT = 290;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const parseDate = (value: string) => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatReturnDate = (value: string) => {
  const date = parseDate(value);

  if (!date) return '미정';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = WEEKDAYS[date.getDay()];

  return `${year}. ${month}. ${day} (${weekday})`;
};

const getDdayText = (value: string) => {
  const date = parseDate(value);

  if (!date) return '귀국 D-?';

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diff = Math.ceil(
    (date.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  return diff >= 0 ? `귀국 D-${diff}` : '귀국 완료';
};

const formatPrice = (post: LocalMarketPost) => {
  if (post.priceText) return post.priceText;
  if (!post.price) return '가격 미정';

  return `${post.price.toLocaleString()}원`;
};

export default function MarketDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [tab, setTab] = useState<'trade' | 'items' | 'seller'>('trade');
  const [liked, setLiked] = useState(false);
  const [post, setPost] = useState<LocalMarketPost | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadPost = async () => {
        setLoading(true);

        if (!id) {
          setPost(null);
          setLoading(false);
          return;
        }

        const nextPost = await getLocalMarketPost(id);

        if (active) {
          setPost(nextPost);
          setLoading(false);
        }
      };

      loadPost();

      return () => {
        active = false;
      };
    }, [id]),
  );

  const tags = useMemo(() => {
    if (!post) return [];

    return [
      post.region || '지역 미정',
      post.semester || '학기 미정',
      getDdayText(post.returnDate),
    ];
  }, [post]);

  const handleChangeTab = (nextTab: 'trade' | 'items' | 'seller') => {
    const currentY = currentScrollY.current;

    setTab(nextTab);

    requestAnimationFrame(() => {
      const nextY = nextTab === 'seller' ? Math.min(currentY, 430) : currentY;

      scrollRef.current?.scrollTo({
        y: nextY,
        animated: false,
      });
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBack />

        <View style={styles.centerState}>
          <Text style={styles.centerText}>게시글을 불러오는 중이에요</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <HeaderBack />

        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>게시글을 찾을 수 없어요</Text>
          <Pressable
            style={styles.centerButton}
            onPress={() => router.replace('/market' as any)}
          >
            <Text style={styles.centerButtonText}>목록으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          currentScrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <HeaderBack />

        <ImageCarousel photos={post.photos} />

        <View style={styles.body}>
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{post.title}</Text>
            <Image
              source={require('../../../assets/images/share.png')}
              style={styles.shareIcon}
            />
          </View>

          <Text style={styles.price}>{formatPrice(post)}</Text>

          <View style={styles.tabRow}>
            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab('trade')}
            >
              <Text style={styles.tabText}>거래 정보</Text>
              {tab === 'trade' && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab('items')}
            >
              <Text style={styles.tabText}>물품 목록</Text>
              {tab === 'items' && <View style={styles.activeLine} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleChangeTab('seller')}
            >
              <Text style={styles.tabText}>판매자 정보</Text>
              {tab === 'seller' && <View style={styles.activeLine} />}
            </Pressable>
          </View>

          {tab === 'trade' && <TradeInfo post={post} />}
          {tab === 'items' && <ItemList post={post} />}
          {tab === 'seller' && <SellerInfo post={post} />}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => setLiked(!liked)}>
          <Image
            source={
              liked
                ? require('../../../assets/images/filled_heart.png')
                : require('../../../assets/images/heart.png')
            }
            style={liked ? styles.filledHeartIcon : styles.heartIcon}
          />
        </Pressable>

        <Pressable style={styles.chatButton}>
          <Text style={styles.chatText}>채팅 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HeaderBack() {
  return (
    <View style={styles.top}>
      <AppBackButton />
    </View>
  );
}

function ImageCarousel({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return (
      <View style={[styles.imageArea, styles.emptyImageArea]}>
        <Text style={styles.emptyImageText}>등록된 사진 없음</Text>
      </View>
    );
  }

  return (
    <View style={styles.imageArea}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {photos.map((photo, index) => (
          <Image
            key={`${photo}-${index}`}
            source={{ uri: photo }}
            style={styles.heroImage}
          />
        ))}
      </ScrollView>

      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      )}
    </View>
  );
}

function TradeInfo({ post }: { post: LocalMarketPost }) {
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
          <Text style={styles.conditionValue}>{post.region || '미정'}</Text>
        </View>

        <View style={styles.conditionCard}>
          <View style={styles.conditionLabelRow}>
            <Image
              source={require('../../../assets/images/date.png')}
              style={styles.conditionIcon}
            />
            <Text style={styles.conditionLabel}>귀국일</Text>
          </View>
          <Text style={styles.conditionValue}>
            {formatReturnDate(post.returnDate)}
          </Text>
        </View>
      </View>

      <Text style={styles.subTitle}>판매자 글</Text>

      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>{post.content}</Text>
      </View>
    </View>
  );
}

function ItemList({ post }: { post: LocalMarketPost }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>물품 목록</Text>
      <Text style={styles.sectionDesc}>판매 물품 리스트예요</Text>

      {post.itemGroups.length > 0 ? (
        <>
          <Text style={styles.subTitle}>보유 카테고리</Text>

          <View style={styles.categoryPillRow}>
            {post.itemGroups.map((group) => (
              <Text key={group.category} style={styles.categoryPill}>
                {group.category}
              </Text>
            ))}
          </View>

          {post.itemGroups.map((group) => (
            <View key={group.category} style={styles.itemGroup}>
              <Text style={styles.subTitle}>{group.category}</Text>

              {group.photos && group.photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.itemPhotoRow}
                >
                  {group.photos.map((photo, index) => (
                    <Image
                      key={`${group.category}-${photo}-${index}`}
                      source={{ uri: photo }}
                      style={styles.itemPhoto}
                    />
                  ))}
                </ScrollView>
              )}

              {group.description && group.description.length > 0 && (
                <View style={styles.itemDescriptionBox}>
                  <Text style={styles.itemDescriptionText}>
                    {group.description}
                  </Text>
                </View>
              )}

              <View style={styles.itemGrid}>
                {group.items.map((item, index) => (
                  <Text
                    key={`${group.category}-${item.name}-${index}`}
                    style={styles.itemText}
                  >
                    • {item.name} {item.quantity}개
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyListBox}>
          <Text style={styles.emptyListText}>등록된 물품이 없어요</Text>
        </View>
      )}
    </View>
  );
}

function SellerInfo({ post }: { post: LocalMarketPost }) {
  const authorName = post.authorName || '나';
  const initial = authorName.trim().charAt(0) || '나';

  return (
    <View>
      <Text style={styles.sectionTitle}>판매자 정보</Text>
      <Text style={styles.sectionDesc}>
        교환학생 선배 판매자의 기본 정보예요
      </Text>

      <Text style={styles.nickname}>{authorName}</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileImage}>
          <Text style={styles.profileInitial}>{initial}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{authorName}</Text>
          <Text style={styles.profileMeta}>
            {post.region || '지역 미정'}　{post.semester || '학기 미정'} 파견생
          </Text>
        </View>

        <Text style={styles.profileArrow}>›</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  top: {
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  centerState: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  centerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },

  centerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#777777',
  },

  centerButton: {
    height: 44,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  centerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  imageArea: {
    height: DETAIL_IMAGE_HEIGHT,
    backgroundColor: '#F2F2F2',
  },

  emptyImageArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
  },

  heroImage: {
    width: SCREEN_WIDTH,
    height: DETAIL_IMAGE_HEIGHT,
    resizeMode: 'cover',
  },

  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  body: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 120,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: '#555555',
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    color: '#111111',
    marginRight: 10,
  },

  shareIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  price: {
    marginTop: 8,
    fontSize: 20,
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
    color: '#111111',
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
    color: '#111111',
    marginBottom: 7,
  },

  sectionDesc: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 24,
  },

  subTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
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
    minHeight: 92,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 11,
    paddingVertical: 12,
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
    fontSize: 12,
    color: '#555555',
    fontWeight: '700',
  },

  conditionValue: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '800',
    lineHeight: 18,
    flexWrap: 'wrap',
  },

  descriptionBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111111',
    fontWeight: '600',
  },

  categoryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 22,
  },

  categoryPill: {
    backgroundColor: '#F2F2F2',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: '#111111',
    fontWeight: '700',
    overflow: 'hidden',
  },

  itemGroup: {
    marginBottom: 22,
  },

  itemPhotoRow: {
    marginBottom: 12,
  },

  itemPhoto: {
    width: 96,
    height: 96,
    borderRadius: 10,
    resizeMode: 'cover',
    marginRight: 9,
  },

  itemDescriptionBox: {
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 12,
  },

  itemDescriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333333',
    fontWeight: '600',
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
  },

  itemText: {
    width: '50%',
    fontSize: 14,
    lineHeight: 21,
    color: '#111111',
  },

  emptyListBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
  },

  emptyListText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
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
    backgroundColor: '#D9E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  profileInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333333',
  },

  profileMeta: {
    marginTop: 5,
    fontSize: 10,
    color: '#555555',
    fontWeight: '600',
  },

  profileArrow: {
    fontSize: 30,
    color: '#111111',
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

  heartIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    top: 6,
  },

  filledHeartIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    top: 6,
  },

  chatButton: {
    height: 48,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    left: 15,
  },

  chatText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
