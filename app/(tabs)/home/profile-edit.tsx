import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { getMemberMe } from '../../../src/api/auth';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const SOFT = '#F6F8FC';
const CARD = '#FFFFFF';
const PAGE = '#F4F5F7';

const statusOptions = ['지원 준비 중', '출국 준비 중', '파견 중'];
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
type DateFieldKey = 'applicationDeadline' | 'departureDate' | 'dispatchStartDate' | 'returnDate';
type EditSnapshot = {
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

export default function ProfileEditScreen() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(createDate(2026, 8, 21));
  const [activeDateField, setActiveDateField] = useState<DateFieldKey>('departureDate');
  const [initialSnapshot, setInitialSnapshot] = useState<EditSnapshot | null>(null);

  const currentSnapshot: EditSnapshot = {
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
  };

  const hasChanges =
    !!initialSnapshot &&
    Object.keys(currentSnapshot).some((key) => {
      const snapshotKey = key as keyof EditSnapshot;
      return currentSnapshot[snapshotKey] !== initialSnapshot[snapshotKey];
    });

  const openFieldEdit = (
    field: 'nickname' | 'homeUniversity' | 'country' | 'dispatchedUniversity',
    value: string,
  ) => {
    router.push({
      pathname: '/(tabs)/home/profile-field-edit',
      params: { field, value, region },
    } as any);
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
        AsyncStorage.getItem('profileFieldOverrides'),
      ]);

      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

      const nextAvatar = savedAvatar || null;
      let nextName = '';
      let nextEmail = '';
      let nextNickname = savedNickname || '';
      let nextHomeUniversity = savedHomeUniversity || savedUniversity || '';
      let nextDispatchedUniversity = savedDispatchedUniversity || '';
      let nextCountry = savedCountry || '';
      let nextRegion = savedRegion || '';
      const nextStatus =
        savedStatus && statusOptions.includes(savedStatus) ? savedStatus : statusOptions[1];
      const nextApplicationDeadline = toDateValue(savedApplicationDeadline);
      const nextDepartureDate = toDateValue(savedDepartureDate);
      const nextDispatchStartDate = toDateValue(savedDispatchStartDate);
      const nextReturnDate = toDateValue(savedReturnDate);

      try {
        const memberRes = await getMemberMe();
        const member = memberRes.data?.data;

        if (member?.name) nextName = member.name;
        if (member?.email) nextEmail = member.email;
        if (member?.nickname && !overrides.nickname) nextNickname = member.nickname;
        if ((member?.homeUniversity || member?.domesticUniversity) && !overrides.homeUniversity) {
          nextHomeUniversity = member.homeUniversity || member.domesticUniversity || '';
        }
        if (member?.dispatchedCountry && !overrides.country) nextCountry = member.dispatchedCountry;
        if (member?.dispatchedRegion && !overrides.region) nextRegion = member.dispatchedRegion;
        if (member?.dispatchedUniversity && !overrides.dispatchedUniversity) {
          nextDispatchedUniversity = member.dispatchedUniversity;
        }
      } catch (error) {
        console.log('내 정보 조회 실패:', error);
      }

      setAvatarUri(nextAvatar);
      setName(nextName);
      setEmail(nextEmail);
      setNickname(nextNickname);
      setHomeUniversity(nextHomeUniversity);
      setDispatchedUniversity(nextDispatchedUniversity);
      setCountry(nextCountry);
      setRegion(nextRegion);
      setStatus(nextStatus);
      setApplicationDeadline(nextApplicationDeadline);
      setDepartureDate(nextDepartureDate);
      setDispatchStartDate(nextDispatchStartDate);
      setReturnDate(nextReturnDate);
      const loadedSnapshot = {
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
      };

      setInitialSnapshot((prev) => prev ?? loadedSnapshot);
    };

    loadProfile();
    }, []),
  );

  const setActiveDate = (date: Date) => {
    if (activeDateField === 'applicationDeadline') {
      setApplicationDeadline(date);
      return;
    }

    if (activeDateField === 'departureDate') {
      setDepartureDate(date);
      return;
    }

    if (activeDateField === 'dispatchStartDate') {
      setDispatchStartDate(date);
      return;
    }

    setReturnDate(date);
  };

  const getFallbackDate = () => {
    if (activeDateField === 'applicationDeadline') return createDate(2026, 3, 18);
    if (activeDateField === 'departureDate') return createDate(2026, 8, 21);
    if (activeDateField === 'dispatchStartDate') return createDate(2026, 9, 1);
    return createDate(2027, 1, 15);
  };

  const getDateByField = (field: DateFieldKey) => {
    if (field === 'applicationDeadline') return applicationDeadline;
    if (field === 'departureDate') return departureDate;
    if (field === 'dispatchStartDate') return dispatchStartDate;
    return returnDate;
  };

  const getDateLabelByField = (field: DateFieldKey) => {
    if (field === 'applicationDeadline') return '지원 마감일';
    if (field === 'departureDate') return '출국일';
    if (field === 'dispatchStartDate') return '파견 시작일';
    return '귀국일';
  };

  const openDatePicker = (field: DateFieldKey) => {
    setActiveDateField(field);
    setDraftDate(getDateByField(field) || getFallbackDate());
    setShowPicker(true);
  };

  const completeDatePicker = () => {
    setActiveDate(draftDate);
    setShowPicker(false);
  };

  const saveProfile = async () => {
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
      avatarUri
        ? AsyncStorage.setItem('profileAvatarUri', avatarUri)
        : AsyncStorage.removeItem('profileAvatarUri'),
      departurePrepStartDateTask,
    ]);

    setInitialSnapshot(currentSnapshot);

    Alert.alert('저장 완료', '프로필 정보가 저장되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>프로필 수정</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarFrame}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={24} color={INK} />
            )}
          </View>
        </View>

        <InfoSection title="기본 정보">
          <EditableInfoRow
            label="닉네임"
            value={nickname}
            placeholder="미설정"
            onPress={() => openFieldEdit('nickname', nickname)}
            withDivider
          />
          <ReadonlyInfoRow label="이름" value={name} withDivider />
          <ReadonlyInfoRow label="이메일" value={email} />
        </InfoSection>

        <InfoSection title="학교 정보">
          <EditableInfoRow
            label="소속 대학"
            value={homeUniversity}
            placeholder="미설정"
            onPress={() => openFieldEdit('homeUniversity', homeUniversity)}
            withDivider
          />
          <EditableInfoRow
            label="파견 국가 및 지역"
            value={[country, region].filter(Boolean).join(' ')}
            placeholder="미설정"
            onPress={() => openFieldEdit('country', country)}
            withDivider
          />
          <EditableInfoRow
            label="파견교"
            value={dispatchedUniversity}
            placeholder="미정"
            onPress={() => openFieldEdit('dispatchedUniversity', dispatchedUniversity)}
          />
        </InfoSection>

        <FormSection title="파견 상태">
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

          {status === '파견 중' ? (
            <>
              <DateField
                field="dispatchStartDate"
                label="파견 시작일"
                value={dispatchStartDate}
                onPress={openDatePicker}
              />
              <DateField
                field="returnDate"
                label="귀국일"
                value={returnDate}
                onPress={openDatePicker}
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
              onPress={openDatePicker}
              optional={status === '귀국'}
            />
          )}
        </FormSection>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, !hasChanges && styles.footerButtonDisabled]}
          onPress={saveProfile}
          activeOpacity={hasChanges ? 0.88 : 1}
          disabled={!hasChanges}
        >
          <Text style={[styles.footerButtonText, !hasChanges && styles.footerButtonTextDisabled]}>
            변경사항 저장
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)} activeOpacity={0.8}>
                <Text style={styles.sheetCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{getDateLabelByField(activeDateField)}</Text>
              <TouchableOpacity onPress={completeDatePicker} activeOpacity={0.8}>
                <Text style={styles.sheetDoneText}>완료</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={draftDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="light"
              textColor={INK}
              accentColor={BLUE}
              onChange={(_, selectedDate) => {
                if (!selectedDate) {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  return;
                }

                if (Platform.OS === 'ios') {
                  setDraftDate(selectedDate);
                  return;
                }

                setActiveDate(selectedDate);
                setShowPicker(false);
              }}
              style={styles.sheetDatePicker}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionBody}>{children}</View>
      </View>
    </View>
  );
}

