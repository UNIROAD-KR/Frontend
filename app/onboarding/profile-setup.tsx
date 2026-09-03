import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import { useResetScrollOnFocus } from '@/hooks/use-reset-scroll-on-focus';
import {
  countryOptions,
  CUSTOM_COUNTRY_OPTION,
  dispatchSemesterTerms,
  type DispatchSemesterTerm,
  ExchangeStatus,
  formatDispatchSemester,
  getNicknameError,
  ONBOARDING_NICKNAME_KEY,
  parseDispatchSemester,
  universityOptions,
} from '@/src/constants/onboarding';
import { onboarding, type OnboardingRequest } from '@/src/api/auth';
import { clearOnboardingDraft } from '@/src/storage/onboardingDraft';

type DateStorageKey =
  | 'applicationDeadline'
  | 'departureDate'
  | 'dispatchStartDate';

type StatusOption = {
  value: ExchangeStatus;
  label: string;
  dateLabel: string;
  dateKey: DateStorageKey;
  profileStatus: string;
};

const statusOptions: StatusOption[] = [
  {
    value: 'preparing',
    label: '지원 준비 중',
    dateLabel: '지원 마감일',
    dateKey: 'applicationDeadline',
    profileStatus: '지원 준비 중',
  },
  {
    value: 'accepted',
    label: '출국 준비 중',
    dateLabel: '출국 예정일',
    dateKey: 'departureDate',
    profileStatus: '출국 준비 중',
  },
  {
    value: 'dispatched',
    label: '파견 중',
    dateLabel: '파견 시작일',
    dateKey: 'dispatchStartDate',
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

const toStorageDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStoredDateParts = (value: string) => {
  const [year = '', month = '', day = ''] = value.split('-');
  return { year, month, day };
};

const resolveCountrySelection = (savedCountry: string | null) => {
  if (!savedCountry) return { selectedCountry: '', customCountry: '' };
  if (countryOptions.includes(savedCountry)) {
    return { selectedCountry: savedCountry, customCountry: '' };
  }
  return { selectedCountry: CUSTOM_COUNTRY_OPTION, customCountry: savedCountry };
};

const mapCurrentSituation = (
  status: ExchangeStatus,
): OnboardingRequest['currentSituation'] => {
  if (status === 'dispatched') return 'DISPATCHED';
  if (status === 'accepted') return 'PREPARING_DEPARTURE';
  return 'PREPARING_APPLICATION';
};

const mapGender = (gender: string | null): OnboardingRequest['gender'] | undefined => {
  if (gender === 'female') return 'FEMALE';
  if (gender === 'male') return 'MALE';
  return undefined;
};

const calculateAge = (birthYear: string | null) => {
  const value = Number(birthYear);
  return Number.isInteger(value) && value > 0
    ? new Date().getFullYear() - value + 1
    : undefined;
};

function Step({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.step, active && styles.stepActive]}>
      <Text style={styles.stepText}>{label}</Text>
    </View>
  );
}

type SelectFieldProps = {
  value: string;
  placeholder: string;
  onPress: () => void;
};

