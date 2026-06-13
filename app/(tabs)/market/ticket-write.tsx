import { router } from 'expo-router';
import { type RefObject, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

const BLUE = '#102BE0';
const TIME_ITEM_HEIGHT = 36;
const TIME_WHEEL_HEIGHT = 180;
const TIME_WHEEL_BOX_HEIGHT = 206;
const calendarWeekDays = ['일', '월', '화', '수', '목', '금', '토'];

const ticketTypeOptions: { label: string; value: TicketType }[] = [
  { label: '관광 티켓', value: 'TOUR' },
  { label: '콘서트 / 공연', value: 'CONCERT' },
  { label: '기차', value: 'TRAIN' },
  { label: '항공권', value: 'FLIGHT' },
  { label: '숙박', value: 'ACCOMMODATION' },
];

const ticketFieldLabels: Record<
  TicketType,
  { date: string; time: string; location: string }
> = {
  TOUR: {
    date: '이용일',
    time: '시간',
    location: '장소',
  },
  CONCERT: {
    date: '공연일',
    time: '공연 시간',
    location: '공연 장소',
  },
  TRAIN: {
    date: '출발일',
    time: '출발 시간',
    location: '장소(역명)',
  },
  FLIGHT: {
    date: '출발일',
    time: '출발 시간',
    location: '장소(공항명)',
  },
  ACCOMMODATION: {
    date: '체크인 날짜',
    time: '',
    location: '장소',
  },
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const hourOptions = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const minuteOptions = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, '0'),
);
const countryOptions = [
  '독일',
  '프랑스',
  '스페인',
  '체코',
  '이탈리아',
  '네덜란드',
  '일본',
  '기타',
];

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const parseDateValue = (value: string) => {
  if (!value) return new Date();

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export default function TicketWritePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [ticketType, setTicketType] = useState<TicketType | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transferPrice, setTransferPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [dateTarget, setDateTarget] = useState<'event' | 'checkin' | 'checkout'>(
    'event',
  );
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [submitting, setSubmitting] = useState(false);
  const hourWheelRef = useRef<ScrollView>(null);
  const minuteWheelRef = useRef<ScrollView>(null);
  const hourSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minuteSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isAccommodation = ticketType === 'ACCOMMODATION';
  const fieldLabels = ticketType
    ? ticketFieldLabels[ticketType]
    : ticketFieldLabels.TOUR;

  const canGoNext = useMemo(
    () =>
      Boolean(
        ticketType &&
          eventDate &&
          (isAccommodation ? checkoutDate : eventTime) &&
          country &&
          location.trim() &&
          transferPrice &&
          originalPrice &&
          Number(transferPrice) > 0 &&
          Number(originalPrice) > 0,
      ),
    [
      eventDate,
      eventTime,
      checkoutDate,
      isAccommodation,
      country,
      location,
      originalPrice,
      ticketType,
      transferPrice,
    ],
  );

  const canSubmit = Boolean(title.trim() && content.trim() && !submitting);

  const openPicker = (
    mode: 'date' | 'time',
    target: 'event' | 'checkin' | 'checkout' = 'event',
  ) => {
    setPickerMode(mode);

    if (mode === 'date') {
      setDateTarget(target);
      const currentValue = target === 'checkout' ? checkoutDate : eventDate;
      const selectedDate = parseDateValue(currentValue || eventDate);
      setCalendarMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
      return;
    }

    const [hour = '00', minute = '00'] = eventTime.split(':');
    const nextHour = hour.padStart(2, '0');
    const nextMinute = minute.padStart(2, '0');

    setSelectedHour(nextHour);
    setSelectedMinute(nextMinute);

    setTimeout(() => {
      hourWheelRef.current?.scrollTo({
        y: hourOptions.indexOf(nextHour) * TIME_ITEM_HEIGHT,
        animated: false,
      });
      minuteWheelRef.current?.scrollTo({
        y: minuteOptions.indexOf(nextMinute) * TIME_ITEM_HEIGHT,
        animated: false,
      });
    }, 80);
  };

  const closePicker = () => {
    if (hourSnapTimerRef.current) {
      clearTimeout(hourSnapTimerRef.current);
      hourSnapTimerRef.current = null;
    }
    if (minuteSnapTimerRef.current) {
      clearTimeout(minuteSnapTimerRef.current);
      minuteSnapTimerRef.current = null;
    }

    setPickerMode(null);
  };

  const handleConfirmPicker = () => {
    if (pickerMode === 'time') {
      setEventTime(`${selectedHour}:${selectedMinute}`);
    }

    closePicker();
  };

  const snapTimeWheelToNearest = (
    offsetY: number,
    options: string[],
    onSelect: (value: string) => void,
    wheelRef: RefObject<ScrollView | null>,
    animated = true,
  ) => {
    const rawIndex = Math.round(offsetY / TIME_ITEM_HEIGHT);
    const nextIndex = Math.max(0, Math.min(options.length - 1, rawIndex));

    onSelect(options[nextIndex]);
    wheelRef.current?.scrollTo({
      y: nextIndex * TIME_ITEM_HEIGHT,
      animated,
    });
  };

  const handleTimeWheelDragEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    options: string[],
    onSelect: (value: string) => void,
    wheelRef: RefObject<ScrollView | null>,
    timerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      snapTimeWheelToNearest(offsetY, options, onSelect, wheelRef);
      timerRef.current = null;
    }, 120);
  };

  const handleTimeWheelMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    options: string[],
    onSelect: (value: string) => void,
    wheelRef: RefObject<ScrollView | null>,
    timerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    snapTimeWheelToNearest(offsetY, options, onSelect, wheelRef);
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [calendarMonth]);

  const moveCalendarMonth = (amount: number) => {
    setCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1),
    );
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    const nextDate = formatDate(selectedDate);

    if (dateTarget === 'checkout') {
      if (eventDate && parseDateValue(nextDate) <= parseDateValue(eventDate)) {
        Alert.alert('날짜 선택', '체크아웃 날짜는 체크인 날짜보다 이전일 수 없어요.');
        return;
      }

      setCheckoutDate(nextDate);
      return;
    }

    setEventDate(nextDate);

    if (
      isAccommodation &&
      checkoutDate &&
      parseDateValue(checkoutDate) <= parseDateValue(nextDate)
    ) {
      setCheckoutDate('');
    }
  };

  const handleSubmit = async () => {
    if (!ticketType || !canSubmit || !canGoNext) return;

    const submitEventDate = isAccommodation
      ? `${eventDate}~${checkoutDate}`
      : eventDate;

    const payload: TicketTransferRequest = {
      ticketType,
      title: title.trim(),
      content: content.trim(),
      eventDate: submitEventDate,
      eventTime: isAccommodation ? '00:00' : eventTime,
      country,
      location: location.trim(),
      quantity,
      transferPrice: Number(transferPrice),
      originalPrice: Number(originalPrice),
    };

    try {
      setSubmitting(true);
      const response = await createTicket(payload);
      const ticketId = response.data.data;

      if (ticketId) {
        router.replace({
          pathname: '/market/ticket-preview',
          params: { id: String(ticketId) },
        } as any);
        return;
      }

      router.replace({
        pathname: '/market',
        params: { tab: 'ticket', refresh: String(Date.now()) },
      } as any);
    } catch (error: any) {
      console.log('티켓 양도 글 작성 실패:', error.response?.data || error.message);
      Alert.alert(
        '업로드 실패',
        error.response?.data?.message ?? '티켓 양도 글을 등록하지 못했어요.',
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppBackButton />
          <Text style={styles.headerTitle}>티켓양도하기</Text>
          <Text style={styles.tempSave}>임시저장</Text>
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.sectionLabel}>티켓 종류</Text>
            <View style={styles.typeGrid}>
              {ticketTypeOptions.map((option) => {
                const active = ticketType === option.value;

                return (
                  <Pressable
                    key={option.value}
                    style={[styles.typeButton, active && styles.typeButtonActive]}
                    onPress={() => setTicketType(option.value)}
                  >
                    <Text
                      style={[styles.typeText, active && styles.typeTextActive]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>티켓 정보</Text>
              <View style={styles.sectionLine} />
            </View>

            {isAccommodation && (
              <View style={styles.twoColumnRow}>
                <View style={styles.halfGroup}>
                  <Text style={styles.inputLabel}>체크인 날짜</Text>
                  <Pressable
                    style={styles.selectInput}
                    onPress={() => openPicker('date', 'checkin')}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        eventDate && styles.selectTextActive,
                      ]}
                    >
                      {eventDate || '연도-월-일'}
                    </Text>
                    <Text style={styles.chevron}>⌄</Text>
                  </Pressable>
                </View>

                <View style={styles.halfGroup}>
                  <Text style={styles.inputLabel}>체크아웃 날짜</Text>
                  <Pressable
                    style={styles.selectInput}
                    onPress={() => openPicker('date', 'checkout')}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        checkoutDate && styles.selectTextActive,
                      ]}
                    >
                      {checkoutDate || '연도-월-일'}
                    </Text>
                    <Text style={styles.chevron}>⌄</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {!isAccommodation && (
              <View style={styles.twoColumnRow}>
                <View style={styles.halfGroup}>
                  <Text style={styles.inputLabel}>{fieldLabels.date}</Text>
                  <Pressable
                    style={styles.selectInput}
                    onPress={() => openPicker('date')}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        eventDate && styles.selectTextActive,
                      ]}
                    >
                      {eventDate || '연도-월-일'}
                    </Text>
                    <Text style={styles.chevron}>⌄</Text>
                  </Pressable>
                </View>

                <View style={styles.halfGroup}>
                  <Text style={styles.inputLabel}>{fieldLabels.time}</Text>
                  <Pressable
                    style={styles.selectInput}
                    onPress={() => openPicker('time')}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        eventTime && styles.selectTextActive,
                      ]}
                    >
                      {eventTime || '선택'}
                    </Text>
                    <Text style={styles.chevron}>⌄</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.hiddenRow}>
              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel}>날짜</Text>
                <Pressable
                  style={styles.selectInput}
                  onPress={() => openPicker('date')}
                >
                  <Text
                    style={[
                      styles.selectText,
                      eventDate && styles.selectTextActive,
                    ]}
                  >
                    {eventDate || '연도-월-일'}
                  </Text>
                  <Text style={styles.chevron}>⌄</Text>
                </Pressable>
              </View>

              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel}>시간</Text>
                <Pressable
                  style={styles.selectInput}
                  onPress={() => openPicker('time')}
                >
                  <Text
                    style={[
                      styles.selectText,
                      eventTime && styles.selectTextActive,
                    ]}
                  >
                    {eventTime || '선택'}
                  </Text>
                  <Text style={styles.chevron}>⌄</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel}>국가</Text>
                <Pressable
                  style={styles.selectInput}
                  onPress={() => setCountryPickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      country && styles.selectTextActive,
                    ]}
                  >
                    {country || '선택'}
                  </Text>
                  <Text style={styles.chevron}>⌄</Text>
                </Pressable>
              </View>

              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel}>{fieldLabels.location}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="입력"
                  placeholderTextColor="#9B9B9B"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.fullGroup}>
              <Text style={styles.inputLabel}>양도 매수</Text>
              <View style={styles.quantityBox}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </Pressable>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => setQuantity((prev) => prev + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.hiddenRow}>
              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel}>장소</Text>
                <TextInput
                  style={styles.input}
                  placeholder="입력"
                  placeholderTextColor="#9B9B9B"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel}>양도 매수</Text>
                <View style={styles.quantityBox}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => setQuantity((prev) => prev + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>가격</Text>
              <View style={styles.sectionLine} />
            </View>

            <Text style={styles.inputLabel}>양도 가격</Text>
            <TextInput
              style={styles.input}
              placeholder="€ 양도 가격"
              placeholderTextColor="#9B9B9B"
              keyboardType="number-pad"
              value={transferPrice}
              onChangeText={(value) => setTransferPrice(onlyDigits(value))}
            />

            <Text style={styles.inputLabel}>원가</Text>
            <TextInput
              style={styles.input}
              placeholder="€ 구매 당시 원가"
              placeholderTextColor="#9B9B9B"
              keyboardType="number-pad"
              value={originalPrice}
              onChangeText={(value) => setOriginalPrice(onlyDigits(value))}
            />

            <Pressable
              style={[styles.bottomButton, !canGoNext && styles.buttonDisabled]}
              disabled={!canGoNext}
              onPress={() => setStep(2)}
            >
              <Text style={styles.bottomButtonText}>다음 (1/2)</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>제목</Text>
            <TextInput
              style={styles.input}
              placeholder="제목을 입력해주세요."
              placeholderTextColor="#9B9B9B"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, styles.descriptionLabel]}>
              상세 설명
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="양도 이유, 거래 방식 등 자유롭게 적어주세요"
              placeholderTextColor="#9B9B9B"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <Pressable
              style={[
                styles.bottomButton,
                (!canSubmit || !canGoNext) && styles.buttonDisabled,
              ]}
              disabled={!canSubmit || !canGoNext}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bottomButtonText}>업로드 하기</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={pickerMode !== null}
        animationType="slide"
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closePicker} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={closePicker}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>
              <Text style={styles.pickerTitle}>
                {pickerMode === 'date' ? '날짜 선택' : '시간 선택'}
              </Text>
              <Pressable onPress={handleConfirmPicker}>
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>

            {false && (
              <View style={styles.pickerHeader}>
                <Pressable onPress={closePicker}>
                  <Text style={styles.pickerCancel}>취소</Text>
                </Pressable>
                <Text style={styles.pickerTitle}>
                  {pickerMode === 'date' ? '날짜 선택' : '시간 선택'}
                </Text>
                <Pressable onPress={handleConfirmPicker}>
                  <Text style={styles.pickerDone}>완료</Text>
                </Pressable>
              </View>
            )}

            {pickerMode === 'date' && (
              <View style={styles.calendarBox}>
                <View style={styles.calendarMonthRow}>
                  <Pressable
                    style={styles.calendarNavButton}
                    onPress={() => moveCalendarMonth(-1)}
                  >
                    <Text style={styles.calendarNavText}>‹</Text>
                  </Pressable>
                  <Text style={styles.calendarMonthText}>
                    {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                  </Text>
                  <Pressable
                    style={styles.calendarNavButton}
                    onPress={() => moveCalendarMonth(1)}
                  >
                    <Text style={styles.calendarNavText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.weekRow}>
                  {calendarWeekDays.map((day) => (
                    <Text key={day} style={styles.weekDayText}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => {
                    const dateValue = day
                      ? formatDate(
                          new Date(
                            calendarMonth.getFullYear(),
                            calendarMonth.getMonth(),
                            day,
                          ),
                        )
                      : '';
                    const isCheckInDate = Boolean(
                      day && isAccommodation && dateValue === eventDate,
                    );
                    const isCheckOutDate = Boolean(
                      day && isAccommodation && dateValue === checkoutDate,
                    );
                    const selected = Boolean(
                      day &&
                        (isAccommodation
                          ? isCheckInDate || isCheckOutDate
                          : dateValue === eventDate),
                    );
                    const hasAccommodationRange = Boolean(
                      isAccommodation && eventDate && checkoutDate,
                    );
                    const inAccommodationRange = Boolean(
                      day &&
                        hasAccommodationRange &&
                        dateValue > eventDate &&
                        dateValue < checkoutDate,
                    );
                    const rangeStartsHere = Boolean(
                      hasAccommodationRange && isCheckInDate,
                    );
                    const rangeEndsHere = Boolean(
                      hasAccommodationRange && isCheckOutDate,
                    );
                    const showRangeBackground = Boolean(
                      inAccommodationRange || rangeStartsHere || rangeEndsHere,
                    );

                    return (
                      <Pressable
                        key={`${dateValue}-${index}`}
                        style={styles.calendarDay}
                        disabled={!day}
                        onPress={() => day && handleSelectDate(day)}
                      >
                        {showRangeBackground && (
                          <View
                            style={[
                              styles.calendarRangeBackground,
                              inAccommodationRange &&
                                styles.calendarRangeMiddle,
                              rangeStartsHere && styles.calendarRangeStart,
                              rangeEndsHere && styles.calendarRangeEnd,
                            ]}
                          />
                        )}
                        <View
                          style={[
                            styles.calendarDayCircle,
                            selected && styles.calendarDaySelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              selected && styles.calendarDayTextSelected,
                            ]}
                          >
                            {day ?? ''}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {false && pickerMode === 'time' && (
              <View style={styles.timePickerBox}>
                <Text style={styles.timePickerLabel}>시간</Text>
                <View style={styles.timeOptionGrid}>
                  {hourOptions.map((hour) => {
                    const selected = selectedHour === hour;

                    return (
                      <Pressable
                        key={hour}
                        style={[
                          styles.timeOption,
                          selected && styles.timeOptionSelected,
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selected && styles.timeOptionTextSelected,
                          ]}
                        >
                          {hour}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.timePickerLabel}>분</Text>
                <View style={styles.timeOptionGrid}>
                  {minuteOptions.map((minute) => {
                    const selected = selectedMinute === minute;

                    return (
                      <Pressable
                        key={minute}
                        style={[
                          styles.timeOption,
                          selected && styles.timeOptionSelected,
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selected && styles.timeOptionTextSelected,
                          ]}
                        >
                          {minute}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {pickerMode === 'time' && (
              <View style={styles.timeWheelBox}>
                <View style={styles.timeWheelHighlight} />
                <View style={styles.timeWheelColumn}>
                  <Text style={styles.timeWheelLabel}>시</Text>
                  <ScrollView
                    ref={hourWheelRef}
                    style={styles.timeWheel}
                    contentContainerStyle={styles.timeWheelContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onMomentumScrollBegin={() => {
                      if (hourSnapTimerRef.current) {
                        clearTimeout(hourSnapTimerRef.current);
                        hourSnapTimerRef.current = null;
                      }
                    }}
                    onMomentumScrollEnd={(event) =>
                      handleTimeWheelMomentumEnd(
                        event,
                        hourOptions,
                        setSelectedHour,
                        hourWheelRef,
                        hourSnapTimerRef,
                      )
                    }
                    onScrollEndDrag={(event) =>
                      handleTimeWheelDragEnd(
                        event,
                        hourOptions,
                        setSelectedHour,
                        hourWheelRef,
                        hourSnapTimerRef,
                      )
                    }
                  >
                    {hourOptions.map((hour) => {
                      const selected = selectedHour === hour;

                      return (
                        <Pressable
                          key={hour}
                          style={[
                            styles.timeWheelItem,
                            selected && styles.timeWheelItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedHour(hour);
                            hourWheelRef.current?.scrollTo({
                              y: hourOptions.indexOf(hour) * TIME_ITEM_HEIGHT,
                              animated: true,
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.timeWheelText,
                              selected && styles.timeWheelTextSelected,
                            ]}
                          >
                            {hour}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <Text style={styles.timeWheelSeparator}>:</Text>

                <View style={styles.timeWheelColumn}>
                  <Text style={styles.timeWheelLabel}>분</Text>
                  <ScrollView
                    ref={minuteWheelRef}
                    style={styles.timeWheel}
                    contentContainerStyle={styles.timeWheelContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onMomentumScrollBegin={() => {
                      if (minuteSnapTimerRef.current) {
                        clearTimeout(minuteSnapTimerRef.current);
                        minuteSnapTimerRef.current = null;
                      }
                    }}
                    onMomentumScrollEnd={(event) =>
                      handleTimeWheelMomentumEnd(
                        event,
                        minuteOptions,
                        setSelectedMinute,
                        minuteWheelRef,
                        minuteSnapTimerRef,
                      )
                    }
                    onScrollEndDrag={(event) =>
                      handleTimeWheelDragEnd(
                        event,
                        minuteOptions,
                        setSelectedMinute,
                        minuteWheelRef,
                        minuteSnapTimerRef,
                      )
                    }
                  >
                    {minuteOptions.map((minute) => {
                      const selected = selectedMinute === minute;

                      return (
                        <Pressable
                          key={minute}
                          style={[
                            styles.timeWheelItem,
                            selected && styles.timeWheelItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedMinute(minute);
                            minuteWheelRef.current?.scrollTo({
                              y:
                                minuteOptions.indexOf(minute) *
                                TIME_ITEM_HEIGHT,
                              animated: true,
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.timeWheelText,
                              selected && styles.timeWheelTextSelected,
                            ]}
                          >
                            {minute}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={countryPickerVisible}
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCountryPickerVisible(false)}
          />
          <View style={styles.countrySheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setCountryPickerVisible(false)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>
              <Text style={styles.pickerTitle}>국가 선택</Text>
              <View style={styles.pickerHeaderSpacer} />
            </View>

            <View style={styles.countryList}>
              {countryOptions.map((option) => {
                const selected = country === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.countryOption,
                      selected && styles.countryOptionSelected,
                    ]}
                    onPress={() => {
                      setCountry(option);
                      setCountryPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.countryOptionText,
                        selected && styles.countryOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 24,
  },
  header: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  tempSave: {
    fontSize: 12,
    color: '#C4C4C4',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 12,
    marginBottom: 32,
  },
  typeButton: {
    height: 24,
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  typeButtonActive: {
    backgroundColor: '#E5E8FF',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  typeTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 14,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  halfGroup: {
    flex: 1,
  },
  fullGroup: {
    marginBottom: 12,
  },
  hiddenRow: {
    display: 'none',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 7,
  },
  selectInput: {
    height: 32,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: 12,
    color: '#9B9B9B',
  },
  selectTextActive: {
    color: '#111111',
    fontWeight: '700',
  },
  chevron: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 18,
  },
  input: {
    height: 32,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 11,
    fontSize: 12,
    color: '#111111',
    marginBottom: 14,
  },
  quantityBox: {
    height: 32,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: '#111111',
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 13,
    color: '#777777',
    fontWeight: '700',
  },
  helperText: {
    marginTop: -6,
    marginBottom: 10,
    fontSize: 11,
    color: BLUE,
    fontWeight: '700',
  },
  descriptionLabel: {
    marginTop: 22,
  },
  textArea: {
    height: 135,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 11,
    paddingVertical: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#111111',
  },
  bottomButton: {
    height: 42,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonDisabled: {
    backgroundColor: '#C9D0F8',
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    minHeight: 0,
    paddingBottom: 18,
  },
  picker: {
    height: 210,
    backgroundColor: '#FFFFFF',
  },
  calendarBox: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  calendarMonthRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarNavButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  calendarNavText: {
    fontSize: 32,
    lineHeight: 34,
    color: '#111111',
    fontWeight: '800',
  },
  calendarMonthText: {
    position: 'absolute',
    left: 56,
    right: 56,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#777777',
    lineHeight: 30,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 2,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarRangeBackground: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: '#E8ECFF',
  },
  calendarRangeMiddle: {
    left: 0,
    right: 0,
  },
  calendarRangeStart: {
    left: '50%',
    right: 0,
  },
  calendarRangeEnd: {
    left: 0,
    right: '50%',
  },
  calendarDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  calendarDaySelected: {
    backgroundColor: BLUE,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  timePickerBox: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
  },
  timeOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  timeOption: {
    width: '14.8%',
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionSelected: {
    backgroundColor: BLUE,
  },
  timeOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#333333',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  timeWheelBox: {
    height: TIME_WHEEL_BOX_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    position: 'relative',
  },
  timeWheelHighlight: {
    position: 'absolute',
    left: 34,
    right: 34,
    top: (TIME_WHEEL_BOX_HEIGHT - TIME_ITEM_HEIGHT) / 2,
    height: TIME_ITEM_HEIGHT,
    borderRadius: 10,
    backgroundColor: '#F1F1F3',
  },
  timeWheelColumn: {
    width: 104,
    alignItems: 'center',
  },
  timeWheelLabel: {
    display: 'none',
  },
  timeWheel: {
    width: '100%',
    height: TIME_WHEEL_HEIGHT,
  },
  timeWheelContent: {
    paddingVertical: (TIME_WHEEL_HEIGHT - TIME_ITEM_HEIGHT) / 2,
    alignItems: 'center',
  },
  timeWheelItem: {
    width: 88,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  timeWheelItemSelected: {
    backgroundColor: 'transparent',
  },
  timeWheelText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#9E9E9E',
    lineHeight: TIME_ITEM_HEIGHT,
  },
  timeWheelTextSelected: {
    fontSize: 18,
    color: '#111111',
    fontWeight: '600',
    lineHeight: TIME_ITEM_HEIGHT,
  },
  timeWheelSeparator: {
    width: 42,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    lineHeight: TIME_ITEM_HEIGHT,
    zIndex: 1,
  },
  pickerHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  pickerHeaderSpacer: {
    width: 34,
  },
  pickerCancel: {
    fontSize: 15,
    color: '#777777',
    fontWeight: '700',
  },
  pickerTitle: {
    position: 'absolute',
    left: 88,
    right: 88,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  pickerDone: {
    fontSize: 15,
    color: BLUE,
    fontWeight: '900',
  },
  countrySheet: {
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingBottom: 18,
  },
  countryList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  countryOption: {
    height: 44,
    borderRadius: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  countryOptionSelected: {
    backgroundColor: '#F0F3FF',
  },
  countryOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  countryOptionTextSelected: {
    color: BLUE,
    fontWeight: '900',
  },
});
