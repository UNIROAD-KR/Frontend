import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import { AppBackButton } from '@/components/ui/app-back-button';
import {
  CUSTOM_COUNTRY_OPTION,
  type DispatchSemesterTerm,
  countryOptions,
  dispatchSemesterTerms,
  formatDispatchSemester,
  getNicknameError,
  parseDispatchSemester,
  universityOptions,
} from '@/src/constants/onboarding';

const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#737373';
const LINE = '#E5E7EB';
const SOFT = '#F6F8FC';

type FieldKey =
  | 'nickname'
  | 'homeUniversity'
  | 'country'
  | 'dispatchedUniversity'
  | 'dispatchSemester';

const fieldConfig: Record<
  FieldKey,
  {
    title: string;
    label: string;
    placeholder: string;
    helpText: string;
    buttonText: string;
    storageKeys: string[];
  }
> = {
  nickname: {
    title: '닉네임 설정',
    label: '닉네임',
    placeholder: '닉네임을 입력하세요',
    helpText: '※ 사용할 닉네임을 입력해주세요',
    buttonText: '변경하기',
    storageKeys: ['nickname'],
  },
  homeUniversity: {
    title: '소속 대학 설정',
    label: '소속 대학',
    placeholder: '소속 대학 선택',
    helpText: '※ 온보딩과 같은 대학 목록에서 선택해 주세요.',
    buttonText: '변경하기',
    storageKeys: ['homeUniversity', 'university'],
  },
  country: {
    title: '파견 국가 및 지역 설정',
    label: '파견 국가 및 지역',
    placeholder: '파견 국가 선택',
    helpText: '※ 파견 국가와 지역은 홈 화면과 프로필에 함께 표시됩니다.',
    buttonText: '변경하기',
    storageKeys: ['dispatchedCountry'],
  },
  dispatchedUniversity: {
    title: '파견교 설정',
    label: '파견교',
    placeholder: '파견교를 입력하세요',
    helpText: '※ 파견교를 설정하면 학교별 정보를 더 쉽게 확인할 수 있습니다.',
    buttonText: '변경하기',
    storageKeys: ['dispatchedUniversity'],
  },
  dispatchSemester: {
    title: '파견 학기 설정',
    label: '파견 학기',
    placeholder: '파견 학기 선택',
    helpText: '※ 파견 년도와 학기를 선택해 주세요.',
    buttonText: '변경하기',
    storageKeys: ['dispatchSemester'],
  },
};

const currentYear = new Date().getFullYear();
const dispatchYearOptions = Array.from({ length: 12 }, (_, index) =>
  String(currentYear - 1 + index),
);

const resolveCountrySelection = (savedCountry: string) => {
  if (!savedCountry) {
    return { selectedCountry: '', customCountry: '' };
  }

  if (countryOptions.includes(savedCountry)) {
    return { selectedCountry: savedCountry, customCountry: '' };
  }

  return {
    selectedCountry: CUSTOM_COUNTRY_OPTION,
    customCountry: savedCountry,
  };
};

