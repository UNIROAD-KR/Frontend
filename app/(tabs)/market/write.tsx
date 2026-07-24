import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
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
import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import { AppBackButton } from '@/components/ui/app-back-button';
import {
  CUSTOM_COUNTRY_OPTION,
  countryOptions,
} from '@/src/constants/onboarding';
import { getMarketDraft, saveMarketDraft } from '../../../src/storage/marketDraft';
import { canUseMarketWithoutVerification } from '../../../src/utils/verification';

const MAX_MARKET_PHOTOS = 10;

const parsePhotos = (value?: string) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const parseDate = (value?: string) => {
  if (!value) return new Date();

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

const formatWonInput = (value: string) => {
  const digits = onlyDigits(value);

  if (!digits) return '';

  return Number(digits).toLocaleString('ko-KR');
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

export default function MarketWritePage() {
  const handlePickImages = async () => {
    if (photos.length >= MAX_MARKET_PHOTOS) {
      Alert.alert('사진 제한', `사진은 최대 ${MAX_MARKET_PHOTOS}장까지 업로드할 수 있어요.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '앨범 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_MARKET_PHOTOS - photos.length,
    });

    if (result.canceled) return;

    const selectedUris = result.assets.map((asset) => asset.uri);

    setPhotos((prev) => [...prev, ...selectedUris].slice(0, MAX_MARKET_PHOTOS));
  };
  const handleTakePhoto = async () => {
    if (photos.length >= MAX_MARKET_PHOTOS) {
      Alert.alert('사진 제한', `사진은 최대 ${MAX_MARKET_PHOTOS}장까지 업로드할 수 있어요.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    setPhotos((prev) => [...prev, uri].slice(0, MAX_MARKET_PHOTOS));
  };
  const scrollRef = useRef<ScrollView>(null);
  const customCountryInputRef = useRef<TextInput>(null);
  const regionInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: false,
      });
    }, []),
  );
  const params = useLocalSearchParams<{
    type?: string;
    title?: string;
    content?: string;
    price?: string;
    country?: string;
    region?: string;
    returnDate?: string;
    photos?: string;
    resumeCategory?: string;
    resumePreview?: string;
    selectedItems?: string;
    draftSelectedCategories?: string;
    draftItemsByCategory?: string;
    draftCategoryDetails?: string;
  }>();
  const resumedCategoryRef = useRef(false);
  const { type } = params;
  const initialCountrySelection = resolveCountrySelection(params.country);

  const [verificationModalVisible, setVerificationModalVisible] =
    useState(false);

  const [photos, setPhotos] = useState<string[]>(() =>
    parsePhotos(params.photos),
  );
  const [selectedCountry, setSelectedCountry] = useState(
    initialCountrySelection.selectedCountry,
  );
  const [customCountry, setCustomCountry] = useState(
    initialCountrySelection.customCountry,
  );
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [region, setRegion] = useState(params.region || '');
  const [returnDate, setReturnDate] = useState(params.returnDate || '');
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDate(params.returnDate),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [title, setTitle] = useState(params.title || '');
  const [content, setContent] = useState(params.content || '');
  const [price, setPrice] = useState(() => formatWonInput(params.price || ''));
  const isCustomCountry = selectedCountry === CUSTOM_COUNTRY_OPTION;
  const countryValue = isCustomCountry ? customCountry.trim() : selectedCountry;
  const canGoNext =
    photos.length > 0 &&
    Boolean(countryValue) &&
    region.trim().length > 0 &&
    returnDate.length > 0 &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    onlyDigits(price).length > 0;

  useEffect(() => {
    checkVerification();
  }, []);

  useEffect(() => {
    if (params.resumeCategory !== 'true' || resumedCategoryRef.current) {
      return;
    }

    resumedCategoryRef.current = true;

    const timer = setTimeout(() => {
      router.push({
        pathname: '/market/category',
        params: {
          title: params.title ?? '',
          content: params.content ?? '',
          price: onlyDigits(params.price ?? ''),
          country: params.country ?? '',
          region: params.region ?? '',
          returnDate: params.returnDate ?? '',
          type: params.type ?? 'all',
          photos: params.photos ?? '[]',
          resumePreview: params.resumePreview ?? '',
          selectedItems: params.selectedItems ?? '',
          draftSelectedCategories: params.draftSelectedCategories ?? '[]',
          draftItemsByCategory: params.draftItemsByCategory ?? '',
          draftCategoryDetails: params.draftCategoryDetails ?? '{}',
        },
      } as any);
    }, 120);

    return () => clearTimeout(timer);
  }, [
    params.content,
    params.country,
    params.draftCategoryDetails,
    params.draftItemsByCategory,
    params.draftSelectedCategories,
    params.photos,
    params.price,
    params.region,
    params.resumeCategory,
    params.resumePreview,
    params.returnDate,
    params.selectedItems,
    params.title,
    params.type,
  ]);

  const checkVerification = async () => {
    try {
      const canUseMarket = await canUseMarketWithoutVerification();

      if (!canUseMarket) {
        setVerificationModalVisible(true);
      }
    } catch (error: any) {
      console.log('내 정보 조회 실패:', error.response?.data || error.message);
      setVerificationModalVisible(true);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
  };

  const focusNextField = (ref: RefObject<TextInput | null>) => {
    setTimeout(() => {
      ref.current?.focus();
    }, 120);
  };

  const handleConfirmDate = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');

    setReturnDate(`${year}-${month}-${day}`);
    setShowDatePicker(false);
    focusNextField(titleInputRef);
  };

  const handleTempSave = async () => {
    await saveMarketDraft({
      step: 'write',
      write: {
        type,
        title,
        content,
        price,
        country: countryValue,
        region,
        returnDate,
        photos,
      },
    });

    Alert.alert('임시저장 완료', '작성 중인 거래글을 저장했어요.');
  };

  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setCountryModalVisible(false);

    if (countryName !== CUSTOM_COUNTRY_OPTION) {
      setCustomCountry('');
      focusNextField(regionInputRef);
      return;
    }

    focusNextField(customCountryInputRef);
  };

  const handleSubmit = async () => {
    const cleanPrice = onlyDigits(price);

    if (
      !countryValue ||
      !region.trim() ||
      !returnDate ||
      !title.trim() ||
      !content.trim() ||
      !cleanPrice
    ) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    const draft = await getMarketDraft();
    const hasReusableCategoryDraft =
      draft?.category &&
      draft.write.title === title &&
      draft.write.content === content &&
      onlyDigits(draft.write.price) === cleanPrice &&
      draft.write.country === countryValue &&
      draft.write.region === region &&
      draft.write.returnDate === returnDate;
    const reusableCategoryDraft = hasReusableCategoryDraft
      ? draft.category
      : null;
    const reusableCategoryDetails =
      hasReusableCategoryDraft && draft?.preview?.categoryDetails
        ? draft.preview.categoryDetails
        : null;

    router.push({
      pathname: '/market/category',
      params: {
        title,
        content,
        price: cleanPrice,
        country: countryValue,
        region: region.trim(),
        returnDate,
        type,
        photos: JSON.stringify(photos),
        ...(reusableCategoryDraft
          ? {
              draftSelectedCategories: JSON.stringify(
                reusableCategoryDraft.selectedCategories,
              ),
              draftItemsByCategory: JSON.stringify(
                reusableCategoryDraft.itemsByCategory,
              ),
              ...(reusableCategoryDetails
                ? {
                    draftCategoryDetails: JSON.stringify(reusableCategoryDetails),
                  }
                : {}),
            }
          : {}),
      },
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppBackButton style={styles.backButton} />

          <Text style={styles.headerTitle}>
            {type === 'all' ? '일괄 판매하기' : '개별 판매하기'}
          </Text>

          <Pressable onPress={handleTempSave}>
            <Text style={styles.tempSave}>임시저장</Text>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progress} />
        </View>

        <View style={styles.photoHeader}>
          <Text style={styles.sectionTitle}>사진</Text>
          <Text style={styles.photoCount}>
            {photos.length}/{MAX_MARKET_PHOTOS}
          </Text>
        </View>

        <View style={styles.photoArea}>
          {photos.length === 0 ? (
            <View style={styles.photoActionRow}>
              <Pressable
                style={styles.photoActionButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={18} color={BLUE} />
                <Text style={styles.photoText}>사진 촬영</Text>
              </Pressable>

              <Pressable
                style={styles.photoActionButton}
                onPress={handlePickImages}
              >
                <Ionicons name="images-outline" size={18} color={BLUE} />
                <Text style={styles.photoText}>앨범 선택</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoPreviewList}
            >
              {photos.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoPreviewWrap}>
                  <Pressable
                    style={styles.photoPreviewButton}
                    onPress={() => setExpandedPhoto(uri)}
                  >
                    <Image source={{ uri }} style={styles.photoPreview} />
                  </Pressable>

                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>×</Text>
                  </Pressable>
                </View>
              ))}

              {photos.length < MAX_MARKET_PHOTOS && (
                <Pressable
                  style={styles.addMorePhoto}
                  onPress={handlePickImages}
                >
                  <Ionicons name="add" size={24} color={BLUE} />
                  <Text style={styles.addMorePhotoText}>추가</Text>
                </Pressable>
              )}
            </ScrollView>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>거래 정보</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.twoColumnRow}>
          <View style={styles.halfInputGroup}>
            <Text style={styles.label}>국가</Text>
            <Pressable
              style={styles.selectInput}
              onPress={() => setCountryModalVisible(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  selectedCountry && styles.selectTextActive,
                ]}
              >
                {selectedCountry || '선택'}
              </Text>

              <Ionicons
                name="chevron-down"
                size={16}
                color="#B8BECC"
                style={styles.chevronIcon}
              />
            </Pressable>
          </View>

          <View style={styles.halfInputGroup}>
            <Text style={styles.label}>희망 장소</Text>
            <TextInput
              style={styles.input}
              ref={regionInputRef}
              placeholder="입력"
              placeholderTextColor="#A6A6A6"
              value={region}
              onChangeText={setRegion}
              returnKeyType="next"
              onSubmitEditing={() => focusNextField(titleInputRef)}
            />
          </View>
        </View>

        {isCustomCountry && (
          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>국가 직접 입력</Text>
            <TextInput
              style={styles.input}
              ref={customCountryInputRef}
              placeholder="국가명 입력"
              placeholderTextColor="#A6A6A6"
              value={customCountry}
              onChangeText={setCustomCountry}
              returnKeyType="next"
              onSubmitEditing={() => focusNextField(regionInputRef)}
            />
          </View>
        )}

        <View style={styles.tradeDateGroup}>
            <Text style={styles.label}>귀국일</Text>

            <Pressable
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[styles.dateText, returnDate && styles.dateTextActive]}
              >
                {returnDate || '연도-월-일'}
              </Text>

              <Ionicons
                name="chevron-down"
                size={16}
                color="#B8BECC"
                style={styles.chevronIcon}
              />
            </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>게시글</Text>
          <View style={styles.sectionLine} />
        </View>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          ref={titleInputRef}
          placeholder="제목을 입력해주세요."
          placeholderTextColor="#A6A6A6"
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
          onSubmitEditing={() => focusNextField(contentInputRef)}
        />

        <Text style={styles.label}>자유 설명</Text>
        <TextInput
          style={styles.textArea}
          ref={contentInputRef}
          placeholder={
            '다음 학기 교환학생에게 전달할 내용을 작성해 주세요.\n물품 상태, 구매 시기, 거래 조건 등 자유롭게\n적어주세요.'
          }
          placeholderTextColor="#A6A6A6"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          returnKeyType="next"
          blurOnSubmit
          onSubmitEditing={() => focusNextField(priceInputRef)}
        />

        <Text style={styles.label}>가격</Text>
        <View style={styles.priceInputBox}>
          <Text style={styles.pricePrefix}>₩</Text>
          <TextInput
            style={styles.priceTextInput}
            ref={priceInputRef}
            placeholder="0"
            placeholderTextColor="#A6A6A6"
            keyboardType="number-pad"
            value={price}
            onChangeText={(value) => setPrice(formatWonInput(value))}
          />
          <Text style={styles.priceUnit}>원</Text>
        </View>

        <Pressable
          style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]}
          disabled={!canGoNext}
          onPress={handleSubmit}
        >
          <Text
            style={[
              styles.nextButtonText,
              !canGoNext && styles.nextButtonTextDisabled,
            ]}
          >
            다음 (1/2)
          </Text>
        </Pressable>
      </ScrollView>

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

      <Modal
        transparent
        visible={verificationModalVisible}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModal}>
            <Text style={styles.verifyTitle}>교환학생 인증</Text>

            <Text style={styles.verifyDesc}>
              글을 작성하려면 교환학생 신원{'\n'}인증이 필요해요.
            </Text>

            <View style={styles.verifyButtonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setVerificationModalVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>

              <Pressable
                style={styles.verifyButton}
                onPress={() => {
                  setVerificationModalVisible(false);
                  router.push('/verification-consent' as any);
                }}
              >
                <Text style={styles.verifyButtonText}>신원 인증하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(expandedPhoto)} animationType="fade">
        <View style={styles.fullImageOverlay}>
          <Pressable
            style={styles.fullImageBackdrop}
            onPress={() => setExpandedPhoto(null)}
          />

          {expandedPhoto && (
            <Image source={{ uri: expandedPhoto }} style={styles.fullImage} />
          )}

          <Pressable
            style={styles.fullImageCloseButton}
            onPress={() => setExpandedPhoto(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
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
    </KeyboardAvoidingView>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 42,
  },

  header: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F8FC',
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

  progress: {
    flex: 1,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#DDDDDD',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222222',
  },

  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  photoCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#8A8A8A',
  },

  photoArea: {
    marginBottom: 48,
  },

  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  photoActionButton: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE5F3',
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  photoText: {
    fontSize: 13,
    color: BLUE,
    fontWeight: '900',
  },

  photoPreviewList: {
    gap: 10,
    paddingRight: 4,
  },

  photoPreviewWrap: {
    width: 96,
    height: 96,
    marginRight: 10,
    position: 'relative',
  },

  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  photoPreviewButton: {
    width: '100%',
    height: '100%',
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
    width: '100%',
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
    fontWeight: '800',
  },

  addMorePhoto: {
    width: 96,
    height: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE5F3',
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  addMorePhotoText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E3E3',
    marginLeft: 14,
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  halfInputGroup: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  fullInputGroup: {
    marginBottom: 18,
  },

  tradeDateGroup: {
    marginBottom: 58,
  },

  label: {
    height: 19,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 10,
    includeFontPadding: false,
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    color: '#111111',
    marginBottom: 18,
  },

  selectInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  selectText: {
    flex: 1,
    fontSize: 14,
    color: '#A6A6A6',
    fontWeight: '600',
  },

  selectTextActive: {
    color: '#111111',
  },

  dateInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#A6A6A6',
  },

  dateTextActive: {
    color: '#111111',
  },

  chevronIcon: {
    marginLeft: 8,
  },

  textArea: {
    height: 132,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingTop: 14,
    fontSize: 14,
    lineHeight: 22,
    color: '#111111',
    marginBottom: 18,
  },

  priceInputBox: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },

  pricePrefix: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '900',
    marginRight: 6,
  },

  priceTextInput: {
    flex: 1,
    height: 43,
    paddingVertical: 0,
    fontSize: 14,
    color: '#111111',
    fontWeight: '700',
  },

  priceUnit: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '800',
    marginLeft: 8,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 50,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D0D0D0',
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
    fontSize: 14,
    fontWeight: '900',
  },

  checkText: {
    fontSize: 14,
    color: '#222222',
  },

  nextButton: {
    height: 52,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonDisabled: {
    backgroundColor: '#D5D5D5',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  nextButtonTextDisabled: {
    color: '#999999',
  },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyModal: {
    width: 270,
    borderRadius: 10,
    backgroundColor: '#4A4A4A',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  verifyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  verifyDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 22,
  },

  verifyButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#9A9A9A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  verifyButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
  },
});
