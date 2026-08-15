import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton, goBackOrReplace } from '@/components/ui/app-back-button';
import ArrowDownIcon from '@/assets/icon/Property 1=arrow2, Property 2=down.svg';
import VerificationApprovedCardIcon from '@/assets/icon/profile/verification-approved-card.svg';
import VerificationAddImageIcon from '@/assets/icon/verification/add-image.svg';
import ApprovedBadge from '@/assets/icon/verification/approved-badge.svg';
import LatestReviewIcon from '@/assets/icon/verification/latest-review-icon.svg';
import PendingBadge from '@/assets/icon/verification/pending-badge.svg';
import { getMemberMe } from '../src/api/auth';
import { getUploadUrl, uploadFileToStorage } from '../src/api/upload';
import {
  getMyVerifications,
  submitVerification,
  VerificationResponse,
} from '../src/api/verification';

type FormMode = 'history' | 'form';
type VerificationSortOrder = 'latest' | 'oldest';

type VerificationStatus = VerificationResponse['status'];

type PickedImage = {
  uri: string;
  fileName: string;
  contentType: string;
};

const BLUE = '#3568DA';
const NAVY = '#18202B';
const INK = '#1A2029';
const MUTED = '#7A8491';
const LINE = '#E3E7EC';
const SOFT = '#F2F4F7';
const statusMeta: Record<
  VerificationStatus,
  { label: string; color: string; backgroundColor: string }
> = {
  PENDING: {
    label: '검토 중',
    color: '#006BFF',
    backgroundColor: '#F1F8FF',
  },
  APPROVED: {
    label: '승인 완료',
    color: '#7A8491',
    backgroundColor: '#F1F3F5',
  },
  REJECTED: {
    label: '반려',
    color: '#D92D20',
    backgroundColor: '#FFF1F0',
  },
};

