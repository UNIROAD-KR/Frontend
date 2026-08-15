import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getMemberMe,
  updateMemberProfile,
  type CurrentSituation,
  type MemberProfileUpdateRequest,
} from '../../../src/api/auth';
import { AppBackButton } from '@/components/ui/app-back-button';
import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import DropdownArrowIcon from '@/assets/icon/Property 1=arrow2, Property 2=down.svg';
import ProfileEditAvatarActionIcon from '@/assets/icon/profile/profile-edit-avatar-action.svg';
import ProfileEditAvatarBackground from '@/assets/icon/profile/profile-edit-avatar-background.svg';
import ProfileEditLockIcon from '@/assets/icon/profile/profile-edit-lock.svg';
import AvatarCameraIcon from '@/assets/icon/profile/avatar-camera.svg';
import AvatarLibraryIcon from '@/assets/icon/profile/avatar-library.svg';
import {
  CUSTOM_COUNTRY_OPTION,
  countryOptions,
  dispatchSemesterTerms,
  formatDispatchSemester,
  getNicknameError,
  parseDispatchSemester,
  universityOptions,
} from '@/src/constants/onboarding';

const NAVY = '#0F2042';
const BLUE = '#3568DA';
const INK = '#1A2029';
const MUTED = '#7A8491';
const PAGE = '#F6F7F9';

const statusOptions = ['지원 준비 중', '출국 준비 중', '파견 중'];
const semesterYearOptions = Array.from({ length: 12 }, (_, index) =>
  String(new Date().getFullYear() - 3 + index),
);
const dateLabels: Record<string, string> = {
  '지원 준비 중': '지원 마감일',
  '출국 준비 중': '출국일',
  '파견 중': '파견 시작일',
  귀국: '귀국일',
};
const exchangeStatusByProfileStatus: Record<string, string> = {
  '지원 준비 중': 'preparing',
  '출국 준비 중': 'accepted',
  '파견 중': 'dispatched',
  귀국: 'returned',
};
const currentSituationByProfileStatus: Record<string, CurrentSituation> = {
  '지원 준비 중': 'PREPARING_APPLICATION',
  '출국 준비 중': 'PREPARING_DEPARTURE',
  '파견 중': 'DISPATCHED',
  귀국: 'RETURNED',
};
const profileStatusByCurrentSituation: Record<CurrentSituation, string> = {
  PREPARING_APPLICATION: '지원 준비 중',
  WAITING_RESULT: '지원 준비 중',
  ACCEPTED: '지원 준비 중',
  PREPARING_DEPARTURE: '출국 준비 중',
  DISPATCHED: '파견 중',
  RETURNED: '귀국',
};
type DateFieldKey = 'applicationDeadline' | 'departureDate' | 'dispatchStartDate' | 'returnDate';
type DatePart = 'year' | 'month' | 'day';
type EditSnapshot = {
  avatarUri: string;
  nickname: string;
  homeUniversity: string;
  country: string;
  region: string;
  dispatchedUniversity: string;
  status: string;
  applicationDeadline: string;
  departureDate: string;
  dispatchStartDate: string;
  returnDate: string;
  dispatchSemester: string;
};

