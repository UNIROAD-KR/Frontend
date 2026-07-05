import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppBackButton } from '@/components/ui/app-back-button';
import { saveMarketDraft } from '../../../src/storage/marketDraft';

type CategoryName =
  | '주방 용품'
  | '욕실 / 청소 용품'
  | '생활 용품'
  | '침구류'
  | '각종 소스류'
  | '기타';

type ItemState = {
  name: string;
  originalName: string;
  checked: boolean;
  quantity: number;
  editable?: boolean;
  editing?: boolean;
};

type RawItemState = Omit<ItemState, 'originalName'>;

const BLUE = '#123F9F';

const categories: CategoryName[] = [
  '주방 용품',
  '욕실 / 청소 용품',
  '생활 용품',
  '침구류',
  '각종 소스류',
  '기타',
];

const rawInitialItems: Record<CategoryName, RawItemState[]> = {
  '주방 용품': [
    { name: '냄비', checked: false, quantity: 1 },
    { name: '브리타 정수기', checked: false, quantity: 1 },
    { name: '프라이팬', checked: false, quantity: 1 },
    { name: '주방 소도구(주걱·집게)', checked: false, quantity: 1 },
    { name: '밥솥 (1인용)', checked: false, quantity: 1 },
    { name: '주방 칼', checked: false, quantity: 1 },
    { name: '밥·국 그릇', checked: false, quantity: 1 },
    { name: '주방 가위', checked: false, quantity: 1 },
    { name: '접시', checked: false, quantity: 1 },
    { name: '락앤락 통', checked: false, quantity: 1 },
    { name: '컵', checked: false, quantity: 1 },
    { name: '수저세트', checked: false, quantity: 1 },
  ],
  '욕실 / 청소 용품': [
    { name: '청소 밀대', checked: false, quantity: 1 },
    { name: '빨래 건조대', checked: false, quantity: 1 },
    { name: '빗자루 세트', checked: false, quantity: 1 },
    { name: '빨래 망', checked: false, quantity: 1 },
    { name: '욕실 매트', checked: false, quantity: 1 },
    { name: '빨래 집게', checked: false, quantity: 1 },
    { name: '욕실용 슬리퍼', checked: false, quantity: 1 },
    { name: '세제류', checked: false, quantity: 1 },
  ],
  '생활 용품': [
    { name: '드라이기', checked: false, quantity: 1 },
    { name: '멀티탭', checked: false, quantity: 1 },
    { name: '와이파이 공유기', checked: false, quantity: 1 },
    { name: '옷걸이', checked: false, quantity: 1 },
    { name: '전신 거울', checked: false, quantity: 1 },
    { name: '탁상 스탠드', checked: false, quantity: 1 },
    { name: '쓰레기통', checked: false, quantity: 1 },
    { name: '실내 슬리퍼', checked: false, quantity: 1 },
  ],
  침구류: [
    { name: '이불', checked: false, quantity: 1 },
    { name: '베개', checked: false, quantity: 1 },
    { name: '침대 시트', checked: false, quantity: 1 },
    { name: '담요', checked: false, quantity: 1 },
    { name: '매트리스 커버', checked: false, quantity: 1 },
    { name: '베개 커버', checked: false, quantity: 1 },
  ],
  '각종 소스류': [
    { name: '간장', checked: false, quantity: 1 },
    { name: '고추장', checked: false, quantity: 1 },
    { name: '참기름', checked: false, quantity: 1 },
    { name: '식용유', checked: false, quantity: 1 },
    { name: '소금', checked: false, quantity: 1 },
    { name: '설탕', checked: false, quantity: 1 },
    { name: '후추', checked: false, quantity: 1 },
    { name: '파스타 소스', checked: false, quantity: 1 },
  ],
  기타: [
    { name: '보조배터리', checked: false, quantity: 1 },
    { name: '우산', checked: false, quantity: 1 },
    { name: '캐리어', checked: false, quantity: 1 },
    { name: '문구류', checked: false, quantity: 1 },
  ],
};

const makeInitialItems = (): Record<CategoryName, ItemState[]> => {
  return Object.fromEntries(
    Object.entries(rawInitialItems).map(([category, list]) => [
      category,
      list.map((item) => ({
        ...item,
        originalName: item.name,
      })),
    ]),
  ) as Record<CategoryName, ItemState[]>;
};

const parseJsonArray = <T,>(value?: string): T[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const parseDraftItems = (
  value?: string,
): Record<CategoryName, ItemState[]> | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<CategoryName, ItemState[]>;

    if (!parsed || typeof parsed !== 'object') return null;

    const fallback = makeInitialItems();

    return Object.fromEntries(
      categories.map((category) => [
        category,
        Array.isArray(parsed[category])
          ? parsed[category].map((item) => ({
              ...item,
              originalName: item.originalName ?? item.name,
            }))
          : fallback[category],
      ]),
    ) as Record<CategoryName, ItemState[]>;
  } catch {
    return null;
  }
};