function ReadonlyInfoRow({
  label,
  value,
  withDivider = false,
}: {
  label: string;
  value: string;
  withDivider?: boolean;
}) {
  return (
    <View style={[styles.infoRow, withDivider && styles.infoRowDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value || '-'}
      </Text>
    </View>
  );
}

function EditableInfoRow({
  label,
  value,
  placeholder,
  onPress,
  withDivider = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  withDivider?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.infoRow, withDivider && styles.infoRowDivider]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, !value.trim() && styles.infoPlaceholder]}
        numberOfLines={1}
      >
        {value.trim() || placeholder}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#A4ADBA" />
    </TouchableOpacity>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.sectionBody, styles.formSectionBody]}>{children}</View>
      </View>
    </View>
  );
}

function DateField({
  field,
  label,
  value,
  onPress,
  optional = false,
}: {
  field: DateFieldKey;
  label: string;
  value: Date | null;
  onPress: (field: DateFieldKey) => void;
  optional?: boolean;
}) {
  return (
    <View style={styles.dateField}>
      <View style={styles.dateLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.optionalText}>선택</Text>}
      </View>

      <TouchableOpacity style={styles.dateButton} onPress={() => onPress(field)} activeOpacity={0.84}>
        <Ionicons name="calendar-outline" size={18} color={BLUE} />
        <Text style={[styles.dateButtonText, !value && styles.datePlaceholderText]}>
          {value ? formatDate(value) : getDateFieldPlaceholder(field)}
        </Text>
        <Ionicons name="chevron-forward" size={17} color="#A4ADBA" />
      </TouchableOpacity>
    </View>
  );
}

