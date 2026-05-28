import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

const BLUE = '#102BE0';
const GREEN = '#40A66A';

const communityTabs = ['자유 게시판', '동행 구하기'] as const;
const boardFilters = ['전체', '파견 전', '파견 중', '귀국 후'];
const countryFilters = ['전체 국가', '프랑스', '독일', '스페인', '네덜란드'];
const companionStatusFilters = ['전체', '모집중', '모집완료'];
const sortFilters = ['최신순', '마감임박순'];

type CommunityTab = (typeof communityTabs)[number];
type DropdownKey = 'boardCountry' | 'status' | 'country' | 'sort' | null;
type DatePickerTarget = 'start' | 'end' | null;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDate = (dateText: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

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

const companionPosts = [
  {
    id: 1,
    icon: 'map-outline' as const,
    title: '뮌헨 맥주 축제 같이 가요',
    country: '독일',
    cityName: '뮌헨',
    period: '04/01 - 04/02',
    dateValue: '2026-04-01',
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
    country: '네덜란드',
    cityName: '암스테르담',
    period: '04/06',
    dateValue: '2026-04-06',
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
    country: '프랑스',
    cityName: '파리',
    period: '04/12 - 04/13',
    dateValue: '2026-04-12',
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<CommunityTab>('자유 게시판');
  const [selectedBoardFilter, setSelectedBoardFilter] = useState('전체');
  const [selectedBoardCountry, setSelectedBoardCountry] = useState('전체 국가');
  const [boardKeyword, setBoardKeyword] = useState('');
  const [selectedCompanionStatus, setSelectedCompanionStatus] = useState('모집중');
  const [selectedCompanionCountry, setSelectedCompanionCountry] = useState('전체 국가');
  const [companionStartDate, setCompanionStartDate] = useState('');
  const [companionEndDate, setCompanionEndDate] = useState('');
  const [selectedCompanionSort, setSelectedCompanionSort] = useState('최신순');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const isWide = width >= 768;

  const filteredBoardPosts = useMemo(
    () => {
      const keyword = boardKeyword.trim().toLowerCase();

      return boardPosts.filter((post) => {
        const matchesStatus =
          selectedBoardFilter === '전체' || post.status === selectedBoardFilter;
        const matchesCountry =
          selectedBoardCountry === '전체 국가' || post.country === selectedBoardCountry;
        const matchesKeyword =
          keyword.length === 0 ||
          `${post.title} ${post.preview}`.toLowerCase().includes(keyword);

        return matchesStatus && matchesCountry && matchesKeyword;
      });
    },
    [boardKeyword, selectedBoardCountry, selectedBoardFilter],
  );

  const filteredCompanions = useMemo(
    () => {
      const filtered = companionPosts.filter((post) => {
        const matchesStatus =
          selectedCompanionStatus === '전체' ||
          post.status === selectedCompanionStatus;
        const matchesCountry =
          selectedCompanionCountry === '전체 국가' ||
          post.country === selectedCompanionCountry;
        const matchesDate =
          (!companionStartDate || post.dateValue >= companionStartDate) &&
          (!companionEndDate || post.dateValue <= companionEndDate);

        return matchesStatus && matchesCountry && matchesDate;
      });

      return [...filtered].sort((a, b) =>
        selectedCompanionSort === '마감임박순'
          ? a.dateValue.localeCompare(b.dateValue)
          : b.id - a.id,
      );
    },
    [
      companionEndDate,
      companionStartDate,
      selectedCompanionCountry,
      selectedCompanionSort,
      selectedCompanionStatus,
    ],
  );

  const openCompanionDatePicker = (target: Exclude<DatePickerTarget, null>) => {
    const currentValue = target === 'start' ? companionStartDate : companionEndDate;
    setDraftDate(parseDate(currentValue) || new Date());
    setDatePickerTarget(target);
  };

  const handleConfirmDate = () => {
    const nextDate = formatDate(draftDate);

    if (datePickerTarget === 'start') {
      setCompanionStartDate(nextDate);
      if (companionEndDate && companionEndDate < nextDate) {
        setCompanionEndDate('');
      }
    }

    if (datePickerTarget === 'end') {
      setCompanionEndDate(nextDate);
      if (companionStartDate && companionStartDate > nextDate) {
        setCompanionStartDate('');
      }
    }

    setDatePickerTarget(null);
  };

  const handleFabPress = () => {
    router.push({
      pathname: '/community-write',
      params: { type: activeTab === '자유 게시판' ? 'free' : 'companion' },
    } as never);
  };

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
        contentContainerStyle={[
          styles.content,
          isWide && styles.contentWide,
        ]}
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
                placeholder="글 제목, 내용 검색"
                placeholderTextColor="#9A9A9A"
                value={boardKeyword}
                onChangeText={setBoardKeyword}
              />
            </View>

            <DropdownFilter
              label={selectedBoardCountry}
              items={countryFilters}
              selected={selectedBoardCountry}
              open={openDropdown === 'boardCountry'}
              onToggle={() =>
                setOpenDropdown(openDropdown === 'boardCountry' ? null : 'boardCountry')
              }
              onSelect={(item) => {
                setSelectedBoardCountry(item);
                setOpenDropdown(null);
              }}
            />

            <FilterChips
              items={boardFilters}
              selected={selectedBoardFilter}
              onSelect={setSelectedBoardFilter}
            />

            <View style={[styles.boardList, isWide && styles.gridList]}>
              {filteredBoardPosts.map((post) => (
                <Pressable
                  key={post.id}
                  style={[styles.boardCard, isWide && styles.gridCard]}
                >
                  <View style={styles.boardTopRow}>
                    <View style={[styles.statusBadge, { backgroundColor: post.color }]}>
                      <Text style={[styles.statusBadgeText, { color: post.textColor }]}>
                        {post.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.boardTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={styles.boardPreview} numberOfLines={1}>
                    {post.preview}
                  </Text>

                  <View style={styles.boardFooter}>
                    <View style={styles.authorRow}>
                      <Text style={styles.metaText}>
                        익명 · {post.country} {post.status}
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
                      <Text style={styles.timeText}>{post.time}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.companionFilterPanel}>
              <View style={styles.filterTopRow}>
                <View style={styles.filterTitleRow}>
                  <Ionicons name="options-outline" size={16} color={BLUE} />
                  <Text style={styles.filterPanelTitle}>필터</Text>
                </View>

                {(companionStartDate || companionEndDate) && (
                  <Pressable
                    style={styles.clearDateButton}
                    onPress={() => {
                      setCompanionStartDate('');
                      setCompanionEndDate('');
                    }}
                  >
                    <Ionicons name="refresh" size={13} color="#666666" />
                    <Text style={styles.clearDateText}>날짜 초기화</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.compactFilterBar}>
                <DropdownFilter
                  compact
                  label={selectedCompanionStatus}
                  items={companionStatusFilters}
                  selected={selectedCompanionStatus}
                  open={openDropdown === 'status'}
                  onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  onSelect={(item) => {
                    setSelectedCompanionStatus(item);
                    setOpenDropdown(null);
                  }}
                />
                <DropdownFilter
                  compact
                  label={selectedCompanionCountry}
                  items={countryFilters}
                  selected={selectedCompanionCountry}
                  open={openDropdown === 'country'}
                  onToggle={() =>
                    setOpenDropdown(openDropdown === 'country' ? null : 'country')
                  }
                  onSelect={(item) => {
                    setSelectedCompanionCountry(item);
                    setOpenDropdown(null);
                  }}
                />
                <DropdownFilter
                  compact
                  label={selectedCompanionSort}
                  items={sortFilters}
                  selected={selectedCompanionSort}
                  open={openDropdown === 'sort'}
                  onToggle={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  onSelect={(item) => {
                    setSelectedCompanionSort(item);
                    setOpenDropdown(null);
                  }}
                />
              </View>

              <View style={styles.dateRangeRow}>
                <DateRangeButton
                  label="시작일"
                  value={companionStartDate}
                  onPress={() => openCompanionDatePicker('start')}
                />
                <View style={styles.dateRangeDivider} />
                <DateRangeButton
                  label="종료일"
                  value={companionEndDate}
                  onPress={() => openCompanionDatePicker('end')}
                />
              </View>
            </View>

            <View style={styles.nowHeader}>
              <Text style={styles.sectionTitle}>조건에 맞는 동행</Text>
            </View>

            <View style={[styles.companionList, isWide && styles.gridList]}>
              {filteredCompanions.map((post) => (
                <Pressable
                  key={post.id}
                  style={[styles.companionCard, isWide && styles.gridCard]}
                >
                  <View style={[styles.companionThumb, { backgroundColor: post.tint }]}>
                    <Ionicons name={post.icon} size={23} color={post.iconColor} />
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
                      {post.country} · {post.cityName} · {post.period}
                    </Text>

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

      <Modal
        transparent
        visible={datePickerTarget !== null}
        animationType="slide"
        onRequestClose={() => setDatePickerTarget(null)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setDatePickerTarget(null)}
          />

          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setDatePickerTarget(null)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>

              <Text style={styles.pickerTitle}>
                {datePickerTarget === 'start' ? '시작일 선택' : '종료일 선택'}
              </Text>

              <Pressable onPress={handleConfirmDate}>
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              textColor="#111111"
              themeVariant="light"
              style={styles.iosPicker}
              onChange={(event, date) => {
                if (date) {
                  setDraftDate(date);
                }
              }}
            />
          </View>
        </View>
      </Modal>

      <Pressable style={styles.fab} onPress={handleFabPress}>
        <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>
          {activeTab === '자유 게시판' ? '글쓰기' : '동행 모집'}
        </Text>
      </Pressable>
    </View>
  );
}

function DropdownFilter({
  label,
  items,
  selected,
  open,
  onToggle,
  onSelect,
  compact = false,
}: {
  label: string;
  items: string[];
  selected: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (item: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.dropdownWrap, compact && styles.dropdownWrapCompact]}>
      <Pressable
        style={[styles.dropdownButton, compact && styles.dropdownButtonCompact]}
        onPress={onToggle}
      >
        <Text style={styles.dropdownText} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={15}
          color="#555555"
        />
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {items.map((item) => {
            const active = selected === item;

            return (
              <Pressable
                key={item}
                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    active && styles.dropdownItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function DateRangeButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const active = value.length > 0;

  return (
    <Pressable
      style={[styles.dateRangeButton, active && styles.dateRangeButtonActive]}
      onPress={onPress}
    >
      <View style={styles.dateRangeLabelRow}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={active ? BLUE : '#8A8A8A'}
        />
        <Text style={[styles.dateRangeLabel, active && styles.dateRangeLabelActive]}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.dateRangeValue, active && styles.dateRangeValueActive]}
        numberOfLines={1}
      >
        {active ? value : '날짜 선택'}
      </Text>
    </Pressable>
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
  contentWide: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
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
  dropdownWrap: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  dropdownWrapCompact: {
    marginBottom: 0,
    flexShrink: 0,
  },
  dropdownButton: {
    minWidth: 128,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
  },
  dropdownButtonCompact: {
    minWidth: 98,
    maxWidth: 150,
    height: 40,
    borderRadius: 12,
    borderColor: '#E6EAF2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#333333',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    left: 0,
    minWidth: 132,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    zIndex: 50,
  },
  dropdownItem: {
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#F0F3F7',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
  },
  dropdownItemTextActive: {
    fontWeight: '900',
    color: '#111111',
  },
  boardList: {
    gap: 12,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  boardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 13,
  },
  gridCard: {
    width: '48.7%',
  },
  boardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#B4B4B4',
  },
  boardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: '#111111',
  },
  boardPreview: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#777777',
  },
  boardFooter: {
    marginTop: 9,
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
  metaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  compactFilterBar: {
    position: 'relative',
    zIndex: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  companionFilterPanel: {
    position: 'relative',
    zIndex: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    backgroundColor: '#F8FAFD',
    padding: 13,
    marginBottom: 18,
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  filterTopRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 11,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPanelTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
  },
  clearDateButton: {
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF1F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  clearDateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#666666',
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dateRangeButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  dateRangeButtonActive: {
    borderColor: '#C9D4FF',
    backgroundColor: '#F4F7FF',
  },
  dateRangeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateRangeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8A8A',
  },
  dateRangeLabelActive: {
    color: BLUE,
  },
  dateRangeValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '900',
    color: '#A0A0A0',
  },
  dateRangeValueActive: {
    color: '#111111',
  },
  dateRangeDivider: {
    width: 10,
    height: 1,
    borderRadius: 1,
    backgroundColor: '#B9C0CC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  nowHeader: {
    marginTop: 0,
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
    padding: 12,
  },
  companionThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
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
    marginTop: 5,
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
    marginTop: 9,
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
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 17, 0.32)',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingBottom: 28,
    overflow: 'hidden',
  },
  pickerHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F4',
  },
  pickerCancel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#777777',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  pickerDone: {
    fontSize: 15,
    fontWeight: '900',
    color: BLUE,
  },
  iosPicker: {
    height: 210,
    backgroundColor: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 23,
    bottom: 30,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
