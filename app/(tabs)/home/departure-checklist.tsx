import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#0F2042';
const PACKING_DONE_STORAGE_KEY = 'departurePackingDoneState';
const PACKING_CATEGORIES_STORAGE_KEY = 'departurePackingCategories';
const oneDay = 1000 * 60 * 60 * 24;

type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  required?: boolean;
  due?: string;
  done: boolean;
};

type PackingCategory = {
  id: string;
  title: string;
  items: string[];
};

type SheetMode = 'category' | 'item' | null;

const CATEGORIES = ['비자', '거주', '보험', '은행/재정', '통신', '항공'];

const INITIAL_ITEMS: ChecklistItem[] = [
  { id: 'visa-apply', title: '비자 신청', category: '비자', required: true, due: '06.10', done: true },
  { id: 'visa-pickup', title: '비자 수령', category: '비자', required: true, due: '07.05', done: false },
  { id: 'housing-secure', title: '숙소 확보', category: '거주', required: true, due: '06.19', done: true },
  { id: 'insurance-join', title: '보험 가입', category: '보험', required: true, due: '06.16', done: true },
  { id: 'blocked-account', title: '슈페어콘토 개설', category: '은행/재정', required: true, due: '06.12', done: true },
  { id: 'card-ready', title: '해외결제 카드 준비', category: '은행/재정', due: '06.27', done: false },
  { id: 'esim-ready', title: '유심/eSIM 준비', category: '통신', due: '07.01', done: false },
  { id: 'flight-booking', title: '항공권 예약', category: '항공', required: true, due: '06.18', done: true },
];

const DEFAULT_PACKING_CATEGORIES: PackingCategory[] = [
  {
    id: 'daily',
    title: '생활용품',
    items: ['우산', '작은 우산', '수건', '손톱깎이', '장바구니', '멀티어댑터', '텀블러', '스탠드', '가위', '칼'],
  },
  {
    id: 'bath',
    title: '욕실용품',
    items: ['샴푸', '트리트먼트', '샤워타올/볼', '칫솔', '치약', '바디워시', '샤워헤드', '샤워필터'],
  },
  {
    id: 'kitchen',
    title: '주방용품',
    items: ['고무장갑', '수세미', '행주', '코인육수', '블럭국'],
  },
  {
    id: 'electronics',
    title: '전자기기',
    items: ['휴대폰 충전기', 'C타입 충전기', '워치 충전기', '노트북 충전기', '보조배터리', '에어팟', '노트북', '아이패드', '블루투스 마우스', '건전지', '고데기', '카메라'],
  },
  {
    id: 'travel',
    title: '여행용품',
    items: ['도난방지줄', '자물쇠', '자전거 자물쇠', '안대', '마스크', '백팩', '에코백', '크로스백'],
  },
  {
    id: 'clothes',
    title: '의류',
    items: ['잠옷', '반팔티', '얇은 긴팔', '바람막이', '후드집업', '후드티', '츄리닝바지', '패딩', '코트', '속옷', '양말', '수면양말'],
  },
  {
    id: 'shoes',
    title: '신발',
    items: ['크록스', '운동화', '러닝화'],
  },
  {
    id: 'sports',
    title: '운동용품',
    items: ['레깅스', '반바지', '운동 반팔', '수영복'],
  },
  {
    id: 'cosmetics',
    title: '화장품',
    items: ['크림', '스킨', '앰플', '콜라겐', '립밤/바세린', '핸드크림', '머리빗', '머리끈', '오일 클렌저', '폼 클렌저', '선크림', '쿠션', '파운데이션', '브로우카라', '틴트', '쉐딩', '블러셔', '마스카라', '아이라이너', '브러쉬', '향수', '화장솜', '면봉'],
  },
  {
    id: 'medicine',
    title: '상비약',
    items: ['타이레놀', '종합감기약', '소화제', '배탈약', '인공눈물', '후시딘', '마데카솔', '여드름 패치', '여드름 연고', '파스', '기침약', '밴드', '벌레 물렸을 때 바르는 약', '유산균'],
  },
  {
    id: 'etc',
    title: '기타',
    items: ['파일', '다이어리', '필기구', '서류 메일 보내기', '휴대폰 정지', '마스크팩'],
  },
];

const defaultOpenCategories = DEFAULT_PACKING_CATEGORIES.reduce<Record<string, boolean>>(
  (acc, category) => {
    acc[category.id] = ['daily', 'electronics', 'medicine'].includes(category.id);
    return acc;
  },
  {},
);

const makePackingId = (categoryId: string, itemIndex: number) => `${categoryId}-${itemIndex}`;

