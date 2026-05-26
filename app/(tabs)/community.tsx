import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BLUE = '#102BE0';
const GREEN = '#40A66A';
const CARD_WIDTH = Math.min(214, SCREEN_WIDTH * 0.55);

const communityTabs = ['자유 게시판', '동행 구하기'] as const;
const boardFilters = ['전체', '파견 전', '파견 중', '귀국 후'];
const companionFilters = ['전체', '모집중', '모집완료'];

type CommunityTab = (typeof communityTabs)[number];

const boardPosts = [
  {
    id: 1,
    status: '파견 중',
    title: '아우크스부르크 근처 가성비 맛집 리스트 공유',
    preview:
      '한 학기 동안 찾아낸 찐 맛집 리스트입니다. 현지인들도 자주 가는 곳 위주로 정리했어요.',
    author: '김서현',
    country: '독일',
    stage: '파견',
    time: '방금 전',
    likes: 57,
    comments: 7,
    color: '#DDF4E4',
    textColor: '#238451',
  },
  {
    id: 2,
    status: '파견 전',
    title: '독일 비자 신청 후기 - 서울 영사관 직접 방문',
    preview:
      '비자 신청 준비하시는 분들 참고하세요. 예약부터 서류 준비까지 제가 겪은 것들 정리했어요.',
    author: '이민준',
    country: '독일',
    stage: '파견 예정',
    time: '1시간 전',
    likes: 43,
    comments: 12,
    color: '#EAF1FF',
    textColor: '#2F66D0',
  },
  {
    id: 3,
    status: '귀국 후',
    title: '귀국하고 나서 학점 인정 받을 때 체크할 것',
    preview:
      '성적표 원본, 수강계획서, 실라버스는 미리 챙겨두면 훨씬 편합니다. 놓치기 쉬운 부분만 모았어요.',
    author: '박하린',
    country: '프랑스',
    stage: '귀국',
    time: '3시간 전',
    likes: 31,
    comments: 5,
    color: '#FFF1DF',
    textColor: '#F28A2E',
  },
  {
    id: 4,
    status: '파견 중',
    title: '파리 Navigo 학생권 신청 성공한 분 계신가요?',
    preview:
      '학교 메일 인증에서 계속 막히는데 혹시 최근에 신청해보신 분 있으면 절차 공유 부탁드려요.',
    author: '최유진',
    country: '프랑스',
    stage: '파견',
    time: '어제',
    likes: 18,
    comments: 16,
    color: '#DDF4E4',
    textColor: '#238451',
  },
];

const topCompanions = [
  {
    id: 1,
    status: '모집중',
    city: '베를린, 독일',
    title: '박물관 섬 같이 가실 분?',
    date: '03/15',
    people: '2명',
    likes: 24,
    background: BLUE,
  },
  {
    id: 2,
    status: '모집중',
    city: '파리, 프랑스',
    title: '루브르 박물관 같이 가요',
    date: '03/20',
    people: '1명',
    likes: 18,
    background: GREEN,
  },
  {
    id: 3,
    status: '모집완료',
    city: '바르셀로나, 스페인',
    title: '가우디 투어 동행 구해요',
    date: '03/22',
    people: '4명',
    likes: 16,
    background: '#1A7AA8',
  },
  {
    id: 4,
    status: '모집중',
    city: '프라하, 체코',
    title: '야경 산책 같이 하실 분',
    date: '03/28',
    people: '3명',
    likes: 15,
    background: '#188A7B',
  },
  {
    id: 5,
    status: '모집중',
    city: '뮌헨, 독일',
    title: '주말 근교 여행 팀원 모집',
    date: '04/02',
    people: '2명',
    likes: 13,
    background: '#2F66D0',
  },
];

