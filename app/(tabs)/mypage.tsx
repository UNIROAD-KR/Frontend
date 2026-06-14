import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AccountBookCategory,
  AccountBookResponse,
  addAccountBookTransaction,
  getAccountBookBalance,
  getAccountBookDailyDetails,
  getAccountBookMonthlySummary
} from '../../src/api/accountBook';
import { getMemberMe } from '../../src/api/auth';


const { width } = Dimensions.get('window');

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDateInput = (dateText: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const CATEGORIES: {
  key: AccountBookCategory;
  label: string;
  icon: keyof typeof Ionicons.prototype.styles | string;
  color: string;
}[] = [
  { key: 'FOOD', label: '식비', icon: 'fast-food', color: '#FF7A00' },
  { key: 'TRANSPORT', label: '교통비', icon: 'bus', color: '#00C2FF' },
  { key: 'SHOPPING', label: '쇼핑', icon: 'cart', color: '#FF007A' },
  { key: 'TRAVEL', label: '여행', icon: 'airplane', color: '#00E575' },
  { key: 'ETC', label: '기타 지출', icon: 'ellipsis-horizontal-circle', color: '#8E8E93' },
];

export default function MyPageScreen() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTabletDatePicker = Platform.OS === 'ios' && Math.min(windowWidth, windowHeight) >= 768;
  const [userName, setUserName] = useState<string>('사용자');
  const [balance, setBalance] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [monthlySummary, setMonthlySummary] = useState<{
    totalIncome: number;
    totalExpense: number;
    dailySummaries: Record<string, { income: number; expense: number }>;
  }>({
    totalIncome: 0,
    totalExpense: 0,
    dailySummaries: {},
  });
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyDetails, setDailyDetails] = useState<AccountBookResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // 모달 상태 관리
  const [chargeModalVisible, setChargeModalVisible] = useState<boolean>(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState<boolean>(false);
  
  // 모달 입력값 상태 관리
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [chargeTitle, setChargeTitle] = useState<string>('잔액 충전');
  
  const [selectedCategory, setSelectedCategory] = useState<AccountBookCategory>('FOOD');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(''); // YYYY-MM-DD
  
  // 날짜 피커 상태
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [expenseDateValue, setExpenseDateValue] = useState<Date>(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (event?.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setExpenseDateValue(selectedDate);
      setExpenseDate(formatDate(selectedDate));
      if (isTabletDatePicker) {
        setShowDatePicker(false);
      }
    }
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpenseDateValue(parseDateInput(expenseDate) || new Date());
    setShowDatePicker(true);
  };

  const closeExpenseModal = () => {
    Keyboard.dismiss();
    setShowDatePicker(false);
    setExpenseModalVisible(false);
  };

  const dismissKeyboardAndTabletPicker = () => {
    Keyboard.dismiss();
    if (isTabletDatePicker) {
      setShowDatePicker(false);
    }
  };

  // 기본 데이터 불러오기
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 내 정보 가져오기
      try {
        const memberRes = await getMemberMe();
        if (memberRes.data?.data) {
          setUserName(memberRes.data.data.name || '사용자');
          setBalance(memberRes.data.data.balance || 0);
        } else {
          const balanceRes = await getAccountBookBalance();
          setBalance(balanceRes.data?.data?.balance || 0);
        }
      } catch (memberError) {
        console.log('내 정보 조회 실패, 기존 잔액 가져오기 시도:', memberError);
        const balanceRes = await getAccountBookBalance();
        setBalance(balanceRes.data?.data?.balance || 0);
      }

      // 2. 월간 요약 가져오기
      const summaryRes = await getAccountBookMonthlySummary(currentYear, currentMonth + 1);
      setMonthlySummary(
        summaryRes.data?.data || {
          totalIncome: 0,
          totalExpense: 0,
          dailySummaries: {},
        }
      );
    } catch (error: any) {
      console.log('가계부 데이터 로드 실패:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // 특정 날짜의 상세 내역 조회
  const fetchDailyDetails = useCallback(async (dateStr: string) => {
    setDetailsLoading(true);
    try {
      const res = await getAccountBookDailyDetails(dateStr);
      setDailyDetails(res.data?.data || []);
      setSelectedDate(dateStr);
    } catch (error: any) {
      console.log('일별 상세 조회 실패:', error.response?.data || error.message);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const today = new Date();

      setCurrentDate(today);
      fetchDailyDetails(formatDate(today));
    }, [fetchDailyDetails])
  );

  // 잔액 충전(수입 추가) API 호출
  const handleChargeSubmit = async () => {
    const amountNum = parseFloat(chargeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('입력 오류', '올바른 금액을 입력해주세요.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addAccountBookTransaction({
        amount: amountNum,
        type: 'INCOME',
        category: 'CHARGE',
        title: chargeTitle.trim() || '잔액 충전',
        transactionDate: new Date().toISOString().split('T')[0],
      });

      Alert.alert('충전 완료', '성공적으로 잔액이 충전되었습니다.');
      setChargeModalVisible(false);
      setChargeAmount('');
      setChargeTitle('잔액 충전');
      
      // 데이터 즉시 갱신
      fetchData();
      if (selectedDate) fetchDailyDetails(selectedDate);
    } catch (error: any) {
      Alert.alert('충전 실패', '금액 충전에 실패했습니다.');
    }
  };

  // 지출 등록 API 호출
  const handleExpenseSubmit = async () => {
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('입력 오류', '올바른 금액을 입력해주세요.');
      return;
    }
    if (!expenseTitle.trim()) {
      Alert.alert('입력 오류', '내역 이름을 입력해주세요.');
      return;
    }

    if (!parseDateInput(expenseDate)) {
      Alert.alert('입력 오류', '날짜 형식은 YYYY-MM-DD 여야 하며 실제 존재하는 날짜여야 합니다.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addAccountBookTransaction({
        amount: amountNum,
        type: 'EXPENSE',
        category: selectedCategory,
        title: expenseTitle.trim(),
        description: expenseDescription.trim() || undefined,
        transactionDate: expenseDate,
      });

      Alert.alert('등록 완료', '지출 내역이 성공적으로 등록되었습니다.');
      closeExpenseModal();
      setExpenseAmount('');
      setExpenseTitle('');
      setExpenseDescription('');
      
      // 데이터 즉시 갱신
      fetchData();
      if (selectedDate) fetchDailyDetails(selectedDate);
    } catch (error: any) {
      Alert.alert('등록 실패', '지출 등록에 실패했습니다.');
    }
  };

  // 월 전환 처리
  const changeMonth = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(null);
    setDailyDetails([]);
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (direction === 'prev') {
        nextDate.setMonth(prev.getMonth() - 1);
      } else {
        nextDate.setMonth(prev.getMonth() + 1);
      }
      return nextDate;
    });
  };

  // 지출 카테고리 클릭 시 모달 오픈
  const openExpenseModal = (category: AccountBookCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(category);
    const today = new Date();
    setExpenseDate(formatDate(today)); // 오늘 날짜 기본 세팅
    setExpenseDateValue(today); // 데이트 피커용 밸류 초기화
    setShowDatePicker(false);
    setExpenseModalVisible(true);
  };

  // 캘린더 날짜 격자 생성 로직
  const renderCalendar = () => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // 1일의 요일 알아내기 (Mon-Sun으로 배치하기 위해 월요일(1) 시작으로 계산)
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

    const days = [];

    // 지난 달 빈칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
    }

    // 이번 달 날짜 채우기
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
      const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const summary = monthlySummary.dailySummaries[fullDateStr];
      const isSelected = selectedDate === fullDateStr;

      days.push(
        <Pressable
          key={`day-${day}`}
          style={[styles.calendarDayCell, isSelected && styles.selectedDayCell]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            fetchDailyDetails(fullDateStr);
          }}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
            {day}
          </Text>
          <View style={styles.summaryLabelContainer}>
            {summary && summary.income > 0 && (
              <Text style={styles.incomeBadgeText} numberOfLines={1}>
                +{summary.income}
              </Text>
            )}
            {summary && summary.expense > 0 && (
              <Text style={styles.expenseBadgeText} numberOfLines={1}>
                -{summary.expense}
              </Text>
            )}
          </View>
        </Pressable>
      );
    }

    return days;
  };

  // 예산 대비 지출 비율 계산 (총 충전액 대비 지출 비율 또는 1000유로 대비 비율)
  const budgetLimit = 1000;
  const expensePercentage = Math.min(
    Math.round((monthlySummary.totalExpense / budgetLimit) * 100),
    100
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>반가워요, {userName}님</Text>
            <Text style={styles.headerTitle}>나의 지출 관리</Text>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/home/profile-settings' as any)}
          >
            <Ionicons name="settings-outline" size={26} color="#000" />
          </Pressable>
        </View>

        {/* 잔액 & 예산 블루 카드 */}
        <LinearGradient
          colors={['#123F9F', '#092A72']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>현재 잔액</Text>
              <Text style={styles.balanceAmount}>€{balance.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</Text>
            </View>
            <Pressable
              style={styles.chargePlusButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setChargeModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={42} color="#FFF" />
            </Pressable>
          </View>

          {/* 소비 프로그레스바 */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>이번 달 지출</Text>
              <Text style={styles.progressValue}>€{monthlySummary.totalExpense.toLocaleString('ko-KR')}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${expensePercentage}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.limitLabel}>목표 한도 €{budgetLimit.toLocaleString()}</Text>
              <Text style={styles.percentageLabel}>{expensePercentage}% 사용됨</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 5대 카테고리 퀵 지출 등록 버튼 */}
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              style={styles.categoryItem}
              onPress={() => openExpenseModal(cat.key)}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name={cat.icon as any} size={28} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 월간 수입/지출 체크 표시 (캘린더 상단 요약) */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryTitle}>
            {currentMonth + 1}월 요약
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryChipBlue}>
              <Ionicons name="trending-up-outline" size={16} color="#123F9F" style={{ marginRight: 4 }} />
              <Text style={styles.summaryBlueText}>수입 €{monthlySummary.totalIncome.toLocaleString('ko-KR')}</Text>
            </View>
            <View style={styles.summaryChipRed}>
              <Ionicons name="trending-down-outline" size={16} color="#FF3B30" style={{ marginRight: 4 }} />
              <Text style={styles.summaryRedText}>지출 €{monthlySummary.totalExpense.toLocaleString('ko-KR')}</Text>
            </View>
          </View>
        </View>

        {/* 달력 일정 영역 */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => changeMonth('prev')} style={styles.chevronButton}>
              <Ionicons name="chevron-back" size={22} color="#8A8A8F" />
            </Pressable>
            <Text style={styles.calendarMonthText}>
              {currentYear}년 {currentMonth + 1}월
            </Text>
            <Pressable onPress={() => changeMonth('next')} style={styles.chevronButton}>
              <Ionicons name="chevron-forward" size={22} color="#8A8A8F" />
            </Pressable>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.weekHeader}>
            {['월', '화', '수', '목', '금', '토', '일'].map((w, idx) => (
              <Text key={`week-${idx}`} style={styles.weekHeaderText}>
                {w}
              </Text>
            ))}
          </View>

          {/* 날짜 격자 */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#123F9F" />
            </View>
          ) : (
            <View style={styles.calendarGrid}>{renderCalendar()}</View>
          )}
        </View>

        {/* 일간 상세 내역 리스트 */}
        {selectedDate && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>
                {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 상세 내역
              </Text>
              <Pressable onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={24} color="#8E8E93" />
              </Pressable>
            </View>

            {detailsLoading ? (
              <ActivityIndicator size="small" color="#123F9F" style={{ marginVertical: 20 }} />
            ) : dailyDetails.length === 0 ? (
              <Text style={styles.emptyDetailsText}>거래 내역이 없는 날입니다.</Text>
            ) : (
              dailyDetails.map((item) => {
                const isIncome = item.type === 'INCOME';
                const catInfo = CATEGORIES.find((c) => c.key === item.category);

                return (
                  <View key={item.id} style={styles.detailItemRow}>
                    <View style={styles.detailLeft}>
                      <View
                        style={[
                          styles.detailIconCircle,
                          { backgroundColor: isIncome ? '#E5F1FF' : '#FFEBEA' },
                        ]}
                      >
                        <Ionicons
                          name={isIncome ? 'wallet-outline' : (catInfo?.icon as any || 'basket-outline')}
                          size={20}
                          color={isIncome ? '#123F9F' : (catInfo?.color || '#FF3B30')}
                        />
                      </View>
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailTitleText}>{item.title}</Text>
                        <Text style={styles.detailSubText}>
                          {isIncome ? '충전' : catInfo?.label} {item.description ? `• ${item.description}` : ''}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.detailAmountText,
                        { color: isIncome ? '#123F9F' : '#FF3B30' },
                      ]}
                    >
                      {isIncome ? '+' : '-'}€{item.amount.toLocaleString('ko-KR')}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* 1. 잔액 충전 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={chargeModalVisible}
        onRequestClose={() => setChargeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>잔액 충전</Text>
                <Pressable onPress={() => {
                  Keyboard.dismiss();
                  setChargeModalVisible(false);
                }}>
                  <Ionicons name="close" size={24} color="#000" />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>충전 금액 (€)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 50.5"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={chargeAmount}
                onChangeText={setChargeAmount}
              />

              <Text style={styles.inputLabel}>내역 설명</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 용돈 입금, 비상금 충전"
                placeholderTextColor="#C7C7CC"
                value={chargeTitle}
                onChangeText={setChargeTitle}
              />

              <Pressable style={styles.submitModalButton} onPress={handleChargeSubmit}>
                <Text style={styles.submitModalButtonText}>충전하기</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. 지출 등록 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={expenseModalVisible}
        onRequestClose={closeExpenseModal}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboardAndTabletPicker} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {showDatePicker && isTabletDatePicker && (
                <Pressable
                  style={styles.tabletPickerDismissLayer}
                  onPress={() => setShowDatePicker(false)}
                />
              )}

              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  지출 등록 ({CATEGORIES.find((c) => c.key === selectedCategory)?.label})
                </Text>
                <Pressable onPress={closeExpenseModal}>
                  <Ionicons name="close" size={24} color="#000" />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>지출 금액 (€)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 12.5"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />

              <Text style={styles.inputLabel}>내역 이름 (필수)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 점심 학식, 에펠탑 티켓"
                placeholderTextColor="#C7C7CC"
                value={expenseTitle}
                onChangeText={setExpenseTitle}
              />

              <Text style={styles.inputLabel}>메모 (선택)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 마트 장보기 지출"
                placeholderTextColor="#C7C7CC"
                value={expenseDescription}
                onChangeText={setExpenseDescription}
              />

              <Text style={styles.inputLabel}>거래 일자 (선택)</Text>
              <View style={[styles.datePickerAnchor, showDatePicker && isTabletDatePicker && styles.datePickerAnchorOpen]}>
                <Pressable
                  style={styles.dateSelectorField}
                  onPress={openDatePicker}
                  accessibilityRole="button"
                  accessibilityLabel="거래 일자 달력 열기"
                >
                  <Text style={[styles.dateSelectorText, !expenseDate && styles.dateSelectorPlaceholder]}>
                    {expenseDate || formatDate(new Date())}
                  </Text>
                  <View style={styles.dateSelectorButton}>
                    <Ionicons name="calendar-outline" size={22} color="#8E8E93" />
                  </View>
                </Pressable>

                {showDatePicker && isTabletDatePicker && (
                  <View style={styles.tabletPickerPopover}>
                    <View style={styles.tabletPickerHeader}>
                      <Text style={styles.tabletPickerTitle}>거래 일자 선택</Text>
                      <Pressable
                        style={styles.tabletPickerCloseButton}
                        onPress={() => setShowDatePicker(false)}
                        accessibilityRole="button"
                        accessibilityLabel="거래 일자 달력 닫기"
                      >
                        <Ionicons name="close" size={18} color="#8E8E93" />
                      </Pressable>
                    </View>

                    <DateTimePicker
                      value={expenseDateValue}
                      mode="date"
                      display="inline"
                      locale="ko-KR"
                      textColor="#111111"
                      accentColor="#123F9F"
                      themeVariant="light"
                      style={styles.tabletInlinePicker}
                      onChange={onDateChange}
                    />
                  </View>
                )}
              </View>

              <Pressable
                style={[styles.submitModalButton, { backgroundColor: '#FF3B30' }]}
                onPress={handleExpenseSubmit}
              >
                <Text style={styles.submitModalButtonText}>지출 기록하기</Text>
              </Pressable>
            </View>

            {showDatePicker && Platform.OS === 'ios' && !isTabletDatePicker && (
              <View style={styles.pickerOverlay}>
                <Pressable
                  style={styles.pickerBackdrop}
                  onPress={() => setShowDatePicker(false)}
                />

                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerCancel}>취소</Text>
                    </Pressable>

                    <Text style={styles.pickerTitle}>거래 일자 선택</Text>

                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDone}>완료</Text>
                    </Pressable>
                  </View>

                  <DateTimePicker
                    value={expenseDateValue}
                    mode="date"
                    display="inline"
                    locale="ko-KR"
                    textColor="#111111"
                    accentColor="#123F9F"
                    themeVariant="light"
                    style={styles.iosPicker}
                    onChange={onDateChange}
                  />
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={expenseDateValue}
          mode="date"
          display="calendar"
          onChange={onDateChange}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8A8A8F',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1C1C1E',
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: -1,
  },
  chargePlusButton: {
    padding: 4,
  },
  progressContainer: {
    marginTop: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFCC00',
    borderRadius: 4,
  },
  limitLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  percentageLabel: {
    color: '#FFCC00',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    width: (width - 40) / 5 - 8,
  },
  categoryIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
    textAlign: 'center',
  },
  summaryBar: {
    marginHorizontal: 20,
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryChipBlue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryBlueText: {
    color: '#123F9F',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryChipRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryRedText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '700',
  },
  calendarContainer: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFF4',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chevronButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF4',
    paddingBottom: 8,
    width: '100%',
  },
  weekHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8F',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDayCell: {
    width: '14.28%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    marginVertical: 1,
    borderRadius: 8,
  },
  selectedDayCell: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#123F9F',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedDayText: {
    fontWeight: '800',
    color: '#123F9F',
  },
  summaryLabelContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
  },
  incomeBadgeText: {
    fontSize: 8,
    color: '#123F9F',
    fontWeight: '700',
  },
  expenseBadgeText: {
    fontSize: 8,
    color: '#FF3B30',
    fontWeight: '700',
  },
  loaderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EFEFF4',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingBottom: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  emptyDetailsText: {
    textAlign: 'center',
    color: '#8A8A8F',
    marginVertical: 20,
    fontSize: 14,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  detailSubText: {
    fontSize: 12,
    color: '#8A8A8F',
    marginTop: 2,
  },
  detailAmountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    overflow: 'visible',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A3A3C',
    marginBottom: 8,
    marginTop: 14,
  },
  modalInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  datePickerAnchor: {
    position: 'relative',
  },
  datePickerAnchorOpen: {
    zIndex: 20,
  },
  dateSelectorField: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingLeft: 16,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  dateSelectorPlaceholder: {
    color: '#C7C7CC',
  },
  dateSelectorButton: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletPickerDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  tabletPickerPopover: {
    position: 'absolute',
    right: 0,
    bottom: 62,
    width: 350,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  tabletPickerHeader: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tabletPickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  tabletPickerCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  tabletInlinePicker: {
    width: '100%',
    height: 320,
    backgroundColor: '#FFFFFF',
  },
  submitModalButton: {
    height: 54,
    backgroundColor: '#123F9F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  submitModalButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  pickerHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#777777',
    fontWeight: '700',
  },
  pickerTitle: {
    fontSize: 17,
    color: '#111111',
    fontWeight: '900',
  },
  pickerDone: {
    fontSize: 16,
    color: '#123F9F',
    fontWeight: '800',
  },
  iosPicker: {
    height: 360,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
});
