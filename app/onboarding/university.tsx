import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import { useResetScrollOnFocus } from '@/hooks/use-reset-scroll-on-focus';
import {
  ExchangeStatus,
  ONBOARDING_NICKNAME_KEY,
  universityOptions,
} from '@/src/constants/onboarding';

type DateStorageKey =
  | 'applicationDeadline'
  | 'departureDate'
  | 'dispatchStartDate';

type StatusOption = {
  value: ExchangeStatus;
  label: string;
  emoji: string;
  dateLabel: string;
  datePlaceholder: string;
  storageKey: DateStorageKey;
  profileStatus: string;
};

const statusOptions: StatusOption[] = [
  {
    value: 'preparing',
    label: '지원 준비 중',
    emoji: '📝',
    dateLabel: '지원 마감일',
    datePlaceholder: '지원 마감일 선택',
    storageKey: 'applicationDeadline',
    profileStatus: '지원 준비 중',
  },
  {
    value: 'accepted',
    label: '출국 준비 중',
    emoji: '✈️',
    dateLabel: '출국 예정일',
    datePlaceholder: '출국 예정일 선택',
    storageKey: 'departureDate',
    profileStatus: '출국 준비 중',
  },
  {
    value: 'dispatched',
    label: '파견 중',
    emoji: '🎓',
    dateLabel: '파견 시작일',
    datePlaceholder: '파견 시작일 선택',
    storageKey: 'dispatchStartDate',
    profileStatus: '파견 중',
  },
];

const emptyStatusDates: Record<ExchangeStatus, string> = {
  preparing: '',
  accepted: '',
  dispatched: '',
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseStorageDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const clampToToday = (date: Date) => {
  const today = startOfToday();
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate < today ? today : nextDate;
};

const toStorageDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: string) => {
  const parsedDate = parseStorageDate(value);

  if (!parsedDate) {
    return '';
  }

  return `${parsedDate.getFullYear()}.${String(
    parsedDate.getMonth() + 1,
  ).padStart(2, '0')}.${String(parsedDate.getDate()).padStart(2, '0')}`;
};

const isExchangeStatus = (value: string | null): value is ExchangeStatus =>
  value === 'preparing' || value === 'accepted' || value === 'dispatched';