const companionPosts = [
  {
    id: 1,
    icon: 'map-outline' as const,
    title: '뮌헨 맥주 축제 같이 가요',
    city: '뮌헨, 독일',
    period: '04/01 - 04/02',
    tags: ['축제', '맥주', '감성'],
    status: '모집중',
    current: 2,
    total: 4,
    verified: true,
    tint: '#EAF1FF',
    iconColor: '#2F66D0',
  },
  {
    id: 2,
    icon: 'airplane-outline' as const,
    title: '암스테르담 당일치기',
    city: '암스테르담, 네덜란드',
    period: '04/06',
    tags: ['당일치기', '미술관'],
    status: '모집중',
    current: 1,
    total: 3,
    verified: true,
    tint: '#FFF4E7',
    iconColor: '#E8872F',
  },
  {
    id: 3,
    icon: 'cafe-outline' as const,
    title: '파리 카페 투어 같이 해요',
    city: '파리, 프랑스',
    period: '04/12 - 04/13',
    tags: ['카페', '사진', '주말'],
    status: '모집완료',
    current: 4,
    total: 4,
    verified: false,
    tint: '#EAF7EF',
    iconColor: '#40A66A',
  },
];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('자유 게시판');
  const [selectedBoardFilter, setSelectedBoardFilter] = useState('전체');
  const [selectedCompanionFilter, setSelectedCompanionFilter] = useState('전체');

  const filteredBoardPosts = useMemo(
    () =>
      selectedBoardFilter === '전체'
        ? boardPosts
        : boardPosts.filter((post) => post.status === selectedBoardFilter),
    [selectedBoardFilter],
  );

  const filteredCompanions = useMemo(
    () =>
      selectedCompanionFilter === '전체'
        ? companionPosts
        : companionPosts.filter((post) => post.status === selectedCompanionFilter),
    [selectedCompanionFilter],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>

        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <Image
              source={require('../../assets/images/alarm.png')}
              style={styles.icon}
            />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Image
              source={require('../../assets/images/menu.png')}
              style={styles.icon}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tradeTypeBox}>
          {communityTabs.map((tab) => {
            const active = activeTab === tab;

            return (
              <Pressable
                key={tab}
                style={[styles.tradeTypeButton, active && styles.tradeTypeActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tradeTypeText,
                    active && styles.tradeTypeTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === '자유 게시판' ? (
          <View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color="#9A9A9A" />
              <TextInput
                style={styles.searchInput}
                placeholder="글 제목, 내용, 해시태그"
                placeholderTextColor="#9A9A9A"
              />
            </View>

            <FilterChips
              items={boardFilters}
              selected={selectedBoardFilter}
              onSelect={setSelectedBoardFilter}
            />

            <View style={styles.boardList}>
              {filteredBoardPosts.map((post) => (
                <Pressable key={post.id} style={styles.boardCard}>
                  <View style={styles.boardTopRow}>
                    <View style={[styles.statusBadge, { backgroundColor: post.color }]}>
                      <Text style={[styles.statusBadgeText, { color: post.textColor }]}>
                        {post.status}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{post.time}</Text>
                  </View>

                  <Text style={styles.boardTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={styles.boardPreview} numberOfLines={2}>
                    {post.preview}
                  </Text>

                  <View style={styles.boardFooter}>
                    <View style={styles.authorRow}>
                      <View style={[styles.avatar, { backgroundColor: post.color }]}>
                        <Text style={[styles.avatarText, { color: post.textColor }]}>
                          {post.author.slice(0, 1)}
                        </Text>
                      </View>
                      <Text style={styles.metaText}>
                        {post.author} · {post.country} {post.stage}
                      </Text>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="thumbs-up-outline" size={13} color="#A5A5A5" />
                        <Text style={styles.statText}>{post.likes}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="chatbubble-outline" size={13} color="#A5A5A5" />
                        <Text style={styles.statText}>{post.comments}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <FilterChips
              items={companionFilters}
              selected={selectedCompanionFilter}
              onSelect={setSelectedCompanionFilter}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>인기 Top 5</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.topScroll}
              contentContainerStyle={styles.topContent}
            >
              {topCompanions.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.topCard, { backgroundColor: item.background }]}
                >
                  <View style={styles.topStatusBadge}>
                    <Text style={styles.topStatusText}>{item.status}</Text>
                  </View>
                  <Text style={styles.topCity}>{item.city}</Text>
                  <Text style={styles.topTitle}>{item.title}</Text>
                  <View style={styles.topBottom}>
                    <View style={styles.topMetaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.topMeta}>{item.date}</Text>
                    </View>
                    <View style={styles.topMetaItem}>
                      <Ionicons name="people-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.topMeta}>{item.people}</Text>
                    </View>
                    <View style={styles.topMetaItem}>
                      <Ionicons name="heart-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.topMeta}>{item.likes}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.nowHeader}>
              <Text style={styles.sectionTitle}>지금 올라온 동행</Text>
            </View>

            <View style={styles.companionList}>
              {filteredCompanions.map((post) => (
                <Pressable key={post.id} style={styles.companionCard}>
                  <View style={[styles.companionThumb, { backgroundColor: post.tint }]}>
                    <Ionicons name={post.icon} size={29} color={post.iconColor} />
                  </View>

                  <View style={styles.companionBody}>
                    <View style={styles.companionTitleRow}>
                      <Text style={styles.companionTitle} numberOfLines={1}>
                        {post.title}
                      </Text>
                      <View
                        style={[
                          styles.smallStatus,
                          post.status === '모집완료' && styles.smallStatusDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallStatusText,
                            post.status === '모집완료' && styles.smallStatusDoneText,
                          ]}
                        >
                          {post.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.companionMeta}>
                      {post.city} · {post.period}
                    </Text>

                    <View style={styles.tagRow}>
                      {post.tags.map((tag) => (
                        <View key={tag} style={styles.tagChip}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.companionFooter}>
                      <View style={styles.peopleRow}>
                        <Ionicons name="people-outline" size={14} color="#777777" />
                        <Text style={styles.peopleText}>
                          {post.current}/{post.total}명
                        </Text>
                      </View>
                      <View style={styles.verifyRow}>
                        <Ionicons
                          name={post.verified ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={post.verified ? GREEN : '#B7B7B7'}
                        />
                        <Text
                          style={[
                            styles.verifyText,
                            !post.verified && styles.verifyTextInactive,
                          ]}
                        >
                          학교인증
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterChips({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      {items.map((item) => {
        const active = selected === item;

        return (
          <Pressable
            key={item}
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.filterText, active && styles.filterTextActive]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 23,
    paddingTop: 84,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
  },
  iconBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 23,
    paddingBottom: 120,
  },
  tradeTypeBox: {
    height: 55,
    backgroundColor: '#F0F3F7',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 5,
    marginBottom: 16,
  },
  tradeTypeButton: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeTypeActive: {
    backgroundColor: '#FFFFFF',
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8F8F8F',
  },
  tradeTypeTextActive: {
    color: '#111111',
    fontWeight: '900',
  },
  searchBox: {
    height: 45,
    borderRadius: 13,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    paddingVertical: 0,
  },
  filterScroll: {
    marginHorizontal: -23,
    marginBottom: 15,
  },
  filterContent: {
    paddingHorizontal: 23,
    gap: 9,
  },
  filterChip: {
    minWidth: 63,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  filterChipActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  boardList: {
    gap: 12,
  },
  boardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
  },
  boardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B4B4B4',
  },
  boardTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: '#111111',
  },
  boardPreview: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: '#777777',
  },
  boardFooter: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '900',
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A5A5A5',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  topScroll: {
    marginHorizontal: -23,
  },
  topContent: {
    paddingHorizontal: 23,
    gap: 12,
  },
  topCard: {
    width: CARD_WIDTH,
    height: 208,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  topStatusText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topCity: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
  },
  topTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  topMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  topMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nowHeader: {
    marginTop: 25,
    marginBottom: 12,
  },
  companionList: {
    gap: 12,
  },
  companionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    padding: 14,
  },
  companionThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  companionBody: {
    flex: 1,
  },
  companionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companionTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: '#111111',
  },
  smallStatus: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#EEF3FF',
  },
  smallStatusDone: {
    backgroundColor: '#F2F2F2',
  },
  smallStatusText: {
    fontSize: 11,
    fontWeight: '900',
    color: BLUE,
  },
  smallStatusDoneText: {
    color: '#777777',
  },
  companionMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#777777',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  tagChip: {
    borderRadius: 6,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777777',
  },
  companionFooter: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  peopleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#555555',
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: '900',
    color: GREEN,
  },
  verifyTextInactive: {
    color: '#A5A5A5',
  },
});