const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);
const toDateValue = (value: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toStorageDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : '');
const formatDate = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
const normalizeDispatchSemester = (value?: string | number | null) => {
  if (value === null || value === undefined) return '';

  const trimmedValue = String(value).trim();
  const parsedValue = parseDispatchSemester(trimmedValue);

  if (/^\d{4}$/.test(trimmedValue)) return '';
  if (parsedValue.year && parsedValue.term) {
    return formatDispatchSemester(parsedValue.year, parsedValue.term);
  }

  return trimmedValue;
};

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  // Keep the fixed save action above the floating bottom tab on every device.
  const footerBottomOffset = 64 + Math.max(insets.bottom, 12) + 12;
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [homeUniversity, setHomeUniversity] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [dispatchedUniversity, setDispatchedUniversity] = useState('');
  const [status, setStatus] = useState('출국 준비 중');
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [dispatchStartDate, setDispatchStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [dispatchSemester, setDispatchSemester] = useState('');
  const [universityPickerVisible, setUniversityPickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [semesterYearPickerVisible, setSemesterYearPickerVisible] = useState(false);
  const [customCountryMode, setCustomCountryMode] = useState(false);
  const [openDateDropdown, setOpenDateDropdown] = useState<{
    field: DateFieldKey;
    part: DatePart;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<EditSnapshot | null>(null);
  const [loadedCurrentSituation, setLoadedCurrentSituation] = useState<CurrentSituation | null>(null);

  const currentSnapshot: EditSnapshot = {
    avatarUri: avatarUri || '',
    nickname: nickname.trim(),
    homeUniversity: homeUniversity.trim(),
    country: country.trim(),
    region: region.trim(),
    dispatchedUniversity: dispatchedUniversity.trim(),
    status,
    applicationDeadline: toStorageDate(applicationDeadline),
    departureDate: toStorageDate(departureDate),
    dispatchStartDate: toStorageDate(dispatchStartDate),
    returnDate: toStorageDate(returnDate),
    dispatchSemester: dispatchSemester.trim(),
  };

  const hasChanges =
    !!initialSnapshot &&
    Object.keys(currentSnapshot).some((key) => {
      const snapshotKey = key as keyof EditSnapshot;
      return currentSnapshot[snapshotKey] !== initialSnapshot[snapshotKey];
    });
  const nicknameError = getNicknameError(nickname);
  const parsedDispatchSemester = parseDispatchSemester(dispatchSemester);
  const isDispatchSemesterValid =
    !dispatchSemester || Boolean(parsedDispatchSemester.year && parsedDispatchSemester.term);
  const canSave = hasChanges && Boolean(nickname.trim()) && !nicknameError && isDispatchSemesterValid;

  const chooseAvatar = async (source: 'camera' | 'library') => {
    setAvatarPickerVisible(false);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        '권한 필요',
        source === 'camera'
          ? '프로필 사진을 촬영하려면 카메라 접근 권한이 필요합니다.'
          : '프로필 사진을 선택하려면 사진첩 접근 권한이 필요합니다.',
      );
      return;
    }

    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.9,
    } as const;
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const selectUniversity = (value: string) => {
    setHomeUniversity(value);
    setUniversityPickerVisible(false);
  };

  const selectCountry = (value: string) => {
    if (value === CUSTOM_COUNTRY_OPTION) {
      setCountry('');
      setCustomCountryMode(true);
    } else {
      setCountry(value);
      setCustomCountryMode(false);
    }

    setCountryPickerVisible(false);
  };

  const selectSemesterYear = (year: string) => {
    const { term } = parseDispatchSemester(dispatchSemester);
    setDispatchSemester(term ? formatDispatchSemester(year, term) : year);
    setSemesterYearPickerVisible(false);
  };

  const selectSemesterTerm = (term: (typeof dispatchSemesterTerms)[number]) => {
    const { year } = parseDispatchSemester(dispatchSemester);
    setDispatchSemester(year ? formatDispatchSemester(year, term) : term);
  };

  useFocusEffect(
    useCallback(() => {
    const loadProfile = async () => {
      const [
        savedAvatar,
        savedNickname,
        savedUniversity,
        savedHomeUniversity,
        savedDispatchedUniversity,
        savedCountry,
        savedRegion,
        savedStatus,
        savedApplicationDeadline,
        savedDepartureDate,
        savedDispatchStartDate,
        savedReturnDate,
        savedDispatchSemester,
        savedOverrides,
      ] = await Promise.all([
        AsyncStorage.getItem('profileAvatarUri'),
        AsyncStorage.getItem('nickname'),
        AsyncStorage.getItem('university'),
        AsyncStorage.getItem('homeUniversity'),
        AsyncStorage.getItem('dispatchedUniversity'),
        AsyncStorage.getItem('dispatchedCountry'),
        AsyncStorage.getItem('dispatchedRegion'),
        AsyncStorage.getItem('profileStatus'),
        AsyncStorage.getItem('applicationDeadline'),
        AsyncStorage.getItem('departureDate'),
        AsyncStorage.getItem('dispatchStartDate'),
        AsyncStorage.getItem('returnDate'),
        AsyncStorage.getItem('dispatchSemester'),
        AsyncStorage.getItem('profileFieldOverrides'),
      ]);

      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

      const nextAvatar = savedAvatar || null;
      let nextName = '';
      let nextNickname = savedNickname || '';
      let nextHomeUniversity = savedHomeUniversity || savedUniversity || '';
      let nextDispatchedUniversity = savedDispatchedUniversity || '';
      let nextCountry = savedCountry || '';
      let nextRegion = savedRegion || '';
      let nextStatus =
        savedStatus && statusOptions.includes(savedStatus) ? savedStatus : statusOptions[1];
      let nextCurrentSituation: CurrentSituation | null = null;
      const nextApplicationDeadline = toDateValue(savedApplicationDeadline);
      const nextDepartureDate = toDateValue(savedDepartureDate);
      const nextDispatchStartDate = toDateValue(savedDispatchStartDate);
      const nextReturnDate = toDateValue(savedReturnDate);
      let nextDispatchSemester = normalizeDispatchSemester(savedDispatchSemester);

      try {
        const memberRes = await getMemberMe();
        const member = memberRes.data?.data;

        if (member?.name) nextName = member.name;
        if (member?.nickname && !overrides.nickname) nextNickname = member.nickname;
        if ((member?.homeUniversity || member?.domesticUniversity) && !overrides.homeUniversity) {
          nextHomeUniversity = member.homeUniversity || member.domesticUniversity || '';
        }
        if (member?.dispatchedCountry && !overrides.country) nextCountry = member.dispatchedCountry;
        if (member?.dispatchedRegion && !overrides.region) nextRegion = member.dispatchedRegion;
        if (member?.dispatchedUniversity && !overrides.dispatchedUniversity) {
          nextDispatchedUniversity = member.dispatchedUniversity;
        }
        if (member?.dispatchSemester && !overrides.dispatchSemester) {
          nextDispatchSemester = normalizeDispatchSemester(member.dispatchSemester);
        }
        if (member?.currentSituation) {
          nextCurrentSituation = member.currentSituation;
          nextStatus = profileStatusByCurrentSituation[member.currentSituation] || nextStatus;
        }
      } catch (error) {
        console.log('내 정보 조회 실패:', error);
      }

      setAvatarUri(nextAvatar);
      setName(nextName);
      setNickname(nextNickname);
      setHomeUniversity(nextHomeUniversity);
      setDispatchedUniversity(nextDispatchedUniversity);
      setCountry(nextCountry);
      setCustomCountryMode(Boolean(nextCountry) && !countryOptions.includes(nextCountry));
      setRegion(nextRegion);
      setStatus(nextStatus);
      setLoadedCurrentSituation(nextCurrentSituation);
      setApplicationDeadline(nextApplicationDeadline);
      setDepartureDate(nextDepartureDate);
      setDispatchStartDate(nextDispatchStartDate);
      setReturnDate(nextReturnDate);
      setDispatchSemester(nextDispatchSemester);
      const loadedSnapshot = {
        avatarUri: nextAvatar || '',
        nickname: nextNickname.trim(),
        homeUniversity: nextHomeUniversity.trim(),
        country: nextCountry.trim(),
        region: nextRegion.trim(),
        dispatchedUniversity: nextDispatchedUniversity.trim(),
        status: nextStatus,
        applicationDeadline: toStorageDate(nextApplicationDeadline),
        departureDate: toStorageDate(nextDepartureDate),
        dispatchStartDate: toStorageDate(nextDispatchStartDate),
        returnDate: toStorageDate(nextReturnDate),
        dispatchSemester: nextDispatchSemester.trim(),
      };

      setInitialSnapshot((prev) => prev ?? loadedSnapshot);
    };

    loadProfile();
    }, []),
  );

  const setDateForField = (field: DateFieldKey, date: Date) => {
    if (field === 'applicationDeadline') {
      setApplicationDeadline(date);
      return;
    }

    if (field === 'departureDate') {
      setDepartureDate(date);
      return;
    }

    if (field === 'dispatchStartDate') {
      setDispatchStartDate(date);
      return;
    }

    setReturnDate(date);
  };

  const getFallbackDate = (field: DateFieldKey) => {
    if (field === 'applicationDeadline') return createDate(2026, 3, 18);
    if (field === 'departureDate') return createDate(2026, 8, 21);
    if (field === 'dispatchStartDate') return createDate(2026, 9, 1);
    return createDate(2027, 1, 15);
  };

  const getDateByField = (field: DateFieldKey) => {
    if (field === 'applicationDeadline') return applicationDeadline;
    if (field === 'departureDate') return departureDate;
    if (field === 'dispatchStartDate') return dispatchStartDate;
    return returnDate;
  };

  const toggleDateDropdown = (field: DateFieldKey, part: DatePart) => {
    setOpenDateDropdown((current) =>
      current?.field === field && current.part === part ? null : { field, part },
    );

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const selectDatePart = (field: DateFieldKey, part: DatePart, value: string) => {
    const currentDate = getDateByField(field) || getFallbackDate(field);
    const nextYear = part === 'year' ? Number(value) : currentDate.getFullYear();
    const nextMonth = part === 'month' ? Number(value) : currentDate.getMonth() + 1;
    const maxDay = new Date(nextYear, nextMonth, 0).getDate();
    const nextDay = Math.min(part === 'day' ? Number(value) : currentDate.getDate(), maxDay);

    setDateForField(field, createDate(nextYear, nextMonth, nextDay));
    setOpenDateDropdown(null);
  };

  const saveProfile = async () => {
    if (!canSave) {
      return;
    }

    const [savedStatus, savedDeparturePrepStartDate] = await Promise.all([
      AsyncStorage.getItem('profileStatus'),
      AsyncStorage.getItem('departurePrepStartDate'),
    ]);
    const departurePrepStartDateTask =
      status === '출국 준비 중'
        ? savedStatus !== status || !savedDeparturePrepStartDate
          ? AsyncStorage.setItem('departurePrepStartDate', toStorageDate(new Date()))
          : Promise.resolve()
        : AsyncStorage.removeItem('departurePrepStartDate');
    const nextCurrentSituation =
      loadedCurrentSituation && profileStatusByCurrentSituation[loadedCurrentSituation] === status
        ? loadedCurrentSituation
        : currentSituationByProfileStatus[status];
    const requestBody: MemberProfileUpdateRequest = {
      nickname: nickname.trim(),
      dispatchedCountry: country.trim(),
      dispatchedRegion: region.trim(),
      currentSituation: nextCurrentSituation,
      dispatchedUniversity: dispatchedUniversity.trim(),
      domesticUniversity: homeUniversity.trim(),
      applicationDeadline: applicationDeadline ? toStorageDate(applicationDeadline) : null,
      departureDate: departureDate ? toStorageDate(departureDate) : null,
      dispatchStartDate: dispatchStartDate ? toStorageDate(dispatchStartDate) : null,
      returnDate: returnDate ? toStorageDate(returnDate) : null,
      dispatchSemester: dispatchSemester.trim(),
    };

    try {
      await updateMemberProfile(requestBody);
    } catch (error: any) {
      console.log('프로필 수정 실패:', error.response?.data || error.message);
      Alert.alert('저장 실패', '프로필 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    await Promise.all([
      AsyncStorage.setItem('nickname', nickname.trim()),
      AsyncStorage.setItem('university', homeUniversity.trim()),
      AsyncStorage.setItem('homeUniversity', homeUniversity.trim()),
      AsyncStorage.setItem('dispatchedCountry', country.trim()),
      AsyncStorage.setItem('dispatchedRegion', region.trim()),
      AsyncStorage.setItem('dispatchedUniversity', dispatchedUniversity.trim()),
      AsyncStorage.setItem('profileStatus', status),
      AsyncStorage.setItem('exchangeStatus', exchangeStatusByProfileStatus[status]),
      applicationDeadline
        ? AsyncStorage.setItem('applicationDeadline', toStorageDate(applicationDeadline))
        : AsyncStorage.removeItem('applicationDeadline'),
      departureDate
        ? AsyncStorage.setItem('departureDate', toStorageDate(departureDate))
        : AsyncStorage.removeItem('departureDate'),
      dispatchStartDate
        ? AsyncStorage.setItem('dispatchStartDate', toStorageDate(dispatchStartDate))
        : AsyncStorage.removeItem('dispatchStartDate'),
      returnDate
        ? AsyncStorage.setItem('returnDate', toStorageDate(returnDate))
        : AsyncStorage.removeItem('returnDate'),
      dispatchSemester.trim()
        ? AsyncStorage.setItem('dispatchSemester', dispatchSemester.trim())
        : AsyncStorage.removeItem('dispatchSemester'),
      avatarUri
        ? AsyncStorage.setItem('profileAvatarUri', avatarUri)
        : AsyncStorage.removeItem('profileAvatarUri'),
      AsyncStorage.removeItem('profileFieldOverrides'),
      departurePrepStartDateTask,
    ]);

    setInitialSnapshot(currentSnapshot);
    setLoadedCurrentSituation(nextCurrentSituation);

    Alert.alert('저장 완료', '프로필 정보가 저장되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />

        <Text style={styles.headerTitle}>프로필 수정</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: footerBottomOffset + 76 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileIntro}>
          <View style={styles.profileIntroText}>
            <Text style={styles.screenTitle}>프로필 편집하기</Text>
            <Text style={styles.screenDescription}>원하시는 프로필 정보를 편집할 수 있어요</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 변경"
            style={styles.avatarEditButton}
            onPress={() => setAvatarPickerVisible(true)}
          >
            <ProfileEditAvatarBackground width={80} height={80} />
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} /> : null}
            <ProfileEditAvatarActionIcon width={24} height={24} style={styles.avatarEditIcon} />
          </Pressable>
        </View>

        <ProfileTextField
          label="닉네임"
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임을 입력하세요"
          counter={`${nickname.length}/12`}
          error={nicknameError}
        />

        <ReadonlyNameField value={name} />

        <View style={styles.sectionDivider} />

        <ProfileSelectField
          label="소속 대학"
          value={homeUniversity}
          placeholder="소속 대학 선택"
          onPress={() => setUniversityPickerVisible(true)}
        />

        <CountryRegionFields
          country={country}
          region={region}
          customCountryMode={customCountryMode}
          onPress={() => setCountryPickerVisible(true)}
          onChangeCountry={setCountry}
          onChangeRegion={setRegion}
        />

        <ProfileSelectField
          label="파견교"
          value={dispatchedUniversity}
          placeholder="파견교 입력"
          editable
          onChangeText={setDispatchedUniversity}
        />

        <SemesterField
          value={dispatchSemester}
          onPress={() => {
            setSemesterYearPickerVisible((visible) => !visible);
            requestAnimationFrame(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            });
          }}
          onSelectTerm={selectSemesterTerm}
          yearOptions={semesterYearOptions}
          yearPickerVisible={semesterYearPickerVisible}
          onSelectYear={selectSemesterYear}
        />

        <View style={styles.statusField}>
          <Text style={styles.fieldLabel}>파견 상태</Text>
          <View style={styles.optionGrid}>
            {statusOptions.map((option) => {
              const selected = status === option;

              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.statusChip, selected && styles.statusChipSelected]}
                  onPress={() => setStatus(option)}
                  activeOpacity={0.84}
                >
                  <Text style={[styles.statusChipText, selected && styles.statusChipTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {status === '파견 중' ? (
          <>
            <DateField
              field="dispatchStartDate"
              label="파견 시작일"
              value={dispatchStartDate}
              openPart={openDateDropdown?.field === 'dispatchStartDate' ? openDateDropdown.part : null}
              onToggle={toggleDateDropdown}
              onSelect={selectDatePart}
            />
            <DateField
              field="returnDate"
              label="귀국일"
              value={returnDate}
              openPart={openDateDropdown?.field === 'returnDate' ? openDateDropdown.part : null}
              onToggle={toggleDateDropdown}
              onSelect={selectDatePart}
              optional
            />
          </>
        ) : (
          <DateField
            field={
              status === '지원 준비 중'
                ? 'applicationDeadline'
                : status === '출국 준비 중'
                  ? 'departureDate'
                  : 'returnDate'
            }
            label={dateLabels[status]}
            value={
              status === '지원 준비 중'
                ? applicationDeadline
                : status === '출국 준비 중'
                  ? departureDate
                  : returnDate
            }
            openPart={
              openDateDropdown?.field ===
              (status === '지원 준비 중'
                ? 'applicationDeadline'
                : status === '출국 준비 중'
                  ? 'departureDate'
                  : 'returnDate')
                ? openDateDropdown.part
                : null
            }
            onToggle={toggleDateDropdown}
            onSelect={selectDatePart}
            optional={status === '귀국'}
          />
        )}

      </ScrollView>

      <View style={[styles.footer, { bottom: footerBottomOffset, paddingBottom: 0 }]}>
        <TouchableOpacity
          style={[styles.footerButton, !canSave && styles.footerButtonDisabled]}
          onPress={saveProfile}
          activeOpacity={canSave ? 0.88 : 1}
          disabled={!canSave}
        >
          <Text style={[styles.footerButtonText, !canSave && styles.footerButtonTextDisabled]}>
            변동사항 저장하기
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={avatarPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <View style={styles.avatarPickerOverlay}>
          <Pressable style={styles.avatarPickerBackdrop} onPress={() => setAvatarPickerVisible(false)} />
          <View style={[styles.avatarPickerSheet, { paddingBottom: Math.max(insets.bottom, 12) + 14 }]}>
            <View style={styles.avatarPickerHandle} />
            <TouchableOpacity
              style={styles.avatarPickerOption}
              onPress={() => chooseAvatar('camera')}
              activeOpacity={0.72}
            >
              <AvatarCameraIcon width={20} height={18} />
              <Text style={styles.avatarPickerOptionText}>카메라로 촬영하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarPickerOption}
              onPress={() => chooseAvatar('library')}
              activeOpacity={0.72}
            >
              <AvatarLibraryIcon width={20} height={20} />
              <Text style={styles.avatarPickerOptionText}>앨범에서 이미지 선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <OnboardingSelectModal
        visible={universityPickerVisible}
        title="소속 대학 선택하기"
        options={universityOptions}
        selectedValue={homeUniversity}
        selectionMode="confirm"
        searchPlaceholder="학교명으로 찾아보세요"
        onClose={() => setUniversityPickerVisible(false)}
        onSelect={selectUniversity}
      />

      <OnboardingSelectModal
        visible={countryPickerVisible}
        title="파견 국가 선택하기"
        options={countryOptions}
        selectedValue={customCountryMode ? CUSTOM_COUNTRY_OPTION : country}
        selectionMode="confirm"
        searchPlaceholder="국가명으로 찾아보세요"
        onClose={() => setCountryPickerVisible(false)}
        onSelect={selectCountry}
      />
    </KeyboardAvoidingView>
  );
}

function ProfileTextField({
  label,
  value,
  onChangeText,
  placeholder,
  counter,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  counter?: string;
  error?: string;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.textInputWrap, error && styles.textInputWrapError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B1B8C1"
          maxLength={12}
          returnKeyType="done"
          style={styles.profileTextInput}
        />
        {counter ? <Text style={styles.textCounter}>{counter}</Text> : null}
      </View>
      {error ? <Text style={styles.nicknameError}>{error}</Text> : null}
    </View>
  );
}

function ReadonlyNameField({ value }: { value: string }) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>이름</Text>
      <View style={styles.readonlyInput}>
        <Text style={[styles.readonlyInputText, !value && styles.readonlyInputPlaceholder]}>
          {value || '이름'}
        </Text>
        <ProfileEditLockIcon width={24} height={24} />
      </View>
    </View>
  );
}

