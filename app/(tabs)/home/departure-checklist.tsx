import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';

type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  required?: boolean;
  due?: string;
  done: boolean;
};

const CATEGORIES = ['전체', '서류', '비자', '항공', '보험', '숙소', '금융', '짐싸기', '도착 후'];

const INITIAL_ITEMS: ChecklistItem[] = [
  { id: 'doc-1', title: '여권 유효기간 확인', category: '서류', required: true, due: '06.02', done: true },
  { id: 'doc-2', title: '입학허가서 저장', category: '서류', required: true, due: '06.05', done: true },
  { id: 'doc-3', title: '증명사진 준비', category: '서류', due: '06.08', done: true },
  { id: 'visa-1', title: '비자 예약', category: '비자', required: true, due: '06.10', done: true },
  { id: 'visa-2', title: '재정증명 준비', category: '비자', required: true, due: '06.12', done: true },
  { id: 'insurance-1', title: '보험 증명서 준비', category: '보험', required: true, due: '06.16', done: true },
  { id: 'flight-1', title: '항공권 예약', category: '항공', required: true, due: '06.18', done: true },
  { id: 'housing-1', title: '기숙사 신청 확인', category: '숙소', required: true, due: '06.19', done: true },
  { id: 'flight-2', title: '도착일 교통편 확인', category: '항공', due: '06.24', done: true },
  { id: 'money-1', title: '해외 결제 카드 준비', category: '금융', due: '06.27', done: true },
  { id: 'money-2', title: '환전 또는 계좌 준비', category: '금융', required: true, due: '06.30', done: true },
  { id: 'life-1', title: '유심/eSIM 준비', category: '짐싸기', due: '07.01', done: true },
  { id: 'pack-1', title: '상비약과 처방전 챙기기', category: '짐싸기', due: '07.04', done: false },
  { id: 'pack-2', title: '계절별 옷 압축 정리', category: '짐싸기', due: '07.07', done: false },
  { id: 'arrival-1', title: '거주지 등록', category: '도착 후', required: true, due: '도착 후 7일', done: false },
  { id: 'arrival-2', title: '학교 오리엔테이션 확인', category: '도착 후', due: '도착 첫 주', done: false },
  { id: 'arrival-3', title: '현지 보험/교통카드 확인', category: '도착 후', due: '도착 첫 주', done: false },
  { id: 'life-2', title: '중요 서류 클라우드 백업', category: '서류', due: '07.09', done: false },
];

export default function DepartureChecklistScreen() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [hideDone, setHideDone] = useState(false);
  const [items, setItems] = useState(INITIAL_ITEMS);

  const doneCount = items.filter((item) => item.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selectedCategory === '전체' || item.category === selectedCategory;
      const matchDone = !hideDone || !item.done;
      return matchCategory && matchDone;
    });
  }, [hideDone, items, selectedCategory]);

  const categoryProgress = useMemo(() => {
    return CATEGORIES.filter((category) => category !== '전체')
      .map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        const categoryDone = categoryItems.filter((item) => item.done).length;
        const percent =
          categoryItems.length === 0 ? 0 : Math.round((categoryDone / categoryItems.length) * 100);

        return { category, done: categoryDone, total: categoryItems.length, percent };
      })
      .filter((item) => item.total > 0);
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>출국 준비 체크리스트</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={21} color={NAVY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.dDay}>출국까지 D-43</Text>
              <Text style={styles.summarySub}>완료한 항목 {doneCount}/{items.length}</Text>
            </View>

            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progress}%</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.summaryBottom}>
            <Text style={styles.summaryCaption}>전체 준비도</Text>
            <Text style={styles.summaryHint}>비자와 항공은 마감일 기준으로 먼저 확인하세요</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.86}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>직접 항목 추가</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleWrap}
            onPress={() => setHideDone((prev) => !prev)}
            activeOpacity={0.86}
          >
            <View style={[styles.switchTrack, hideDone && styles.switchTrackOn]}>
              <View style={[styles.switchThumb, hideDone && styles.switchThumbOn]} />
            </View>
            <Text style={styles.toggleText}>완료 항목 숨기기</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((category) => {
            const active = category === selectedCategory;

            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.85}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>카테고리별 진행률</Text>
          <Text style={styles.sectionMeta}>실시간</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.progressScroll}
          contentContainerStyle={styles.progressContent}
        >
          {categoryProgress.map((item) => (
            <View key={item.category} style={styles.categoryProgressCard}>
              <Text style={styles.progressCategory}>{item.category}</Text>
              <Text style={styles.progressValue}>{item.percent}%</Text>
              <View style={styles.miniTrack}>
                <View style={[styles.miniFill, { width: `${item.percent}%` }]} />
              </View>
              <Text style={styles.progressSmall}>
                {item.done}/{item.total} 완료
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>준비 항목</Text>
          <Text style={styles.sectionMeta}>{filteredItems.length}개</Text>
        </View>

        <View style={styles.checklistCard}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, item.done && styles.itemRowDone]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.86}
            >
              <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
                {item.done && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
              </View>

              <View style={styles.itemBody}>
                <View style={styles.itemTitleRow}>
                  <Text style={[styles.itemTitle, item.done && styles.itemTitleDone]}>
                    {item.title}
                  </Text>
                  {item.required && (
                    <View style={styles.requiredTag}>
                      <Text style={styles.requiredText}>필수</Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemMetaRow}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                  {item.due && (
                    <View style={styles.dueWrap}>
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      <Text style={styles.dueText}>{item.due}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={38} color="#CBD5E1" />
              <Text style={styles.emptyText}>표시할 준비 항목이 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  headerRight: {
    width: 38,
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: NAVY,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dDay: {
    fontSize: 22,
    fontWeight: '900',
    color: NAVY,
  },
  summarySub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE,
  },
  progressBarTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
    marginTop: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: NAVY,
  },
  summaryBottom: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCaption: {
    fontSize: 12,
    fontWeight: '900',
    color: NAVY,
  },
  summaryHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  addButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  toggleWrap: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  switchTrack: {
    width: 34,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    padding: 2,
  },
  switchTrackOn: {
    backgroundColor: NAVY,
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOn: {
    transform: [{ translateX: 14 }],
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: NAVY,
  },
  categoryScroll: {
    marginHorizontal: -20,
    marginTop: 18,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
  },
  progressScroll: {
    marginHorizontal: -20,
  },
  progressContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryProgressCard: {
    width: 118,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 13,
  },
  progressCategory: {
    fontSize: 12,
    fontWeight: '900',
    color: NAVY,
  },
  progressValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
    color: BLUE,
  },
  miniTrack: {
    marginTop: 9,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: NAVY,
  },
  progressSmall: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  checklistCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemRowDone: {
    backgroundColor: '#FBFDFF',
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkBoxDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
    lineHeight: 20,
  },
  itemTitleDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  requiredTag: {
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '900',
    color: BLUE,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },
  categoryTag: {
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  dueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 38,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
});
