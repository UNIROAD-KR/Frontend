import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type CategoryName =
  | '주방 용품'
  | '욕실 / 청소 용품'
  | '생활 용품'
  | '침구류'
  | '각종 소스류'
  | '기타';

type ItemState = {
  name: string;
  checked: boolean;
  quantity: number;
  editable?: boolean;
  editing?: boolean;
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

const initialItems: Record<CategoryName, ItemState[]> = {
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

export default function MarketCategoryPage() {
  const params = useLocalSearchParams<{
    title?: string;
    content?: string;
    price?: string;
    region?: string;
    returnDate?: string;
    photoUrl?: string;
    photos?: string;
  }>();

  const [selectedCategories, setSelectedCategories] = useState<CategoryName[]>(
    [],
  );
  const [itemsByCategory, setItemsByCategory] =
    useState<Record<CategoryName, ItemState[]>>(initialItems);

  const hasSelectedItem = selectedCategories.some((category) =>
    itemsByCategory[category].some((item) => item.checked),
  );

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
        itemIndex === index ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  const changeQuantity = (
    category: CategoryName,
    index: number,
    direction: 'plus' | 'minus',
  ) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          quantity:
            direction === 'plus'
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

  const toggleEditItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, editing: !item.editing } : item,
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
          checked: false,
          quantity: 1,
          editable: true,
          editing: true,
        },
      ],
    }));
  };

  const removeCustomItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = () => {
    if (!hasSelectedItem) {
      Alert.alert('입력 오류', '판매할 물품을 하나 이상 선택해주세요.');
      return;
    }

    const selectedItemsData = selectedCategories
      .map((category) => {
        const selectedItems = itemsByCategory[category]
          .filter((item) => item.checked)
          .map((item) => ({
            name: item.name || '이름 없음',
            quantity: item.quantity,
          }));

        return {
          category,
          items: selectedItems,
        };
      })
      .filter((group) => group.items.length > 0);

    router.push({
      pathname: '/market/preview',
      params: {
        photos: params.photos || '',
        title: params.title || '',
        content: params.content || '',
        price: params.price || '',
        region: params.region || '',
        returnDate: params.returnDate || '',
        photoUrl: params.photoUrl || '',
        selectedItems: JSON.stringify(selectedItemsData),
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>다음 교환학생에게 넘기기</Text>

          <Text style={styles.tempSave}>임시저장</Text>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>

        <Text style={styles.sectionTitle}>카테고리 선택</Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const active = selectedCategories.includes(category);

            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryButton,
                  active && styles.categoryButtonActive,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedCategories.length > 0 && (
          <View style={styles.itemSectionHeader}>
            <Text style={styles.sectionTitle}>물품 목록</Text>
            <View style={styles.sectionLine} />
          </View>
        )}

        {selectedCategories.map((category) => (
          <View key={category} style={styles.itemCard}>
            <Text style={styles.itemCardTitle}>{category}</Text>

            <View style={styles.itemGrid}>
              {itemsByCategory[category].map((item, index) => (
                <View
                  key={`${category}-${index}`}
                  style={[
                    styles.itemRow,
                    item.checked && styles.itemRowSelected,
                  ]}
                >
                  <View style={styles.itemTopRow}>
                    <Pressable
                      style={[
                        styles.checkbox,
                        item.checked && styles.checkboxActive,
                      ]}
                      onPress={() => toggleItem(category, index)}
                    >
                      {item.checked && <Text style={styles.checkMark}>✓</Text>}
                    </Pressable>

                    {item.editable || item.editing ? (
                      <TextInput
                        style={styles.itemInput}
                        placeholder="품목 입력"
                        placeholderTextColor="#A6A6A6"
                        value={item.name}
                        onChangeText={(value) =>
                          changeItemName(category, index, value)
                        }
                        onSubmitEditing={() => toggleEditItem(category, index)}
                      />
                    ) : (
                      <Text style={styles.itemName}>{item.name}</Text>
                    )}

                    {item.checked && !item.editable && (
                      <Pressable
                        onPress={() => toggleEditItem(category, index)}
                      >
                        <Image
                          source={require('../../../assets/images/pen.png')}
                          style={styles.penImage}
                        />
                      </Pressable>
                    )}

                    {item.editable && (
                      <Pressable
                        style={styles.removeButton}
                        onPress={() => removeCustomItem(category, index)}
                      >
                        <Text style={styles.removeText}>×</Text>
                      </Pressable>
                    )}
                  </View>

                  {item.checked && (
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
              ))}
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() => addCustomItem(category)}
            >
              <Text style={styles.addButtonText}>+ 추가하기</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.nextButton, hasSelectedItem && styles.nextButtonActive]}
        disabled={!hasSelectedItem}
        onPress={handleSubmit}
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

  content: {
    paddingHorizontal: 22,
    paddingTop: 52,
    paddingBottom: 120,
  },

  header: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  back: {
    fontSize: 38,
    color: '#111111',
    lineHeight: 38,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
  },

  tempSave: {
    fontSize: 14,
    color: '#C5C5C5',
    fontWeight: '600',
  },

  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 38,
  },

  progressActive: {
    flex: 1,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#666666',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },

  categoryGrid: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  categoryButton: {
    width: '48%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryButtonActive: {
    backgroundColor: BLUE,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  itemSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 16,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E1E1',
    marginLeft: 12,
  },

  itemCard: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 18,
    marginBottom: 28,
  },

  itemCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  itemRow: {
    width: '48%',
    minHeight: 31,
    marginBottom: 9,
  },

  itemRowSelected: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },

  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  checkMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  itemName: {
    fontSize: 16,
    color: '#111111',
    flexShrink: 1,
    marginRight: 8,
  },

  itemInput: {
    flex: 1,
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
    fontSize: 16,
    color: '#111111',
    paddingVertical: 0,
    marginRight: 8,
  },

  penImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  quantityLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#555555',
    marginRight: 14,
  },

  quantityBox: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  quantityButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#111111',
  },

  quantityNumber: {
    fontSize: 24,
    color: '#777777',
  },

  removeButton: {
    marginLeft: 6,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#CFCFCF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },

  addButton: {
    height: 29,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },

  nextButton: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 36,
    height: 52,
    borderRadius: 5,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonActive: {
    backgroundColor: BLUE,
  },

  nextText: {
    color: '#9A9A9A',
    fontSize: 16,
    fontWeight: '800',
  },

  nextTextActive: {
    color: '#FFFFFF',
  },
});