function ProfileSelectField({
  label,
  value,
  placeholder,
  onPress,
  editable = false,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress?: () => void;
  editable?: boolean;
  onChangeText?: (value: string) => void;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable ? (
        <View style={styles.selectInput}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#B1B8C1"
            style={styles.selectTextInput}
            returnKeyType="done"
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.selectInput} onPress={onPress} activeOpacity={0.84}>
          <Text style={[styles.selectInputText, !value && styles.selectInputPlaceholder]}>
            {value || placeholder}
          </Text>
          <DropdownArrowIcon width={16} height={16} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function CountryRegionFields({
  country,
  region,
  customCountryMode,
  onPress,
  onChangeCountry,
  onChangeRegion,
}: {
  country: string;
  region: string;
  customCountryMode: boolean;
  onPress: () => void;
  onChangeCountry: (value: string) => void;
  onChangeRegion: (value: string) => void;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>파견 국가 및 지역</Text>
      {customCountryMode ? (
        <View style={styles.selectInput}>
          <TextInput
            value={country}
            onChangeText={onChangeCountry}
            placeholder="파견 국가 입력"
            placeholderTextColor="#B1B8C1"
            style={styles.selectTextInput}
            returnKeyType="next"
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.selectInput} onPress={onPress} activeOpacity={0.84}>
          <Text style={[styles.selectInputText, !country && styles.selectInputPlaceholder]}>
            {country || '파견 국가 선택'}
          </Text>
          <DropdownArrowIcon width={16} height={16} />
        </TouchableOpacity>
      )}
      <View style={[styles.selectInput, styles.regionInput]}>
        <TextInput
          value={region}
          onChangeText={onChangeRegion}
          placeholder="파견 지역 입력"
          placeholderTextColor="#B1B8C1"
          style={styles.selectTextInput}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

function SemesterField({
  value,
  onPress,
  onSelectTerm,
  yearOptions,
  yearPickerVisible,
  onSelectYear,
}: {
  value: string;
  onPress: () => void;
  onSelectTerm: (term: (typeof dispatchSemesterTerms)[number]) => void;
  yearOptions: string[];
  yearPickerVisible: boolean;
  onSelectYear: (year: string) => void;
}) {
  const { year, term } = parseDispatchSemester(value);

  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>파견 학기</Text>
      <InlineDropdown
        value={year}
        placeholder="파견 년도 선택"
        open={yearPickerVisible}
        options={yearOptions}
        onPress={onPress}
        onSelect={onSelectYear}
        displayValue={year ? `${year}년` : ''}
      />
      <View style={styles.semesterChipRow}>
        {dispatchSemesterTerms.map((option) => {
          const selected = term === option;

          return (
            <TouchableOpacity
              key={option}
              style={[styles.semesterChip, selected && styles.semesterChipSelected]}
              onPress={() => onSelectTerm(option)}
              activeOpacity={0.84}
            >
              <Text style={[styles.semesterChipText, selected && styles.semesterChipTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function InlineDropdown({
  value,
  placeholder,
  open,
  options,
  onPress,
  onSelect,
  displayValue,
}: {
  value: string;
  placeholder: string;
  open: boolean;
  options: string[];
  onPress: () => void;
  onSelect: (value: string) => void;
  displayValue?: string;
}) {
  return (
    <View style={[styles.inlineDropdownAnchor, open && styles.inlineDropdownAnchorOpen]}>
      <TouchableOpacity style={styles.selectInput} onPress={onPress} activeOpacity={0.84}>
        <Text style={[styles.selectInputText, !value && styles.selectInputPlaceholder]}>
          {displayValue || value || placeholder}
        </Text>
        <DropdownArrowIcon width={16} height={16} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.inlineDropdownMenu}>
          <ScrollView
            style={styles.inlineDropdownScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
            nestedScrollEnabled
          >
            {options.map((option) => {
              const selected = option === value;

              return (
                <Pressable
                  key={option}
                  style={styles.inlineDropdownOption}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.inlineDropdownOptionText, selected && styles.inlineDropdownOptionTextSelected]}>
                    {option.endsWith('년') || option.endsWith('월') || option.endsWith('일')
                      ? option
                      : `${option}년`}
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

function DateField({
  field,
  label,
  value,
  openPart,
  onToggle,
  onSelect,
  optional = false,
}: {
  field: DateFieldKey;
  label: string;
  value: Date | null;
  openPart: DatePart | null;
  onToggle: (field: DateFieldKey, part: DatePart) => void;
  onSelect: (field: DateFieldKey, part: DatePart, value: string) => void;
  optional?: boolean;
}) {
  const referenceDate = value || new Date();
  const year = value ? String(value.getFullYear()) : '';
  const month = value ? String(value.getMonth() + 1).padStart(2, '0') : '';
  const day = value ? String(value.getDate()).padStart(2, '0') : '';
  const yearOptions = Array.from({ length: 12 }, (_, index) =>
    String(new Date().getFullYear() - 3 + index),
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  const dayOptions = Array.from(
    { length: new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate() },
    (_, index) => String(index + 1).padStart(2, '0'),
  );

  return (
    <View style={styles.dateField}>
      <View style={styles.dateLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.optionalText}>선택</Text>}
      </View>

      <View style={styles.dateSelectRow}>
        <CompactInlineDropdown
          value={year}
          placeholder="연도"
          suffix="년"
          open={openPart === 'year'}
          options={yearOptions}
          onPress={() => onToggle(field, 'year')}
          onSelect={(nextValue) => onSelect(field, 'year', nextValue)}
        />
        <CompactInlineDropdown
          value={month}
          placeholder="월"
          suffix="월"
          open={openPart === 'month'}
          options={monthOptions}
          onPress={() => onToggle(field, 'month')}
          onSelect={(nextValue) => onSelect(field, 'month', nextValue)}
        />
        <CompactInlineDropdown
          value={day}
          placeholder="일"
          suffix="일"
          open={openPart === 'day'}
          options={dayOptions}
          onPress={() => onToggle(field, 'day')}
          onSelect={(nextValue) => onSelect(field, 'day', nextValue)}
        />
      </View>
    </View>
  );
}

function CompactInlineDropdown({
  value,
  placeholder,
  suffix,
  open,
  options,
  onPress,
  onSelect,
}: {
  value: string;
  placeholder: string;
  suffix: string;
  open: boolean;
  options: string[];
  onPress: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={[styles.compactDropdownAnchor, open && styles.compactDropdownAnchorOpen]}>
      <TouchableOpacity style={styles.dateSelect} onPress={onPress} activeOpacity={0.84}>
        <Text style={[styles.dateSelectText, !value && styles.dateSelectPlaceholder]}>
          {value ? `${value}${suffix}` : placeholder}
        </Text>
        <DropdownArrowIcon width={16} height={16} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.compactDropdownMenu}>
          <ScrollView
            style={styles.inlineDropdownScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
            nestedScrollEnabled
          >
            {options.map((option) => (
              <Pressable key={option} style={styles.inlineDropdownOption} onPress={() => onSelect(option)}>
                <Text style={[styles.inlineDropdownOptionText, value === option && styles.inlineDropdownOptionTextSelected]}>
                  {option}{suffix}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE,
  },
  header: {
    height: 118,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: PAGE,
    position: 'relative',
  },
  iconBtn: {
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    top: 57,
    left: 0,
    right: 0,
    height: 34,
    lineHeight: 34,
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 146,
  },
  profileIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileIntroText: {
    flex: 1,
    paddingTop: 7,
  },
  screenTitle: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '900',
    color: INK,
  },
  screenDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: MUTED,
  },
  avatarEditButton: {
    width: 80,
    height: 80,
    marginLeft: 16,
    position: 'relative',
  },
  avatar: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  avatarPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  avatarPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  avatarPickerSheet: {
    minHeight: 168,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#F6F8FA',
    paddingHorizontal: 16,
    paddingTop: 26,
  },
  avatarPickerHandle: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 80,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D6DC',
  },
  avatarPickerOption: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarPickerOptionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#252C37',
  },
  profileField: {
    marginBottom: 22,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '900',
    color: '#64748B',
  },
  textInputWrap: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E4E9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputWrapError: {
    borderColor: '#FF4D4F',
  },
  profileTextInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 0,
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  textCounter: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '800',
    color: INK,
  },
  nicknameError: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#FF4D4F',
  },
  readonlyInput: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F0F2F6',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readonlyInputText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B1B8C1',
  },
  readonlyInputPlaceholder: {
    color: '#B1B8C1',
  },
  sectionDivider: {
    height: 8,
    marginHorizontal: -16,
    marginBottom: 22,
    backgroundColor: '#EEF1F4',
  },
  selectInput: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E4E9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  selectTextInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 0,
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  selectInputPlaceholder: {
    color: '#B1B8C1',
  },
  regionInput: {
    marginTop: 6,
  },
  semesterChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  inlineDropdownAnchor: {
    position: 'relative',
    zIndex: 1,
  },
  inlineDropdownAnchorOpen: {
    zIndex: 30,
  },
  inlineDropdownMenu: {
    position: 'absolute',
    top: 51,
    right: 0,
    left: 0,
    height: 206,
    borderWidth: 1,
    borderColor: '#E1E4E9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#141416',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  compactDropdownAnchor: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  compactDropdownAnchorOpen: {
    zIndex: 30,
  },
  compactDropdownMenu: {
    position: 'absolute',
    top: 51,
    right: 0,
    left: 0,
    height: 156,
    borderWidth: 1,
    borderColor: '#E1E4E9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#141416',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  inlineDropdownScroll: {
    flex: 1,
  },
  inlineDropdownOption: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  inlineDropdownOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  inlineDropdownOptionTextSelected: {
    fontWeight: '900',
    color: '#006BFF',
  },
  semesterChip: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semesterChipSelected: {
    backgroundColor: '#191F28',
  },
  semesterChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B95A1',
  },
  semesterChipTextSelected: {
    color: '#FFFFFF',
  },
  statusField: {
    marginBottom: 22,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  dateField: {
    marginBottom: 22,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalText: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '800',
    color: MUTED,
  },
  dateSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dateSelect: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E4E9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectText: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  dateSelectPlaceholder: {
    color: '#B1B8C1',
  },
  statusChip: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipSelected: {
    backgroundColor: '#191F28',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B95A1',
  },
  statusChipTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: PAGE,
  },
  footerButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#191F28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonDisabled: {
    backgroundColor: '#B1B8C1',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footerButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
