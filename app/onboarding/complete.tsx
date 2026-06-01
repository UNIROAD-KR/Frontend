import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

import { onboarding, OnboardingRequest } from '../../src/api/auth';

const calculateAge = (birthYear: string | null) => {
  if (!birthYear) {
    return undefined;
  }

  const parsedBirthYear = Number(birthYear);

  if (!Number.isInteger(parsedBirthYear) || parsedBirthYear <= 0) {
    return undefined;
  }

  return new Date().getFullYear() - parsedBirthYear + 1;
};

const mapGender = (gender: string | null): OnboardingRequest['gender'] | null => {
  if (gender === 'female') {
    return 'FEMALE';
  }

  if (gender === 'male') {
    return 'MALE';
  }

  return null;
};

const mapCurrentSituation = (
  exchangeStatus: string | null,
): OnboardingRequest['currentSituation'] =>
  exchangeStatus === 'dispatched' ? 'DISPATCHED' : 'PREPARING_APPLICATION';

export default function CompletePage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [submitting, setSubmitting] = useState(false);
  const displayName = nickname?.trim() || 'OO';

  const handleStart = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const [
        birthYear,
        storedGender,
        domesticUniversity,
        dispatchedUniversity,
        dispatchedCountry,
        dispatchedRegion,
        exchangeStatus,
      ] = await AsyncStorage.multiGet([
        'birthYear',
        'gender',
        'university',
        'dispatchedUniversity',
        'dispatchedCountry',
        'dispatchedRegion',
        'exchangeStatus',
      ]);

      const gender = mapGender(storedGender[1]);
      const domesticUniversityValue = domesticUniversity[1]?.trim() ?? '';

      if (!displayName || displayName === 'OO' || !gender || !domesticUniversityValue) {
        Alert.alert('온보딩 정보 확인', '닉네임, 성별, 소속대학 정보를 다시 확인해주세요.');
        return;
      }

      const request: OnboardingRequest = {
        nickname: displayName,
        gender,
        currentSituation: mapCurrentSituation(exchangeStatus[1]),
        domesticUniversity: domesticUniversityValue,
        age: calculateAge(birthYear[1]),
        dispatchedUniversity: dispatchedUniversity[1]?.trim() || undefined,
        dispatchedCountry: dispatchedCountry[1]?.trim() || undefined,
        dispatchedRegion: dispatchedRegion[1]?.trim() || undefined,
      };

      await onboarding(request);
      await AsyncStorage.setItem('nickname', displayName);
      router.replace('/home');
    } catch (error: any) {
      console.log('온보딩 정보 전송 실패:', error.response?.data || error.message);
      Alert.alert(
        '온보딩 실패',
        error.response?.data?.message ?? '온보딩 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹</Text>
      </Pressable>

      <View style={styles.centerArea}>
        <Image
          source={require('../../assets/images/school_icon.png')}
          style={styles.logo}
        />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>준비 완료!</Text>
        </View>

        <Text style={styles.title}>
          이제 유니로드와 함께{'\n'}교환 생활을 시작해봐요
        </Text>

        <Text style={styles.subtitle}>
          {displayName} 님의 파견지 정보를 바탕으로 딱 맞는 정보를 준비했어요
        </Text>
      </View>

      <Pressable
        style={[styles.startButton, submitting && styles.startButtonDisabled]}
        disabled={submitting}
        onPress={handleStart}
      >
        <Text style={styles.startButtonText}>
          {submitting ? '저장 중...' : '시작하기'}
        </Text>
      </Pressable>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 52,
  },

  back: {
    fontSize: 30,
    lineHeight: 32,
    color: '#000',
  },

  centerArea: {
    alignItems: 'center',
    marginTop: 155,
  },

  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 18,
  },

  badge: {
    width: '100%',
    height: 32,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },

  badgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },

  title: {
    fontSize: 22,
    lineHeight: 33,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },

  subtitle: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },

  startButton: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 48,
    height: 52,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  startButtonDisabled: {
    opacity: 0.6,
  },

  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
