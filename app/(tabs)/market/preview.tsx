import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getUploadUrl, uploadFileToStorage } from '../../../src/api/upload';
import { createUsedItem } from '../../../src/api/usedItems';

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

type SelectedItemGroup = {
  category: CategoryName;
  items: {
    name: string;
    quantity: number;
  }[];
};

const BLUE = '#102BE0';
const SCREEN_WIDTH = Dimensions.get('window').width;

const categoryCodeMap: Record<CategoryName, string> = {
  '주방 용품': 'KITCHEN',
  '욕실 / 청소 용품': 'BATHROOM',
  '생활 용품': 'LIVING',
  침구류: 'BEDDING',
  '각종 소스류': 'SAUCE',
  기타: 'ETC',
};

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
  ],
  '각종 소스류': [
    { name: '간장', checked: false, quantity: 1 },
    { name: '고추장', checked: false, quantity: 1 },
    { name: '참기름', checked: false, quantity: 1 },
    { name: '식용유', checked: false, quantity: 1 },
  ],
  기타: [
    { name: '보조배터리', checked: false, quantity: 1 },
    { name: '우산', checked: false, quantity: 1 },
    { name: '캐리어', checked: false, quantity: 1 },
  ],
};

export default function MarketPreviewPage() {
  const params = useLocalSearchParams<{
    title?: string;
    content?: string;
    price?: string;
    region?: string;
    returnDate?: string;
    semester?: string;
    selectedItems?: string;
    photos?: string;
  }>();

  const parsedGroups = useMemo<SelectedItemGroup[]>(() => {
    try {
      return params.selectedItems ? JSON.parse(params.selectedItems) : [];
    } catch {
      return [];
    }
  }, [params.selectedItems]);

  const photoList = useMemo<string[]>(() => {
    try {
      return params.photos ? JSON.parse(params.photos) : [];
    } catch {
      return [];
    }
  }, [params.photos]);

  const makeInitialEditableItems = () => {
    const next = JSON.parse(JSON.stringify(initialItems)) as Record<
      CategoryName,
      ItemState[]
    >;

    parsedGroups.forEach((group) => {
      group.items.forEach((selectedItem) => {
        const targetIndex = next[group.category]?.findIndex(
          (item) => item.name === selectedItem.name,
        );

        if (targetIndex >= 0) {
          next[group.category][targetIndex].checked = true;
          next[group.category][targetIndex].quantity = selectedItem.quantity;
        } else {
          next[group.category].push({
            name: selectedItem.name,
            checked: true,
            quantity: selectedItem.quantity,
            editable: true,
          });
        }
      });
    });

    return next;
  };

  const [title, setTitle] = useState(params.title || '');
  const [content, setContent] = useState(params.content || '');
  const [price, setPrice] = useState(params.price || '');
  const [activeSheet, setActiveSheet] = useState<
    'photo' | 'description' | 'editList' | null
  >(null);
  const [itemsByCategory, setItemsByCategory] = useState(
    makeInitialEditableItems,
  );

  const selectedGroups = useMemo<SelectedItemGroup[]>(() => {
    return Object.entries(itemsByCategory)
      .map(([category, items]) => ({
        category: category as CategoryName,
        items: items
          .filter((item) => item.checked && item.name.trim().length > 0)
          .map((item) => ({
            name: item.name,
            quantity: item.quantity,
          })),
      }))
      .filter((group) => group.items.length > 0);
  }, [itemsByCategory]);

  const dDayText = useMemo(() => {
    if (!params.returnDate) return '귀국 D-?';

    const today = new Date();
    const target = new Date(params.returnDate);
    const diff = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return diff >= 0 ? `귀국 D-${diff}` : '귀국 완료';
  }, [params.returnDate]);

  const semesterText = params.semester || '26-2학기';
  const regionText = params.region || '독일';

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
          checked: true,
          quantity: 1,
          editable: true,
          editing: true,
        },
      ],
    }));
  };
  const uploadImage = async (uri: string, index: number) => {
    const fileName = `used_item_${Date.now()}_${index}.jpg`;
    const contentType = 'image/jpeg';

    const response = await getUploadUrl({
      fileName,
      contentType,
      fileType: 'IMAGE',
    });

    const uploadUrl = response.data.data.uploadUrl;
    const fileUrl = response.data.data.fileUrl;

    await uploadFileToStorage(uploadUrl, uri, contentType);

    return fileUrl;
  };

  const handleUpload = async () => {
    const uploadedImageUrls = await Promise.all(
      photoList.map((photo, index) => uploadImage(photo, index)),
    );
    const thumbnailImageUrl = uploadedImageUrls[0];

    if (photoList.length === 0) {
      Alert.alert('대표 이미지 필요', '대표 사진을 1장 이상 추가해주세요.');
      return;
    }

    if (!title.trim() || !content.trim() || !price.trim()) {
      Alert.alert('입력 오류', '제목, 설명, 가격을 모두 입력해주세요.');
      return;
    }

    if (selectedGroups.length === 0) {
      Alert.alert('입력 오류', '물품을 1개 이상 선택해주세요.');
      return;
    }

    try {
      const requestBody = {
        title: title.trim(),
        content: content.trim(),
        price: Number(price.replace(/[^0-9]/g, '')) || 0,
        region: regionText,
        semester: semesterText,
        thumbnailImageUrl,
        items: selectedGroups.flatMap((group) =>
          group.items.map((item) => ({
            category: categoryCodeMap[group.category],
            name: item.name,
            quantity: item.quantity,
          })),
        ),
        categoryImages: selectedGroups.map((group, index) => ({
          category: categoryCodeMap[group.category],
          imageUrl: uploadedImageUrls[index] ?? thumbnailImageUrl,
        })),
      };

      console.log('중고거래 업로드 요청:', requestBody);

      await createUsedItem(requestBody);

      Alert.alert('업로드 완료', '중고거래 게시글이 등록되었습니다.');
      router.replace('/market' as any);
    } catch (error: any) {
      console.log('업로드 실패:', error.response?.data || error.message);
      Alert.alert('업로드 실패', '게시글 등록에 실패했습니다.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

        <View style={styles.imagePreview}>
          {photoList.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {photoList.map((photo, index) => (
                  <Image
                    key={`${photo}-${index}`}
                    source={{ uri: photo }}
                    style={styles.previewImage}
                  />
                ))}
              </ScrollView>

              <View style={styles.dots}>
                {photoList.map((_, index) => (
                  <View key={index} style={styles.dot} />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyImage}>
              <Text style={styles.emptyImageText}>등록된 사진 없음</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>{regionText}</Text>
            <Text style={styles.tag}>{semesterText}</Text>
            <Text style={styles.tag}>{dDayText}</Text>
          </View>

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목"
            placeholderTextColor="#999999"
          />

          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            placeholder="예: 12엔, 21만원"
            placeholderTextColor="#999999"
          />

          <View style={styles.tabRow}>
            <Text style={styles.tabText}>거래 정보</Text>
            <Text style={[styles.tabText, styles.activeTabText]}>
              물품 목록
            </Text>
            <Text style={styles.tabText}>판매자 정보</Text>
          </View>

          <View style={styles.activeLine} />

          <Text style={styles.sectionTitle}>물품 목록</Text>
          <Text style={styles.desc}>판매 물품 목록이에요</Text>

          <Text style={styles.subTitle}>보유 카테고리</Text>

          <View style={styles.categoryRow}>
            {selectedGroups.map((group) => (
              <View key={group.category} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{group.category}</Text>
              </View>
            ))}
          </View>

          {selectedGroups.map((group) => (
            <View key={group.category} style={styles.groupBox}>
              <View style={styles.groupTitleRow}>
                <Text style={styles.groupTitle}>{group.category}</Text>
                <View style={styles.groupLine} />
              </View>

              <Pressable
                style={styles.optionButton}
                onPress={() => setActiveSheet('photo')}
              >
                <Image
                  source={require('../../../assets/images/camera_Icon.png')}
                  style={styles.optionIcon}
                />
                <Text style={styles.optionButtonText}>
                  사진 추가하기 (선택)
                </Text>
              </Pressable>

              <Pressable
                style={styles.optionButton}
                onPress={() => setActiveSheet('description')}
              >
                <Image
                  source={require('../../../assets/images/pen.png')}
                  style={styles.optionIcon}
                />
                <Text style={styles.optionButtonText}>
                  설명 추가하기 (선택)
                </Text>
              </Pressable>

              <View style={styles.itemList}>
                {group.items.map((item, index) => (
                  <Text
                    key={`${group.category}-${index}`}
                    style={styles.itemText}
                  >
                    • {item.name} {item.quantity}개
                  </Text>
                ))}
              </View>

              <Pressable
                onPress={() => setActiveSheet('editList')}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>목록 수정하기</Text>
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.uploadButton} onPress={handleUpload}>
            <Text style={styles.uploadButtonText}>업로드 하기</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal transparent visible={activeSheet !== null} animationType="slide">
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setActiveSheet(null)}
          />

          <View style={styles.sheetBox}>
            <View style={styles.sheetHandle} />

            {activeSheet === 'photo' && (
              <>
                <Text style={styles.sheetTitle}>사진 추가</Text>

                <View style={styles.photoUploadBox}>
                  <Image
                    source={require('../../../assets/images/camera_Icon.png')}
                    style={styles.cameraIcon}
                  />
                  <Text style={styles.photoUploadText}>
                    카테고리별 사진 업로드는 추후 API 연결
                  </Text>
                </View>

                <Pressable
                  style={styles.sheetConfirmButton}
                  onPress={() => setActiveSheet(null)}
                >
                  <Text style={styles.sheetConfirmText}>확인</Text>
                </Pressable>
              </>
            )}

            {activeSheet === 'description' && (
              <>
                <Text style={styles.sheetTitle}>설명 추가</Text>

                <TextInput
                  style={styles.sheetTextArea}
                  placeholder="상태, 브랜드, 구매처 등 간단히 적어주세요"
                  placeholderTextColor="#888888"
                  multiline
                  textAlignVertical="top"
                />

                <Pressable
                  style={styles.sheetConfirmButton}
                  onPress={() => setActiveSheet(null)}
                >
                  <Text style={styles.sheetConfirmText}>확인</Text>
                </Pressable>
              </>
            )}

            {activeSheet === 'editList' && (
              <>
                <Text style={styles.sheetTitle}>물품 목록 수정</Text>

                <ScrollView style={styles.editListScroll}>
                  {(Object.keys(itemsByCategory) as CategoryName[]).map(
                    (category) => (
                      <View key={category} style={styles.editCategoryBox}>
                        <Text style={styles.editCategoryTitle}>{category}</Text>

                        {itemsByCategory[category].map((item, index) => (
                          <View
                            key={`${category}-${index}`}
                            style={[
                              styles.editItemRow,
                              item.checked && styles.editItemRowSelected,
                            ]}
                          >
                            <View style={styles.editItemTopRow}>
                              <Pressable
                                style={[
                                  styles.smallCheck,
                                  item.checked && styles.smallCheckActive,
                                ]}
                                onPress={() => toggleItem(category, index)}
                              >
                                {item.checked && (
                                  <Text style={styles.smallCheckText}>✓</Text>
                                )}
                              </Pressable>

                              {item.editable || item.editing ? (
                                <TextInput
                                  style={styles.editItemInput}
                                  placeholder="품목 입력"
                                  placeholderTextColor="#A6A6A6"
                                  value={item.name}
                                  onChangeText={(value) =>
                                    changeItemName(category, index, value)
                                  }
                                  onSubmitEditing={() =>
                                    toggleEditItem(category, index)
                                  }
                                />
                              ) : (
                                <Text style={styles.editItemText}>
                                  {item.name}
                                </Text>
                              )}

                              {item.checked && !item.editable && (
                                <Pressable
                                  onPress={() =>
                                    toggleEditItem(category, index)
                                  }
                                >
                                  <Image
                                    source={require('../../../assets/images/pen.png')}
                                    style={styles.editPenIcon}
                                  />
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
                                    <Text style={styles.quantityText}>+</Text>
                                  </Pressable>
                                </View>
                              </View>
                            )}
                          </View>
                        ))}

                        <Pressable
                          style={styles.addItemButton}
                          onPress={() => addCustomItem(category)}
                        >
                          <Text style={styles.addItemText}>
                            + 물품 추가하기
                          </Text>
                        </Pressable>
                      </View>
                    ),
                  )}
                </ScrollView>

                <Pressable
                  style={styles.sheetConfirmButton}
                  onPress={() => setActiveSheet(null)}
                >
                  <Text style={styles.sheetConfirmText}>확인</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 50 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 52,
    height: 105,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { fontSize: 38, color: '#111111', lineHeight: 38 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#111111' },
  tempSave: { fontSize: 13, color: '#BDBDBD', fontWeight: '700' },
  imagePreview: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#F3F3F3',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: 300,
    resizeMode: 'cover',
  },
  emptyImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyImageText: { color: '#999999', fontSize: 14 },
  dots: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
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
  body: { paddingHorizontal: 22, paddingTop: 16 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: '#555555',
    fontWeight: '700',
  },
  titleInput: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
    paddingVertical: 0,
    marginBottom: 8,
  },
  priceInput: {
    fontSize: 17,
    fontWeight: '900',
    color: BLUE,
    paddingVertical: 0,
    marginBottom: 20,
  },
  tabRow: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#777777',
  },
  activeTabText: { color: '#111111' },
  activeLine: {
    width: '33.33%',
    height: 4,
    borderRadius: 99,
    backgroundColor: BLUE,
    marginLeft: '33.33%',
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
  },
  desc: { fontSize: 12, color: '#777777', marginBottom: 24 },
  subTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
  },
  categoryChipText: { fontSize: 12, fontWeight: '800', color: '#111111' },
  groupBox: { marginTop: 30 },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  groupTitle: { fontSize: 15, fontWeight: '900', color: '#111111' },
  groupLine: { flex: 1, height: 1, backgroundColor: '#E3E3E3', marginLeft: 12 },
  optionButton: {
    height: 42,
    borderRadius: 5,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  optionIcon: { width: 17, height: 17, resizeMode: 'contain', marginRight: 8 },
  optionButtonText: { fontSize: 13, fontWeight: '700', color: '#333333' },
  itemList: { marginTop: 12 },
  itemText: { fontSize: 13, lineHeight: 24, color: '#111111' },
  editButton: {
    marginTop: 14,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { fontSize: 13, fontWeight: '800', color: '#333333' },
  uploadButton: {
    height: 52,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  uploadButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheetBox: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#D8D8D8',
    alignSelf: 'center',
    marginBottom: 22,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },
  photoUploadBox: {
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  photoUploadText: { fontSize: 14, color: '#777777', fontWeight: '700' },
  sheetTextArea: {
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    padding: 14,
    fontSize: 14,
    color: '#111111',
  },
  sheetConfirmButton: {
    height: 48,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  sheetConfirmText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  editListScroll: { maxHeight: 430 },
  editCategoryBox: { marginBottom: 24 },
  editCategoryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },
  editItemRow: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  editItemRowSelected: { backgroundColor: '#F5F5F5' },
  editItemTopRow: { flexDirection: 'row', alignItems: 'center' },
  smallCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCheckActive: { backgroundColor: BLUE, borderColor: BLUE },
  smallCheckText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  editItemText: { flex: 1, fontSize: 14, color: '#111111' },
  editItemInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
  },
  editPenIcon: { width: 16, height: 16, resizeMode: 'contain' },
  quantityRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: { fontSize: 13, fontWeight: '700', color: '#333333' },
  quantityBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: 18, color: '#333333', fontWeight: '800' },
  quantityNumber: { fontSize: 14, fontWeight: '800', color: '#111111' },
  addItemButton: {
    height: 38,
    borderRadius: 5,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemText: { fontSize: 13, fontWeight: '800', color: '#333333' },
});
