import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
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

type CategoryDetail = {
  photos: string[];
  description: string;
};

type DraggableSheetProps = {
  children: ReactNode;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

const BLUE = '#102BE0';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const categoryCodeMap: Record<CategoryName, TradeCategory> = {
  '주방 용품': 'KITCHEN',
  '욕실 / 청소 용품': 'BATH',
  '생활 용품': 'LIFE',
  침구류: 'BEDDING',
  '각종 소스류': 'ETC',
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
    { name: '락앤락 통', checked: false, quantity: 1 },
    { name: '접시', checked: false, quantity: 1 },
    { name: '수저세트', checked: false, quantity: 1 },
    { name: '컵', checked: false, quantity: 1 },
    { name: '식기 건조대', checked: false, quantity: 1 },
  ],
  '욕실 / 청소 용품': [
    { name: '청소 밀대', checked: false, quantity: 1 },
    { name: '빨래 건조대', checked: false, quantity: 1 },
    { name: '빗자루 세트', checked: false, quantity: 1 },
    { name: '빨래 망', checked: false, quantity: 1 },
    { name: '욕실 매트', checked: false, quantity: 1 },
    { name: '세제류', checked: false, quantity: 1 },
  ],
  '생활 용품': [
    { name: '드라이기', checked: false, quantity: 1 },
    { name: '멀티탭', checked: false, quantity: 1 },
    { name: '와이파이 공유기', checked: false, quantity: 1 },
    { name: '옷걸이', checked: false, quantity: 1 },
    { name: '전신 거울', checked: false, quantity: 1 },
    { name: '탁상 스탠드', checked: false, quantity: 1 },
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

const previewCategories = Object.keys(initialItems) as CategoryName[];

const parseRecord = <T,>(value?: string): Partial<Record<CategoryName, T>> => {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object'
      ? (parsed as Partial<Record<CategoryName, T>>)
      : {};
  } catch {
    return {};
  }
};

const parseDraftPreviewItems = (
  value?: string,
): Record<CategoryName, ItemState[]> | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<CategoryName, ItemState[]>;

    if (!parsed || typeof parsed !== 'object') return null;

    const fallback = JSON.parse(JSON.stringify(initialItems)) as Record<
      CategoryName,
      ItemState[]
    >;

    return Object.fromEntries(
      previewCategories.map((category) => [
        category,
        Array.isArray(parsed[category]) ? parsed[category] : fallback[category],
      ]),
    ) as Record<CategoryName, ItemState[]>;
  } catch {
    return null;
  }
};

