import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { AppBackButton } from '@/components/ui/app-back-button';

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
    freeStatus?: string;
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
  const [currentParticipants, setCurrentParticipants] = useState(
    params.currentParticipants || '1',
  );
  const [genderRatio, setGenderRatio] = useState(params.genderRatio || '무관');
  const [chatLink, setChatLink] = useState(params.chatLink || '');
  const [status, setStatus] = useState<'RECRUITING' | 'COMPLETED'>(
    params.status || 'RECRUITING',
  );
  const [freeStatus, setFreeStatus] = useState(params.freeStatus || '파견 중');
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
      !capacity.trim()
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
      genderRatio: genderRatio.trim() || '무관',
    };
  };

  const buildFreePostPayload = (imageUrls: string[]): FreePostRequest | null => {
    if (!title.trim() || !body.trim() || !country.trim() || !freeStatus.trim()) {
      Alert.alert('입력 오류', '제목, 내용, 국가, 상태를 모두 입력해주세요.');
      return null;
    }

    return {
      title: title.trim(),
      content: body.trim(),
      country: country.trim(),
      status: freeStatus.trim(),
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
    if (submitting) {
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
          [{ text: '확인', onPress: () => router.back() }],
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
        [{ text: '확인', onPress: () => router.back() }],
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

  const submitDisabled =
    submitting ||
    !title.trim() ||
    !body.trim() ||
    (isCompanion &&
      (!country.trim() ||
        !region.trim() ||
        !startDate ||
        !endDate ||
        !capacity.trim())) ||
    (!isCompanion && (!country.trim() || !freeStatus.trim()));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <AppBackButton
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{screenText.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>국가</Text>
                <TextInput
                  style={styles.input}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="예: 독일"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>상태</Text>
                <View style={styles.statusSelect}>
                  {['파견 전', '파견 중', '귀국 후'].map((item) => {
                    const active = freeStatus === item;

                    return (
                      <Pressable
                        key={item}
                        style={[styles.statusSelectButton, active && styles.statusSelectActive]}
                        onPress={() => setFreeStatus(item)}
                      >
                        <Text
                          style={[
                            styles.statusSelectText,
                            active && styles.statusSelectTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

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

        {isCompanion && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>모집 정보</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>국가</Text>
                <TextInput
                  style={styles.input}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="예: 독일"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>도시/지역</Text>
                <TextInput
                  style={styles.input}
                  value={region}
                  onChangeText={setRegion}
                  placeholder="예: 뮌헨"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>시작일</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={() => openDatePicker('start')}
                >
                  <Text style={[styles.dateText, startDate && styles.dateTextActive]}>
                    {startDate || '연도-월-일'}
                  </Text>
                  <Ionicons name="calendar-outline" size={17} color="#777777" />
                </Pressable>
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>종료일</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={() => openDatePicker('end')}
                >
                  <Text style={[styles.dateText, endDate && styles.dateTextActive]}>
                    {endDate || '연도-월-일'}
                  </Text>
                  <Ionicons name="calendar-outline" size={17} color="#777777" />
                </Pressable>
              </View>
            </View>

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>모집 인원</Text>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="number-pad"
                  placeholder="예: 4"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>현재 인원</Text>
                <TextInput
                  style={styles.input}
                  value={currentParticipants}
                  onChangeText={setCurrentParticipants}
                  keyboardType="number-pad"
                  placeholder="예: 1"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>모집 상태</Text>
              <View style={styles.segmented}>
                {(['RECRUITING', 'COMPLETED'] as const).map((item) => {
                  const active = status === item;

                  return (
                    <Pressable
                      key={item}
                      style={[styles.segmentButton, active && styles.segmentActive]}
                      onPress={() => setStatus(item)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && styles.segmentTextActive,
                        ]}
                      >
                        {item === 'RECRUITING' ? '모집중' : '모집완료'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>성별 조건</Text>
              <TextInput
                style={styles.input}
                value={genderRatio}
                onChangeText={setGenderRatio}
                placeholder="예: 무관, 여성 2명"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>오픈채팅 링크</Text>
              <TextInput
                style={styles.input}
                value={chatLink}
                onChangeText={setChatLink}
                autoCapitalize="none"
                placeholder="선택 입력"
                placeholderTextColor="#A0A0A0"
              />
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
      </ScrollView>

      <View style={styles.bottomBar}>
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
      </View>

      <Modal
        transparent
        visible={dateTarget !== null}
        animationType="slide"
        onRequestClose={() => setDateTarget(null)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setDateTarget(null)} />

          <View style={styles.pickerSheet}>
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
          </View>
        </View>
      </Modal>

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
    fontSize: 18,
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
