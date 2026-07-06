import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { useResetScrollOnFocus } from '@/hooks/use-reset-scroll-on-focus';
import {
  ExchangeStatus,
  ONBOARDING_NICKNAME_KEY,
} from '@/src/constants/onboarding';
import { onboarding, OnboardingRequest } from '../../src/api/auth';

type OnboardingSummary = {
  nickname: string;
  domesticUniversity: string;
  profileStatus: string;
  dispatchedCountry: string;
  dispatchedRegion: string;
  dispatchedUniversity: string;
  dispatchSemester: string;
  applicationDeadline: string;
  departureDate: string;
  dispatchStartDate: string;
  onboardingSituation: ExchangeStatus | '';
};

const initialSummary: OnboardingSummary = {
  nickname: '',
  domesticUniversity: '',
  profileStatus: '',
  dispatchedCountry: '',
  dispatchedRegion: '',
  dispatchedUniversity: '',
  dispatchSemester: '',
  applicationDeadline: '',
  departureDate: '',
  dispatchStartDate: '',
  onboardingSituation: '',
};

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
): OnboardingRequest['currentSituation'] => {
  if (exchangeStatus === 'dispatched') {
    return 'DISPATCHED';
  }

  if (exchangeStatus === 'accepted') {
    return 'PREPARING_DEPARTURE';
  }

  return 'PREPARING_APPLICATION';
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return '';
  }

  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(
    2,
    '0',
  )}`;
};

const getDateSummary = (summary: OnboardingSummary) => {
  if (summary.onboardingSituation === 'preparing') {
    return {
      label: '지원 마감일',
      value: parseDate(summary.applicationDeadline),
    };
  }

  if (summary.onboardingSituation === 'accepted') {
    return {
      label: '출국 예정일',
      value: parseDate(summary.departureDate),
    };
  }

  if (summary.onboardingSituation === 'dispatched') {
    return {
      label: '파견 시작일',
      value: parseDate(summary.dispatchStartDate),
    };
  }

  return { label: '일정', value: '' };
};

const isExchangeStatus = (value: string | null): value is ExchangeStatus =>
  value === 'preparing' || value === 'accepted' || value === 'dispatched';

export default function CompletePage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const scrollRef = useResetScrollOnFocus();
  const [summary, setSummary] = useState<OnboardingSummary>(initialSummary);
  const [submitting, setSubmitting] = useState(false);

  const displayName = summary.nickname || nickname?.trim() || 'OO';
  const dateSummary = useMemo(() => getDateSummary(summary), [summary]);
  const locationSummary = [summary.dispatchedCountry, summary.dispatchedRegion]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    const loadSummary = async () => {
      const entries = await AsyncStorage.multiGet([
        ONBOARDING_NICKNAME_KEY,
        'university',
        'profileStatus',
        'dispatchedCountry',
        'dispatchedRegion',
        'dispatchedUniversity',
        'dispatchSemester',
        'applicationDeadline',
        'departureDate',
        'dispatchStartDate',
        'onboardingSituation',
      ]);
      const stored = Object.fromEntries(entries);

      setSummary({
        nickname: stored[ONBOARDING_NICKNAME_KEY]?.trim() || nickname?.trim() || '',
        domesticUniversity: stored.university?.trim() || '',
        profileStatus: stored.profileStatus?.trim() || '',
        dispatchedCountry: stored.dispatchedCountry?.trim() || '',
        dispatchedRegion: stored.dispatchedRegion?.trim() || '',
        dispatchedUniversity: stored.dispatchedUniversity?.trim() || '',
        dispatchSemester: stored.dispatchSemester?.trim() || '',
        applicationDeadline: stored.applicationDeadline?.trim() || '',
        departureDate: stored.departureDate?.trim() || '',
        dispatchStartDate: stored.dispatchStartDate?.trim() || '',
        onboardingSituation: isExchangeStatus(stored.onboardingSituation)
          ? stored.onboardingSituation
          : '',
      });
    };

    loadSummary();
  }, [nickname]);

  const handleStart = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const entries = await AsyncStorage.multiGet([
        'birthYear',
        'gender',
        'university',
        'dispatchedUniversity',
        'dispatchedCountry',
        'dispatchedRegion',
        'dispatchSemester',
        'onboardingSituation',
        'applicationDeadline',
        'departureDate',
        'dispatchStartDate',
        ONBOARDING_NICKNAME_KEY,
      ]);
      const stored = Object.fromEntries(entries);

      const gender = mapGender(stored.gender);
      const domesticUniversityValue = stored.university?.trim() ?? '';
      const requestNickname =
        stored[ONBOARDING_NICKNAME_KEY]?.trim() || nickname?.trim() || '';
      const currentSituation = mapCurrentSituation(stored.onboardingSituation);

      if (!requestNickname || !gender || !domesticUniversityValue) {
        Alert.alert('온보딩 정보 확인', '닉네임, 성별, 소속대학 정보를 다시 확인해주세요.');
        return;
      }

      const request: OnboardingRequest = {
        nickname: requestNickname,
        gender,
        currentSituation,
        domesticUniversity: domesticUniversityValue,
        age: calculateAge(stored.birthYear),
        dispatchedUniversity: stored.dispatchedUniversity?.trim() || undefined,
        dispatchedCountry: stored.dispatchedCountry?.trim() || undefined,
        dispatchedRegion: stored.dispatchedRegion?.trim() || undefined,
        dispatchSemester: stored.dispatchSemester?.trim() || undefined,
        applicationDeadline:
          currentSituation === 'PREPARING_APPLICATION'
            ? stored.applicationDeadline?.trim() || undefined
            : undefined,
        departureDate:
          currentSituation === 'PREPARING_DEPARTURE'
            ? stored.departureDate?.trim() || undefined
            : undefined,
        dispatchStartDate:
          currentSituation === 'DISPATCHED'
            ? stored.dispatchStartDate?.trim() || undefined
            : undefined,
      };

      await onboarding(request);
      await AsyncStorage.setItem('nickname', requestNickname);
      await AsyncStorage.removeItem(ONBOARDING_NICKNAME_KEY);
      router.replace('/home');
    } catch (error: any) {
      console.log('온보딩 정보 전송 실패:', error.response?.data || error.message);
      Alert.alert(
        '온보딩 실패',
        error.response?.data?.message ??
          '온보딩 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppBackButton style={styles.backButton} />

        <View style={styles.heroIcon}>
          <Ionicons name="checkmark" size={34} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>
          {displayName} 님,{'\n'}온보딩이 완료됐어요
        </Text>

        <Text style={styles.subtitle}>
          입력한 정보를 바탕으로 필요한 교환학생 정보를 먼저 보여드릴게요.
        </Text>

        <View style={styles.summaryPanel}>
          <SummaryRow label="소속대학" value={summary.domesticUniversity || '-'} />
          <SummaryRow label="현재 상황" value={summary.profileStatus || '-'} />
          <SummaryRow label="파견 학기" value={summary.dispatchSemester || '-'} />
          <SummaryRow label="파견 지역" value={locationSummary || '-'} />
          <SummaryRow
            label="파견 대학"
            value={summary.dispatchedUniversity || '-'}
          />
          <SummaryRow label={dateSummary.label} value={dateSummary.value || '-'} />
        </View>
      </ScrollView>

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 136,
  },

  backButton: {
    marginBottom: 76,
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777777',
    textAlign: 'center',
    marginBottom: 36,
  },

  summaryPanel: {
    borderWidth: 1,
    borderColor: '#E2E7F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },

  summaryRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF7',
  },

  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
  },

  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
    textAlign: 'right',
  },

  startButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
    height: 53,
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
