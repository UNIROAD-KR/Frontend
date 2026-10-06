import { BottomSheetModal, bottomSheetStyles, BottomSheetView } from '@/components/ui/bottom-sheet';
import { Text, TextInput } from '@/components/ui/app-text';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  CompanionPostRequest,
  createCompanionPost,
  updateCompanionPost,
} from '../src/api/companion';
import {
  FreePostRequest,
  createFreePost,
  updateFreePost,
} from '../src/api/freePosts';
import { getUploadUrl, uploadFileToStorage } from '../src/api/upload';
import { BLUE } from '../src/data/community';
import { canUseMarketWithoutVerification } from '../src/utils/verification';
import { Colors, fonts } from '@/constants/theme';
import { MarketCountrySheet } from '@/components/market/MarketCountrySheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackButton, goBackOrReplace } from '@/components/ui/app-back-button';

type DateTarget = 'start' | 'end' | null;
const MAX_FREE_POST_PHOTOS = 10;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDate = (value?: string) => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

export default function CommunityWriteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    type?: string;
    mode?: string;
    id?: string;
    title?: string;
    body?: string;
    country?: string;
    region?: string;
    startDate?: string;
    endDate?: string;
    chatLink?: string;
    capacity?: string;
    currentParticipants?: string;
    genderRatio?: string;
    status?: 'RECRUITING' | 'COMPLETED';
    imageUrls?: string;
  }>();
  const isCompanion = params.type === 'companion';
  const isEdit = params.mode === 'edit';

  const [title, setTitle] = useState(params.title || '');
  const [body, setBody] = useState(params.body || '');
  const [country, setCountry] = useState(params.country || '');
  const [region, setRegion] = useState(params.region || '');
  const [startDate, setStartDate] = useState(params.startDate || '');
  const [endDate, setEndDate] = useState(params.endDate || '');
  const [capacity, setCapacity] = useState(params.capacity || '');
  const [currentParticipants] = useState(
    params.currentParticipants || '1',
  );
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const [chatLink, setChatLink] = useState(params.chatLink || '');
  const [status] = useState<'RECRUITING' | 'COMPLETED'>(
    params.status || 'RECRUITING',
  );
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const [photos, setPhotos] = useState<string[]>(() => {
    if (!params.imageUrls) {
      return [];
    }

    try {
      const parsed = JSON.parse(params.imageUrls);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);

  const screenText = useMemo(
    () => ({
      title: isCompanion ? '동행 모집' : '글쓰기',
      subtitle: isCompanion
        ? '인증된 교환학생만 동행 모집 글을 작성할 수 있어요.'
        : '익명으로 경험과 질문을 공유해보세요.',
      bodyPlaceholder: isCompanion
        ? '일정, 이동 방식, 예상 비용, 원하는 동행 스타일을 구체적으로 적어주세요.'
        : '본문을 입력해주세요.',
      button: isEdit
        ? '수정 완료'
        : isCompanion
          ? '모집글 등록'
          : '게시글 등록',
    }),
    [isCompanion, isEdit],
  );

  useEffect(() => {
    if (!isCompanion) {
      return;
    }

    const checkVerification = async () => {
      try {
        const canWrite = await canUseMarketWithoutVerification();

        if (!canWrite) {
          setVerificationModalVisible(true);
        }
      } catch (error: any) {
        console.log('내 정보 조회 실패:', error.response?.data || error.message);
        setVerificationModalVisible(true);
      }
    };

    checkVerification();
  }, [isCompanion]);

  const openDatePicker = (target: Exclude<DateTarget, null>) => {
    setDraftDate(parseDate(target === 'start' ? startDate : endDate));
    setDateTarget(target);
  };

  const handleConfirmDate = () => {
    const nextDate = formatDate(draftDate);

    if (dateTarget === 'start') {
      setStartDate(nextDate);
      if (endDate && endDate < nextDate) {
        setEndDate('');
      }
    }

    if (dateTarget === 'end') {
      setEndDate(nextDate);
      if (startDate && startDate > nextDate) {
        setStartDate('');
      }
    }

    setDateTarget(null);
  };

  const buildCompanionPayload = (): CompanionPostRequest | null => {
    const capacityNumber = Number(capacity);
    const currentNumber = Number(currentParticipants);

    if (
      !title.trim() ||
      !body.trim() ||
      !country.trim() ||
      !region.trim() ||
      !startDate ||
      !endDate ||
      !capacity.trim() ||
      !chatLink.trim()
    ) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return null;
    }

    if (!Number.isInteger(capacityNumber) || capacityNumber < 2) {
      Alert.alert('입력 오류', '모집 인원은 2명 이상 숫자로 입력해주세요.');
      return null;
    }

    if (!Number.isInteger(currentNumber) || currentNumber < 1) {
      Alert.alert('입력 오류', '현재 인원은 1명 이상 숫자로 입력해주세요.');
      return null;
    }

    if (currentNumber > capacityNumber) {
      Alert.alert('입력 오류', '현재 인원은 모집 인원보다 클 수 없어요.');
      return null;
    }

    return {
      title: title.trim(),
      content: body.trim(),
      startDate,
      endDate,
      country: country.trim(),
      region: region.trim(),
      chatLink: chatLink.trim(),
      status,
      capacity: capacityNumber,
      currentParticipants: currentNumber,
      genderRatio: isEdit ? (params.genderRatio || '무관') : '무관',
    };
  };

  const buildFreePostPayload = (imageUrls: string[]): FreePostRequest | null => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 입력해주세요.');
      return null;
    }

    return {
      title: title.trim(),
      content: body.trim(),
      imageUrls,
    };
  };

  const uploadCommunityImage = async (uri: string, index: number) => {
    if (/^https?:\/\//.test(uri)) {
      return uri;
    }

    const fileName = `community_${Date.now()}_${index}.jpg`;
    const contentType = 'image/jpeg';
    const response = await getUploadUrl({
      fileName,
      contentType,
      fileType: 'IMAGE',
    });

    const { uploadUrl, fileUrl } = response.data.data;
    await uploadFileToStorage(uploadUrl, uri, contentType);

    return fileUrl;
  };

  const handlePickImages = async () => {
    if (photos.length >= MAX_FREE_POST_PHOTOS) {
      Alert.alert('사진 제한', `사진은 최대 ${MAX_FREE_POST_PHOTOS}장까지 업로드할 수 있어요.`);
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
      selectionLimit: MAX_FREE_POST_PHOTOS - photos.length,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setPhotos((prev) =>
        [...prev, ...selectedUris].slice(0, MAX_FREE_POST_PHOTOS),
      );
    }
  };

  const handleTakePhoto = async () => {
    if (photos.length >= MAX_FREE_POST_PHOTOS) {
      Alert.alert('사진 제한', `사진은 최대 ${MAX_FREE_POST_PHOTOS}장까지 업로드할 수 있어요.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos((prev) =>
        [...prev, result.assets[0].uri].slice(0, MAX_FREE_POST_PHOTOS),
      );
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
  };

  const handleSubmit = async () => {
    if (submitting || (isCompanion && !companionValid)) {
      return;
    }

    if (!title.trim() || !body.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    if (!isCompanion) {
      try {
        const imageUrls = await Promise.all(
          photos.map((photo, index) => uploadCommunityImage(photo, index)),
        );
        const payload = buildFreePostPayload(imageUrls);

        if (!payload) {
          return;
        }

        if (isEdit && params.id) {
          await updateFreePost(Number(params.id), payload);
        } else {
          await createFreePost(payload);
        }

        Alert.alert(
          isEdit ? '수정 완료' : '등록 완료',
          isEdit ? '게시글을 수정했어요.' : '게시글을 등록했어요.',
          [{ text: '확인', onPress: () => goBackOrReplace('/community') }],
        );
      } catch (error: any) {
        console.log('자유게시판 저장 실패:', error.response?.data || error.message);
        Alert.alert(
          '저장 실패',
          error.response?.data?.message || '잠시 후 다시 시도해주세요.',
        );
      } finally {
        setSubmitting(false);
      }

      return;
    }

    const payload = buildCompanionPayload();

    if (!payload) {
      setSubmitting(false);
      return;
    }

    try {
      if (isEdit && params.id) {
        await updateCompanionPost(Number(params.id), payload);
      } else {
        await createCompanionPost(payload);
      }

      Alert.alert(
        isEdit ? '수정 완료' : '등록 완료',
        isEdit ? '동행 모집 글을 수정했어요.' : '동행 모집 글을 등록했어요.',
        [{ text: '확인', onPress: () => goBackOrReplace('/community') }],
      );
    } catch (error: any) {
      console.log('동행 모집 저장 실패:', error.response?.data || error.message);
      Alert.alert(
        '저장 실패',
        error.response?.data?.message || '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const companionValid = Boolean(
    country.trim() && region.trim() && startDate && endDate &&
    startDate <= endDate && chatLink.trim() &&
    Number.isInteger(Number(capacity)) && Number(capacity) >= 2 &&
    Number.isInteger(Number(currentParticipants)) && Number(currentParticipants) >= 1 &&
    Number(currentParticipants) <= Number(capacity) &&
    title.trim() && body.trim() && body.length <= 200
  );
  const submitDisabled = submitting || (isCompanion ? !companionValid : !title.trim() || !body.trim());

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, isCompanion && { height: insets.top + 56, paddingTop: insets.top, borderBottomWidth: 0 }]}>
        {isCompanion ? (
          <>
            <View style={styles.companionHeaderSide}>
              <AppBackButton onPress={() => goBackOrReplace('/community')} style={styles.backButton} />
            </View>
            <Text style={styles.companionHeaderTitle}>동행 모집 {isEdit ? '수정' : '글쓰기'}</Text>
            <Pressable style={[styles.companionHeaderSide, styles.companionHeaderSubmit]} onPress={handleSubmit} disabled={submitDisabled} accessibilityRole="button" accessibilityLabel={isEdit ? '동행 글 수정 제출' : '동행 글쓰기 제출'} accessibilityState={{ disabled: submitDisabled, busy: submitting }}>
              <Text style={[styles.companionWriteText, !submitDisabled && { color: Colors.primary.default }]}>{submitting ? '저장 중' : isEdit ? '수정' : '글쓰기'}</Text>
            </Pressable>
          </>
        ) : (
          <>
        <AppBackButton
          onPress={() => goBackOrReplace('/community')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{screenText.title}</Text>
        <View style={styles.headerSpacer} />
          </>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isCompanion && { paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isCompanion ? (
          <>
            <Text style={styles.companionSectionTitle}>모집 조건</Text>
            <View style={styles.companionField}>
              <Text style={styles.companionLabel}>국가 및 지역</Text>
              <Pressable style={styles.companionSelect} onPress={() => setCountrySheetVisible(true)} accessibilityRole="button">
                <Text style={[styles.companionValue, { flex: 1 }, !country && styles.companionPlaceholder]}>{country || '국가 및 지역을 선택해주세요'}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.gray[11]} />
              </Pressable>
              {!!country && <TextInput style={[styles.companionInput, { marginTop: 8 }]} value={region} onChangeText={setRegion} placeholder="도시 / 지역을 입력해주세요" placeholderTextColor={Colors.gray[5]} />}
            </View>
            <View style={styles.companionDateRow}>
              {(['start', 'end'] as const).map((target) => {
                const value = target === 'start' ? startDate : endDate;
                return (
                  <View key={target} style={styles.inlineField}>
                    <Text style={styles.companionLabel}>일정 {target === 'start' ? '시작' : '종료'}</Text>
                    <Pressable style={styles.companionDateParts} onPress={() => openDatePicker(target)} accessibilityRole="button" accessibilityLabel={`${target === 'start' ? '시작일' : '종료일'} ${value || '선택'}`}>
                      <View style={styles.companionDatePart}><Text style={[styles.companionValue, !value && styles.companionPlaceholder]}>{value ? value.slice(0, 4) : '년'}</Text></View>
                      <View style={styles.companionDatePart}><Text style={[styles.companionValue, !value && styles.companionPlaceholder]}>{value ? value.slice(5).replace('-', '.') : '월 / 일'}</Text></View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <View style={styles.companionField}>
              <Text style={styles.companionLabel}>모집 인원</Text>
              <View style={styles.companionStepper}>
                <Pressable style={styles.companionStepButton} onPress={() => setCapacity(String(Math.max(Math.max(2, Number(currentParticipants)), (Number(capacity) || 0) - 1)))} disabled={Number(capacity) <= Math.max(2, Number(currentParticipants))} accessibilityLabel="모집 인원 줄이기">
                  <Ionicons name="remove" size={20} color={Colors.gray[7]} />
                </Pressable>
                <View style={styles.companionStepValue}><Text style={styles.companionValue}>{capacity || '0'}</Text></View>
                <Pressable style={styles.companionStepButton} onPress={() => setCapacity(String(Math.max(2, Number(currentParticipants), (Number(capacity) || 0) + 1)))} accessibilityLabel="모집 인원 늘리기">
                  <Ionicons name="add" size={20} color={Colors.gray[7]} />
                </Pressable>
              </View>
            </View>
            <View style={styles.companionField}>
              <Text style={styles.companionLabel}>소통 링크</Text>
              <View style={styles.companionSelect}>
                <Ionicons name="link-outline" size={22} color={Colors.gray[11]} />
                <TextInput style={styles.companionLinkInput} value={chatLink} onChangeText={setChatLink} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="링크를 입력해주세요" placeholderTextColor={Colors.gray[5]} />
              </View>
            </View>
            <View style={styles.companionDivider} />
            <Text style={styles.companionSectionTitle}>게시글 작성</Text>
            <View style={styles.companionField}>
              <Text style={styles.companionLabel}>제목</Text>
              <TextInput style={styles.companionInput} value={title} onChangeText={setTitle} placeholder="제목을 입력해주세요" placeholderTextColor={Colors.gray[5]} />
            </View>
            <View style={styles.companionField}>
              <Text style={styles.companionLabel}>내용</Text>
              <View style={styles.companionBodyBox}>
                <TextInput style={styles.companionBodyInput} value={body} onChangeText={setBody} multiline maxLength={200} textAlignVertical="top" placeholder="세부적인 동행 모집 내용을 작성해주세요" placeholderTextColor={Colors.gray[5]} />
                <Text style={styles.companionBodyCount}>{body.length}/200</Text>
              </View>
            </View>
          </>
        ) : (
          <>
        <Text style={styles.subtitle}>{screenText.subtitle}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요."
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {!isCompanion && (
          <>
            <View style={styles.fieldGroup}>
              <View style={styles.photoHeader}>
                <Text style={styles.label}>사진</Text>
                <Text style={styles.photoCount}>
                  {photos.length}/{MAX_FREE_POST_PHOTOS}
                </Text>
              </View>

              {photos.length === 0 ? (
                <View style={styles.photoActionRow}>
                  <Pressable style={styles.photoActionButton} onPress={handleTakePhoto}>
                    <Ionicons name="camera-outline" size={18} color={BLUE} />
                    <Text style={styles.photoActionText}>사진 촬영</Text>
                  </Pressable>

                  <Pressable style={styles.photoActionButton} onPress={handlePickImages}>
                    <Ionicons name="images-outline" size={18} color={BLUE} />
                    <Text style={styles.photoActionText}>앨범 선택</Text>
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
                      <Image source={{ uri }} style={styles.photoPreview} />

                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close" size={15} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}

                  {photos.length < MAX_FREE_POST_PHOTOS && (
                    <Pressable style={styles.addPhotoButton} onPress={handlePickImages}>
                      <Ionicons name="add" size={23} color={BLUE} />
                      <Text style={styles.addPhotoText}>추가</Text>
                    </Pressable>
                  )}
                </ScrollView>
              )}
            </View>
          </>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.textarea}
            value={body}
            onChangeText={setBody}
            placeholder={screenText.bodyPlaceholder}
            placeholderTextColor="#A0A0A0"
            multiline
            textAlignVertical="top"
          />
        </View>
          </>
        )}
      </ScrollView>

      {!isCompanion && <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.submitButton,
            submitDisabled && styles.submitButtonDisabled,
          ]}
          disabled={submitDisabled}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>
            {submitting ? '저장 중...' : screenText.button}
          </Text>
        </Pressable>
      </View>}

      <MarketCountrySheet visible={countrySheetVisible} allowAll={false} selectedCountry={country} onClose={() => setCountrySheetVisible(false)} onSelect={(value) => { setCountry(value); if (value !== country) setRegion(''); setCountrySheetVisible(false); }} />

      <BottomSheetModal
        visible={dateTarget !== null}
        onRequestClose={() => setDateTarget(null)}
      >
        <View style={[styles.pickerOverlay, bottomSheetStyles.transparent]}>
          <Pressable style={[styles.pickerBackdrop, bottomSheetStyles.transparent]} onPress={() => setDateTarget(null)} />

          <BottomSheetView style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setDateTarget(null)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>

              <Text style={styles.pickerTitle}>
                {dateTarget === 'start' ? '시작일 선택' : '종료일 선택'}
              </Text>

              <Pressable onPress={handleConfirmDate}>
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              textColor="#111111"
              themeVariant="light"
              style={styles.iosPicker}
              onChange={(event, date) => {
                if (date) {
                  setDraftDate(date);
                }
              }}
            />
          </BottomSheetView>
        </View>
      </BottomSheetModal>

      <Modal transparent visible={verificationModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModal}>
            <Text style={styles.verifyTitle}>교환학생 인증</Text>
            <Text style={styles.verifyDesc}>
              동행 모집 글은 인증된 인원만{'\n'}작성할 수 있어요.
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
                  router.push('/verification-consent' as never);
                }}
              >
                <Text style={styles.verifyButtonText}>신원 인증하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  companionHeaderSide: { width: 64, minHeight: 44, justifyContent: 'center' },
  companionHeaderSubmit: { alignItems: 'flex-end' },
  companionHeaderTitle: { ...fonts.sub3_sb_16, color: Colors.gray[11], flex: 1, textAlign: 'center' },
  companionWriteText: { ...fonts.body2_m_14, color: Colors.gray[6] },
  companionSectionTitle: { ...fonts.sub1_sb_18, color: Colors.gray[11], marginBottom: 22 },
  companionField: { marginBottom: 28 },
  companionLabel: { ...fonts.body2_m_14, color: Colors.gray[8], marginBottom: 8 },
  companionInput: { ...fonts.body3_r_16, minHeight: 52, borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 10, paddingHorizontal: 16, color: Colors.gray[11] },
  companionSelect: { minHeight: 52, borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  companionValue: { ...fonts.body3_r_16, color: Colors.gray[11], flexShrink: 1 },
  companionPlaceholder: { color: Colors.gray[5] },
  companionDateRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  companionDateParts: { flexDirection: 'row', gap: 4 },
  companionDatePart: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  companionStepper: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray[2], borderRadius: 8, padding: 4 },
  companionStepButton: { width: 42, height: 38, justifyContent: 'center', alignItems: 'center' },
  companionStepValue: { width: 42, height: 38, borderRadius: 6, backgroundColor: Colors.common.white, justifyContent: 'center', alignItems: 'center' },
  companionLinkInput: { ...fonts.body3_r_16, flex: 1, color: Colors.gray[11], paddingVertical: 12 },
  companionDivider: { height: 10, backgroundColor: Colors.gray[2], marginHorizontal: -20, marginBottom: 24 },
  companionBodyBox: { borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 10, padding: 16 },
  companionBodyInput: { ...fonts.body3_r_16, minHeight: 140, color: Colors.gray[11], padding: 0 },
  companionBodyCount: { ...fonts.body4_r_14, textAlign: 'right', color: Colors.gray[7], marginTop: 12 },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 108,
    paddingTop: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  headerSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 23,
    paddingTop: 22,
    paddingBottom: 132,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#777777',
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ECECEC',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 9,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSelect: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F3F7',
    padding: 4,
    flexDirection: 'row',
  },
  statusSelectButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSelectActive: {
    backgroundColor: '#FFFFFF',
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888888',
  },
  statusSelectTextActive: {
    color: '#111111',
    fontWeight: '900',
  },
  photoCount: {
    marginBottom: 9,
    fontSize: 12,
    fontWeight: '800',
    color: '#8A8A8A',
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionButton: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE6F6',
    backgroundColor: '#F7FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: BLUE,
  },
  photoPreviewList: {
    gap: 10,
    paddingRight: 4,
  },
  photoPreviewWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE6F6',
    backgroundColor: '#F7FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  inlineField: {
    flex: 1,
  },
  dateInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#A0A0A0',
  },
  dateTextActive: {
    color: '#111111',
  },
  segmented: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F3F7',
    padding: 4,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#888888',
  },
  segmentTextActive: {
    color: '#111111',
    fontWeight: '900',
  },
  textarea: {
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#111111',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 23,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  submitButton: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    height: 54,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C9CED8',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  pickerHeader: {
    height: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerCancel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#777777',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  pickerDone: {
    fontSize: 15,
    fontWeight: '900',
    color: BLUE,
  },
  iosPicker: {
    height: 216,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  verifyModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 22,
  },
  verifyTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
    textAlign: 'center',
  },
  verifyDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#777777',
    textAlign: 'center',
  },
  verifyButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#555555',
  },
  verifyButton: {
    flex: 1.45,
    height: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