const getImageContentType = (asset: ImagePicker.ImagePickerAsset) => {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  const lowerUri = asset.uri.toLowerCase();
  if (lowerUri.endsWith('.png')) {
    return 'image/png';
  }
  if (lowerUri.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
};

const getFileExtension = (contentType: string) => {
  if (contentType === 'image/png') {
    return 'png';
  }
  if (contentType === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const getVerificationFileName = (imageUrl: string, fallbackId: number) => {
  if (!imageUrl) {
    return `image${fallbackId}`;
  }

  const decodedUrl = decodeURIComponent(imageUrl.split('?')[0]);
  const fileName = decodedUrl.split('/').pop() || '';
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

  return nameWithoutExtension || `image${fallbackId}`;
};

export default function VerificationPage() {
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<FormMode>('history');
  const [verifications, setVerifications] = useState<VerificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [sortOrder, setSortOrder] = useState<VerificationSortOrder>('latest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const hasHistory = verifications.length > 0;
  const canSubmit = Boolean(pickedImage) && !isSubmitting;
  const sortedVerifications = useMemo(
    () =>
      [...verifications].sort((a, b) => {
        const comparison = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        return sortOrder === 'latest' ? comparison : -comparison;
      }),
    [sortOrder, verifications],
  );
  const latestVerification = useMemo(
    () =>
      [...verifications].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )[0],
    [verifications],
  );

  const loadVerifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getMyVerifications();
      const nextVerifications = [...response.data.data].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
      const isApproved = nextVerifications.some(
        (verification) => verification.status === 'APPROVED',
      );

      setVerifications(nextVerifications);
      setMode(requestedMode === 'form' || nextVerifications.length === 0 ? 'form' : 'history');
      await AsyncStorage.setItem('isVerified', isApproved ? 'true' : 'false');

    } catch (error: any) {
      console.log('인증 내역 조회 실패:', error.response?.data || error.message);
      Alert.alert('조회 실패', '인증 신청 내역을 불러오지 못했습니다.');
      setMode('history');
    } finally {
      setIsLoading(false);
    }
  }, [requestedMode]);

  useFocusEffect(
    useCallback(() => {
      loadVerifications();
    }, [loadVerifications]),
  );

  const openNewVerificationForm = () => {
    router.push({
      pathname: '/verification',
      params: { mode: 'form' },
    } as any);
  };

  const handleHeaderBack = () => {
    if (mode === 'form' && hasHistory) {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace({
        pathname: '/verification',
        params: { mode: 'history' },
      } as any);
      return;
    }

    goBackOrReplace('/home/profile-card');
  };

  const buildPickedImage = (asset: ImagePicker.ImagePickerAsset): PickedImage => {
    const contentType = getImageContentType(asset);
    const extension = getFileExtension(contentType);

    return {
      uri: asset.uri,
      fileName: asset.fileName || `verification_${Date.now()}.${extension}`,
      contentType,
    };
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setPickedImage(buildPickedImage(result.assets[0]));
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPickedImage(buildPickedImage(result.assets[0]));
    }
  };

  const openImagePicker = () => {
    Alert.alert('인증 사진 추가', '인증에 사용할 사진을 선택해주세요.', [
      { text: '촬영하기', onPress: () => void pickFromCamera() },
      { text: '사진 선택', onPress: () => void pickFromLibrary() },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const getProfilePayload = async () => {
    const [savedUniversity, savedCountry, savedRegion] = await Promise.all([
      AsyncStorage.getItem('dispatchedUniversity'),
      AsyncStorage.getItem('dispatchedCountry'),
      AsyncStorage.getItem('dispatchedRegion'),
    ]);

    try {
      const response = await getMemberMe();
      const member = response.data.data;

      return {
        university: member.dispatchedUniversity || savedUniversity || '',
        country: member.dispatchedCountry || savedCountry || '',
        region: member.dispatchedRegion || savedRegion || '',
      };
    } catch (error: any) {
      console.log('회원 정보 조회 실패:', error.response?.data || error.message);

      return {
        university: savedUniversity || '',
        country: savedCountry || '',
        region: savedRegion || '',
      };
    }
  };

  const uploadVerificationImage = async (image: PickedImage) => {
    const response = await getUploadUrl({
      fileName: image.fileName,
      contentType: image.contentType,
      fileType: 'IMAGE',
    });
    const { uploadUrl, fileUrl } = response.data.data;

    await uploadFileToStorage(uploadUrl, image.uri, image.contentType);

    return fileUrl;
  };

  const handleSubmit = async () => {
    if (!pickedImage) {
      Alert.alert('이미지 선택', '인증에 사용할 사진을 촬영하거나 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const [imageUrl, profilePayload] = await Promise.all([
        uploadVerificationImage(pickedImage),
        getProfilePayload(),
      ]);

      await submitVerification({
        imageUrl,
        ...profilePayload,
      });

      await AsyncStorage.setItem('isVerified', 'false');
      setPickedImage(null);
      await loadVerifications();

      Alert.alert('제출 완료', '인증 요청이 제출되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/verification-complete' as any),
        },
      ]);
    } catch (error: any) {
      console.log('인증 요청 실패:', error.response?.data || error.message);
      Alert.alert('제출 실패', '인증 요청을 제출하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHistory = () => {
    const isLatestApproved = latestVerification?.status === 'APPROVED';
    const SummaryIcon = isLatestApproved ? VerificationApprovedCardIcon : LatestReviewIcon;
    const summaryTitle = isLatestApproved ? '최신 인증 승인 완료' : '최신 인증 검토 중';
    const summaryReviewDate = latestVerification?.reviewedAt
      ? formatDate(latestVerification.reviewedAt)
      : '-';

    return (
      <>
      <View style={styles.summaryCard}>
        <SummaryIcon width={40} height={40} style={styles.summaryIcon} />
        <View style={styles.summaryTextBox}>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          <Text style={styles.summaryDesc}>최신 검토일 {summaryReviewDate}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>인증 신청 내역</Text>
        <View style={styles.sortControl}>
          <Pressable
            style={styles.sortLabel}
            onPress={() => setIsSortMenuOpen((current) => !current)}
          >
            <Text style={styles.sortLabelText}>
              {sortOrder === 'latest' ? '최신순' : '오래된순'}
            </Text>
            <ArrowDownIcon width={16} height={16} color={MUTED} />
          </Pressable>

          {isSortMenuOpen ? (
            <View style={styles.sortMenu}>
              {([
                ['latest', '최신순'],
                ['oldest', '오래된순'],
              ] as const).map(([value, label]) => (
                <Pressable
                  key={value}
                  style={styles.sortMenuItem}
                  onPress={() => {
                    setSortOrder(value);
                    setIsSortMenuOpen(false);
                  }}
                >
                  <Text style={[styles.sortMenuText, sortOrder === value && styles.sortMenuTextActive]}>
                    {label}
                  </Text>
                  {sortOrder === value ? <Ionicons name="checkmark" size={16} color={BLUE} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {sortedVerifications.map((verification) => {
        const fileName = getVerificationFileName(verification.imageUrl, verification.id);

        return (
          <View key={verification.id} style={styles.historyCard}>
            {verification.imageUrl ? (
              <Image source={{ uri: verification.imageUrl }} style={styles.historyImage} />
            ) : (
              <View style={styles.historyImagePlaceholder} />
            )}
            <View style={styles.historyContent}>
              <View style={styles.historyTopRow}>
                <Text style={styles.historyTitle} numberOfLines={1}>{fileName}</Text>
                <VerificationBadge status={verification.status} />
              </View>
              <Text style={styles.historyDate}>
                신청일 {formatDate(verification.submittedAt)}
              </Text>
              <Text style={styles.historyDate}>
                검토일 {formatDate(verification.reviewedAt)}
              </Text>
              {verification.status === 'REJECTED' && verification.rejectReason ? (
                <Text style={styles.rejectReason} numberOfLines={2}>
                  반려 사유: {verification.rejectReason}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
      </>
    );
  };

  const renderForm = () => (
    <>
      <Text style={styles.title}>교환학생 신원 인증</Text>

      <Text style={styles.description}>
        허위 매물 방지를 위해 공식 서류 사진을 제출해주세요.{'\n'}
        제출된 정보는 인증 목적으로만 사용됩니다.
      </Text>

      <Text style={styles.formSectionTitle}>인증 사진 추가</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="인증 사진 추가"
        style={styles.imagePickerCard}
        onPress={openImagePicker}
      >
        {pickedImage ? (
          <View style={styles.previewContent}>
            <Image source={{ uri: pickedImage.uri }} style={styles.previewImage} />
            <View style={styles.previewTextBox}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {pickedImage.fileName}
              </Text>
              <Text style={styles.previewSubtitle}>다시 누르면 사진을 변경할 수 있어요.</Text>
            </View>
          </View>
        ) : (
          <>
            <VerificationAddImageIcon width={27} height={27} />
            <Text style={styles.imagePickerTitle}>인증 가능한 이미지 추가</Text>
            <Text style={styles.imagePickerDescription}>
              카메라로 직접 촬영하거나{`\n`}앨범에서 이미지를 불러와주세요
            </Text>
          </>
        )}
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>인증 가능 서류</Text>
        <Text style={styles.infoText}>• 파견 대학 입학허가서 (Letter of Admission)</Text>
        <Text style={styles.infoText}>• 재학 대학교 파견 승인서</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton onPress={handleHeaderBack} style={styles.backButton} />
        <Text style={styles.headerTitle}>교환학생 신원 인증</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, mode === 'form' && styles.formContent]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={BLUE} />
          </View>
        ) : mode === 'history' ? (
          renderHistory()
        ) : (
          renderForm()
        )}
      </ScrollView>

      {!isLoading && mode === 'history' ? (
        <View style={styles.historyFooter}>
          <Pressable style={styles.primaryButton} onPress={openNewVerificationForm}>
            <Text style={styles.primaryButtonText}>신규 인증 신청하기</Text>
          </Pressable>
          <Text style={styles.bottomNotice}>
            서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
          </Text>
        </View>
      ) : null}

      {!isLoading && mode === 'form' ? (
        <View style={styles.formFooter}>
          <Pressable
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>제출하기</Text>
            )}
          </Pressable>
          <Text style={styles.bottomNotice}>
            서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === 'PENDING') {
    return <PendingBadge width={41} height={20} />;
  }

  if (status === 'APPROVED') {
    return <ApprovedBadge width={51} height={20} />;
  }

  const meta = statusMeta[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: meta.backgroundColor }]}>
      <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  header: {
    height: 118,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 43,
    paddingBottom: 12,
    backgroundColor: '#F6F8FA',
    position: 'relative',
  },
  backButton: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    position: 'absolute',
    top: 57,
    left: 0,
    right: 0,
    height: 34,
    lineHeight: 34,
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
  },
  formContent: {
    paddingTop: 32,
  },
  loadingBox: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '900',
    color: INK,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    marginBottom: 26,
  },
  formSectionTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '900',
    color: INK,
    marginBottom: 16,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    color: INK,
  },
  sortControl: {
    position: 'relative',
  },
  sortLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingLeft: 8,
  },
  sortLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  sortMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 104,
    borderWidth: 1,
    borderColor: '#E1E6EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    shadowColor: '#18202B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  sortMenuItem: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  sortMenuText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#576273',
  },
  sortMenuTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
  summaryCard: {
    height: 76,
    borderRadius: 10,
    backgroundColor: '#18202B',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryTextBox: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  summaryDesc: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
    color: '#ABB4C0',
  },
  historyCard: {
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyImage: {
    width: 68,
    height: 68,
    borderRadius: 7,
    backgroundColor: SOFT,
    marginRight: 12,
  },
  historyImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 7,
    backgroundColor: '#EEF1F5',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
    minWidth: 0,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: INK,
  },
  statusPill: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    marginTop: 1,
  },
  rejectReason: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#D92D20',
  },
  imagePickerCard: {
    height: 187,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  imagePickerTitle: {
    marginTop: 14,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '900',
    color: INK,
  },
  imagePickerDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
  },
  previewContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 112,
    height: 112,
    borderRadius: 8,
    marginRight: 12,
  },
  previewTextBox: {
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: INK,
  },
  previewSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: MUTED,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    backgroundColor: '#F2F5F8',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: INK,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '700',
    color: '#536174',
  },
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#18202B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#B1B8C1',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bottomNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 12,
  },
  historyFooter: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#F6F8FA',
  },
  formFooter: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#F6F8FA',
  },
});
