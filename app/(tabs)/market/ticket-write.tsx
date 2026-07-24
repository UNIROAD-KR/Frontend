import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/ui/app-back-button';
import {
  createTicket,
  getMyTickets,
  TicketTransferRequest,
  TicketType,
  updateTicket,
} from '../../../src/api/ticket';
import {
  clearTicketDraft,
  getTicketDraft,
  saveTicketDraft,
} from '../../../src/storage/ticketDraft';
import { saveTicketCurrency } from '../../../src/storage/ticketMetadata';

const BLUE = '#102BE0';
const TIME_ITEM_HEIGHT = 36;
const TIME_WHEEL_HEIGHT = 180;
const TIME_WHEEL_BOX_HEIGHT = 206;
const calendarWeekDays = ['일', '월', '화', '수', '목', '금', '토'];

const ticketTypeOptions: {
  label: string;
  value: TicketType | null;
  disabledReason?: string;
}[] = [
  { label: '관광 티켓', value: 'TOUR' },
  { label: '콘서트 / 공연', value: 'CONCERT' },
  { label: '기차', value: 'TRAIN' },
  { label: '항공권', value: 'FLIGHT' },
  { label: '숙박', value: 'ACCOMMODATION' },
  {
    label: '기타',
    value: null,
    disabledReason:
      '백엔드 티켓 타입에 OTHER가 추가되면 바로 등록할 수 있어요.',
  },
];

const ticketFieldLabels: Record<
  TicketType,
  { date: string; time: string; location: string; arrival?: string }