function DraggableSheet({ children, onClose, style }: DraggableSheetProps) {
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const translateY = dragY.interpolate({
    inputRange: [-1, 0, SCREEN_HEIGHT],
    outputRange: [0, 0, SCREEN_HEIGHT],
    extrapolate: 'clamp',
  });

  const backdropOpacity = dragY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const closeSheet = () => {
    if (isClosing.current) return;

    isClosing.current = true;
    Keyboard.dismiss();

    Animated.timing(dragY, {
      toValue: SCREEN_HEIGHT,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClose();

      setTimeout(() => {
        dragY.setValue(0);
        isClosing.current = false;
      }, 80);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosing.current,
      onStartShouldSetPanResponderCapture: () => !isClosing.current,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !isClosing.current &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx) &&
        Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        dragY.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        dragY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 70 || gesture.vy > 0.75) {
          closeSheet();
          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          stiffness: 220,
          damping: 26,
          mass: 0.85,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          stiffness: 220,
          damping: 26,
          mass: 0.85,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.sheetOverlay}>
      <Animated.View
        pointerEvents="none"
        style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
      />

      <Pressable style={styles.sheetBackdropPressable} onPress={closeSheet} />

      <Animated.View
        style={[
          styles.sheetBox,
          style,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.sheetHandleTouchArea} {...panResponder.panHandlers}>
          <View style={styles.sheetHandle} />
        </View>

        {children}
      </Animated.View>
    </View>
  );
}

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
    type?: string;
    allowOffer?: string;
    draftItemsByCategory?: string;
    draftCategoryDetails?: string;
  }>();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [editListModalVisible, setEditListModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryName | null>(
    null,
  );
  const [draftDescription, setDraftDescription] = useState('');
  const [categoryDetails, setCategoryDetails] = useState<
    Partial<Record<CategoryName, CategoryDetail>>
  >(() => parseRecord<CategoryDetail>(params.draftCategoryDetails));

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
    const draftItems = parseDraftPreviewItems(params.draftItemsByCategory);

    if (draftItems) {
      return draftItems;
    }

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
  const [content] = useState(params.content || '');
  const [price, setPrice] = useState(params.price || '');
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

  const getCategoryDetail = (category: CategoryName): CategoryDetail => {
    return categoryDetails[category] ?? { photos: [], description: '' };
  };

  const openPhotoModal = (category: CategoryName) => {
    setActiveCategory(category);
    setPhotoModalVisible(true);
  };

  const openDescriptionModal = (category: CategoryName) => {
    const detail = getCategoryDetail(category);

    setActiveCategory(category);
    setDraftDescription(detail.description);
    setDescriptionModalVisible(true);
  };

  const openEditListModal = (category: CategoryName) => {
    setActiveCategory(category);
    setEditListModalVisible(true);
  };

  const toggleItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, checked: !item.checked } : item,
      ),
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

  const finishEditItem = (category: CategoryName, index: number) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((item, itemIndex) =>
        itemIndex === index ? { ...item, editing: false } : item,
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

  const handlePickCategoryPhotos = async () => {
    if (!activeCategory) return;

    const currentPhotos = getCategoryDetail(activeCategory).photos;

    if (currentPhotos.length >= 10) {
      Alert.alert('사진 제한', '카테고리별 사진은 최대 10장까지 추가할 수 있어요.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - currentPhotos.length,
    });

    if (result.canceled) {
      return;
    }

    const selectedUris = result.assets.map((asset) => asset.uri);

    setCategoryDetails((prev) => {
      const previousDetail = prev[activeCategory] ?? {
        photos: [],
        description: '',
      };

      return {
        ...prev,
        [activeCategory]: {
          ...previousDetail,
          photos: [...previousDetail.photos, ...selectedUris].slice(0, 10),
        },
      };
    });
  };

  const removeCategoryPhoto = (category: CategoryName, index: number) => {
    setCategoryDetails((prev) => {
      const previousDetail = prev[category] ?? { photos: [], description: '' };

      return {
        ...prev,
        [category]: {
          ...previousDetail,
          photos: previousDetail.photos.filter(
            (_, photoIndex) => photoIndex !== index,
          ),
        },
      };
    });
  };

  const handleConfirmDescription = () => {
    if (!activeCategory) return;

    setCategoryDetails((prev) => {
      const previousDetail = prev[activeCategory] ?? {
        photos: [],
        description: '',
      };

      return {
        ...prev,
        [activeCategory]: {
          ...previousDetail,
          description: draftDescription,
        },
      };
    });

    setDescriptionModalVisible(false);
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

    console.log('중고거래 서버 업로드 요청:', requestBody);

    await createUsedItem(requestBody);
  };

  const handleUpload = async () => {
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

    const cleanedTitle = title.trim();
    const cleanedContent = content.trim();
    const cleanedPriceText = price.trim();
    const numericPrice = Number(cleanedPriceText.replace(/[^0-9]/g, '')) || 0;

    try {
      const nickname = await AsyncStorage.getItem('nickname');

      await saveLocalMarketPost({
        title: cleanedTitle,
        content: cleanedContent,
        price: numericPrice,
        priceText: cleanedPriceText,
        region: regionText,
        semester: semesterText,
        returnDate: params.returnDate || '',
        photos: photoList,
        itemGroups: selectedGroups.map((group) => {
          const detail = getCategoryDetail(group.category);

          return {
            ...group,
            photos: detail.photos,
            description: detail.description.trim(),
          };
        }),
        authorName: nickname || '나',
      });

      void syncPostToServer({
        title: cleanedTitle,
        content: cleanedContent,
        price: numericPrice,
      }).catch((error: any) => {
        console.log(
          '중고거래 서버 동기화 실패:',
          error.response?.data || error.message,
        );
      });

      await clearMarketDraft();

      Alert.alert('업로드 완료', '중고거래 게시글이 등록되었습니다.');
      router.replace('/market' as any);
    } catch (error: any) {
      console.log('로컬 업로드 실패:', error.response?.data || error.message);
      Alert.alert('업로드 실패', '게시글 등록에 실패했습니다.');
    }
  };

  const handleTempSave = async () => {
    await saveMarketDraft({
      step: 'preview',
      write: {
        type: params.type ?? 'all',
        title,
        content,
        price,
        region: regionText,
        returnDate: params.returnDate ?? '',
        semester: semesterText,
        photos: photoList,
        allowOffer: params.allowOffer === 'true',
      },
      preview: {
        selectedItems: JSON.stringify(selectedGroups),
        itemsByCategory,
        categoryDetails: categoryDetails as Record<
          CategoryName,
          CategoryDetail
        >,
      },
    });

    Alert.alert('임시저장 완료', '작성 중인 거래글을 저장했어요.');
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
          <AppBackButton />

          <Text style={styles.headerTitle}>다음 교환학생에게 넘기기</Text>

          <Pressable onPress={handleTempSave}>
            <Text style={styles.tempSave}>임시저장</Text>
          </Pressable>
        </View>

        <View style={styles.photoSection}>
          {photoList.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x /
                      event.nativeEvent.layoutMeasurement.width,
                  );
                  setCurrentPhotoIndex(index);
                }}
              >
                {photoList.map((photo, index) => (
                  <Image
                    key={`${photo}-${index}`}
                    source={{ uri: photo }}
                    style={styles.previewImage}
                  />
                ))}
              </ScrollView>

              <View style={styles.photoDotRow}>
                {photoList.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoDot,
                      currentPhotoIndex === index && styles.photoDotActive,
                    ]}
                  />
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

          {selectedGroups.map((group) => {
            const detail = getCategoryDetail(group.category);
            const hasDescription = detail.description.trim().length > 0;

            return (
              <View key={group.category} style={styles.groupBox}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.groupTitle}>{group.category}</Text>
                  <View style={styles.groupLine} />
                </View>

                <Pressable
                  style={styles.addPhotoButton}
                  onPress={() => openPhotoModal(group.category)}
                >
                  <Image
                    source={require('../../../assets/images/camera.png')}
                    style={styles.addPhotoIcon}
                  />
                  <Text style={styles.addPhotoText}>
                    {detail.photos.length > 0
                      ? `사진 ${detail.photos.length}장 수정하기`
                      : '사진 추가하기 (선택)'}
                  </Text>
                </Pressable>

                {detail.photos.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryPhotoPreviewRow}
                  >
                    {detail.photos.map((photo, index) => (
                      <Image
                        key={`${group.category}-${photo}-${index}`}
                        source={{ uri: photo }}
                        style={styles.categoryPhotoPreview}
                      />
                    ))}
                  </ScrollView>
                )}

                <Pressable
                  style={styles.addPhotoButton}
                  onPress={() => openDescriptionModal(group.category)}
                >
                  <Image
                    source={require('../../../assets/images/pen.png')}
                    style={styles.addDescriptionIcon}
                  />
                  <Text style={styles.addPhotoText}>
                    {hasDescription ? '설명 수정하기' : '설명 추가하기 (선택)'}
                  </Text>
                </Pressable>

                {hasDescription && (
                  <View style={styles.categoryDescriptionPreview}>
                    <Text style={styles.categoryDescriptionPreviewText}>
                      {detail.description}
                    </Text>
                  </View>
                )}

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
                  onPress={() => openEditListModal(group.category)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>목록 수정하기</Text>
                </Pressable>
              </View>
            );
          })}

          <Pressable style={styles.uploadButton} onPress={handleUpload}>
            <Text style={styles.uploadButtonText}>업로드 하기</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal transparent visible={photoModalVisible} animationType="none">
          <DraggableSheet onClose={() => setPhotoModalVisible(false)}>
            <Text style={styles.sheetTitle}>{activeCategory ?? '물품'} 사진</Text>

            {activeCategory &&
              getCategoryDetail(activeCategory).photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoModalPreviewRow}
                >
                  {getCategoryDetail(activeCategory).photos.map(
                    (photo, index) => (
                      <View
                        key={`${activeCategory}-${photo}-${index}`}
                        style={styles.photoModalPreviewWrap}
                      >
                        <Image
                          source={{ uri: photo }}
                          style={styles.photoModalPreview}
                        />

                        <Pressable
                          style={styles.removePhotoButton}
                          onPress={() =>
                            removeCategoryPhoto(activeCategory, index)
                          }
                        >
                          <Text style={styles.removePhotoText}>×</Text>
                        </Pressable>
                      </View>
                    ),
                  )}
                </ScrollView>
              )}

            <Pressable
              style={styles.photoUploadBox}
              onPress={handlePickCategoryPhotos}
            >
              <Image
                source={require('../../../assets/images/camera.png')}
                style={styles.cameraIcon}
              />
              <Text style={styles.photoUploadText}>앨범에서 사진 선택</Text>
            </Pressable>

            <Pressable
              style={styles.sheetConfirmButton}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.sheetConfirmText}>확인</Text>
            </Pressable>
          </DraggableSheet>
      </Modal>

      <Modal transparent visible={editListModalVisible} animationType="none">
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <DraggableSheet
              style={styles.editListSheetBox}
              onClose={() => {
                Keyboard.dismiss();
                setEditListModalVisible(false);
              }}
            >
              <Text style={styles.sheetTitle}>
                {activeCategory ?? '물품'} 목록
              </Text>

              {activeCategory && (
                <View style={styles.editListCard}>
                  <Text style={styles.editListCategoryTitle}>
                    {activeCategory}
                  </Text>

                  <View style={styles.editItemGrid}>
                    {itemsByCategory[activeCategory].map((item, index) => {
                      const category = activeCategory;

                      return (
                        <View
                          key={`${category}-${index}`}
                          style={styles.editItemCell}
                        >
                          <Pressable
                            style={[
                              styles.editCheckbox,
                              item.checked && styles.editCheckboxActive,
                            ]}
                            onPress={() => toggleItem(category, index)}
                          >
                            {item.checked && (
                              <Text style={styles.editCheckMark}>✓</Text>
                            )}
                          </Pressable>

                          {item.editing ? (
                            <TextInput
                              style={styles.editItemInput}
                              placeholder="품목 입력"
                              placeholderTextColor="#999999"
                              value={item.name}
                              autoFocus={item.name.length === 0}
                              onChangeText={(value) =>
                                changeItemName(category, index, value)
                              }
                              onBlur={() => finishEditItem(category, index)}
                              onSubmitEditing={() =>
                                finishEditItem(category, index)
                              }
                            />
                          ) : (
                            <Text style={styles.editItemText} numberOfLines={1}>
                              {item.name || '품목명'} {item.quantity}개
                            </Text>
                          )}

                          <Pressable
                            style={styles.editPencilButton}
                            onPress={() => toggleEditItem(category, index)}
                          >
                            <Image
                              source={require('../../../assets/images/pen.png')}
                              style={styles.editPencilIcon}
                            />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>

                  <Pressable
                    style={styles.addListItemButton}
                    onPress={() => addCustomItem(activeCategory)}
                  >
                    <Text style={styles.addListItemText}>+ 추가하기</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                style={[styles.sheetConfirmButton, styles.editListConfirmButton]}
                onPress={() => {
                  Keyboard.dismiss();
                  setEditListModalVisible(false);
                }}
              >
                <Text style={styles.sheetConfirmText}>확인</Text>
              </Pressable>
            </DraggableSheet>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        transparent
        visible={descriptionModalVisible}
        animationType="none"
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <DraggableSheet
              onClose={() => {
                Keyboard.dismiss();
                setDescriptionModalVisible(false);
              }}
            >
              <Text style={styles.sheetTitle}>
                {activeCategory ?? '물품'} 설명
              </Text>

              <TextInput
                style={styles.sheetTextArea}
                placeholder="상태, 브랜드, 구매처 등 간단히 적어주세요"
                placeholderTextColor="#888888"
                multiline
                textAlignVertical="top"
                value={draftDescription}
                onChangeText={setDraftDescription}
              />

              <Pressable
                style={styles.sheetConfirmButton}
                onPress={() => {
                  Keyboard.dismiss();
                  handleConfirmDescription();
                }}
              >
                <Text style={styles.sheetConfirmText}>확인</Text>
              </Pressable>
            </DraggableSheet>
        </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#111111' },
  tempSave: { fontSize: 13, color: '#BDBDBD', fontWeight: '700' },

  photoSection: {
    width: SCREEN_WIDTH,
    height: 360,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: 360,
    resizeMode: 'cover',
  },
  emptyImage: {
    width: SCREEN_WIDTH,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3F3',
  },
  emptyImageText: { color: '#999999', fontSize: 14 },
  photoDotRow: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
  },
  photoDotActive: {
    backgroundColor: '#777777',
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

  addPhotoButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DADADA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
  },
  addPhotoIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    marginRight: 6,
  },
  addDescriptionIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    marginRight: 6,
  },

  categoryPhotoPreviewRow: {
    marginBottom: 10,
  },

  categoryPhotoPreview: {
    width: 72,
    height: 72,
    borderRadius: 8,
    resizeMode: 'cover',
    marginRight: 8,
  },

  categoryDescriptionPreview: {
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },

  categoryDescriptionPreviewText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333333',
    fontWeight: '600',
  },

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

  modalKeyboardAvoiding: {
    flex: 1,
  },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheetBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
  },
  sheetHandleTouchArea: {
    alignItems: 'center',
    paddingBottom: 22,
  },
  sheetHandle: {
    width: 52,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#D8D8D8',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },
  editListSheetBox: {
    maxHeight: '82%',
  },
  editListCard: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 16,
  },
  editListCategoryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },
  editItemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  editItemCell: {
    width: '48%',
    minHeight: 34,
    borderRadius: 4,
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginBottom: 7,
  },
  editCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#B7B7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  editCheckboxActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  editCheckMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 17,
  },
  editItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  editItemInput: {
    flex: 1,
    height: 30,
    paddingVertical: 0,
    fontSize: 14,
    color: '#111111',
    fontWeight: '700',
  },
  editPencilButton: {
    width: 28,
    height: 30,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  editPencilIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
  addListItemButton: {
    height: 35,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addListItemText: {
    fontSize: 14,
    fontWeight: '800',
    color: BLUE,
  },
  editListConfirmButton: {
    marginTop: 54,
  },
  photoUploadBox: {
    height: 170,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  cameraIcon: { width: 32, height: 32, resizeMode: 'contain', marginBottom: 8 },
  photoUploadText: { fontSize: 16, color: '#666666', fontWeight: '600' },
  photoModalPreviewRow: {
    marginBottom: 14,
  },
  photoModalPreviewWrap: {
    width: 86,
    height: 86,
    marginRight: 10,
    position: 'relative',
  },
  photoModalPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  sheetTextArea: {
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    padding: 14,
    fontSize: 14,
    color: '#111111',
  },
  sheetConfirmButton: {
    height: 54,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  sheetConfirmText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
});
