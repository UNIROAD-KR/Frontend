import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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

import { AppBackButton } from '@/components/ui/app-back-button';

type ExchangeStatus = 'preparing' | 'accepted' | 'dispatched';

const statusOptions: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: ExchangeStatus;
}[] = [
  {
    label: '지원 준비 중',
    value: 'preparing',
  },
  {
    icon: 'airplane-outline',
    label: '출국 준비 중',
    value: 'accepted',
  },
  {
    label: '파견 중',
    value: 'dispatched',
  },
];

const createDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

const DEFAULT_DEPARTURE_DATE = createDate(2026, 8, 21);

const toStorageDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const universities = [
  '서울대학교',
  '서울과학기술대학교',
  '서울시립대학교',
  '서울여자대학교',
  '연세대학교',
  '고려대학교',
  '성균관대학교',
  '한양대학교',
  '중앙대학교',
  '경희대학교',
  '한국외국어대학교',
  '이화여자대학교',
  '건국대학교',
  '동국대학교',
  '홍익대학교',
  '숭실대학교',
  '국민대학교',
  '세종대학교',
  '숙명여자대학교',
  '광운대학교',
  '명지대학교',
  '상명대학교',
  '가천대학교',
  '인하대학교',
  '아주대학교',
  '단국대학교',
  '한국항공대학교',
  '한국공학대학교',
  '한국교원대학교',
  '부산대학교',
  '경북대학교',
  '전남대학교',
  '전북대학교',
  '충남대학교',
  '충북대학교',
  '강원대학교',
  '제주대학교',
  '부경대학교',
  '영남대학교',
  '동아대학교',
  '계명대학교',
  '조선대학교',
  '원광대학교',
  '울산대학교',
  '인천대학교',
  '한림대학교',
  '가톨릭대학교',
  '덕성여자대학교',
  '동덕여자대학교',
  '성신여자대학교',
];

export default function UniversityPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [university, setUniversity] = useState('');
  const [status, setStatus] = useState<ExchangeStatus | ''>('');
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [draftDate, setDraftDate] = useState(DEFAULT_DEPARTURE_DATE);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isValid = university !== '' && status !== '';
  const filteredUniversities = useMemo(() => {
    if (!showSuggestions || university.trim().length === 0) {
      return [];
    }

    return universities.filter((item) => item.includes(university.trim()));
  }, [showSuggestions, university]);

  const handleSelectUniversity = (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    setShowSuggestions(false);
  };

  const openDatePicker = () => {
    setDraftDate(departureDate ?? DEFAULT_DEPARTURE_DATE);
    setShowDatePicker(true);
  };

  const handleConfirmDate = () => {
    setDepartureDate(draftDate);
    setShowDatePicker(false);
  };

  const handleNext = async () => {
    if (!isValid) {
      return;
    }

    await AsyncStorage.setItem('university', university);
    await AsyncStorage.setItem('onboardingSituation', status);
    await AsyncStorage.setItem(
      'departureDate',
      departureDate ? toStorageDate(departureDate) : '',
    );
    await AsyncStorage.setItem(
      'exchangeStatus',
      status === 'dispatched' ? 'dispatched' : 'preparing',
    );
    await AsyncStorage.setItem(
      'profileStatus',
      status === 'dispatched' ? '파견 중' : '지원 준비 중',
    );

    if (status !== 'dispatched') {
      router.push({
        pathname: '/onboarding/country',
        params: { nickname },
      });
      return;
    }

    router.push({
      pathname: '/onboarding/dispatched-country',
      params: { nickname },
    });
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
        <AppBackButton style={styles.backButton} />

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progress} />
          <View style={styles.progress} />
        </View>

        <Text style={styles.title}>
          소속대학과{'\n'}현재 본인의 상태를 알려주세요.
        </Text>

        <Text style={styles.subtitle}>현재 본인의 단계는 어디인가요?</Text>

        <Text style={styles.label}>소속대학</Text>

        <View style={styles.inputArea}>
          <TextInput
            style={styles.universityInput}
            placeholder="소속대학 입력"
            placeholderTextColor="#555555"
            value={university}
            onFocus={() => setShowSuggestions(true)}
            onChangeText={(text) => {
              setUniversity(text);
              setShowSuggestions(true);
            }}
          />

          {university.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setUniversity('');
                setShowSuggestions(false);
              }}
            >
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          )}
        </View>

        {filteredUniversities.length > 0 && (
          <View style={styles.suggestionBox}>
            {filteredUniversities.map((item) => (
              <Pressable
                key={item}
                style={styles.suggestionItem}
                onPress={() => handleSelectUniversity(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.statusLabel}>현재 상황</Text>

        <View style={styles.statusRow}>
          {statusOptions.map((item) => {
            const selected = status === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.statusCard,
                  selected && styles.selectedCard,
                ]}
                onPress={() => setStatus(item.value)}
              >
                {item.value === 'preparing' ? (
                  <Image
                    source={require('../../assets/images/ready.png')}
                    style={styles.statusImage}
                  />
                ) : item.value === 'dispatched' ? (
                  <Text style={styles.emoji}>🧚</Text>
                ) : (
                  <View
                    style={[
                      styles.statusIconCircle,
                      selected && styles.statusIconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={item.icon ?? 'airplane-outline'}
                      size={20}
                      color={selected ? '#FFFFFF' : BLUE}
                    />
                  </View>
                )}
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

        <Text style={styles.dateLabel}>출국 예정일</Text>

        <Pressable style={styles.dateField} onPress={openDatePicker}>
          <View style={styles.dateIconBox}>
            <Ionicons name="calendar-outline" size={19} color={BLUE} />
          </View>
          <Text
            style={[
              styles.dateText,
              !departureDate && styles.datePlaceholderText,
            ]}
          >
            {departureDate ? formatDisplayDate(departureDate) : '날짜 선택'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#777777" />
        </Pressable>

        <View style={styles.bottomSpacer} />

        <Pressable
          style={[styles.nextButton, isValid && styles.nextButtonActive]}
          disabled={!isValid}
          onPress={handleNext}
        >
          <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
            다음 (2/4)
          </Text>
        </Pressable>
      </ScrollView>

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

              <Text style={styles.datePickerTitle}>출국 예정일 선택</Text>

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

                  if (Platform.OS === 'ios') {
                    setDraftDate(selectedDate);
                    return;
                  }

                  setDepartureDate(selectedDate);
                  setDraftDate(selectedDate);
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
    marginBottom: 92,
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
    color: '#000',
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

  inputArea: {
    height: 54,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  universityInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
  },

  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  clearText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: -1,
  },

  suggestionBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 230,
    overflow: 'hidden',
  },

  suggestionItem: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  suggestionText: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '600',
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
    minHeight: 104,
    borderWidth: 1,
    borderColor: '#E2E7F0',
    borderRadius: 12,
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

  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  statusIconCircleSelected: {
    backgroundColor: BLUE,
  },

  statusImage: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginBottom: 9,
  },

  emoji: {
    fontSize: 34,
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

  dateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginTop: 28,
    marginBottom: 12,
  },

  dateField: {
    height: 54,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
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