> = {
  TOUR: {
    date: '이용일',
    time: '이용시간',
    location: '관광지명',
  },
  CONCERT: {
    date: '공연일',
    time: '공연시간',
    location: '공연 장소',
  },
  TRAIN: {
    date: '출발일',
    time: '출발시간',
    location: '출발역',
    arrival: '도착역',
  },
  FLIGHT: {
    date: '출발일',
    time: '출발시간',
    location: '출발공항',
    arrival: '도착공항',
  },
  ACCOMMODATION: {
    date: '체크인 날짜',
    time: '',
    location: '숙소명',
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
const currencyOptions = ['€', '$', '₩', '¥', '£', '직접 입력'];

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

const formatPriceInput = (value: string) => {
  const digits = onlyDigits(value);

  if (!digits) return '';

  return Number(digits).toLocaleString('ko-KR');
};

const parseDateValue = (value: string) => {
  if (!value) return new Date();

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const isRouteTicketType = (value: TicketType | null) =>
  value === 'TRAIN' || value === 'FLIGHT';

const splitRouteLocation = (value: string) => {
  const [departure = '', arrival = ''] = value
    .split('→')
    .map((part) => part.trim());

  return { departure, arrival };
};

export default function TicketWritePage() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    resumeDraft?: string;
    editId?: string;
    ticketType?: string;
    eventDate?: string;
    checkoutDate?: string;
    eventTime?: string;
    country?: string;
    location?: string;
    quantity?: string;
    currencyUnit?: string;
    customCurrencyUnit?: string;
    transferPrice?: string;
    originalPrice?: string;
    title?: string;
    content?: string;
  }>();
  const editId = Number(params.editId);
  const isEditMode = Number.isFinite(editId);
  const [step, setStep] = useState<1 | 2>(1);
  const [ticketType, setTicketType] = useState<TicketType | null>(
    (params.ticketType as TicketType | undefined) ?? null,
  );
  const [eventDate, setEventDate] = useState(params.eventDate ?? '');
  const [checkoutDate, setCheckoutDate] = useState(params.checkoutDate ?? '');
  const [eventTime, setEventTime] = useState(params.eventTime ?? '');
  const [country, setCountry] = useState(params.country ?? '');
  const [location, setLocation] = useState(params.location ?? '');
  const initialRouteLocation = splitRouteLocation(params.location ?? '');
  const [departureLocation, setDepartureLocation] = useState(
    initialRouteLocation.departure,
  );
  const [arrivalLocation, setArrivalLocation] = useState(
    initialRouteLocation.arrival,
  );
  const [quantity, setQuantity] = useState(() => {
    const parsedQuantity = Number(params.quantity);

    return Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? parsedQuantity
      : 1;
  });
  const [currencyUnit, setCurrencyUnit] = useState(params.currencyUnit ?? '€');
  const [customCurrencyUnit, setCustomCurrencyUnit] = useState(
    params.customCurrencyUnit ?? '',
  );
  const [transferPrice, setTransferPrice] = useState(() =>
    formatPriceInput(params.transferPrice ?? ''),
  );
  const [originalPrice, setOriginalPrice] = useState(() =>
    formatPriceInput(params.originalPrice ?? ''),
  );
  const [title, setTitle] = useState(params.title ?? '');
  const [content, setContent] = useState(params.content ?? '');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [dateTarget, setDateTarget] = useState<'event' | 'checkin' | 'checkout'>(
    'event',
  );
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [submitting, setSubmitting] = useState(false);
  const allowExitRef = useRef(false);
  const submittingRef = useRef(false);
  const locationInputRef = useRef<TextInput>(null);
  const departureInputRef = useRef<TextInput>(null);
  const arrivalInputRef = useRef<TextInput>(null);
  const transferPriceInputRef = useRef<TextInput>(null);
  const originalPriceInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const hourWheelRef = useRef<ScrollView>(null);
  const minuteWheelRef = useRef<ScrollView>(null);
  const hourSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minuteSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isAccommodation = ticketType === 'ACCOMMODATION';
  const isRouteTicket = isRouteTicketType(ticketType);
  const fieldLabels = ticketType
    ? ticketFieldLabels[ticketType]
    : ticketFieldLabels.TOUR;
  const resolvedLocation = isRouteTicket
    ? [departureLocation.trim(), arrivalLocation.trim()]
        .filter(Boolean)
        .join(' → ')
    : location.trim();
  const selectedCurrencyLabel =
    currencyUnit === '직접 입력'
      ? customCurrencyUnit.trim()
      : currencyUnit;

  useEffect(() => {
    if (params.resumeDraft !== 'true' || isEditMode) return;

    let active = true;

    const restoreDraft = async () => {
      const draft = await getTicketDraft();

      if (!active || !draft) return;

      setStep(draft.step);
      setTicketType(draft.ticketType as TicketType | null);
      setEventDate(draft.eventDate);
      setCheckoutDate(draft.checkoutDate);
      setEventTime(draft.eventTime);
      setCountry(draft.country);
      setLocation(draft.location);
      if (draft.departureLocation || draft.arrivalLocation) {
        setDepartureLocation(draft.departureLocation ?? '');
        setArrivalLocation(draft.arrivalLocation ?? '');
      } else {
        const routeLocation = splitRouteLocation(draft.location);
        setDepartureLocation(routeLocation.departure);
        setArrivalLocation(routeLocation.arrival);
      }
      setQuantity(draft.quantity);
      setCurrencyUnit(draft.currencyUnit ?? '€');
      setCustomCurrencyUnit(draft.customCurrencyUnit ?? '');
      setTransferPrice(formatPriceInput(draft.transferPrice));
      setOriginalPrice(formatPriceInput(draft.originalPrice));
      setTitle(draft.title);
      setContent(draft.content);
    };

    restoreDraft();

    return () => {
      active = false;
    };
  }, [isEditMode, params.resumeDraft]);

  usePreventRemove(
    step === 2 && !submitting && !submittingRef.current && !allowExitRef.current,
    () => {
      setStep(1);
    },
  );

  const canGoNext = useMemo(
    () =>
      Boolean(
          ticketType &&
          eventDate &&
          (isAccommodation ? checkoutDate : eventTime.trim()) &&
          country &&
          resolvedLocation &&
          selectedCurrencyLabel &&
          transferPrice &&
          originalPrice &&
          Number(onlyDigits(transferPrice)) > 0 &&
          Number(onlyDigits(originalPrice)) > 0,
      ),
    [
      eventDate,
      eventTime,
      checkoutDate,
      isAccommodation,
      country,
      resolvedLocation,
      originalPrice,
      selectedCurrencyLabel,
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

  const focusNextField = (ref: RefObject<TextInput | null>) => {
    setTimeout(() => {
      ref.current?.focus();
    }, 120);
  };

  const resolveCreatedTicketId = async (rawId: unknown) => {
    if (typeof rawId === 'number' && Number.isFinite(rawId)) {
      return rawId;
    }

    if (typeof rawId === 'string') {
      const parsedId = Number(rawId);

      if (Number.isFinite(parsedId)) {
        return parsedId;
      }
    }

    if (rawId && typeof rawId === 'object' && 'id' in rawId) {
      const parsedId = Number((rawId as { id?: unknown }).id);

      if (Number.isFinite(parsedId)) {
        return parsedId;
      }
    }

    try {
      const response = await getMyTickets({ size: 1 });
      const latestTicket = response.data.data.items[0];

      return latestTicket?.id ?? null;
    } catch (error: any) {
      console.log('작성한 티켓 재조회 실패:', error.response?.data || error.message);
      return null;
    }
  };

  const showUploadComplete = (ticketId: number | null) => {
    Alert.alert(
      isEditMode ? '수정 완료' : '업로드 완료',
      isEditMode
        ? '티켓 양도글이 수정되었습니다.'
        : '티켓 양도글이 등록되었습니다.',
    );

    allowExitRef.current = true;

    if (ticketId) {
      if (isEditMode) {
        router.replace({
          pathname: '/market',
          params: {
            tab: 'ticket',
            openTicketId: String(ticketId),
            refresh: String(Date.now()),
          },
        } as any);
        return;
      }

      router.replace({
        pathname: '/market/ticket-preview',
        params: {
          id: String(ticketId),
          fromCreateComplete: 'true',
        },
      } as any);
      return;
    }

    router.replace({
      pathname: '/market',
      params: {
        tab: 'ticket',
        refresh: String(Date.now()),
      },
    } as any);
  };

  const handleTempSave = async () => {
    await saveTicketDraft({
      step,
      ticketType,
      eventDate,
      checkoutDate,
      eventTime,
      country,
      location,
      departureLocation,
      arrivalLocation,
      quantity,
      currencyUnit,
      customCurrencyUnit,
      transferPrice: onlyDigits(transferPrice),
      originalPrice: onlyDigits(originalPrice),
      title,
      content,
    });

    Alert.alert('임시저장 완료', '작성 중인 티켓 양도글을 저장했어요.');
  };

  const handleSubmit = async () => {
    if (!ticketType || !canSubmit || !canGoNext) return;

    const submitEventDate = isAccommodation
      ? `${eventDate}~${checkoutDate}`
      : eventDate;
    const currencyLabel = selectedCurrencyLabel || '€';

    const payload: TicketTransferRequest = {
      ticketType,
      title: title.trim(),
      content: content.trim(),
      eventDate: submitEventDate,
      eventTime: isAccommodation ? '00:00' : eventTime.trim(),
      country,
      location: resolvedLocation,
      quantity,
      transferPrice: Number(onlyDigits(transferPrice)),
      originalPrice: Number(onlyDigits(originalPrice)),
    };

    try {
      submittingRef.current = true;
      setSubmitting(true);
      const ticketId = isEditMode ? editId : null;

      if (isEditMode) {
        await updateTicket(editId, payload);
        await saveTicketCurrency(editId, currencyLabel);
      } else {
        const response = await createTicket(payload);
        const createdTicketId = await resolveCreatedTicketId(response.data.data);

        if (createdTicketId) {
          await saveTicketCurrency(createdTicketId, currencyLabel);
        }

        await clearTicketDraft();
        setSubmitting(false);
        submittingRef.current = false;
        showUploadComplete(createdTicketId);
        return;
      }

      await clearTicketDraft();
      setSubmitting(false);
      submittingRef.current = false;
      showUploadComplete(ticketId);
    } catch (error: any) {
      console.log('티켓 양도 글 작성 실패:', error.response?.data || error.message);
      Alert.alert(
        isEditMode ? '수정 실패' : '업로드 실패',
        error.response?.data?.message ??
          (isEditMode
            ? '티켓 양도 글을 수정하지 못했어요.'
            : '티켓 양도 글을 등록하지 못했어요.'),
      );
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(54, insets.top + 12),
            paddingBottom: Math.max(74, insets.bottom + 46),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppBackButton
            onPress={() => {
              if (step === 2) {
                setStep(1);
                return;
              }

              router.back();
            }}
          />
          <Text style={styles.headerTitle}>
            {isEditMode ? '티켓양도 수정하기' : '티켓양도하기'}
          </Text>
          <Pressable
            style={styles.tempSaveButton}
            onPress={handleTempSave}
            hitSlop={8}
          >
            <Text style={styles.tempSaveIcon}>🔖</Text>
          </Pressable>
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.sectionLabel}>티켓 종류</Text>
            <View style={styles.typeGrid}>
              {ticketTypeOptions.map((option) => {
                const active = option.value !== null && ticketType === option.value;

                return (
                  <Pressable
                    key={option.label}
                    style={[
                      styles.typeButton,
                      option.value === null && styles.typeButtonDisabled,
                      active && styles.typeButtonActive,
                    ]}
                    onPress={() => {
                      if (option.value === null) {
                        Alert.alert('API 추가 필요', option.disabledReason);
                        return;
                      }

                      setTicketType(option.value);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        option.value === null && styles.typeTextDisabled,
                        active && styles.typeTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, styles.sectionHeaderLabel]}>
                티켓 정보
              </Text>
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
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color="#A0A0A0"
                      style={styles.chevronIcon}
                    />
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
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color="#A0A0A0"
                      style={styles.chevronIcon}
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {!isAccommodation && (
              <View style={styles.twoColumnRow}>
                <View style={styles.halfGroup}>
                  <Text style={styles.inputLabel} numberOfLines={1}>
                    {fieldLabels.date}
                  </Text>
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
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color="#A0A0A0"
                      style={styles.chevronIcon}
                    />
                  </Pressable>
                </View>

                <View style={styles.halfGroup}>
                  <Text style={styles.inputLabel} numberOfLines={1}>
                    {fieldLabels.time}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 19:30"
                    placeholderTextColor="#9B9B9B"
                    value={eventTime}
                    onChangeText={setEventTime}
                    returnKeyType="next"
                    onSubmitEditing={() => setCountryPickerVisible(true)}
                  />
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
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#A0A0A0"
                    style={styles.chevronIcon}
                  />
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
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#A0A0A0"
                    style={styles.chevronIcon}
                  />
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
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#A0A0A0"
                    style={styles.chevronIcon}
                  />
                </Pressable>
              </View>

              <View style={styles.halfGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  {fieldLabels.location}
                </Text>
                <TextInput
                  style={styles.input}
                  ref={isRouteTicket ? departureInputRef : locationInputRef}
                  placeholder="입력"
                  placeholderTextColor="#9B9B9B"
                  value={isRouteTicket ? departureLocation : location}
                  onChangeText={isRouteTicket ? setDepartureLocation : setLocation}
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    focusNextField(
                      isRouteTicket ? arrivalInputRef : transferPriceInputRef,
                    )
                  }
                />
              </View>
            </View>

            {isRouteTicket && (
              <View style={styles.fullGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  {fieldLabels.arrival}
                </Text>
                <TextInput
                  style={styles.input}
                  ref={arrivalInputRef}
                  placeholder="입력"
                  placeholderTextColor="#9B9B9B"
                  value={arrivalLocation}
                  onChangeText={setArrivalLocation}
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField(transferPriceInputRef)}
                />
              </View>
            )}

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

            <View style={[styles.sectionHeader, styles.priceSectionHeader]}>
              <Text style={[styles.sectionLabel, styles.sectionHeaderLabel]}>
                가격
              </Text>
              <View style={styles.sectionLine} />
            </View>

            <Text style={styles.inputLabel}>화폐 단위</Text>
            <View style={styles.currencyControlRow}>
              <Pressable
                style={[styles.selectInput, styles.currencySelect]}
                onPress={() => setCurrencyPickerVisible(true)}
              >
                <Text
                  style={[
                    styles.selectText,
                    selectedCurrencyLabel && styles.selectTextActive,
                  ]}
                >
                  {currencyUnit}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#A0A0A0"
                  style={styles.chevronIcon}
                />
              </Pressable>

              {currencyUnit === '직접 입력' && (
                <TextInput
                  style={[styles.input, styles.currencyCustomInput]}
                  placeholder="예: CHF"
                  placeholderTextColor="#9B9B9B"
                  value={customCurrencyUnit}
                  onChangeText={setCustomCurrencyUnit}
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField(transferPriceInputRef)}
                />
              )}
            </View>

            <Text style={styles.inputLabel}>양도 가격</Text>
            <View style={styles.priceInputBox}>
              <Text style={styles.currencyPrefix}>
                {selectedCurrencyLabel || '단위'}
              </Text>
              <TextInput
                style={styles.priceInput}
                placeholder="양도 가격"
                placeholderTextColor="#9B9B9B"
                keyboardType="number-pad"
                value={transferPrice}
                onChangeText={(value) => setTransferPrice(formatPriceInput(value))}
                returnKeyType="next"
                onSubmitEditing={() => focusNextField(originalPriceInputRef)}
                ref={transferPriceInputRef}
              />
            </View>

            <Text style={styles.inputLabel}>원가</Text>
            <View style={styles.priceInputBox}>
              <Text style={styles.currencyPrefix}>
                {selectedCurrencyLabel || '단위'}
              </Text>
              <TextInput
                style={styles.priceInput}
                placeholder="구매 당시 원가"
                placeholderTextColor="#9B9B9B"
                keyboardType="number-pad"
                value={originalPrice}
                onChangeText={(value) => setOriginalPrice(formatPriceInput(value))}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (canGoNext) {
                    setStep(2);
                    focusNextField(titleInputRef);
                  }
                }}
                ref={originalPriceInputRef}
              />
            </View>

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
            <Text style={styles.stepTwoLabel}>제목</Text>
            <TextInput
              style={styles.input}
              ref={titleInputRef}
              placeholder="제목을 입력해주세요."
              placeholderTextColor="#9B9B9B"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              onSubmitEditing={() => focusNextField(contentInputRef)}
            />

            <Text style={[styles.stepTwoLabel, styles.descriptionLabel]}>
              상세 설명
            </Text>
            <TextInput
              style={styles.textArea}
              ref={contentInputRef}
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
                <Text style={styles.bottomButtonText}>
                  {isEditMode ? '변경하기' : '업로드 하기'}
                </Text>
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
                      focusNextField(
                        isRouteTicket ? departureInputRef : locationInputRef,
                      );
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

      <Modal
        transparent
        visible={currencyPickerVisible}
        animationType="slide"
        onRequestClose={() => setCurrencyPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCurrencyPickerVisible(false)}
          />
          <View style={styles.countrySheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setCurrencyPickerVisible(false)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>
              <Text style={styles.pickerTitle}>화폐 단위 선택</Text>
              <View style={styles.pickerHeaderSpacer} />
            </View>

            <View style={styles.countryList}>
              {currencyOptions.map((option) => {
                const selected = currencyUnit === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.countryOption,
                      selected && styles.countryOptionSelected,
                    ]}
                    onPress={() => {
                      setCurrencyUnit(option);
                      setCurrencyPickerVisible(false);

                      if (option !== '직접 입력') {
                        setCustomCurrencyUnit('');
                        focusNextField(transferPriceInputRef);
                      }
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

      <Modal transparent visible={submitting} animationType="fade">
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <ActivityIndicator color={BLUE} size="large" />
            <Text style={styles.uploadingTitle}>업로드 중</Text>
            <Text style={styles.uploadingDesc}>
              티켓 양도글을 등록하고 있어요.
            </Text>
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
  },
  header: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  tempSaveButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tempSaveIcon: {
    fontSize: 24,
    lineHeight: 38,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 14,
  },
  sectionHeaderLabel: {
    marginBottom: 0,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 13,
    marginBottom: 36,
  },
  typeButton: {
    height: 27,
    flexBasis: '30%',
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: 13.5,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  typeButtonActive: {
    backgroundColor: '#E5E8FF',
  },
  typeButtonDisabled: {
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
  typeTextDisabled: {
    color: '#A0A0A0',
  },
  typeTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 0,
    marginBottom: 15,
  },
  priceSectionHeader: {
    marginTop: 23,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 13,
  },
  halfGroup: {
    flex: 1,
  },
  fullGroup: {
    marginBottom: 13,
  },
  hiddenRow: {
    display: 'none',
  },
  inputLabel: {
    height: 17,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
    includeFontPadding: false,
  },
  stepTwoLabel: {
    height: 19,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 10,
    includeFontPadding: false,
  },
  selectInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: 13,
    color: '#9B9B9B',
  },
  selectTextActive: {
    color: '#111111',
    fontWeight: '700',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#111111',
    marginBottom: 15,
  },
  currencyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  currencySelect: {
    flex: 1,
    marginBottom: 0,
  },
  currencyCustomInput: {
    flex: 1,
    marginBottom: 0,
  },
  priceInputBox: {
    height: 36,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    minWidth: 38,
    marginRight: 8,
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
  },
  priceInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#111111',
    padding: 0,
  },
  quantityBox: {
    height: 36,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 19,
    lineHeight: 21,
    color: '#111111',
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 14,
    color: '#777777',
    fontWeight: '700',
  },
  helperText: {
    marginTop: -6,
    marginBottom: 11,
    fontSize: 12,
    color: BLUE,
    fontWeight: '700',
  },
  descriptionLabel: {
    marginTop: 24,
  },
  textArea: {
    height: 145,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: 13,
    lineHeight: 20,
    color: '#111111',
  },
  bottomButton: {
    height: 52,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#C9D0F8',
  },
  bottomButtonText: {
    fontSize: 16,
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
    height: 218,
    backgroundColor: '#FFFFFF',
  },
  calendarBox: {
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 8,
  },
  calendarMonthRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  calendarNavButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  calendarNavText: {
    fontSize: 33,
    lineHeight: 35,
    color: '#111111',
    fontWeight: '800',
  },
  calendarMonthText: {
    position: 'absolute',
    left: 56,
    right: 56,
    textAlign: 'center',
    fontSize: 19,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#777777',
    lineHeight: 31,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 2,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 48,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  calendarDaySelected: {
    backgroundColor: BLUE,
  },
  calendarDayText: {
    fontSize: 15,
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
    fontSize: 14,
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
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionSelected: {
    backgroundColor: BLUE,
  },
  timeOptionText: {
    fontSize: 13,
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
    fontSize: 18,
    fontWeight: '500',
    color: '#9E9E9E',
    lineHeight: TIME_ITEM_HEIGHT,
  },
  timeWheelTextSelected: {
    fontSize: 19,
    color: '#111111',
    fontWeight: '600',
    lineHeight: TIME_ITEM_HEIGHT,
  },
  timeWheelSeparator: {
    width: 42,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '600',
    color: '#111111',
    lineHeight: TIME_ITEM_HEIGHT,
    zIndex: 1,
  },
  pickerHeader: {
    height: 50,
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
    fontSize: 16,
    color: '#777777',
    fontWeight: '700',
  },
  pickerTitle: {
    position: 'absolute',
    left: 88,
    right: 88,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  pickerDone: {
    fontSize: 16,
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
    height: 46,
    borderRadius: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  countryOptionSelected: {
    backgroundColor: '#F0F3FF',
  },
  countryOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  countryOptionTextSelected: {
    color: BLUE,
    fontWeight: '900',
  },
  uploadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  uploadingBox: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  uploadingTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  uploadingDesc: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#666666',
    textAlign: 'center',
  },
});
