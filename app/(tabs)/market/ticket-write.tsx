import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import {
  createTicket,
  TicketTransferRequest,
  TicketType,
} from '../../../src/api/ticket';
import { canUseMarketWithoutVerification } from '../../../src/utils/verification';

const NAVY = '#0F2042';
const BLUE = '#123F9F';
const INPUT_BORDER = '#D7D7D7';
const DRAFT_KEY = 'univ:market:ticket-write-draft';

const ticketTypes: { label: string; value: TicketType }[] = [
  { label: '관광 티켓', value: 'TOUR' },
  { label: '콘서트 / 공연', value: 'CONCERT' },
  { label: '기차', value: 'TRAIN' },
  { label: '항공권', value: 'FLIGHT' },
  { label: '숙박', value: 'ACCOMMODATION' },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatTime = (date: Date) => {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${hour}:${minute}`;
};

const parseMoney = (value: string) => {
  const number = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(number) ? number : 0;
};

export default function TicketWriteScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<TicketType>('TOUR');
  const [dateValue, setDateValue] = useState(new Date());
  const [timeValue, setTimeValue] = useState(new Date());
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transferPrice, setTransferPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const canUseMarket = await canUseMarketWithoutVerification();

        if (!canUseMarket) {
          setVerificationModalVisible(true);
        }
      } catch (error: any) {
        console.log('티켓 작성 인증 상태 조회 실패:', error.response?.data || error.message);
        setVerificationModalVisible(true);
      }
    };

    checkVerification();
  }, []);

  const stepOneValid = useMemo(
    () => Boolean(eventDate && eventTime && location.trim() && parseMoney(transferPrice) > 0),
    [eventDate, eventTime, location, transferPrice],
  );

  const stepTwoValid = useMemo(
    () => Boolean(title.trim() && content.trim()),
    [title, content],
  );

  const handleDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS !== 'ios') {
      setDatePickerVisible(false);
    }

    if (!selectedDate) {
      return;
    }

    setDateValue(selectedDate);
    setEventDate(formatDate(selectedDate));
  };

  const handleTimeChange = (
    _event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    if (Platform.OS !== 'ios') {
      setTimePickerVisible(false);
    }

    if (!selectedTime) {
      return;
    }

    setTimeValue(selectedTime);
    setEventTime(formatTime(selectedTime));
  };

  const saveDraft = async () => {
    await AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        selectedType,
        eventDate,
        eventTime,
        location,
        quantity,
        transferPrice,
        originalPrice,
        title,
        content,
      }),
    );
    Alert.alert('임시저장 완료', '작성 중인 티켓 양도글을 저장했어요.');
  };

  const goNext = () => {
    if (!stepOneValid) {
      Alert.alert('입력 필요', '티켓 정보와 양도 가격을 입력해주세요.');
      return;
    }

    setStep(2);
  };

  const uploadTicket = async () => {
    if (!stepTwoValid) {
      Alert.alert('입력 필요', '제목과 상세 설명을 입력해주세요.');
      return;
    }

    const payload: TicketTransferRequest = {
      ticketType: selectedType,
      title: title.trim(),
      content: content.trim(),
      eventDate,
      eventTime,
      location: location.trim(),
      quantity,
      transferPrice: parseMoney(transferPrice),
      originalPrice: originalPrice.trim()
        ? parseMoney(originalPrice)
        : undefined,
    };

    setSubmitting(true);

    try {
      await createTicket(payload);
      await AsyncStorage.removeItem(DRAFT_KEY);
      Alert.alert('업로드 완료', '티켓 양도글이 등록되었습니다.', [
        {
          text: '확인',
          onPress: () =>
            router.replace({
              pathname: '/(tabs)/market',
              params: { tab: 'ticket' },
            } as any),
        },
      ]);
    } catch (error: any) {
      console.log('티켓 양도글 등록 실패:', error.response?.data || error.message);
      Alert.alert(
        '업로드 실패',
        error.response?.data?.message || '티켓 양도글 등록에 실패했어요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusSpacer} />

      <View style={styles.header}>
        <AppBackButton
          style={styles.backButton}
          onPress={step === 2 ? () => setStep(1) : undefined}
        />
        <Text style={styles.headerTitle}>티켓 양도하기</Text>
        <Pressable style={styles.draftButton} onPress={saveDraft}>
          <Text style={styles.draftText}>임시저장</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            <>
              <Text style={styles.sectionTitle}>티켓 종류</Text>
              <View style={styles.typeGrid}>
                {ticketTypes.map((item) => {
                  const active = selectedType === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      style={[styles.typeChip, active && styles.typeChipActive]}
                      onPress={() => setSelectedType(item.value)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          active && styles.typeChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <DividerTitle title="티켓 정보" />

              <View style={styles.twoColumnRow}>
                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>날짜</Text>
                  <Pressable
                    style={styles.selectInput}
                    onPress={() => setDatePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !eventDate && styles.placeholderText,
                      ]}
                    >
                      {eventDate || '연도-월-일'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#B8B8B8" />
                  </Pressable>
                </View>

                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>시간</Text>
                  <Pressable
                    style={styles.selectInput}
                    onPress={() => setTimePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !eventTime && styles.placeholderText,
                      ]}
                    >
                      {eventTime || '선택'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#B8B8B8" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>장소</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="입력"
                    placeholderTextColor="#9B9B9B"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>

                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>양도 매수</Text>
                  <View style={styles.quantityBox}>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    >
                      <Text style={styles.quantitySymbol}>−</Text>
                    </Pressable>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() => setQuantity((prev) => prev + 1)}
                    >
                      <Text style={styles.quantitySymbol}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <DividerTitle title="가격" />

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>양도 가격</Text>
                <TextInput
                  style={styles.fullInput}
                  placeholder="€ 양도 가격"
                  placeholderTextColor="#9B9B9B"
                  keyboardType="numeric"
                  value={transferPrice}
                  onChangeText={setTransferPrice}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>원가 (선택)</Text>
                <TextInput
                  style={styles.fullInput}
                  placeholder="€ 구매 당시 원가"
                  placeholderTextColor="#9B9B9B"
                  keyboardType="numeric"
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldBlock}>
                <Text style={styles.sectionTitle}>제목</Text>
                <TextInput
                  style={styles.fullInput}
                  placeholder="제목을 입력해주세요."
                  placeholderTextColor="#8E8E8E"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.descriptionBlock}>
                <Text style={styles.sectionTitle}>상세 설명</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="양도 이유, 거래 방식 등 자유롭게 적어주세요"
                  placeholderTextColor="#8E8E8E"
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                  multiline
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step === 1 ? (
            <Pressable
              style={[
                styles.primaryButton,
                !stepOneValid && styles.primaryButtonDisabled,
              ]}
              onPress={goNext}
            >
              <Text style={styles.primaryButtonText}>다음 (1/2)</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.primaryButton,
                (!stepTwoValid || submitting) && styles.primaryButtonDisabled,
              ]}
              onPress={uploadTicket}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? '업로드 중...' : '업로드 하기'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {datePickerVisible && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {timePickerVisible && (
        <DateTimePicker
          value={timeValue}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      <Modal transparent visible={verificationModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModal}>
            <Text style={styles.verifyTitle}>교환학생 인증</Text>
            <Text style={styles.verifyDesc}>
              글을 작성하려면 교환학생 신원{'\n'}인증이 필요해요.
            </Text>

            <View style={styles.verifyButtonRow}>
              <Pressable
                style={styles.verifyCancelButton}
                onPress={() => {
                  setVerificationModalVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.verifyCancelText}>취소</Text>
              </Pressable>

              <Pressable
                style={styles.verifyButton}
                onPress={() => {
                  setVerificationModalVisible(false);
                  router.push('/verification' as any);
                }}
              >
                <Text style={styles.verifyButtonText}>신원 인증하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DividerTitle({ title }: { title: string }) {
  return (
    <View style={styles.dividerTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusSpacer: {
    height: 52,
  },
  header: {
    height: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
  },
  headerTitle: {
    position: 'absolute',
    left: 80,
    right: 80,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
  },
  draftButton: {
    minWidth: 64,
    height: 38,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  draftText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B8B8B8',
  },
  keyboardWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 110,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  typeGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    width: '47%',
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: {
    backgroundColor: '#EAF1FF',
    borderWidth: 1,
    borderColor: '#C9DAFF',
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#555555',
  },
  typeChipTextActive: {
    color: NAVY,
  },
  dividerTitleRow: {
    marginTop: 58,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8D8D8',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  columnField: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 9,
  },
  selectInput: {
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },
  placeholderText: {
    color: '#9B9B9B',
  },
  textInput: {
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  fullInput: {
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  quantityBox: {
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  quantityButton: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantitySymbol: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '800',
    color: '#111111',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#555555',
  },
  descriptionBlock: {
    marginTop: 36,
  },
  descriptionInput: {
    marginTop: 16,
    minHeight: 220,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 13,
    paddingTop: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#111111',
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 26,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    height: 58,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyModal: {
    width: 290,
    borderRadius: 12,
    backgroundColor: 'rgba(40,40,40,0.88)',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },
  verifyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verifyDesc: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifyButtonRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 14,
  },
  verifyCancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#8A8A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCancelText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verifyButton: {
    flex: 1.28,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },
});
