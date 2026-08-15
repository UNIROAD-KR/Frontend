import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import {
  CUSTOM_COUNTRY_OPTION,
  countryOptions,
} from '@/src/constants/onboarding';
import { getMemberMe, type MemberResponse } from '../../../src/api/auth';
import { getUploadUrl, uploadFileToStorage } from '../../../src/api/upload';
import { createUsedItem, updateUsedItem } from '../../../src/api/usedItems';
import type { TradeCategory } from '../../../src/api/usedItems';
import { clearMarketDraft, saveMarketDraft } from '../../../src/storage/marketDraft';
import { saveLocalMarketPost } from '../../../src/storage/marketPosts';

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
    description?: string;
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
const MAX_CATEGORY_PHOTOS = 10;

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

const formatWonInput = (value: string) => {
  const digits = onlyDigits(value);

  if (!digits) return '';

  return Number(digits).toLocaleString('ko-KR');
};

const parseDateValue = (value?: string) => {
  if (!value) return new Date();

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const resolveCountrySelection = (value?: string) => {
  if (!value) {
    return {
      selectedCountry: '',
      customCountry: '',
    };
  }

  if (countryOptions.includes(value)) {
    return {
      selectedCountry: value,
      customCountry: '',
    };
  }

  return {
    selectedCountry: CUSTOM_COUNTRY_OPTION,
    customCountry: value,
  };
};

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
    country?: string;
    region?: string;
    returnDate?: string;
    semester?: string;
    selectedItems?: string;
    photos?: string;
    type?: string;
    draftItemsByCategory?: string;
    draftCategoryDetails?: string;
    editId?: string;
  }>();
  const editId = Number(params.editId);
  const isEditMode = Number.isFinite(editId);
  const initialCountrySelection = resolveCountrySelection(params.country);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [editListModalVisible, setEditListModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<MemberResponse | null>(null);
  const [savedNickname, setSavedNickname] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<
    'trade' | 'items' | 'seller'
  >('items');
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
      if (!next[group.category]) {
        return;
      }

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
  const [price, setPrice] = useState(() => formatWonInput(params.price || ''));
  const [selectedCountry, setSelectedCountry] = useState(
    initialCountrySelection.selectedCountry,
  );
  const [customCountry, setCustomCountry] = useState(
    initialCountrySelection.customCountry,
  );
  const [region, setRegion] = useState(params.region || '');
  const [returnDate, setReturnDate] = useState(params.returnDate || '');
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDateValue(params.returnDate),
  );
  const [itemsByCategory, setItemsByCategory] = useState(
    makeInitialEditableItems,
  );
  const isCustomCountry = selectedCountry === CUSTOM_COUNTRY_OPTION;
  const countryText = isCustomCountry ? customCountry.trim() : selectedCountry;
  const regionText = region.trim();
  const semesterText = params.semester || '26-2학기';
  const sellerName = sellerProfile?.nickname || savedNickname || '나';
  const sellerInitial = sellerName.trim().charAt(0) || '나';
  const sellerDomesticUniversity =
    sellerProfile?.domesticUniversity || sellerProfile?.homeUniversity || '소속대학 미정';
  const sellerCountry = sellerProfile?.dispatchedCountry || countryText;
  const sellerRegion = sellerProfile?.dispatchedRegion || regionText;
  const sellerDispatchedUniversity = sellerProfile?.dispatchedUniversity || '파견교 미정';
  const sellerDispatchSemester =
    sellerProfile?.dispatchSemester || semesterText || '학기 미정';

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

  useEffect(() => {
    let active = true;

    const loadSellerProfile = async () => {
      const nickname = await AsyncStorage.getItem('nickname');

      if (active) {
        setSavedNickname(nickname || '');
      }

      try {
        const response = await getMemberMe();

        if (active) {
          setSellerProfile(response.data.data);
        }
      } catch (error: any) {
        console.log('판매자 정보 조회 실패:', error.response?.data || error.message);
      }
    };

    loadSellerProfile();

    return () => {
      active = false;
    };
  }, []);

  const getCategoryDetail = (category: CategoryName): CategoryDetail => {
    return categoryDetails[category] ?? { photos: [], description: '' };
  };
  const activeCategoryPhotoCount = activeCategory
    ? getCategoryDetail(activeCategory).photos.length
    : 0;
  const canConfirmDescription = draftDescription.trim().length > 0;
  const canConfirmEditList = activeCategory
    ? itemsByCategory[activeCategory].some(
        (item) => item.checked && item.name.trim().length > 0,
      ) &&
      itemsByCategory[activeCategory].every(
        (item) => !item.checked || item.name.trim().length > 0,
      )
    : false;
  const canUpload =
    photoList.length > 0 &&
    Boolean(countryText) &&
    regionText.length > 0 &&
    returnDate.length > 0 &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    onlyDigits(price).length > 0 &&
    selectedGroups.length > 0 &&
    !isUploading;

  const savePreviewDraft = useCallback(async () => {
    await saveMarketDraft({
      step: 'preview',
      write: {
        type: params.type ?? 'all',
        title,
        content,
        price,
        country: countryText,
        region: regionText,
        returnDate,
        semester: semesterText,
        photos: photoList,
      },
      category: {
        selectedCategories: selectedGroups.map((group) => group.category),
        itemsByCategory,
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
  }, [
    categoryDetails,
    content,
    countryText,
    itemsByCategory,
    params.type,
    photoList,
    price,
    regionText,
    returnDate,
    selectedGroups,
    semesterText,
    title,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      savePreviewDraft().catch((error) => {
        console.log('중고거래 미리보기 자동저장 실패:', error);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [savePreviewDraft]);

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

  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setCountryModalVisible(false);

    if (countryName !== CUSTOM_COUNTRY_OPTION) {
      setCustomCountry('');
    }
  };

  const handleConfirmDate = () => {
    setReturnDate(formatDateValue(selectedDate));
    setShowDatePicker(false);
  };

  const changeItemQuantity = (
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

  const appendCategoryPhotos = (uris: string[]) => {
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
          photos: [...previousDetail.photos, ...uris].slice(
            0,
            MAX_CATEGORY_PHOTOS,
          ),
        },
      };
    });
  };

  const handlePickCategoryPhotos = async () => {
    if (!activeCategory) return;

    const currentPhotos = getCategoryDetail(activeCategory).photos;

    if (currentPhotos.length >= MAX_CATEGORY_PHOTOS) {
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
      selectionLimit: MAX_CATEGORY_PHOTOS - currentPhotos.length,
    });

    if (result.canceled) {
      return;
    }

    const selectedUris = result.assets.map((asset) => asset.uri);

    appendCategoryPhotos(selectedUris);
  };

  const handleTakeCategoryPhoto = async () => {
    if (!activeCategory) return;

    const currentPhotos = getCategoryDetail(activeCategory).photos;

    if (currentPhotos.length >= MAX_CATEGORY_PHOTOS) {
      Alert.alert('사진 제한', '카테고리별 사진은 최대 10장까지 추가할 수 있어요.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    appendCategoryPhotos([result.assets[0].uri]);
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

  const uploadImage = async (uri: string, index: number | string) => {
    if (/^https?:\/\//.test(uri)) {
      return uri;
    }

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
    if (isUploading) {
      return;
    }

    if (photoList.length === 0) {
      Alert.alert('대표 이미지 필요', '대표 사진을 1장 이상 추가해주세요.');
      return;
    }

    const cleanPrice = onlyDigits(price);

    if (
      !countryText ||
      !regionText ||
      !returnDate ||
      !title.trim() ||
      !content.trim() ||
      !cleanPrice
    ) {
      Alert.alert('입력 오류', '거래 정보, 제목, 설명, 가격을 모두 입력해주세요.');
      return;
    }

    if (selectedGroups.length === 0) {
      Alert.alert('입력 오류', '물품을 1개 이상 선택해주세요.');
      return;
    }

    const cleanedTitle = title.trim();
    const cleanedContent = content.trim();
    const numericPrice = Number(cleanPrice) || 0;
    const cleanedPriceText = `${numericPrice.toLocaleString('ko-KR')}원`;
    const syncPostToServer = async () => {
      const uploadedImageUrls = await Promise.all(
        photoList.map((photo, index) => uploadImage(photo, index)),
      );
      const thumbnailImageUrl = uploadedImageUrls[0];
      const categoryImageEntries = selectedGroups.flatMap((group) => {
        const detail = getCategoryDetail(group.category);

        return detail.photos.map((photo, index) => ({
          category: group.category,
          photo,
          index,
        }));
      });
      const uploadedCategoryImages = await Promise.all(
        categoryImageEntries.map(async (entry, index) => ({
          category: entry.category,
          apiCategory: categoryCodeMap[entry.category],
          imageUrl: await uploadImage(
            entry.photo,
            `category_${index}_${entry.index}`,
          ),
        })),
      );
      const categoryPhotosByCategory = uploadedCategoryImages.reduce<
        Partial<Record<CategoryName, string[]>>
      >((acc, image) => {
        acc[image.category] = [...(acc[image.category] ?? []), image.imageUrl];
        return acc;
      }, {});

      const requestBody = {
        title: cleanedTitle,
        content: cleanedContent,
        price: numericPrice,
        country: countryText,
        region: regionText,
        semester: semesterText,
        returnDate,
        thumbnailImageUrl,
        items: selectedGroups.flatMap((group) =>
          group.items.map((item, index) => {
            const description = getCategoryDetail(group.category).description.trim();

            return {
              category: categoryCodeMap[group.category],
              name: item.name,
              quantity: item.quantity,
              description: index === 0 && description ? description : undefined,
            };
          }),
        ),
        categoryImages:
          uploadedCategoryImages.length > 0
            ? uploadedCategoryImages.map((image) => ({
                category: image.apiCategory,
                imageUrl: image.imageUrl,
              }))
            : undefined,
      };

      if (isEditMode) {
        await updateUsedItem(editId, requestBody);

        return {
          id: editId,
          uploadedImageUrls,
          categoryPhotosByCategory,
        };
      }

      const response = await createUsedItem(requestBody);

      return {
        id: response.data.data,
        uploadedImageUrls,
        categoryPhotosByCategory,
      };
    };

    setIsUploading(true);

    try {
      const nickname = await AsyncStorage.getItem('nickname');
      let memberProfile: MemberResponse | null = null;

      try {
        const memberResponse = await getMemberMe();
        memberProfile = memberResponse.data.data;
      } catch (profileError: any) {
        console.log(
          '판매자 프로필 조회 실패:',
          profileError.response?.data || profileError.message,
        );
      }

      const uploadResult = await syncPostToServer();

      await saveLocalMarketPost(
        {
          title: cleanedTitle,
          content: cleanedContent,
          price: numericPrice,
          priceText: cleanedPriceText,
          country: countryText,
          region: regionText,
          semester: semesterText,
          returnDate,
          photos:
            uploadResult.uploadedImageUrls.length > 0
              ? uploadResult.uploadedImageUrls
              : photoList,
          itemGroups: selectedGroups.map((group) => {
            const detail = getCategoryDetail(group.category);
            const description = detail.description.trim();

            return {
              ...group,
              items: group.items.map((item, index) => ({
                ...item,
                description: index === 0 && description ? description : undefined,
              })),
              photos: uploadResult.categoryPhotosByCategory[group.category] ?? detail.photos,
              description,
            };
          }),
          authorName: memberProfile?.nickname || nickname || '나',
          sellerCountry: memberProfile?.dispatchedCountry || countryText,
          authorDomesticUniversity:
            memberProfile?.domesticUniversity || memberProfile?.homeUniversity || '',
          authorHomeUniversity: memberProfile?.homeUniversity || '',
          authorDispatchedUniversity: memberProfile?.dispatchedUniversity || '',
          authorDispatchedCountry: memberProfile?.dispatchedCountry || '',
          authorDispatchedRegion: memberProfile?.dispatchedRegion || '',
          authorDispatchSemester: memberProfile?.dispatchSemester || semesterText,
          authorVerified: true,
        },
        uploadResult.id,
      );

      await clearMarketDraft();

      Alert.alert(
        isEditMode ? '수정 완료' : '업로드 완료',
        isEditMode
          ? '중고거래 게시글이 수정되었습니다.'
          : '중고거래 게시글이 등록되었습니다.',
      );
      if (isEditMode) {
        router.replace({
          pathname: '/market',
          params: {
            openItemId: String(uploadResult.id),
            refresh: String(Date.now()),
          },
        } as any);
        return;
      }

      router.replace('/market' as any);
    } catch (error: any) {
      console.log('중고거래 업로드 실패:', error.response?.data || error.message);
      Alert.alert(
        isEditMode ? '수정 실패' : '업로드 실패',
        error.response?.data?.message ??
          (isEditMode
            ? '게시글 수정에 실패했습니다.'
            : '게시글 등록에 실패했습니다.'),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleTempSave = async () => {
    await savePreviewDraft();

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
          <AppBackButton style={styles.backButton} />

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
                  <Pressable
                    key={`${photo}-${index}`}
                    style={styles.previewImage}
                    onPress={() => setExpandedPhoto(photo)}
                  >
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                  </Pressable>
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
            <Text style={styles.tag}>{countryText || '국가 미정'}</Text>
            <Text style={styles.tag}>{regionText || '장소 미정'}</Text>
            <Text style={styles.tag}>{semesterText}</Text>
            <Text style={styles.tag}>{isEditMode ? '수정 중' : '등록 전'}</Text>
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
            onChangeText={(value) => setPrice(formatWonInput(value))}
            placeholder="0"
            placeholderTextColor="#999999"
            keyboardType="number-pad"
          />

          <View style={styles.tabRow}>
            <Pressable
              style={styles.tabButton}
              onPress={() => setActivePreviewTab('trade')}
            >
              <Text
                style={[
                  styles.tabText,
                  activePreviewTab === 'trade' && styles.activeTabText,
                ]}
              >
                거래 정보
              </Text>
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => setActivePreviewTab('items')}
            >
              <Text
                style={[
                  styles.tabText,
                  activePreviewTab === 'items' && styles.activeTabText,
                ]}
              >
                물품 목록
              </Text>
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => setActivePreviewTab('seller')}
            >
              <Text
                style={[
                  styles.tabText,
                  activePreviewTab === 'seller' && styles.activeTabText,
                ]}
              >
                판매자 정보
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.activeLine,
              activePreviewTab === 'trade' && styles.activeLineTrade,
              activePreviewTab === 'items' && styles.activeLineItems,
              activePreviewTab === 'seller' && styles.activeLineSeller,
            ]}
          />

          {activePreviewTab === 'trade' && (
            <>
              <Text style={styles.sectionTitle}>거래 정보</Text>
              <Text style={styles.desc}>
                올리기 전 거래 정보를 확인하고 수정할 수 있어요
              </Text>

              <View style={styles.tradeReviewBox}>
                <Text style={styles.tradeReviewLabel}>국가</Text>
                <Pressable
                  style={styles.reviewSelectInput}
                  onPress={() => setCountryModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.reviewSelectText,
                      selectedCountry && styles.reviewSelectTextActive,
                    ]}
                  >
                    {selectedCountry || '선택'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#B8BECC"
                    style={styles.reviewChevronIcon}
                  />
                </Pressable>

                {isCustomCountry && (
                  <>
                    <Text style={styles.tradeReviewLabel}>국가 직접 입력</Text>
                    <TextInput
                      style={styles.reviewInput}
                      value={customCountry}
                      onChangeText={setCustomCountry}
                      placeholder="국가명 입력"
                      placeholderTextColor="#999999"
                    />
                  </>
                )}

                <Text style={styles.tradeReviewLabel}>희망 장소</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={region}
                  onChangeText={setRegion}
                  placeholder="거래 장소 입력"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.tradeReviewLabel}>귀국일</Text>
                <Pressable
                  style={styles.reviewSelectInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.reviewSelectText,
                      returnDate && styles.reviewSelectTextActive,
                    ]}
                  >
                    {returnDate || '연도-월-일'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#B8BECC"
                    style={styles.reviewChevronIcon}
                  />
                </Pressable>

                <Text style={styles.tradeReviewLabel}>제목</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="제목 입력"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.tradeReviewLabel}>판매글 내용</Text>
                <TextInput
                  style={[styles.reviewInput, styles.reviewContentInput]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="판매글 내용 입력"
                  placeholderTextColor="#999999"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {activePreviewTab === 'items' && (
            <>
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
                          <Pressable
                            key={`${group.category}-${photo}-${index}`}
                            style={styles.categoryPhotoPreview}
                            onPress={() => setExpandedPhoto(photo)}
                          >
                            <Image
                              source={{ uri: photo }}
                              style={styles.categoryPhotoPreviewImage}
                            />
                          </Pressable>
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
                        <View
                          key={`${group.category}-${index}`}
                          style={styles.itemCountRow}
                        >
                          <Text style={styles.itemNameText} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={styles.itemCountPill}>
                            <Text style={styles.itemCountText}>
                              {item.quantity}개
                            </Text>
                          </View>
                        </View>
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
            </>
          )}

          {activePreviewTab === 'seller' && (
            <>
              <Text style={styles.sectionTitle}>판매자 정보</Text>
              <Text style={styles.desc}>거래 상대에게 보일 내 프로필 정보예요</Text>

              <View style={styles.sellerProfileCard}>
                <View style={styles.sellerProfileImage}>
                  <Text style={styles.sellerProfileInitial}>
                    {sellerInitial}
                  </Text>
                </View>

                <View style={styles.sellerProfileTextBox}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerNameText} numberOfLines={1}>
                      {sellerName}
                    </Text>
                    <View style={styles.sellerVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#123F9F" />
                      <Text style={styles.sellerVerifiedText}>인증완료</Text>
                    </View>
                  </View>
                  <Text style={styles.sellerMetaText}>
                    {[sellerCountry, sellerRegion].filter(Boolean).join(' ') || '지역 미정'} · {sellerDispatchSemester} 파견생
                  </Text>
                </View>
              </View>

              <View style={styles.sellerInfoList}>
                <View style={styles.sellerInfoRow}>
                  <Text style={styles.sellerInfoLabel}>소속대학</Text>
                  <Text style={styles.sellerInfoValue}>
                    {sellerDomesticUniversity}
                  </Text>
                </View>

                <View style={styles.sellerInfoRow}>
                  <Text style={styles.sellerInfoLabel}>파견국가 및 지역</Text>
                  <Text style={styles.sellerInfoValue}>
                    {[sellerCountry, sellerRegion].filter(Boolean).join(' ') || '미정'}
                  </Text>
                </View>

                <View style={styles.sellerInfoRow}>
                  <Text style={styles.sellerInfoLabel}>파견교</Text>
                  <Text style={styles.sellerInfoValue}>
                    {sellerDispatchedUniversity}
                  </Text>
                </View>

                <View style={styles.sellerInfoRow}>
                  <Text style={styles.sellerInfoLabel}>파견학기</Text>
                  <Text style={styles.sellerInfoValue}>
                    {sellerDispatchSemester}
                  </Text>
                </View>
              </View>
            </>
          )}

          <Pressable
            style={[styles.uploadButton, !canUpload && styles.disabledButton]}
            disabled={!canUpload}
            onPress={handleUpload}
          >
            <Text
              style={[
                styles.uploadButtonText,
                !canUpload && styles.disabledButtonText,
              ]}
            >
              {isUploading
                ? isEditMode
                  ? '수정 중...'
                  : '업로드 중...'
                : isEditMode
                  ? '변경하기'
                  : '업로드 하기'}
            </Text>
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
                        <Pressable
                          style={styles.photoModalPreview}
                          onPress={() => setExpandedPhoto(photo)}
                        >
                          <Image
                            source={{ uri: photo }}
                            style={styles.photoModalPreviewImage}
                          />
                        </Pressable>

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

            <View style={styles.photoSourceRow}>
              <Pressable
                style={styles.photoSourceButton}
                onPress={handleTakeCategoryPhoto}
              >
                <Image
                  source={require('../../../assets/images/camera.png')}
                  style={styles.cameraIcon}
                />
                <Text style={styles.photoUploadText}>사진 촬영</Text>
              </Pressable>

              <Pressable
                style={styles.photoSourceButton}
                onPress={handlePickCategoryPhotos}
              >
                <Ionicons name="images-outline" size={32} color="#666666" />
                <Text style={styles.photoUploadText}>앨범 선택</Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.sheetConfirmButton,
                activeCategoryPhotoCount === 0 && styles.disabledButton,
              ]}
              disabled={activeCategoryPhotoCount === 0}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text
                style={[
                  styles.sheetConfirmText,
                  activeCategoryPhotoCount === 0 && styles.disabledButtonText,
                ]}
              >
                확인
              </Text>
            </Pressable>
          </DraggableSheet>
      </Modal>

      <Modal transparent visible={Boolean(expandedPhoto)} animationType="fade">
        <View style={styles.fullImageOverlay}>
          <Pressable
            style={styles.fullImageBackdrop}
            onPress={() => setExpandedPhoto(null)}
          />

          {expandedPhoto && (
            <Image
              source={{ uri: expandedPhoto }}
              style={styles.fullImage}
            />
          )}

          <Pressable
            style={styles.fullImageCloseButton}
            onPress={() => setExpandedPhoto(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
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

                  <ScrollView
                    style={styles.editItemScroll}
                    contentContainerStyle={styles.editItemGrid}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {itemsByCategory[activeCategory]
                      .map((item, index) => ({ item, index }))
                      .filter(({ item }) => item.checked)
                      .map(({ item, index }) => {
                        const category = activeCategory;

                        return (
                          <View
                            key={`${category}-${index}`}
                            style={styles.editItemCell}
                          >
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
                                {item.name || '품목명'}
                              </Text>
                            )}

                            <View style={styles.editQuantityControl}>
                              <Pressable
                                style={styles.editQuantityButton}
                                onPress={() =>
                                  changeItemQuantity(category, index, 'minus')
                                }
                              >
                                <Text style={styles.editQuantityButtonText}>−</Text>
                              </Pressable>
                              <Text style={styles.editQuantityNumber}>
                                {item.quantity}
                              </Text>
                              <Pressable
                                style={styles.editQuantityButton}
                                onPress={() =>
                                  changeItemQuantity(category, index, 'plus')
                                }
                              >
                                <Text style={styles.editQuantityButtonText}>＋</Text>
                              </Pressable>
                            </View>

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
                  </ScrollView>

                  <Pressable
                    style={styles.addListItemButton}
                    onPress={() => addCustomItem(activeCategory)}
                  >
                    <Text style={styles.addListItemText}>+ 추가하기</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                style={[
                  styles.sheetConfirmButton,
                  styles.editListConfirmButton,
                  !canConfirmEditList && styles.disabledButton,
                ]}
                disabled={!canConfirmEditList}
                onPress={() => {
                  Keyboard.dismiss();
                  setEditListModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sheetConfirmText,
                    !canConfirmEditList && styles.disabledButtonText,
                  ]}
                >
                  확인
                </Text>
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
                style={[
                  styles.sheetConfirmButton,
                  !canConfirmDescription && styles.disabledButton,
                ]}
                disabled={!canConfirmDescription}
                onPress={() => {
                  Keyboard.dismiss();
                  handleConfirmDescription();
                }}
              >
                <Text
                  style={[
                    styles.sheetConfirmText,
                    !canConfirmDescription && styles.disabledButtonText,
                  ]}
                >
                  확인
                </Text>
              </Pressable>
            </DraggableSheet>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        transparent
        visible={showDatePicker}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setShowDatePicker(false)}
          />

          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>

              <Text style={styles.pickerTitle}>귀국일 선택</Text>

              <Pressable onPress={handleConfirmDate}>
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              textColor="#111111"
              themeVariant="light"
              style={styles.iosPicker}
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
            />
          </View>
        </View>
      </Modal>

      <OnboardingSelectModal
        visible={countryModalVisible}
        title="국가 선택"
        options={countryOptions}
        selectedValue={selectedCountry}
        onClose={() => setCountryModalVisible(false)}
        onSelect={handleSelectCountry}
      />

      <Modal transparent visible={isUploading} animationType="fade">
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <ActivityIndicator color={BLUE} size="large" />
            <Text style={styles.uploadingTitle}>업로드 중</Text>
            <Text style={styles.uploadingDesc}>
              사진과 게시글을 {isEditMode ? '수정하고' : '등록하고'} 있어요.
            </Text>
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F8FC',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#111111' },
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
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
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
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
    marginBottom: 22,
  },
  activeLineTrade: {
    marginLeft: 0,
  },
  activeLineItems: {
    marginLeft: '33.33%',
  },
  activeLineSeller: {
    marginLeft: '66.66%',
  },
  sellerProfileCard: {
    borderRadius: 10,
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E7EAF2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  sellerProfileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DDE6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerProfileInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE,
  },
  sellerProfileTextBox: {
    flex: 1,
    minWidth: 0,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sellerNameText: {
    maxWidth: '58%',
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  sellerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sellerVerifiedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#123F9F',
  },
  sellerMetaText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: '#555555',
    fontWeight: '700',
  },
  sellerInfoList: {
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 15,
    paddingVertical: 13,
    gap: 11,
    marginBottom: 22,
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  sellerInfoLabel: {
    width: 96,
    fontSize: 12,
    fontWeight: '800',
    color: '#777777',
  },
  sellerInfoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#111111',
  },
  tradeReviewBox: {
    borderWidth: 1,
    borderColor: '#E4E7EF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 28,
  },
  tradeReviewLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#222222',
    marginBottom: 8,
  },
  reviewInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8DCE8',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111111',
    fontWeight: '700',
    marginBottom: 14,
  },
  reviewContentInput: {
    height: 104,
    paddingTop: 12,
    lineHeight: 20,
  },
  reviewSelectInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8DCE8',
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewSelectText: {
    flex: 1,
    fontSize: 14,
    color: '#999999',
    fontWeight: '700',
  },
  reviewSelectTextActive: {
    color: '#111111',
  },
  reviewChevronIcon: {
    marginLeft: 8,
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
    marginRight: 8,
    overflow: 'hidden',
  },

  categoryPhotoPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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

  itemList: {
    gap: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  itemCountRow: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#EBEEF5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemNameText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    color: '#111111',
    fontWeight: '800',
  },
  itemCountPill: {
    minWidth: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
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
  disabledButton: {
    backgroundColor: '#D5D5D5',
    borderColor: '#D5D5D5',
  },
  disabledButtonText: {
    color: '#999999',
  },

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
    maxHeight: '90%',
    paddingBottom: 46,
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
    gap: 8,
    paddingBottom: 4,
  },
  editItemScroll: {
    maxHeight: SCREEN_HEIGHT * 0.42,
  },
  editItemCell: {
    width: '100%',
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 0,
    gap: 8,
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
    minWidth: 0,
    fontSize: 14,
    color: '#333333',
    fontWeight: '800',
  },
  editItemInput: {
    flex: 1,
    minWidth: 0,
    height: 30,
    paddingVertical: 0,
    fontSize: 14,
    color: '#111111',
    fontWeight: '700',
  },
  editQuantityControl: {
    width: 86,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6EAF3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
  },
  editQuantityButton: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editQuantityButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    lineHeight: 17,
  },
  editQuantityNumber: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
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
  photoSourceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  photoSourceButton: {
    flex: 1,
    height: 126,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
  },
  photoModalPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '78%',
    resizeMode: 'contain',
  },
  fullImageCloseButton: {
    position: 'absolute',
    top: 54,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
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
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  pickerHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#777777',
    fontWeight: '700',
  },
  pickerTitle: {
    fontSize: 17,
    color: '#111111',
    fontWeight: '900',
  },
  pickerDone: {
    fontSize: 16,
    color: BLUE,
    fontWeight: '800',
  },
  iosPicker: {
    height: 216,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  uploadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  uploadingBox: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  uploadingTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  uploadingDesc: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#666666',
    textAlign: 'center',
  },
});