export default function ProfileFieldEditScreen() {
  const { field, value, region } = useLocalSearchParams<{
    field?: string;
    value?: string;
    region?: string;
  }>();
  const safeField: FieldKey =
    field === 'homeUniversity' ||
    field === 'country' ||
    field === 'dispatchedUniversity' ||
    field === 'dispatchSemester' ||
    field === 'nickname'
      ? field
      : 'nickname';
  const config = fieldConfig[safeField];
  const initialValue = useMemo(() => (typeof value === 'string' ? value : ''), [value]);
  const initialRegion = useMemo(() => (typeof region === 'string' ? region : ''), [region]);
  const initialCountrySelection = useMemo(
    () => resolveCountrySelection(initialValue.trim()),
    [initialValue],
  );
  const initialDispatchSemester = useMemo(
    () => parseDispatchSemester(initialValue),
    [initialValue],
  );
  const normalizedInitialDispatchSemester = useMemo(
    () =>
      initialDispatchSemester.year && initialDispatchSemester.term
        ? formatDispatchSemester(initialDispatchSemester.year, initialDispatchSemester.term)
        : initialValue.trim(),
    [initialDispatchSemester, initialValue],
  );
  const [draft, setDraft] = useState(initialValue);
  const [regionDraft, setRegionDraft] = useState(initialRegion);
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    initialCountrySelection.selectedCountry,
  );
  const [customCountry, setCustomCountry] = useState(
    initialCountrySelection.customCountry,
  );
  const [universitySheetVisible, setUniversitySheetVisible] = useState(false);
  const [semesterYear, setSemesterYear] = useState(initialDispatchSemester.year);
  const [semesterTerm, setSemesterTerm] = useState<DispatchSemesterTerm | ''>(
    initialDispatchSemester.term,
  );
  const [semesterYearPickerVisible, setSemesterYearPickerVisible] = useState(false);

  const trimmedDraft = draft.trim();
  const trimmedRegion = regionDraft.trim();
  const nicknameError = useMemo(
    () => (safeField === 'nickname' ? getNicknameError(draft) : ''),
    [draft, safeField],
  );
  const isCustomCountry = safeField === 'country' && selectedCountry === CUSTOM_COUNTRY_OPTION;
  const finalCountryDraft =
    safeField === 'country'
      ? isCustomCountry
        ? customCountry.trim()
        : selectedCountry
      : trimmedDraft;
  const selectedDispatchSemester =
    semesterYear && semesterTerm ? formatDispatchSemester(semesterYear, semesterTerm) : '';
  const canSave =
    safeField === 'country'
      ? finalCountryDraft.length > 0 &&
        (finalCountryDraft !== initialValue.trim() || trimmedRegion !== initialRegion.trim())
      : safeField === 'dispatchSemester'
        ? selectedDispatchSemester.length > 0 &&
          selectedDispatchSemester !== normalizedInitialDispatchSemester
        : safeField === 'nickname'
          ? draft.length > 0 && !nicknameError && trimmedDraft !== initialValue.trim()
          : trimmedDraft.length > 0 && trimmedDraft !== initialValue.trim();

  const openSemesterYearPicker = () => {
    Keyboard.dismiss();
    setSemesterYearPickerVisible(true);
  };

  const selectSemesterYear = (year: string) => {
    setSemesterYear(year);
    setSemesterYearPickerVisible(false);
  };

  const selectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setCountrySheetVisible(false);

    if (countryName === CUSTOM_COUNTRY_OPTION) {
      setCustomCountry('');
      setDraft('');
      return;
    }

    setCustomCountry('');
    setDraft(countryName);
  };

  const changeCustomCountry = (value: string) => {
    setCustomCountry(value);
    setDraft(value);
  };

  const saveField = async () => {
    Keyboard.dismiss();

    if (!canSave) return;

    const savedOverrides = await AsyncStorage.getItem('profileFieldOverrides');
    const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};
    const nextValue =
      safeField === 'country'
        ? finalCountryDraft
        : safeField === 'dispatchSemester'
          ? selectedDispatchSemester
          : trimmedDraft;

    const storageTasks = config.storageKeys.map((key) => AsyncStorage.setItem(key, nextValue));

    if (safeField === 'country') {
      storageTasks.push(AsyncStorage.setItem('dispatchedRegion', trimmedRegion));
    }

    await Promise.all([
      ...storageTasks,
      AsyncStorage.setItem(
        'profileFieldOverrides',
        JSON.stringify({
          ...overrides,
          [safeField]: true,
          ...(safeField === 'country' ? { region: true } : {}),
        }),
      ),
    ]);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={styles.mainArea} onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.header}>
          <AppBackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>{config.title}</Text>
        </View>

        <View style={styles.content}>
          {safeField === 'country' ? (
            <>
              <Text style={styles.label}>파견 국가</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setCountrySheetVisible(true);
                }}
                activeOpacity={0.84}
              >
                <Text style={[styles.selectText, !selectedCountry && styles.selectPlaceholder]}>
                  {selectedCountry || config.placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={MUTED} />
              </TouchableOpacity>

              {isCustomCountry && (
                <>
                  <Text style={[styles.label, styles.regionLabel]}>파견 국가 직접 입력</Text>
                  <TextInput
                    style={styles.input}
                    value={customCountry}
                    onChangeText={changeCustomCountry}
                    placeholder="예: 캐나다, 호주, 일본"
                    placeholderTextColor="#A4ADBA"
                    returnKeyType="next"
                  />
                </>
              )}

              <Text style={[styles.label, styles.regionLabel]}>파견 지역</Text>
              <TextInput
                style={styles.input}
                value={regionDraft}
                onChangeText={setRegionDraft}
                placeholder="파견 지역을 입력하세요"
                placeholderTextColor="#A4ADBA"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </>
          ) : safeField === 'homeUniversity' ? (
            <>
              <Text style={styles.label}>{config.label}</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setUniversitySheetVisible(true);
                }}
                activeOpacity={0.84}
              >
                <Text style={[styles.selectText, !trimmedDraft && styles.selectPlaceholder]}>
                  {trimmedDraft || config.placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={MUTED} />
              </TouchableOpacity>
            </>
          ) : safeField === 'dispatchSemester' ? (
            <>
              <Text style={styles.label}>파견 년도</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={openSemesterYearPicker}
                activeOpacity={0.84}
              >
                <Text style={[styles.selectText, !semesterYear && styles.selectPlaceholder]}>
                  {semesterYear ? `${semesterYear}년` : '년도 선택'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={MUTED} />
              </TouchableOpacity>

              <Text style={[styles.label, styles.regionLabel]}>학기</Text>
              <View style={styles.semesterGrid}>
                {dispatchSemesterTerms.map((term) => {
                  const selected = semesterTerm === term;

                  return (
                    <TouchableOpacity
                      key={term}
                      style={[styles.semesterChip, selected && styles.semesterChipSelected]}
                      onPress={() => setSemesterTerm(term)}
                      activeOpacity={0.84}
                    >
                      <Text
                        style={[
                          styles.semesterChipText,
                          selected && styles.semesterChipTextSelected,
                        ]}
                      >
                        {term}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>{config.label}</Text>
              <TextInput
                style={[styles.input, nicknameError && styles.inputError]}
                value={draft}
                onChangeText={setDraft}
                placeholder={config.placeholder}
                placeholderTextColor="#A4ADBA"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveField}
              />
            </>
          )}
          <Text style={[styles.helpText, nicknameError && styles.errorText]}>
            {nicknameError ||
              (safeField === 'nickname'
                ? '공백없이 2자 이상 12자 이하로 입력해주세요.'
                : config.helpText)}
          </Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaButton, !canSave && styles.ctaButtonDisabled]}
          onPress={saveField}
          activeOpacity={canSave ? 0.88 : 1}
          disabled={!canSave}
        >
          <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
            {config.buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      <OnboardingSelectModal
        visible={countrySheetVisible}
        title="파견 국가 선택"
        options={countryOptions}
        selectedValue={selectedCountry}
        onClose={() => setCountrySheetVisible(false)}
        onSelect={selectCountry}
      />

      <Modal
        transparent
        visible={universitySheetVisible}
        animationType="slide"
        onRequestClose={() => setUniversitySheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setUniversitySheetVisible(false)}
        >
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>소속 대학 선택</Text>
              <TouchableOpacity onPress={() => setUniversitySheetVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color={INK} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.selectionList}>
              {universityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.selectionOption}
                  onPress={() => {
                    setDraft(option);
                    setUniversitySheetVisible(false);
                  }}
                  activeOpacity={0.78}
                >
                  <Text
                    style={[
                      styles.selectionOptionText,
                      trimmedDraft === option && styles.selectionOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {trimmedDraft === option && (
                    <Ionicons name="checkmark" size={18} color={BLUE} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={semesterYearPickerVisible}
        animationType="slide"
        onRequestClose={() => setSemesterYearPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setSemesterYearPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={() => setSemesterYearPickerVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>파견 년도 선택</Text>
              <View style={styles.sheetHeaderSpacer} />
            </View>

            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
              {dispatchYearOptions.map((year) => {
                const selected = semesterYear === year;

                return (
                  <TouchableOpacity
                    key={year}
                    style={styles.selectionOption}
                    onPress={() => selectSemesterYear(year)}
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.selectionOptionText,
                        selected && styles.selectionOptionTextActive,
                      ]}
                    >
                      {year}년
                    </Text>
                    {selected && <Ionicons name="checkmark" size={18} color={BLUE} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainArea: {
    flex: 1,
  },
  header: {
    minHeight: 98,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 17,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 9,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '900',
    color: MUTED,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF7F7',
  },
  regionLabel: {
    marginTop: 14,
  },
  selectButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  selectPlaceholder: {
    color: '#A4ADBA',
  },
  helpText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: MUTED,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  semesterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  semesterChip: {
    minWidth: '47%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  semesterChipSelected: {
    borderColor: BLUE,
    backgroundColor: '#EEF4FF',
  },
  semesterChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5563',
  },
  semesterChipTextSelected: {
    color: BLUE,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  sheet: {
    maxHeight: '68%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D8DEE8',
    marginBottom: 12,
  },
  sheetHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: MUTED,
  },
  sheetDoneText: {
    fontSize: 14,
    fontWeight: '900',
    color: BLUE,
  },
  selectionList: {
    maxHeight: 420,
  },
  selectionOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
    paddingHorizontal: 2,
  },
  selectionOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  selectionOptionTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
  sheetHeaderSpacer: {
    width: 34,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
  },
  ctaButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#D8DEE8',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ctaTextDisabled: {
    color: '#8B95A1',
  },
});
