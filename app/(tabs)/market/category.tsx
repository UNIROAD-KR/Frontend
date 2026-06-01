import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
    return categories.some((category) =>
      itemsByCategory[category].some(
        (item) => item.checked && item.name.trim().length > 0,
      ),
    );
  }, [itemsByCategory]);

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
              : Math.max(0, item.quantity - 1),
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

  const startEditItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, editing: true } : item,
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
            item.name.trim().length > 0 ? item.name.trim() : item.originalName,
          editing: false,
        };
      }),
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
    return categories
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
        <AppBackButton />

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
        <Text style={styles.sectionTitle}>보유 카테고리</Text>

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

        <View style={styles.titleRow}>
          <Text style={styles.mainTitle}>물품 목록</Text>
          <View style={styles.titleLine} />
        </View>

        {categories.map((category) => (
          <View key={category} style={styles.categoryBox}>
            <Text style={styles.categoryTitle}>{category}</Text>

            <View style={styles.itemGrid}>
              {itemsByCategory[category].map((item, index) => {
                const selected = item.checked;

                return (
                  <View
                    key={`${category}-${index}`}
                    style={[styles.itemRow, selected && styles.itemRowSelected]}
                  >
                    <View style={styles.itemTopRow}>
                      <Pressable
                        style={[
                          styles.checkBox,
                          selected && styles.checkBoxSelected,
                        ]}
                        onPress={() => toggleItem(category, index)}
                      >
                        {selected && <Text style={styles.checkText}>✓</Text>}
                      </Pressable>

                      {item.editing ? (
                        <TextInput
                          style={styles.itemNameInput}
                          value={item.name}
                          placeholder="물품명"
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
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                      )}

                      {selected && !item.editing && (
                        <Pressable
                          onPress={() => startEditItem(category, index)}
                          hitSlop={8}
                        >
                          <Image
                            source={require('../../../assets/images/pen.png')}
                            style={styles.penIcon}
                          />
                        </Pressable>
                      )}
                    </View>

                    {selected && (
                      <View style={styles.quantityRow}>
                        <Text style={styles.quantityLabel}>수량</Text>

                        <View style={styles.quantityBox}>
                          <Pressable
                            style={styles.quantityButton}
                            onPress={() =>
                              changeQuantity(category, index, 'minus')
                            }
                          >
                            <Text style={styles.quantityText}>−</Text>
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
                            <Text style={styles.quantityText}>＋</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
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
          다음
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
    paddingTop: 10,
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 14,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 32,
  },

  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F4F4F4',
  },

  categoryChipSelected: {
    backgroundColor: BLUE,
  },

  categoryChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333333',
  },

  categoryChipTextSelected: {
    color: '#FFFFFF',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  mainTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111111',
    marginRight: 16,
  },

  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DADADA',
  },

  categoryBox: {
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 22,
  },

  categoryTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  itemRow: {
    width: '48%',
    minHeight: 40,
    marginBottom: 12,
  },

  itemRowSelected: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 12,
  },

  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 30,
  },

  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C9C9C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginTop: 1,
  },
  checkBoxSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  checkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },

  itemName: {
    flex: 1,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '500',
    color: '#111111',
    marginTop: 2,
  },

  itemNameInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    color: '#111111',
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#BBBBBB',
  },

  penIcon: {
    width: 17,
    height: 17,
    resizeMode: 'contain',
    marginLeft: 5,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  quantityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
    marginRight: 6,
  },

  quantityBox: {
    flex: 1,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  quantityButton: {
    width: 22,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
  },

  quantityNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#777777',
  },

  addButton: {
    height: 43,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  addButtonText: {
    fontSize: 17,
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
