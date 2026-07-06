import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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

import { AppBackButton } from '@/components/ui/app-back-button';
import { getMemberMe } from '../src/api/auth';
import { getUploadUrl, uploadFileToStorage } from '../src/api/upload';
import {
  getMyVerifications,
  submitVerification,
  VerificationResponse,
} from '../src/api/verification';

type FormMode = 'history' | 'form';

type VerificationStatus = VerificationResponse['status'];

type PickedImage = {
  uri: string;
  fileName: string;
  contentType: string;
};

const BLUE = '#123F9F';
const NAVY = '#0F2042';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

const statusMeta: Record<
  VerificationStatus,
  { label: string; color: string; backgroundColor: string }
> = {
  PENDING: {
    label: '검토 중',
    color: '#A15C00',
    backgroundColor: '#FFF4DF',
  },
  APPROVED: {
    label: '승인 완료',
    color: '#137A3D',
    backgroundColor: '#E7F8EE',
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

export default function VerificationPage() {
  const [mode, setMode] = useState<FormMode>('history');
  const [verifications, setVerifications] = useState<VerificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);

  const latestVerification = useMemo(() => verifications[0], [verifications]);
  const hasHistory = verifications.length > 0;

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
      setMode(nextVerifications.length > 0 ? 'history' : 'form');
      await AsyncStorage.setItem('isVerified', isApproved ? 'true' : 'false');
    } catch (error: any) {
      console.log('인증 내역 조회 실패:', error.response?.data || error.message);
      Alert.alert('조회 실패', '인증 신청 내역을 불러오지 못했습니다.');
      setMode('form');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVerifications();
    }, [loadVerifications]),
  );

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

  const renderHistory = () => (
    <>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <Ionicons
            name={latestVerification?.status === 'APPROVED' ? 'shield-checkmark' : 'shield-outline'}
            size={24}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.summaryTextBox}>
          <Text style={styles.summaryTitle}>
            {latestVerification
              ? `최근 인증 ${statusMeta[latestVerification.status].label}`
              : '인증 신청 내역이 없어요'}
          </Text>
          <Text style={styles.summaryDesc}>
            {latestVerification
              ? `신청일 ${formatDate(latestVerification.submittedAt)}`
              : '사진으로 교환학생 인증을 신청할 수 있어요.'}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>인증 신청 내역</Text>
        <Pressable style={styles.refreshButton} onPress={loadVerifications}>
          <Ionicons name="refresh" size={16} color={BLUE} />
        </Pressable>
      </View>

      {verifications.map((verification) => {
        const meta = statusMeta[verification.status];

        return (
          <View key={verification.id} style={styles.historyCard}>
            <Image source={{ uri: verification.imageUrl }} style={styles.historyImage} />
            <View style={styles.historyContent}>
              <View style={styles.historyTopRow}>
                <Text style={styles.historyTitle}>인증 신청</Text>
                <View style={[styles.statusPill, { backgroundColor: meta.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
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

      <Pressable style={styles.primaryButton} onPress={() => setMode('form')}>
        <Text style={styles.primaryButtonText}>새 인증 신청하기</Text>
      </Pressable>
    </>
  );

  const renderForm = () => (
    <>
      {hasHistory ? (
        <Pressable style={styles.backToHistoryButton} onPress={() => setMode('history')}>
          <Ionicons name="chevron-back" size={17} color={BLUE} />
          <Text style={styles.backToHistoryText}>내역으로 돌아가기</Text>
        </Pressable>
      ) : null}

      <Text style={styles.title}>교환학생 신원 인증</Text>

      <Text style={styles.description}>
        허위 매물 방지를 위해 공식 서류 사진을 제출해주세요.{'\n'}
        제출된 정보는 인증 목적으로만 사용됩니다.
      </Text>

      <Text style={styles.sectionTitle}>인증 사진 추가</Text>

      <View style={styles.methodGrid}>
        <Pressable style={styles.methodCard} onPress={pickFromCamera}>
          <Image source={require('../assets/images/camera.png')} style={styles.methodImage} />
          <Text style={styles.methodTitle}>촬영하기</Text>
          <Text style={styles.methodSubtitle}>카메라로 직접 촬영</Text>
        </Pressable>

        <Pressable style={styles.methodCard} onPress={pickFromLibrary}>
          <Ionicons name="image-outline" size={26} color={BLUE} />
          <Text style={styles.methodTitle}>사진 선택</Text>
          <Text style={styles.methodSubtitle}>앨범에서 불러오기</Text>
        </Pressable>
      </View>

      {pickedImage ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: pickedImage.uri }} style={styles.previewImage} />
          <View style={styles.previewTextBox}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {pickedImage.fileName}
            </Text>
            <Text style={styles.previewSubtitle}>{pickedImage.contentType}</Text>
          </View>
          <Pressable style={styles.removeButton} onPress={() => setPickedImage(null)}>
            <Ionicons name="close" size={16} color={MUTED} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>인증 가능 서류</Text>
        <Text style={styles.infoText}>파견 대학 입학허가서 (Letter of Admission)</Text>
        <Text style={styles.infoText}>재학 대학교 파견 승인서</Text>
        <Text style={styles.infoText}>교환학생 비자 사본</Text>
      </View>

      <Pressable
        style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
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
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton fallbackHref="/home" style={styles.backButton} />
        <Text style={styles.headerTitle}>교환학생 인증</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 54,
  },
  loadingBox: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: INK,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#333333',
    marginBottom: 34,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
    marginBottom: 16,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: '#F2F7FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    marginRight: 14,
  },
  summaryTextBox: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: INK,
  },
  summaryDesc: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  historyCard: {
    minHeight: 104,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },
  historyImage: {
    width: 78,
    height: 78,
    borderRadius: 10,
    backgroundColor: SOFT,
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
    marginBottom: 8,
  },
  historyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: INK,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    marginTop: 2,
  },
  rejectReason: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#D92D20',
  },
  backToHistoryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 22,
  },
  backToHistoryText: {
    fontSize: 13,
    fontWeight: '900',
    color: BLUE,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  methodCard: {
    flex: 1,
    minHeight: 122,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  methodImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  methodTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  methodSubtitle: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE7FF',
    backgroundColor: '#F8FBFF',
    padding: 10,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
    marginRight: 12,
  },
  previewTextBox: {
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: INK,
  },
  previewSubtitle: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  infoBox: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 22,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: INK,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '700',
    color: '#222222',
  },
  primaryButton: {
    height: 54,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.72,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bottomNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 10,
  },
});