const parseDepartureDate = (value: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffDays = (target: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedTarget = new Date(target);
  normalizedTarget.setHours(0, 0, 0, 0);

  return Math.ceil((normalizedTarget.getTime() - today.getTime()) / oneDay);
};

export default function DepartureChecklistScreen() {
  const [selectedCategory, setSelectedCategory] = useState('비자');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [packingCategories, setPackingCategories] = useState(DEFAULT_PACKING_CATEGORIES);
  const [packingDone, setPackingDone] = useState<Record<string, boolean>>({});
  const [openPackingCategories, setOpenPackingCategories] = useState(defaultOpenCategories);
  const [packingHydrated, setPackingHydrated] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryItems, setNewCategoryItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [targetPackingCategoryId, setTargetPackingCategoryId] = useState(DEFAULT_PACKING_CATEGORIES[0].id);

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const departureDdayText = useMemo(() => {
    if (!departureDate) return '출국일을 설정해주세요';

    return `출국까지 D-${Math.max(0, diffDays(departureDate))}`;
  }, [departureDate]);

  useFocusEffect(
    useCallback(() => {
      const loadDepartureDate = async () => {
        const savedDepartureDate = await AsyncStorage.getItem('departureDate');
        setDepartureDate(parseDepartureDate(savedDepartureDate));
      };

      loadDepartureDate();
    }, []),
  );

  useEffect(() => {
    const loadPackingState = async () => {
      try {
        const [savedDone, savedCategories] = await Promise.all([
          AsyncStorage.getItem(PACKING_DONE_STORAGE_KEY),
          AsyncStorage.getItem(PACKING_CATEGORIES_STORAGE_KEY),
        ]);

        if (savedDone) {
          setPackingDone(JSON.parse(savedDone));
        }

        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories) as PackingCategory[];
          setPackingCategories(parsedCategories);
          setTargetPackingCategoryId(parsedCategories[0]?.id ?? DEFAULT_PACKING_CATEGORIES[0].id);
          setOpenPackingCategories((prev) => {
            const next = { ...prev };
            parsedCategories.forEach((category) => {
              if (next[category.id] === undefined) next[category.id] = false;
            });
            return next;
          });
        }
      } finally {
        setPackingHydrated(true);
      }
    };

    loadPackingState();
  }, []);

  useEffect(() => {
    if (!packingHydrated) return;
    AsyncStorage.setItem(PACKING_DONE_STORAGE_KEY, JSON.stringify(packingDone));
  }, [packingDone, packingHydrated]);

  useEffect(() => {
    if (!packingHydrated) return;
    AsyncStorage.setItem(PACKING_CATEGORIES_STORAGE_KEY, JSON.stringify(packingCategories));
  }, [packingCategories, packingHydrated]);

  const closeSheet = () => {
    setSheetMode(null);
    setNewCategoryName('');
    setNewCategoryItems([]);
    setNewItemName('');
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  const togglePackingCategory = (id: string) => {
    setOpenPackingCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePackingItem = (id: string) => {
    setPackingDone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addPackingCategory = () => {
    const title = newCategoryName.trim();
    if (!title) return;

    const id = `custom-${Date.now()}`;
    const items = newCategoryItems.map((item) => item.trim()).filter(Boolean);
    setPackingCategories((prev) => [...prev, { id, title, items }]);
    setOpenPackingCategories((prev) => ({ ...prev, [id]: true }));
    setTargetPackingCategoryId(id);
    closeSheet();
  };

  const updateNewCategoryItem = (index: number, value: string) => {
    setNewCategoryItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const addPackingItem = () => {
    const title = newItemName.trim();
    if (!title) return;

    setPackingCategories((prev) =>
      prev.map((category) =>
        category.id === targetPackingCategoryId
          ? { ...category, items: [...category.items, title] }
          : category,
      ),
    );
    setOpenPackingCategories((prev) => ({ ...prev, [targetPackingCategoryId]: true }));
    closeSheet();
  };

  const totalPackingItems = packingCategories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>나의 출국 준비</Text>

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
        <View style={styles.dDayCard}>
          <Text style={styles.dDay}>{departureDdayText}</Text>
          <Text style={styles.dDayHint}>출국 준비와 짐싸기를 단계별로 관리하세요</Text>
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
          <Text style={styles.sectionTitle}>출국 준비 관리</Text>
          <Text style={styles.sectionMeta}>{filteredItems.length}개</Text>
        </View>

        <View style={styles.checklistCard}>
          {filteredItems.map((item) => (
            <ChecklistRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} />
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={38} color="#CBD5E1" />
              <Text style={styles.emptyText}>표시할 준비 항목이 없습니다.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>출국 직전 짐싸기</Text>
          <Text style={styles.sectionMeta}>{totalPackingItems}개</Text>
        </View>

        <View style={styles.packingList}>
          {packingCategories.map((category) => {
            const doneCount = category.items.filter(
              (_, itemIndex) => packingDone[makePackingId(category.id, itemIndex)],
            ).length;
            const open = openPackingCategories[category.id];

            return (
              <View key={category.id} style={styles.packingCategoryCard}>
                <TouchableOpacity
                  style={styles.packingCategoryHeader}
                  onPress={() => togglePackingCategory(category.id)}
                  activeOpacity={0.86}
                >
                  <View style={styles.packingCategoryTitleWrap}>
                    <Ionicons
                      name={open ? 'chevron-down' : 'chevron-forward'}
                      size={18}
                      color={NAVY}
                    />
                    <Text style={styles.packingCategoryTitle}>{category.title}</Text>
                  </View>
                  <Text style={styles.packingCategoryMeta}>
                    {doneCount}/{category.items.length}
                  </Text>
                </TouchableOpacity>

                {open && (
                  <View style={styles.packingItems}>
                    {category.items.map((title, itemIndex) => {
                      const id = makePackingId(category.id, itemIndex);

                      return (
                        <PackingRow
                          key={id}
                          title={title}
                          done={!!packingDone[id]}
                          onToggle={() => togglePackingItem(id)}
                        />
                      );
                    })}
                    {category.items.length === 0 && (
                      <Text style={styles.packingEmptyText}>아직 추가된 준비물이 없습니다.</Text>
                    )}
                    <TouchableOpacity
                      style={styles.addPackingItemButton}
                      onPress={() => {
                        setTargetPackingCategoryId(category.id);
                        setSheetMode('item');
                      }}
                      activeOpacity={0.86}
                    >
                      <Ionicons name="add" size={16} color={NAVY} />
                      <Text style={styles.addPackingItemText}>항목 추가</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetMode('category')}
        activeOpacity={0.88}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={sheetMode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeSheet} />
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              {sheetMode === 'category' && (
                <>
                  <Text style={styles.sheetTitle}>짐 카테고리 추가</Text>
                  <Text style={styles.inputLabel}>카테고리명</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="예: 취미용품"
                    placeholderTextColor="#94A3B8"
                  />

                  {newCategoryItems.map((item, index) => (
                    <View key={index} style={styles.categoryItemInputGroup}>
                      <Text style={styles.inputLabel}>항목 {index + 1}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={item}
                        onChangeText={(value) => updateNewCategoryItem(index, value)}
                        placeholder={index === 0 ? '예: 카메라' : '예: 삼각대'}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addMoreInputButton}
                    onPress={() => setNewCategoryItems((prev) => [...prev, ''])}
                    activeOpacity={0.86}
                  >
                    <Ionicons name="add" size={16} color={NAVY} />
                    <Text style={styles.addMoreInputText}>짐 항목 추가</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !newCategoryName.trim() && styles.submitButtonDisabled,
                    ]}
                    onPress={addPackingCategory}
                    activeOpacity={0.86}
                  >
                    <Text style={styles.submitButtonText}>추가</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet} activeOpacity={0.86}>
                    <Text style={styles.sheetCancelText}>취소</Text>
                  </TouchableOpacity>
                </>
              )}

              {sheetMode === 'item' && (
                <>
                  <Text style={styles.sheetTitle}>짐 항목 추가</Text>
                  <Text style={styles.inputLabel}>항목명</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newItemName}
                    onChangeText={setNewItemName}
                    placeholder="예: 멀티탭"
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    style={[styles.submitButton, !newItemName.trim() && styles.submitButtonDisabled]}
                    onPress={addPackingItem}
                    activeOpacity={0.86}
                  >
                    <Text style={styles.submitButtonText}>추가</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet} activeOpacity={0.86}>
                    <Text style={styles.sheetCancelText}>취소</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ChecklistRow({
  item,
  onToggle,
}: {
  item: ChecklistItem;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.itemRow, item.done && styles.itemRowDone]}
      onPress={onToggle}
      activeOpacity={0.86}
    >
      <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
        {item.done && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemTitleRow}>
          <Text style={[styles.itemTitle, item.done && styles.itemTitleDone]}>{item.title}</Text>
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
  );
}

function PackingRow({
  title,
  done,
  onToggle,
}: {
  title: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.packingRow} onPress={onToggle} activeOpacity={0.86}>
      <View style={[styles.packingCheckBox, done && styles.checkBoxDone]}>
        {done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <Text style={[styles.packingItemText, done && styles.itemTitleDone]}>{title}</Text>
    </TouchableOpacity>
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
    paddingBottom: 150,
  },
  dDayCard: {
    borderRadius: 16,
    backgroundColor: '#F7F8FA',
    padding: 18,
  },
  dDay: {
    fontSize: 22,
    fontWeight: '900',
    color: NAVY,
  },
  dDayHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#64748B',
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
    color: '#2F66D0',
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
  packingList: {
    gap: 10,
  },
  packingCategoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  packingCategoryHeader: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packingCategoryTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packingCategoryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: NAVY,
  },
  packingCategoryMeta: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  packingItems: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 4,
  },
  packingRow: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  packingCheckBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  packingItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: NAVY,
  },
  packingEmptyText: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
  },
  addPackingItemButton: {
    minHeight: 44,
    marginHorizontal: 12,
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addPackingItemText: {
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 34,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 32, 66, 0.22)',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sheetScrollContent: {
    paddingBottom: 34,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: NAVY,
    marginBottom: 14,
  },
  sheetCancel: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#64748B',
  },
  inputLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  categoryItemInputGroup: {
    marginTop: 12,
  },
  addMoreInputButton: {
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  addMoreInputText: {
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
  },
  submitButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.36,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
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
