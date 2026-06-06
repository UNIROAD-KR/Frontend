import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
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
import { AppBackButton } from '@/components/ui/app-back-button';
import { getMemberMe } from '../../../src/api/auth';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

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
  const [name, setName] = useState('서현');
  const [nickname, setNickname] = useState('교환학생꿈나무');
  const [homeUniversity, setHomeUniversity] = useState('서울대학교');
  const [country, setCountry] = useState('독일');
  const [status, setStatus] = useState('출국 준비 중');
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [dispatchStartDate, setDispatchStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(createDate(2026, 8, 21));
  const [activeDateField, setActiveDateField] = useState<DateFieldKey>('departureDate');

  useEffect(() => {
    const loadProfile = async () => {
      const [
        savedAvatar,
        savedNickname,
        savedUniversity,
        savedCountry,
        savedStatus,
        savedApplicationDeadline,
        savedDepartureDate,
        savedDispatchStartDate,
        savedReturnDate,
      ] = await Promise.all([
        AsyncStorage.getItem('profileAvatarUri'),
        AsyncStorage.getItem('nickname'),
        AsyncStorage.getItem('university'),
        AsyncStorage.getItem('dispatchedCountry'),
        AsyncStorage.getItem('profileStatus'),
        AsyncStorage.getItem('applicationDeadline'),
        AsyncStorage.getItem('departureDate'),
        AsyncStorage.getItem('dispatchStartDate'),
        AsyncStorage.getItem('returnDate'),
      ]);

      if (savedAvatar) setAvatarUri(savedAvatar);
      if (savedNickname) setNickname(savedNickname);
      if (savedUniversity) setHomeUniversity(savedUniversity);
      if (savedCountry) setCountry(savedCountry);
      if (savedStatus && statusOptions.includes(savedStatus)) setStatus(savedStatus);
      setApplicationDeadline(toDateValue(savedApplicationDeadline));
      setDepartureDate(toDateValue(savedDepartureDate));
      setDispatchStartDate(toDateValue(savedDispatchStartDate));
      setReturnDate(toDateValue(savedReturnDate));

      try {
        const memberRes = await getMemberMe();
        const memberName = memberRes.data?.data?.name;
        if (memberName) setName(memberName);
      } catch (error) {
        console.log('내 정보 조회 실패:', error);
      }
    };

    loadProfile();
  }, []);

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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '프로필 이미지를 변경하려면 사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
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
      AsyncStorage.setItem('nickname', nickname.trim() || '교환학생꿈나무'),
      AsyncStorage.setItem('university', homeUniversity.trim() || '서울대학교'),
      AsyncStorage.setItem('dispatchedCountry', country.trim() || '독일'),
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
        <AppBackButton style={styles.iconBtn} />

        <Text style={styles.headerTitle}>프로필 수정</Text>

        <View style={styles.headerSpacer} />
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
              <Ionicons name="person" size={44} color={INK} />
            )}
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={pickImage} activeOpacity={0.86}>
            <Ionicons name="camera-outline" size={18} color={BLUE} />
            <Text style={styles.imageButtonText}>프로필 이미지 변경</Text>
          </TouchableOpacity>

          <View style={styles.profileNameField}>
            <DisabledField label="이름" value={name} />
          </View>
        </View>

        <FormSection title="프로필 정보">
          <Field
            label="닉네임"
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
          />
          <Field
            label="학교"
            value={homeUniversity}
            onChangeText={setHomeUniversity}
            placeholder="학교를 입력하세요"
          />
          <Field
            label="파견 국가"
            value={country}
            onChangeText={setCountry}
            placeholder="파견 국가를 입력하세요"
          />
        </FormSection>

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
        <TouchableOpacity style={styles.footerButton} onPress={saveProfile} activeOpacity={0.88}>
          <Text style={styles.footerButtonText}>변경사항 저장</Text>
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function DisabledField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, styles.disabledInput]}
        value={value}
        editable={false}
        selectTextOnFocus={false}
        showSoftInputOnFocus={false}
      />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A4ADBA"
      />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
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
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 150,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarFrame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LINE,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: '#F4F8FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  imageButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: BLUE,
  },
  profileNameField: {
    alignSelf: 'stretch',
    marginTop: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    padding: 16,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#E7EDF6',
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  disabledInput: {
    backgroundColor: '#FFFFFF',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  dateField: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 16,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalText: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  dateButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#E7EDF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 9,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  datePlaceholderText: {
    fontWeight: '800',
    color: '#A4ADBA',
  },
  statusChip: {
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: '#E7EDF6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  statusChipSelected: {
    backgroundColor: '#123F9F',
    borderColor: '#123F9F',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '900',
    color: MUTED,
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
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  footerButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#123F9F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '800',
    color: MUTED,
  },
  sheetDoneText: {
    fontSize: 15,
    fontWeight: '900',
    color: BLUE,
  },
  sheetDatePicker: {
    alignSelf: 'stretch',
    height: 216,
    backgroundColor: '#FFFFFF',
  },
});
