import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppBackButton } from '@/components/ui/app-back-button';
import { getMarketDraft, saveMarketDraft } from '../../../src/storage/marketDraft';

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

type CategoryDetail = {
  photos: string[];
  description: string;
};

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
    country?: string;
    region?: string;
    returnDate?: string;
    semester?: string;
    photoUrl?: string;
    photos?: string;
    resumePreview?: string;
    selectedItems?: string;
    draftSelectedCategories?: string;
    draftItemsByCategory?: string;
    draftCategoryDetails?: string;
  }>();

  const initialSelectedCategories = parseJsonArray<CategoryName>(
    params.draftSelectedCategories,
  );
  const [selectedCategories, setSelectedCategories] = useState<CategoryName[]>(
    () => initialSelectedCategories,
  );
  const [activeCategory, setActiveCategory] = useState<CategoryName>(
    () => initialSelectedCategories[0] ?? categories[0],
  );

  const [itemsByCategory, setItemsByCategory] = useState<
    Record<CategoryName, ItemState[]>
  >(() => parseDraftItems(params.draftItemsByCategory) ?? makeInitialItems());
  const [draftCategoryDetails, setDraftCategoryDetails] = useState<
    Record<string, CategoryDetail>
  >(() => {
    try {
      const parsed = params.draftCategoryDetails
        ? JSON.parse(params.draftCategoryDetails)
        : {};

      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, CategoryDetail>)
        : {};
    } catch {
      return {};
    }
  });
  const scrollRef = useRef<ScrollView>(null);
  const resumedPreviewRef = useRef(false);

  const hasSelectedItem = useMemo(() => {
    return categories.some((category) =>
      itemsByCategory[category].some(
        (item) => item.checked && item.name.trim().length > 0,
      ),
    );
  }, [itemsByCategory]);

  const getSelectedItemCount = (category: CategoryName) => {
    return itemsByCategory[category].filter(
      (item) => item.checked && item.name.trim().length > 0,
    ).length;
  };

  const isSameWriteDraft = useCallback(
    (write?: {
      title?: string;
      content?: string;
      price?: string;
      country?: string;
      region?: string;
      returnDate?: string;
    }) => {
      if (!write) return false;

      return (
        write.title === (params.title ?? '') &&
        write.content === (params.content ?? '') &&
        write.price === (params.price ?? '') &&
        write.country === (params.country ?? '') &&
        write.region === (params.region ?? '') &&
        write.returnDate === (params.returnDate ?? '')
      );
    },
    [params.content, params.country, params.price, params.region, params.returnDate, params.title],
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const restorePreviewDraft = async () => {
        const draft = await getMarketDraft();

        if (!mounted || !draft?.preview || !isSameWriteDraft(draft.write)) {
          return;
        }

        const fallbackItems = makeInitialItems();
        const previewItems = Object.fromEntries(
          categories.map((category) => [
            category,
            Array.isArray(draft.preview?.itemsByCategory[category])
              ? draft.preview.itemsByCategory[category].map((item) => ({
                  ...item,
                  originalName: item.originalName ?? item.name,
                }))
              : fallbackItems[category],
          ]),
        ) as Record<CategoryName, ItemState[]>;

        setItemsByCategory(previewItems);
        const restoredCategories = categories.filter((category) =>
          previewItems[category].some(
            (item) => item.checked && item.name.trim().length > 0,
          ),
        );

        setSelectedCategories(restoredCategories);
        setActiveCategory(restoredCategories[0] ?? categories[0]);
        setDraftCategoryDetails(
          draft.preview.categoryDetails as Record<string, CategoryDetail>,
        );
      };

      restorePreviewDraft().catch((error) => {
        console.log('중고거래 미리보기 임시저장 복원 실패:', error);
      });

      return () => {
        mounted = false;
      };
    }, [isSameWriteDraft]),
  );

  const openCategory = (category: CategoryName) => {
    setActiveCategory(category);

    if (!selectedCategories.includes(category)) {
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const toggleItem = (category: CategoryName, index: number) => {
    const targetItem = itemsByCategory[category][index];

    if (targetItem && !targetItem.checked && !selectedCategories.includes(category)) {
      setSelectedCategories((prev) => [...prev, category]);
    }

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
    if (!selectedCategories.includes(category)) {
      setSelectedCategories((prev) => [...prev, category]);
    }

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

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: 410,
        animated: true,
      });
    }, 180);
  };

  const getSelectedGroups = useCallback(() => {
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
  }, [itemsByCategory]);

  const handleNext = async () => {
    const selectedGroups = getSelectedGroups();

    if (selectedGroups.length === 0) {
      Alert.alert('선택 필요', '판매할 물품을 1개 이상 선택해주세요.');
      return;
    }

    await saveCategoryDraft();

    router.push({
      pathname: '/market/preview',
      params: {
        title: params.title ?? '',
        content: params.content ?? '',
        price: params.price ?? '',
        country: params.country ?? '',
        region: params.region ?? '',
        returnDate: params.returnDate ?? '',
        semester: params.semester ?? '',
        photoUrl: params.photoUrl ?? '',
        photos: params.photos ?? '[]',
        type: params.type ?? 'all',
        selectedItems: JSON.stringify(selectedGroups),
        draftItemsByCategory: JSON.stringify(itemsByCategory),
        draftCategoryDetails: JSON.stringify(draftCategoryDetails),
      },
    } as any);
  };

  const saveCategoryDraft = useCallback(async () => {
    await saveMarketDraft({
      step: 'category',
      write: {
        type: params.type ?? 'all',
        title: params.title ?? '',
        content: params.content ?? '',
        price: params.price ?? '',
        country: params.country ?? '',
        region: params.region ?? '',
        returnDate: params.returnDate ?? '',
        semester: params.semester ?? '',
        photos: parseJsonArray<string>(params.photos),
      },
      category: {
        selectedCategories: getSelectedGroups().map((group) => group.category),
        itemsByCategory,
      },
      preview: {
        selectedItems: JSON.stringify(getSelectedGroups()),
        itemsByCategory,
        categoryDetails: draftCategoryDetails,
      },
    });
  }, [draftCategoryDetails, getSelectedGroups, itemsByCategory, params]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveCategoryDraft().catch((error) => {
        console.log('중고거래 카테고리 자동저장 실패:', error);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [saveCategoryDraft]);

  useEffect(() => {
    if (params.resumePreview !== 'true' || resumedPreviewRef.current) {
      return;
    }

    resumedPreviewRef.current = true;

    const timer = setTimeout(async () => {
      const selectedGroups = getSelectedGroups();

      if (selectedGroups.length === 0) {
        return;
      }

      await saveCategoryDraft();

      router.push({
        pathname: '/market/preview',
        params: {
          title: params.title ?? '',
          content: params.content ?? '',
          price: params.price ?? '',
          country: params.country ?? '',
          region: params.region ?? '',
          returnDate: params.returnDate ?? '',
          semester: params.semester ?? '',
          photoUrl: params.photoUrl ?? '',
          photos: params.photos ?? '[]',
          type: params.type ?? 'all',
          selectedItems: params.selectedItems || JSON.stringify(selectedGroups),
          draftItemsByCategory: JSON.stringify(itemsByCategory),
          draftCategoryDetails: JSON.stringify(draftCategoryDetails),
        },
      } as any);
    }, 180);

    return () => clearTimeout(timer);
  }, [
    draftCategoryDetails,
    getSelectedGroups,
    itemsByCategory,
    params.content,
    params.country,
    params.photoUrl,
    params.photos,
    params.price,
    params.region,
    params.resumePreview,
    params.returnDate,
    params.selectedItems,
    params.semester,
    params.title,
    params.type,
    saveCategoryDraft,
  ]);

  const handleTempSave = async () => {
    await saveCategoryDraft();

    Alert.alert('임시저장 완료', '작성 중인 거래글을 저장했어요.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={styles.header}>
        <AppBackButton style={styles.backButton} />

        <Text style={styles.headerTitle}>물품 카테고리 선택</Text>

        <Pressable onPress={handleTempSave}>
          <Text style={styles.tempSave}>임시저장</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Text style={styles.sectionTitle}>카테고리 선택</Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const selected = activeCategory === category;
            const selectedItemCount = getSelectedItemCount(category);

            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                ]}
                onPress={() => openCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selected && styles.categoryChipTextSelected,
                  ]}
                >
                  {category}
                </Text>
                {selectedItemCount > 0 && (
                  <View style={styles.categoryCountBadge}>
                    <Text style={styles.categoryCountText}>
                      {selectedItemCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.mainTitle}>물품 목록</Text>
          <View style={styles.titleLine} />
        </View>

        <View style={styles.categoryBox}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle}>{activeCategory}</Text>
            <Text style={styles.categorySelectedCount}>
              {getSelectedItemCount(activeCategory)}개 선택
            </Text>
          </View>

          <View style={styles.itemGrid}>
            {itemsByCategory[activeCategory].map((item, index) => {
              const selected = item.checked;
              const category = activeCategory;

              if (selected) {
                return (
                  <View
                    key={`${category}-${index}`}
                    style={styles.selectedItemCell}
                  >
                    <View style={styles.selectedItemTop}>
                      <View style={styles.selectedItemMain}>
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
                            onFocus={() => {
                              setTimeout(() => {
                                scrollRef.current?.scrollTo({
                                  y: 390,
                                  animated: true,
                                });
                              }, 120);
                            }}
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
                  <View style={styles.checkBox} />

                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => addCustomItem(activeCategory)}
          >
            <Text style={styles.addButtonText}>+ 추가하기</Text>
          </Pressable>
        </View>

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
    </KeyboardAvoidingView>
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
    paddingBottom: 380,
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
    position: 'relative',
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

  categoryCountBadge: {
    position: 'absolute',
    right: 9,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  categoryCountText: {
    fontSize: 11,
    fontWeight: '900',
    color: BLUE,
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

  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  categoryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
  },

  categorySelectedCount: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },

  itemGrid: {
    gap: 8,
  },

  itemRow: {
    width: '100%',
    height: 34,
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
    width: '100%',
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  selectedItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  selectedItemMain: {
    flex: 1,
    minWidth: 0,
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

  quantityControl: {
    width: 96,
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
    height: 280,
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
