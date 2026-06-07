import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppBackButton } from '@/components/ui/app-back-button';
import { submitVerification } from '../src/api/verification';

export default function VerificationPage() {
  const [method, setMethod] = useState<'camera' | 'pdf' | ''>('');
  const handleSubmit = async () => {
    if (!method) {
      Alert.alert('인증 방식 선택', '인증 방식을 선택해주세요.');
      return;
    }

    try {
      await submitVerification({
        imageUrl: 'https://example.com/verification-file.png',
        university: '소속대학',
        country: '파견국가',
        region: '파견지역',
      });

      await AsyncStorage.setItem('isVerified', 'true');

      Alert.alert('제출 완료', '인증 요청이 제출되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/verification-complete' as any),
        },
      ]);
    } catch (error: any) {
      console.log('인증 요청 실패:', error);

      Alert.alert('제출 실패', '다시 시도해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      <AppBackButton fallbackHref="/home" style={styles.backButton} />

      <Text style={styles.title}>교환학생 신원 인증</Text>

      <Text style={styles.description}>
        허위 매물 방지를 위해 공식 서류를 제출해주세요.{'\n'}
        제출된 정보는 인증 목적으로만 사용됩니다.
      </Text>

      <Text style={styles.sectionTitle}>인증 방식 선택</Text>

      <Pressable
        style={[styles.methodCard, method === 'camera' && styles.selectedCard]}
        onPress={() => setMethod('camera')}
      >
        <Image
          source={require('../assets/images/camera.png')}
          style={styles.methodImage}
        />

        <View style={styles.methodTextBox}>
          <Text style={styles.methodTitle}>서류 촬영하기</Text>
          <Text style={styles.methodSubtitle}>카메라로 직접 촬영하기</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={[styles.methodCard, method === 'pdf' && styles.selectedCard]}
        onPress={() => setMethod('pdf')}
      >
        <Image
          source={require('../assets/images/upload_PDF.png')}
          style={styles.methodImage}
        />

        <View style={styles.methodTextBox}>
          <Text style={styles.methodTitle}>PDF 파일 첨부</Text>
          <Text style={styles.methodSubtitle}>파일함에서 불러오기</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ⓘ 인증 가능 서류:</Text>
        <Text style={styles.infoText}>
          • 파견 대학 입학허가서 (Letter of Admission)
        </Text>
        <Text style={styles.infoText}>• 재학 대학교 파견 승인서</Text>
        <Text style={styles.infoText}>• 교환학생 비자 사본</Text>
      </View>

      <View style={styles.bottomArea}>
        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>제출하기 〉</Text>
        </Pressable>

        <Text style={styles.bottomNotice}>
          서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingTop: 52,
  },

  backButton: {
    marginBottom: 58,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#333333',
    marginBottom: 46,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 22,
  },

  methodCard: {
    height: 83,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  selectedCard: {
    borderWidth: 1.5,
    borderColor: BLUE,
  },

  methodImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    marginRight: 20,
  },

  methodTextBox: {
    flex: 1,
  },

  methodTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 6,
  },

  methodSubtitle: {
    fontSize: 12,
    color: '#333333',
  },

  arrow: {
    fontSize: 36,
    color: '#D0D0D0',
    marginTop: -3,
  },

  infoBox: {
    borderWidth: 1,
    borderColor: '#D6D6D6',
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 14,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 10,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 20,
    color: '#222222',
    marginLeft: 22,
  },

  bottomArea: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 28,
  },

  submitButton: {
    height: 54,
    borderRadius: 6,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  submitButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  bottomNotice: {
    fontSize: 11,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 10,
  },
});