function SelectField({ value, placeholder, onPress }: SelectFieldProps) {
  return (
    <Pressable style={styles.selectField} onPress={onPress}>
      <Text style={[styles.selectValue, !value && styles.placeholder]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color="#18202B" />
    </Pressable>
  );
}

type DropdownOption = {
  label: string;
  value: string;
};

type InlineDropdownProps = SelectFieldProps & {
  open: boolean;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  compact?: boolean;
  displayValue?: string;
};

function InlineDropdown({
  value,
  placeholder,
  onPress,
  open,
  options,
  onSelect,
  compact = false,
  displayValue,
}: InlineDropdownProps) {
  return (
    <View style={[styles.inlineDropdownAnchor, compact && styles.compactDropdownAnchor]}>
      <SelectField
        value={displayValue ?? value}
        placeholder={placeholder}
        onPress={onPress}
      />
      {open ? (
        <View style={[styles.inlineDropdownMenu, compact && styles.compactDropdownMenu]}>
          <ScrollView
            style={styles.inlineDropdownScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
          >
            {options.map((option) => {
              const selected = value === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={styles.inlineDropdownOption}
                  onPress={() => onSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.inlineDropdownOptionText,
                      selected && styles.inlineDropdownOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default function ProfileSetupPage() {
  const scrollRef = useResetScrollOnFocus();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [university, setUniversity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [region, setRegion] = useState('');
  const [dispatchedUniversity, setDispatchedUniversity] = useState('');
  const [semesterYear, setSemesterYear] = useState('');
  const [semesterTerm, setSemesterTerm] = useState<DispatchSemesterTerm | ''>('');
  const [status, setStatus] = useState<ExchangeStatus | ''>('');
  const [statusDates, setStatusDates] =
    useState<Record<ExchangeStatus, string>>(emptyStatusDates);
  const [universityPickerVisible, setUniversityPickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [birthYearPickerVisible, setBirthYearPickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [openDatePart, setOpenDatePart] = useState<'year' | 'month' | 'day' | null>(null);
  const [dateDraftParts, setDateDraftParts] = useState({ year: '', month: '', day: '' });
  const [submitting, setSubmitting] = useState(false);

  const nicknameError = useMemo(() => getNicknameError(nickname), [nickname]);
  const selectedStatus = useMemo(
    () => statusOptions.find((option) => option.value === status) ?? null,
    [status],
  );
  const statusDate = status ? statusDates[status] : '';
  const isCustomCountry = selectedCountry === CUSTOM_COUNTRY_OPTION;
  const finalCountry = isCustomCountry ? customCountry.trim() : selectedCountry;
  const isValid = Boolean(
    nickname.trim() &&
      !nicknameError &&
      gender &&
      birthYear &&
      university &&
      finalCountry &&
      region.trim() &&
      dispatchedUniversity.trim() &&
      semesterYear &&
      semesterTerm &&
      status &&
      statusDate,
  );

  const birthYearOptions = useMemo(
    () =>
      Array.from({ length: 63 }, (_, index) => {
        const year = String(new Date().getFullYear() - 18 - index);
        return { value: year, label: `${year}년` };
      }),
    [],
  );

  const semesterYears = useMemo(
    () => Array.from({ length: 10 }, (_, index) => String(new Date().getFullYear() - 3 + index)),
    [],
  );
  const dateYearOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const year = String(new Date().getFullYear() + index);
        return { value: year, label: `${year}년` };
      }),
    [],
  );
  const dateMonthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = String(index + 1).padStart(2, '0');
        return { value: month, label: `${month}월` };
      }),
    [],
  );
  const dateDayOptions = useMemo(() => {
    const year = Number(dateDraftParts.year) || new Date().getFullYear();
    const month = Number(dateDraftParts.month) || 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return { value: day, label: `${day}일` };
    });
  }, [dateDraftParts.month, dateDraftParts.year]);

  useEffect(() => {
    const loadDraft = async () => {
      const entries = await AsyncStorage.multiGet([
        ONBOARDING_NICKNAME_KEY,
        'gender',
        'birthYear',
        'university',
        'dispatchedCountry',
        'dispatchedRegion',
        'dispatchedUniversity',
        'dispatchSemester',
        'dispatchSemesterYear',
        'dispatchSemesterTerm',
        'onboardingSituation',
        'applicationDeadline',
        'departureDate',
        'dispatchStartDate',
      ]);
      const saved = Object.fromEntries(entries);
      const country = resolveCountrySelection(saved.dispatchedCountry);
      const parsedSemester = parseDispatchSemester(saved.dispatchSemester);

      setNickname(saved[ONBOARDING_NICKNAME_KEY] ?? '');
      setGender(
        saved.gender === 'female' || saved.gender === 'male'
          ? saved.gender
          : '',
      );
      setBirthYear(saved.birthYear ?? '');
      setUniversity(saved.university ?? '');
      setSelectedCountry(country.selectedCountry);
      setCustomCountry(country.customCountry);
      setRegion(saved.dispatchedRegion ?? '');
      setDispatchedUniversity(saved.dispatchedUniversity ?? '');
      setSemesterYear(parsedSemester.year || saved.dispatchSemesterYear || '');
      setSemesterTerm(parsedSemester.term || (saved.dispatchSemesterTerm as DispatchSemesterTerm) || '');
      setStatus(
        saved.onboardingSituation === 'preparing' ||
          saved.onboardingSituation === 'accepted' ||
          saved.onboardingSituation === 'dispatched'
          ? saved.onboardingSituation
          : '',
      );
      setStatusDates({
        preparing: saved.applicationDeadline ?? '',
        accepted: saved.departureDate ?? '',
        dispatched: saved.dispatchStartDate ?? '',
      });
      const savedStatus =
        saved.onboardingSituation === 'preparing' ||
        saved.onboardingSituation === 'accepted' ||
        saved.onboardingSituation === 'dispatched'
          ? saved.onboardingSituation
          : '';
      if (savedStatus) {
        const savedDate =
          savedStatus === 'preparing'
            ? saved.applicationDeadline ?? ''
            : savedStatus === 'accepted'
              ? saved.departureDate ?? ''
              : saved.dispatchStartDate ?? '';
        setDateDraftParts(getStoredDateParts(savedDate));
      }
    };

    void loadDraft();
  }, []);

  const saveNickname = (value: string) => {
    setNickname(value);
    void AsyncStorage.setItem(ONBOARDING_NICKNAME_KEY, value);
  };

  const selectCountry = (value: string) => {
    setSelectedCountry(value);
    setCountryPickerVisible(false);
    if (value !== CUSTOM_COUNTRY_OPTION) {
      setCustomCountry('');
      void AsyncStorage.setItem('dispatchedCountry', value);
    } else {
      setCustomCountry('');
      void AsyncStorage.setItem('dispatchedCountry', '');
    }
  };

  const selectSemesterYear = (year: string) => {
    setSemesterYear(year);
    setYearPickerVisible(false);
    void AsyncStorage.setItem('dispatchSemesterYear', year);
  };

  const selectStatus = (nextStatus: ExchangeStatus) => {
    setStatus(nextStatus);
    setDateDraftParts(getStoredDateParts(statusDates[nextStatus]));
    setOpenDatePart(null);
    void AsyncStorage.setItem('onboardingSituation', nextStatus);
  };

  const selectDatePart = (part: 'year' | 'month' | 'day', value: string) => {
    if (!status) return;

    const nextParts = { ...dateDraftParts, [part]: value };
    setDateDraftParts(nextParts);
    setOpenDatePart(null);

    if (!nextParts.year || !nextParts.month || !nextParts.day) return;

    const selectedDate = new Date(
      Number(nextParts.year),
      Number(nextParts.month) - 1,
      Number(nextParts.day),
    );
    const isRealDate =
      selectedDate.getFullYear() === Number(nextParts.year) &&
      selectedDate.getMonth() === Number(nextParts.month) - 1 &&
      selectedDate.getDate() === Number(nextParts.day);

    if (!isRealDate || selectedDate < startOfToday()) {
      Alert.alert('날짜를 확인해주세요', '오늘 이후의 날짜만 선택할 수 있어요.');
      return;
    }

    const nextDate = toStorageDate(selectedDate);
    setStatusDates((current) => ({ ...current, [status]: nextDate }));
    const statusOption = statusOptions.find((option) => option.value === status);
    if (statusOption) void AsyncStorage.setItem(statusOption.dateKey, nextDate);
  };

  const toggleDateDropdown = (part: 'year' | 'month' | 'day') => {
    if (openDatePart === part) {
      setOpenDatePart(null);
      return;
    }

    setOpenDatePart(part);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleStart = async () => {
    if (!isValid || !status || !selectedStatus || submitting) return;

    Keyboard.dismiss();
    setSubmitting(true);

    const selectedDateKey = selectedStatus.dateKey;
    const dispatchSemester = formatDispatchSemester(
      semesterYear,
      semesterTerm as DispatchSemesterTerm,
    );

    try {
      const requestGender = mapGender(gender);
      const requestAge = calculateAge(birthYear);

      if (!requestGender || !requestAge) {
        Alert.alert('입력 정보 확인', '성별과 출생연도를 다시 확인해주세요.');
        return;
      }

      const request: OnboardingRequest = {
        nickname: nickname.trim(),
        gender: requestGender,
        age: requestAge,
        currentSituation: mapCurrentSituation(status),
        domesticUniversity: university,
        dispatchedUniversity: dispatchedUniversity.trim(),
        dispatchedCountry: finalCountry,
        dispatchedRegion: region.trim(),
        dispatchSemester,
        ...(selectedDateKey === 'applicationDeadline'
          ? { applicationDeadline: statusDate }
          : {}),
        ...(selectedDateKey === 'departureDate' ? { departureDate: statusDate } : {}),
        ...(selectedDateKey === 'dispatchStartDate'
          ? { dispatchStartDate: statusDate }
          : {}),
      };

      await AsyncStorage.multiSet([
        [ONBOARDING_NICKNAME_KEY, nickname.trim()],
        ['gender', gender],
        ['birthYear', birthYear],
        ['university', university],
        ['dispatchedCountry', finalCountry],
        ['dispatchedRegion', region.trim()],
        ['dispatchedUniversity', dispatchedUniversity.trim()],
        ['dispatchSemester', dispatchSemester],
        ['dispatchSemesterYear', semesterYear],
        ['dispatchSemesterTerm', semesterTerm],
        ['onboardingSituation', status],
        ['exchangeStatus', status],
        ['profileStatus', selectedStatus.profileStatus],
        ['applicationDeadline', selectedDateKey === 'applicationDeadline' ? statusDate : ''],
        ['departureDate', selectedDateKey === 'departureDate' ? statusDate : ''],
        ['dispatchStartDate', selectedDateKey === 'dispatchStartDate' ? statusDate : ''],
      ]);

      console.log('[Onboarding] 저장 요청:', request);
      await onboarding(request);
      await AsyncStorage.setItem('nickname', nickname.trim());
      await clearOnboardingDraft();
      router.replace('/home');
    } catch (error: any) {
      console.log(
        '[Onboarding] 저장 실패:',
        error.response?.status,
        error.response?.data || error.message,
      );
      Alert.alert(
        '온보딩 저장 실패',
        error.response?.data?.message ?? '입력한 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          openDatePart && styles.contentWithOpenDateDropdown,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppBackButton fallbackHref="/onboarding/consent" style={styles.backButton} />
          <Text style={styles.headerTitle}>교환학생 신원 인증</Text>
        </View>

        <View style={styles.progressRow}>
          <Step label="1" />
          <View style={styles.progressLine} />
          <Step label="2" active />
        </View>

        <Text style={styles.title}>프로필 설정하기</Text>
        <Text style={styles.subtitle}>프로필을 설정하고 나만의 서비스를 시작해 보세요.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>닉네임</Text>
          <View style={[styles.textField, nicknameError && styles.textFieldError]}>
            <TextInput
              value={nickname}
              onChangeText={saveNickname}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#B3BDC9"
              style={styles.textInput}
              maxLength={12}
              returnKeyType="next"
            />
            <Text style={styles.counter}>{nickname.length}/12</Text>
          </View>
          {nicknameError ? <Text style={styles.errorText}>{nicknameError}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>성별</Text>
          <View style={styles.genderRow}>
            {([
              { value: 'female', label: '여성' },
              { value: 'male', label: '남성' },
            ] as const).map((option) => {
              const selected = gender === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.genderButton,
                    selected && styles.genderButtonSelected,
                  ]}
                  onPress={() => {
                    setGender(option.value);
                    void AsyncStorage.setItem('gender', option.value);
                  }}
                >
                  <Text
                    style={[
                      styles.genderText,
                      selected && styles.genderTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>출생연도</Text>
          <InlineDropdown
            value={birthYear}
            displayValue={birthYear ? `${birthYear}년` : ''}
            placeholder="출생연도를 선택해주세요"
            open={birthYearPickerVisible}
            options={birthYearOptions}
            onPress={() =>
              setBirthYearPickerVisible((visible) => !visible)
            }
            onSelect={(value) => {
              setBirthYear(value);
              setBirthYearPickerVisible(false);
              void AsyncStorage.setItem('birthYear', value);
            }}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>소속 대학</Text>
          <SelectField
            value={university}
            placeholder="소속 대학을 선택해주세요"
            onPress={() => setUniversityPickerVisible(true)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견 국가 및 지역</Text>
          <SelectField
            value={selectedCountry === CUSTOM_COUNTRY_OPTION ? customCountry : selectedCountry}
            placeholder="파견 국가를 선택해주세요"
            onPress={() => setCountryPickerVisible(true)}
          />
          {isCustomCountry ? (
            <TextInput
              value={customCountry}
              onChangeText={(value) => {
                setCustomCountry(value);
                void AsyncStorage.setItem('dispatchedCountry', value.trim());
              }}
              placeholder="파견 국가를 입력해주세요"
              placeholderTextColor="#B3BDC9"
              style={[styles.textField, styles.followingField, styles.textInput]}
            />
          ) : null}
          <TextInput
            value={region}
            onChangeText={(value) => {
              setRegion(value);
              void AsyncStorage.setItem('dispatchedRegion', value.trim());
            }}
            placeholder="상세 지역을 입력해주세요"
            placeholderTextColor="#B3BDC9"
            style={[styles.textField, styles.followingField, styles.textInput]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견교</Text>
          <TextInput
            value={dispatchedUniversity}
            onChangeText={(value) => {
              setDispatchedUniversity(value);
              void AsyncStorage.setItem('dispatchedUniversity', value.trim());
            }}
            placeholder="파견 대학을 입력해주세요"
            placeholderTextColor="#B3BDC9"
            style={[styles.textField, styles.textInput]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견 학기</Text>
          <InlineDropdown
            value={semesterYear}
            displayValue={semesterYear ? `${semesterYear}년` : ''}
            placeholder="0000년"
            open={yearPickerVisible}
            options={semesterYears.map((year) => ({ value: year, label: `${year}년` }))}
            onPress={() => setYearPickerVisible((visible) => !visible)}
            onSelect={selectSemesterYear}
          />
          <View style={styles.termRow}>
            {dispatchSemesterTerms.map((term) => {
              const selected = semesterTerm === term;
              return (
                <Pressable
                  key={term}
                  style={[styles.termButton, selected && styles.termButtonSelected]}
                  onPress={() => {
                    setSemesterTerm(term);
                    void AsyncStorage.setItem('dispatchSemesterTerm', term);
                  }}
                >
                  <Text style={[styles.termText, selected && styles.termTextSelected]}>{term}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견 상태</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((option) => {
              const selected = status === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.statusButton, selected && styles.statusButtonSelected]}
                  onPress={() => selectStatus(option.value)}
                >
                  <Text style={[styles.statusText, selected && styles.statusTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedStatus ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{selectedStatus.dateLabel}</Text>
            <View style={styles.dateRow}>
              <InlineDropdown
                value={dateDraftParts.year}
                placeholder="연도"
                open={openDatePart === 'year'}
                compact
                options={dateYearOptions}
                onPress={() => toggleDateDropdown('year')}
                onSelect={(value) => selectDatePart('year', value)}
              />
              <InlineDropdown
                value={dateDraftParts.month}
                placeholder="월"
                open={openDatePart === 'month'}
                compact
                options={dateMonthOptions}
                onPress={() => toggleDateDropdown('month')}
                onSelect={(value) => selectDatePart('month', value)}
              />
              <InlineDropdown
                value={dateDraftParts.day}
                placeholder="일"
                open={openDatePart === 'day'}
                compact
                options={dateDayOptions}
                onPress={() => toggleDateDropdown('day')}
                onSelect={(value) => selectDatePart('day', value)}
              />
            </View>
          </View>
        ) : null}

        <Pressable
          style={[styles.startButton, isValid && styles.startButtonActive]}
          onPress={handleStart}
          disabled={!isValid || submitting}
        >
          <Text style={styles.startButtonText}>{submitting ? '저장 중...' : '유니로드 시작하기'}</Text>
        </Pressable>
      </ScrollView>

      <OnboardingSelectModal
        visible={universityPickerVisible}
        title="소속 대학 선택하기"
        options={universityOptions}
        selectedValue={university}
        selectionMode="confirm"
        searchPlaceholder="학교명으로 찾아보세요"
        onClose={() => setUniversityPickerVisible(false)}
        onSelect={(value) => {
          setUniversity(value);
          setUniversityPickerVisible(false);
          void AsyncStorage.setItem('university', value);
        }}
      />

      <OnboardingSelectModal
        visible={countryPickerVisible}
        title="파견 국가 선택하기"
        options={countryOptions}
        selectedValue={selectedCountry}
        selectionMode="confirm"
        searchPlaceholder="국가명으로 찾아보세요"
        onClose={() => setCountryPickerVisible(false)}
        onSelect={selectCountry}
      />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 36 },
  contentWithOpenDateDropdown: { paddingBottom: 250 },
  header: { height: 36, justifyContent: 'center', marginBottom: 28 },
  backButton: { position: 'absolute', left: 0 },
  headerTitle: { textAlign: 'center', color: '#252C37', fontSize: 16, fontWeight: '800' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  step: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D9DFE7' },
  stepActive: { backgroundColor: '#354151' },
  stepText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  progressLine: { width: 24, height: 1, backgroundColor: '#D9DFE7' },
  title: { color: '#141416', fontSize: 24, lineHeight: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#7A8491', fontSize: 13, lineHeight: 19, marginBottom: 30 },
  fieldGroup: { marginBottom: 24 },
  label: { color: '#5C697A', fontSize: 13, lineHeight: 18, fontWeight: '800', marginBottom: 8 },
  textField: { minHeight: 52, borderWidth: 1, borderColor: '#E0E5EB', borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  textFieldError: { borderColor: '#F04452' },
  textInput: { flex: 1, color: '#18202B', fontSize: 15, fontWeight: '700', paddingVertical: 0 },
  counter: { color: '#18202B', fontSize: 14, fontWeight: '700', marginLeft: 12 },
  errorText: { color: '#F04452', fontSize: 12, fontWeight: '700', marginTop: 6 },
  selectField: { height: 52, borderWidth: 1, borderColor: '#E0E5EB', borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { flex: 1, color: '#18202B', fontSize: 15, fontWeight: '700', marginRight: 10 },
  placeholder: { color: '#B3BDC9', fontWeight: '600' },
  inlineDropdownAnchor: { position: 'relative', zIndex: 20, flex: 1 },
  compactDropdownAnchor: { zIndex: 30 },
  inlineDropdownMenu: { position: 'absolute', top: 51, left: 0, right: 0, height: 206, borderWidth: 1, borderColor: '#E0E5EB', borderRadius: 10, backgroundColor: '#FFFFFF', zIndex: 40, shadowColor: '#111827', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  compactDropdownMenu: { height: 156 },
  inlineDropdownScroll: { flex: 1 },
  inlineDropdownOption: { height: 48, justifyContent: 'center', paddingHorizontal: 15 },
  inlineDropdownOptionText: { color: '#18202B', fontSize: 15, fontWeight: '700' },
  inlineDropdownOptionTextSelected: { color: '#1473FF', fontWeight: '900' },
  followingField: { marginTop: 6 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderButton: { flex: 1, height: 52, borderWidth: 1, borderColor: '#E0E5EB', borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  genderButtonSelected: { borderColor: '#18202B', backgroundColor: '#18202B' },
  genderText: { color: '#7A8491', fontSize: 15, fontWeight: '800' },
  genderTextSelected: { color: '#FFFFFF' },
  termRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  termButton: { flex: 1, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  termButtonSelected: { backgroundColor: '#18202B' },
  termText: { color: '#7A8491', fontSize: 14, fontWeight: '800' },
  termTextSelected: { color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', gap: 5 },
  statusButton: { flex: 1, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  statusButtonSelected: { backgroundColor: '#18202B' },
  statusText: { color: '#7A8491', fontSize: 14, fontWeight: '800' },
  statusTextSelected: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', gap: 5 },
  startButton: { height: 52, borderRadius: 8, backgroundColor: '#B3BDC9', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  startButtonActive: { backgroundColor: '#18202B' },
  startButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