export default function MarketCategoryPage() {
  const params = useLocalSearchParams<{
    type?: string;
    title?: string;
    content?: string;
    price?: string;
    region?: string;
    returnDate?: string;
    semester?: string;
    photoUrl?: string;
    photos?: string;
    allowOffer?: string;
    draftSelectedCategories?: string;
    draftItemsByCategory?: string;
  }>();

  const [selectedCategories, setSelectedCategories] = useState<CategoryName[]>(
    () => parseJsonArray<CategoryName>(params.draftSelectedCategories),
  );

  const [itemsByCategory, setItemsByCategory] = useState<
    Record<CategoryName, ItemState[]>
  >(() => parseDraftItems(params.draftItemsByCategory) ?? makeInitialItems());

  const hasSelectedItem = useMemo(() => {
    return selectedCategories.some((category) =>
      itemsByCategory[category].some(
        (item) => item.checked && item.name.trim().length > 0,
      ),
    );
  }, [itemsByCategory, selectedCategories]);

  const toggleCategory = (category: CategoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const toggleItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              checked: !item.checked,
              editing: item.checked ? false : item.editing,
              quantity:
                !item.checked && item.quantity === 0 ? 1 : item.quantity,
            }
          : item,
      ),
    }));
  };

  const changeQuantity = (
    category: CategoryName,
    index: number,
    type: 'minus' | 'plus',
  ) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          quantity:
            type === 'plus'
              ? item.quantity + 1
              : Math.max(1, item.quantity - 1),
        };
      }),
    }));
  };

  const changeItemName = (
    category: CategoryName,
    index: number,
    value: string,
  ) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, name: value } : item,
      ),
    }));
  };

  const finishEditItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          name:
            item.name.trim().length > 0
              ? item.name.trim()
              : item.editable
                ? ''
                : item.originalName,
          editing: false,
        };
      }),
    }));
  };

  const startEditItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, checked: true, editing: true } : item,
      ),
    }));
  };

  const addCustomItem = (category: CategoryName) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: [
        ...prev[category],
        {
          name: '',
          originalName: '새 물품',
          checked: true,
          quantity: 1,
          editable: true,
          editing: true,
        },
      ],
    }));

    if (!selectedCategories.includes(category)) {
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const getSelectedGroups = () => {
    return selectedCategories
      .map((category) => ({
        category,
        items: itemsByCategory[category]
          .filter((item) => item.checked && item.name.trim().length > 0)
          .map((item) => ({
            name: item.name.trim(),
            quantity: item.quantity,
          })),
      }))
      .filter((group) => group.items.length > 0);
  };

  const handleNext = () => {
    const selectedGroups = getSelectedGroups();

    if (selectedGroups.length === 0) {
      Alert.alert('선택 필요', '판매할 물품을 1개 이상 선택해주세요.');
      return;
    }

    router.push({
      pathname: '/market/preview',
      params: {
        title: params.title ?? '',
        content: params.content ?? '',
        price: params.price ?? '',
        region: params.region ?? '',
        returnDate: params.returnDate ?? '',
        semester: params.semester ?? '',
        photoUrl: params.photoUrl ?? '',
        photos: params.photos ?? '[]',
        type: params.type ?? 'all',
        allowOffer: params.allowOffer ?? 'false',
        selectedItems: JSON.stringify(selectedGroups),
      },
    } as any);
  };

  const handleTempSave = async () => {
    await saveMarketDraft({
      step: 'category',
      write: {
        type: params.type ?? 'all',
        title: params.title ?? '',
        content: params.content ?? '',
        price: params.price ?? '',
        region: params.region ?? '',
        returnDate: params.returnDate ?? '',
        semester: params.semester ?? '',
        photos: parseJsonArray<string>(params.photos),
        allowOffer: params.allowOffer === 'true',
      },
      category: {
        selectedCategories,
        itemsByCategory,
      },
    });

    Alert.alert('임시저장 완료', '작성 중인 거래글을 저장했어요.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.backButton} />

        <Text style={styles.headerTitle}>물품 카테고리 선택</Text>

        <Pressable onPress={handleTempSave}>
          <Text style={styles.tempSave}>임시저장</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Text style={styles.sectionTitle}>카테고리 선택</Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const selected = selectedCategories.includes(category);

            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selected && styles.categoryChipTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedCategories.length > 0 && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>물품 목록</Text>
              <View style={styles.titleLine} />
            </View>

            {selectedCategories.map((category) => (
              <View key={category} style={styles.categoryBox}>
                <Text style={styles.categoryTitle}>{category}</Text>

                <View style={styles.itemGrid}>
                  {itemsByCategory[category].map((item, index) => {
                    const selected = item.checked;

                    if (selected) {
                      return (
                        <View
                          key={`${category}-${index}`}
                          style={styles.selectedItemCell}
                        >
                          <View style={styles.selectedItemTop}>
                            <Pressable
                              style={[styles.checkBox, styles.checkBoxSelected]}
                              onPress={() => toggleItem(category, index)}
                            >
                              <Text style={styles.checkText}>✓</Text>
                            </Pressable>

                            {item.editing ? (
                              <TextInput
                                style={styles.selectedItemInput}
                                value={item.name}
                                placeholder="품목 입력"
                                placeholderTextColor="#999999"
                                autoFocus
                                onChangeText={(value) =>
                                  changeItemName(category, index, value)
                                }
                                onSubmitEditing={() =>
                                  finishEditItem(category, index)
                                }
                                onBlur={() => finishEditItem(category, index)}
                              />
                            ) : (
                              <>
                                <Text
                                  style={styles.selectedItemName}
                                  numberOfLines={1}
                                >
                                  {item.name || '품목 입력'}
                                </Text>

                                <Pressable
                                  style={styles.editNameButton}
                                  onPress={() => startEditItem(category, index)}
                                  hitSlop={8}
                                >
                                  <Ionicons
                                    name="pencil"
                                    size={14}
                                    color="#555555"
                                  />
                                </Pressable>
                              </>
                            )}
                          </View>

                          <View style={styles.quantityRow}>
                            <Text style={styles.quantityLabel}>수량</Text>

                            <View style={styles.quantityControl}>
                              <Pressable
                                style={styles.quantityButton}
                                onPress={() =>
                                  changeQuantity(category, index, 'minus')
                                }
                              >
                                <Text style={styles.quantityButtonText}>−</Text>
                              </Pressable>

                              <Text style={styles.quantityNumber}>
                                {item.quantity}
                              </Text>

                              <Pressable
                                style={styles.quantityButton}
                                onPress={() =>
                                  changeQuantity(category, index, 'plus')
                                }
                              >
                                <Text style={styles.quantityButtonText}>＋</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <Pressable
                        key={`${category}-${index}`}
                        style={styles.itemRow}
                        onPress={() => toggleItem(category, index)}
                      >
                        <View
                          style={[
                            styles.checkBox,
                            selected && styles.checkBoxSelected,
                          ]}
                        >
                          {selected && <Text style={styles.checkText}>✓</Text>}
                        </View>

                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.addButton}
                  onPress={() => addCustomItem(category)}
                >
                  <Text style={styles.addButtonText}>+ 추가하기</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Pressable
        style={[styles.nextButton, hasSelectedItem && styles.nextButtonActive]}
        disabled={!hasSelectedItem}
        onPress={handleNext}
      >
        <Text
          style={[styles.nextText, hasSelectedItem && styles.nextTextActive]}
        >
          다음 (2/2)
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 102,
    paddingTop: 46,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F8FC',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },

  headerBlank: {
    width: 38,
  },

  tempSave: {
    fontSize: 14,
    color: '#C5C5C5',
    fontWeight: '700',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 15,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 30,
  },

  categoryChip: {
    width: '48%',
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryChipSelected: {
    backgroundColor: BLUE,
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333333',
  },

  categoryChipTextSelected: {
    color: '#FFFFFF',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  mainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginRight: 12,
  },

  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DADADA',
  },

  categoryBox: {
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 16,
  },

  categoryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 10,
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    rowGap: 8,
  },

  itemRow: {
    width: '48%',
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  checkBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkBoxSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  checkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
  },

  itemName: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#111111',
  },

  itemNameInput: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#111111',
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#BBBBBB',
  },

  selectedItemCell: {
    width: '48%',
    minHeight: 76,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 7,
    paddingVertical: 7,
  },

  selectedItemTop: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedItemName: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#111111',
  },

  selectedItemInput: {
    flex: 1,
    minWidth: 0,
    height: 24,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
    fontSize: 12,
    fontWeight: '600',
    color: '#111111',
  },

  editNameButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },

  quantityRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityLabel: {
    width: 27,
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
  },

  quantityControl: {
    flex: 1,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  quantityButton: {
    width: 24,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonText: {
    fontSize: 15,
    lineHeight: 17,
    fontWeight: '900',
    color: '#111111',
  },

  quantityNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
  },

  addButton: {
    height: 28,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
  },

  bottomSpacer: {
    height: 20,
  },

  nextButton: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 34,
    height: 53,
    borderRadius: 5,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonActive: {
    backgroundColor: BLUE,
  },

  nextText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#999999',
  },

  nextTextActive: {
    color: '#FFFFFF',
  },
});