export default function UniversityPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const scrollRef = useResetScrollOnFocus();

  const [university, setUniversity] = useState('');
  const [status, setStatus] = useState<ExchangeStatus | ''>('');
  const [statusDates, setStatusDates] =
    useState<Record<ExchangeStatus, string>>(emptyStatusDates);
  const [draftDate, setDraftDate] = useState(startOfToday);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);

  const selectedStatusOption = useMemo(
    () => statusOptions.find((item) => item.value === status) ?? null,
    [status],
  );
  const selectedStatusDate = status ? statusDates[status] : '';
  const isValid = university !== '' && status !== '' && selectedStatusDate !== '';

  useEffect(() => {
    const loadUniversityStep = async () => {
      const [
        [, savedUniversity],
        [, savedStatus],
        [, savedApplicationDeadline],
        [, savedDepartureDate],
        [, savedDispatchStartDate],
      ] = await AsyncStorage.multiGet([
        'university',
        'onboardingSituation',
        'applicationDeadline',
        'departureDate',
        'dispatchStartDate',
      ]);

      if (savedUniversity) {
        setUniversity(savedUniversity);
      }

      if (isExchangeStatus(savedStatus)) {
        setStatus(savedStatus);
      }

      setStatusDates({
        preparing: savedApplicationDeadline ?? '',
        accepted: savedDepartureDate ?? '',
        dispatched: savedDispatchStartDate ?? '',
      });
    };

    loadUniversityStep();
  }, []);

  const handleSelectUniversity = async (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    await AsyncStorage.setItem('university', selectedUniversity);
    setUniversityModalVisible(false);
  };

  const handleSelectStatus = async (nextStatus: ExchangeStatus) => {
    setStatus(nextStatus);
    await AsyncStorage.setItem('onboardingSituation', nextStatus);
  };

  const openDatePicker = () => {
    if (!status) {
      return;
    }

    setDraftDate(parseStorageDate(statusDates[status]) ?? startOfToday());
    setShowDatePicker(true);
  };

  const saveDateForStatus = async (date: Date) => {
    if (!status || !selectedStatusOption) {
      return;
    }

    const nextDate = toStorageDate(clampToToday(date));

    setStatusDates((prev) => ({
      ...prev,
      [status]: nextDate,
    }));
    await AsyncStorage.setItem(selectedStatusOption.storageKey, nextDate);
  };

  const handleConfirmDate = async () => {
    await saveDateForStatus(draftDate);
    setShowDatePicker(false);
  };

  const handleNext = async () => {
    if (!isValid || !selectedStatusOption) {
      return;
    }

    await AsyncStorage.multiSet([
      ['university', university],
      ['onboardingSituation', status],
      ['exchangeStatus', status],
      ['profileStatus', selectedStatusOption.profileStatus],
      ['applicationDeadline', status === 'preparing' ? statusDates.preparing : ''],
      ['departureDate', status === 'accepted' ? statusDates.accepted : ''],
      ['dispatchStartDate', status === 'dispatched' ? statusDates.dispatched : ''],
    ]);

    const savedNickname =
      nickname?.trim() ||
      (await AsyncStorage.getItem(ONBOARDING_NICKNAME_KEY)) ||
      '';

    router.push({
      pathname:
        status === 'preparing'
          ? '/onboarding/country'
          : '/onboarding/dispatched-country',
      params: { nickname: savedNickname },
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppBackButton style={styles.backButton} />

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progress} />
        </View>

        <Text style={styles.title}>
          소속대학과{'\n'}현재 본인의 상태를 알려주세요.
        </Text>

        <Text style={styles.subtitle}>현재 본인의 단계는 어디인가요?</Text>

        <Text style={styles.label}>소속대학</Text>

        <Pressable
          style={styles.selectBox}
          onPress={() => setUniversityModalVisible(true)}
        >
          <Text style={[styles.selectText, university && styles.selectTextActive]}>
            {university || '소속대학 선택'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#777777" />
        </Pressable>

        <Text style={styles.statusLabel}>현재 상황</Text>

        <View style={styles.statusRow}>
          {statusOptions.map((item) => {
            const selected = status === item.value;

            return (
              <Pressable
                key={item.value}
                style={[styles.statusCard, selected && styles.selectedCard]}
                onPress={() => handleSelectStatus(item.value)}
              >
                <Text style={styles.statusEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.statusText,
                    selected && styles.statusTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedStatusOption && (
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>{selectedStatusOption.dateLabel}</Text>

            <Pressable style={styles.dateField} onPress={openDatePicker}>
              <View style={styles.dateIconBox}>
                <Ionicons name="calendar-outline" size={19} color={BLUE} />
              </View>
              <Text
                style={[
                  styles.dateText,
                  !selectedStatusDate && styles.datePlaceholderText,
                ]}
              >
                {selectedStatusDate
                  ? formatDisplayDate(selectedStatusDate)
                  : selectedStatusOption.datePlaceholder}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#777777" />
            </Pressable>
          </View>
        )}

        <View style={styles.bottomSpacer} />

        <Pressable
          style={[styles.nextButton, isValid && styles.nextButtonActive]}
          disabled={!isValid}
          onPress={handleNext}
        >
          <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
            다음
          </Text>
        </Pressable>
      </ScrollView>

      <OnboardingSelectModal
        visible={universityModalVisible}
        title="소속대학 선택"
        options={universityOptions}
        selectedValue={university}
        onClose={() => setUniversityModalVisible(false)}
        onSelect={handleSelectUniversity}
      />

      <Modal
        transparent
        visible={showDatePicker}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <Pressable
            style={styles.datePickerBackdrop}
            onPress={() => setShowDatePicker(false)}
          />

          <View style={styles.datePickerSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.datePickerHeader}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>취소</Text>
              </Pressable>

              <Text style={styles.datePickerTitle}>
                {selectedStatusOption?.dateLabel ?? '날짜'} 선택
              </Text>

              <Pressable onPress={handleConfirmDate}>
                <Text style={styles.datePickerDone}>완료</Text>
              </Pressable>
            </View>

            <View style={styles.datePickerFrame}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                locale="ko-KR"
                minimumDate={startOfToday()}
                themeVariant="light"
                textColor="#111111"
                accentColor={BLUE}
                style={styles.datePicker}
                onChange={(_, selectedDate) => {
                  if (!selectedDate) {
                    if (Platform.OS !== 'ios') {
                      setShowDatePicker(false);
                    }
                    return;
                  }

                  const nextDate = clampToToday(selectedDate);

                  if (Platform.OS === 'ios') {
                    setDraftDate(nextDate);
                    return;
                  }

                  setDraftDate(nextDate);
                  saveDateForStatus(nextDate);
                  setShowDatePicker(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingBottom: 36,
  },

  backButton: {
    marginBottom: 35,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 68,
  },

  progress: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#DDDDDD',
  },

  progressActive: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  title: {
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 13,
    color: '#B0B0B0',
    marginBottom: 42,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },

  selectBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  selectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
  },

  selectTextActive: {
    color: '#111111',
    fontWeight: '800',
  },

  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginTop: 42,
    marginBottom: 14,
  },

  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },

  statusCard: {
    flex: 1,
    minHeight: 102,
    borderWidth: 1,
    borderColor: '#E2E7F0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 2,
    backgroundColor: '#F3F7FF',
  },

  statusEmoji: {
    fontSize: 32,
    marginBottom: 9,
  },

  statusText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#111111',
    fontWeight: '800',
    textAlign: 'center',
  },

  statusTextSelected: {
    color: BLUE,
  },

  dateSection: {
    marginTop: 28,
  },

  dateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },

  dateField: {
    height: 54,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  dateIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  dateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
  },

  datePlaceholderText: {
    fontWeight: '600',
    color: '#777777',
  },

  bottomSpacer: {
    flex: 1,
    minHeight: 120,
  },

  nextButton: {
    height: 53,
    borderRadius: 5,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonActive: {
    backgroundColor: BLUE,
  },

  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A9A9A',
  },

  nextTextActive: {
    color: '#FFFFFF',
  },

  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.24)',
  },

  datePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  datePickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9DEE8',
    marginBottom: 16,
  },

  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  datePickerCancel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A8A8A',
  },

  datePickerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },

  datePickerDone: {
    fontSize: 14,
    fontWeight: '900',
    color: BLUE,
  },

  datePickerFrame: {
    minHeight: 322,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
  },

  datePicker: {
    width: '100%',
    minHeight: 320,
  },
});