function getDateFieldPlaceholder(field: DateFieldKey) {
  if (field === 'applicationDeadline') return '지원 마감일 선택';
  if (field === 'departureDate') return '출국일 선택';
  if (field === 'dispatchStartDate') return '파견 시작일 선택';
  return '귀국일 선택';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 17,
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 150,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarFrame: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionCard: {
    borderRadius: 12,
    backgroundColor: CARD,
    overflow: 'hidden',
  },
  sectionBody: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 6,
  },
  formSectionBody: {
    paddingBottom: 15,
  },
  infoRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },
  infoLabel: {
    flex: 0.85,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  infoValue: {
    flex: 1.25,
    fontSize: 14,
    fontWeight: '700',
    color: '#7A828E',
    textAlign: 'right',
  },
  infoPlaceholder: {
    color: '#A4ADBA',
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  disabledInput: {
    backgroundColor: '#FFFFFF',
    color: INK,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  dateField: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E6EC',
    paddingTop: 12,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalText: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '800',
    color: MUTED,
  },
  dateButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: PAGE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  datePlaceholderText: {
    fontWeight: '700',
    color: '#A4ADBA',
  },
  statusChip: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: PAGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusChipSelected: {
    backgroundColor: '#123F9F',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A4ADBA',
  },
  statusChipTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: 'rgba(244,245,247,0.96)',
  },
  footerButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#123F9F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonDisabled: {
    backgroundColor: '#D8DEE8',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footerButtonTextDisabled: {
    color: '#8B95A1',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,32,66,0.28)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
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
  sheetDatePicker: {
    alignSelf: 'stretch',
    height: 216,
    backgroundColor: '#FFFFFF',
  },
});
