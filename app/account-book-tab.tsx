import { Text } from "@/components/ui/app-text";
import Button from "@/components/ui/button";
import { Modal as AppModal } from "@/components/ui/modal";
import { AppBackButton } from "@/components/ui/app-back-button";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts, commonStyles } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import DetailIcon from "../assets/icon/detail.svg";
import EditIcon from "../assets/icon/edit.svg";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ArrowLeftIcon from "../assets/icon/arrow-left.svg";
import ArrowRightIcon from "../assets/icon/arrow-right.svg";
import { MonthlyManagementCard } from "../components/account-book/monthly-management-card";
import { MonthlySummary } from "../components/account-book/monthly-summary";
import { TransactionModal } from "../components/account-book/transaction-modal";
import {
  AccountBookCategory,
  AccountBookResponse,
  addAccountBookTransaction,
  getAccountBookBalance,
  deleteAccountBookTransaction,
  getAccountBookDailyDetails,
  updateAccountBookTransaction,
  getAccountBookMonthlySummary,
} from "../src/api/accountBook";
import { getMemberMe } from "../src/api/auth";
import { validateTransactionInput } from "@/components/account-book/transaction-validation";
import EmptyState from "@/components/ui/empty-state";

const { width } = Dimensions.get("window");

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

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
}[] = [
  { key: "FOOD", label: "식비" },
  { key: "TRANSPORT", label: "교통비" },
  { key: "SHOPPING", label: "쇼핑" },
  { key: "TRAVEL", label: "여행" },
  {
    key: "ETC",
    label: "기타 지출",
  },
];

export default function AccountBookTab({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { fromHome, fromService } = useLocalSearchParams<{
    fromHome?: string | string[];
    fromService?: string | string[];
  }>();
  const showBackButton =
    (Array.isArray(fromHome) ? fromHome[0] : fromHome) === "true" ||
    (Array.isArray(fromService) ? fromService[0] : fromService) === "true";
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
  const [transactionModalVisible, setTransactionModalVisible] =
    useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">(
    "INCOME",
  );

  // 모달 입력값 상태 관리
  const [chargeAmount, setChargeAmount] = useState<string>("");
  const [chargeTitle, setChargeTitle] = useState<string>("잔액 충전");

  const [selectedCategory, setSelectedCategory] =
    useState<AccountBookCategory>("FOOD");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expenseTitle, setExpenseTitle] = useState<string>("");
  const [expenseDescription, setExpenseDescription] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(""); // YYYY-MM-DD

  // 날짜 피커 상태
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [expenseDateValue, setExpenseDateValue] = useState<Date>(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const onDateChange = (selectedDate: Date) => {
    setExpenseDateValue(selectedDate);
    setExpenseDate(formatDate(selectedDate));
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpenseDateValue(parseDateInput(expenseDate) || new Date());
    setShowDatePicker(true);
  };

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    description: string;
  }>({ visible: false, title: "", description: "" });
  const insets = useSafeAreaInsets();
  const [actionItem, setActionItem] = useState<AccountBookResponse | null>(
    null,
  );
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const closeActionSheet = () => setActionSheetVisible(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountBookResponse | null>(
    null,
  );
  const [deleteVisible, setDeleteVisible] = useState(false);

  const refreshAfterChange = () => {
    fetchData();
    if (selectedDate) fetchDailyDetails(selectedDate);
  };

  const pendingAction = React.useRef<(() => void) | null>(null);

  const runAfterSheetClose = (action: () => void) => {
    pendingAction.current = action;
    closeActionSheet();
  };

  const handleActionSheetAfterClose = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };

  const handleEditPress = () => {
    const item = actionItem;
    if (!item) return;
    runAfterSheetClose(() => {
      setEditingId(item.id);
      setTransactionType(item.type);
      setExpenseDate(item.transactionDate);
      setExpenseDateValue(parseDateInput(item.transactionDate) || new Date());
      if (item.type === "INCOME") {
        setChargeAmount(String(item.amount));
        setChargeTitle(item.title);
      } else {
        setSelectedCategory(item.category);
        setExpenseAmount(String(item.amount));
        setExpenseTitle(item.title);
        setExpenseDescription(item.description ?? "");
      }
      setShowDatePicker(false);
      setTransactionModalVisible(true);
    });
  };

  const handleDeletePress = () => {
    const item = actionItem;
    if (!item) return;
    runAfterSheetClose(() => {
      setDeleteTarget(item);
      setDeleteVisible(true);
    });
  };

  const handleDeleteConfirm = async () => {
    const target = deleteTarget;
    setDeleteVisible(false);
    if (!target) return;
    try {
      await deleteAccountBookTransaction(target.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshAfterChange();
    } catch {
      showAlert("삭제 실패", "내역 삭제에 실패했습니다.", 300);
    }
  };

  const showAlert = (title: string, description: string, delay = 0) => {
    const open = () => setAlertState({ visible: true, title, description });
    if (delay) setTimeout(open, delay);
    else open();
  };

  const closeExpenseModal = () => {
    Keyboard.dismiss();
    setEditingId(null);
    setShowDatePicker(false);
    setTransactionModalVisible(false);
  };

  const dismissKeyboardAndTabletPicker = () => {
    Keyboard.dismiss();
    setShowDatePicker(false);
  };

  const openTransactionModal = (type: "INCOME" | "EXPENSE") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingId(null);
    const today = new Date();
    setTransactionType(type);
    setExpenseDate(formatDate(today));
    setExpenseDateValue(today);
    setShowDatePicker(false);
    setTransactionModalVisible(true);
  };

  // 기본 데이터 불러오기
  const fetchData = async () => {
    setLoading(true);
    try {
      try {
        const memberRes = await getMemberMe();
        if (memberRes.data?.data) {
          setBalance(memberRes.data.data.balance || 0);
        } else {
          const balanceRes = await getAccountBookBalance();
          setBalance(balanceRes.data?.data?.balance || 0);
        }
      } catch (memberError) {
        console.log("내 정보 조회 실패, 기존 잔액 가져오기 시도:", memberError);
        const balanceRes = await getAccountBookBalance();
        setBalance(balanceRes.data?.data?.balance || 0);
      }

      // 2. 월간 요약 가져오기
      const summaryRes = await getAccountBookMonthlySummary(
        currentYear,
        currentMonth + 1,
      );
      setMonthlySummary(
        summaryRes.data?.data || {
          totalIncome: 0,
          totalExpense: 0,
          dailySummaries: {},
        },
      );
    } catch (error: any) {
      console.log(
        "가계부 데이터 로드 실패:",
        error.response?.data || error.message,
      );
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
      console.log(
        "일별 상세 조회 실패:",
        error.response?.data || error.message,
      );
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const today = new Date();

      setCurrentDate(today);
      fetchDailyDetails(formatDate(today));
    }, [fetchDailyDetails]),
  );

  // 잔액 충전(수입 추가) API 호출
  const handleChargeSubmit = async () => {
    if (!validateTransactionInput(chargeAmount, chargeTitle, true).isValid)
      return;
    const amountNum = Number(chargeAmount);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const payload = {
        amount: amountNum,
        type: "INCOME" as const,
        category: "CHARGE" as const,
        title: chargeTitle.trim() || "잔액 충전",
        transactionDate: expenseDate || new Date().toISOString().split("T")[0],
      };
      if (editingId !== null) {
        await updateAccountBookTransaction(editingId, payload);
      } else {
        await addAccountBookTransaction(payload);
      }

      showAlert(
        editingId !== null ? "수정 완료" : "충전 완료",
        editingId !== null
          ? "내역이 수정되었습니다."
          : "성공적으로 잔액이 충전되었습니다.",
        400,
      );
      closeExpenseModal();
      setChargeAmount("");
      setChargeTitle("잔액 충전");

      // 데이터 즉시 갱신
      fetchData();
      if (selectedDate) fetchDailyDetails(selectedDate);
    } catch (error: any) {
      showAlert(
        editingId !== null ? "수정 실패" : "충전 실패",
        editingId !== null
          ? "내역 수정에 실패했습니다."
          : "금액 충전에 실패했습니다.",
      );
    }
  };

  // 지출 등록 API 호출
  const handleExpenseSubmit = async () => {
    if (!validateTransactionInput(expenseAmount, expenseTitle, false).isValid)
      return;
    const amountNum = Number(expenseAmount);

    if (!parseDateInput(expenseDate)) {
      showAlert(
        "입력 오류",
        "날짜 형식은 YYYY-MM-DD 여야 하며 실제 존재하는 날짜여야 합니다.",
      );
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const payload = {
        amount: amountNum,
        type: "EXPENSE" as const,
        category: selectedCategory,
        title: expenseTitle.trim(),
        description: expenseDescription.trim() || undefined,
        transactionDate: expenseDate,
      };
      if (editingId !== null) {
        await updateAccountBookTransaction(editingId, payload);
      } else {
        await addAccountBookTransaction(payload);
      }

      showAlert(
        editingId !== null ? "수정 완료" : "등록 완료",
        editingId !== null
          ? "내역이 수정되었습니다."
          : "지출 내역이 성공적으로 등록되었습니다.",
        400,
      );
      closeExpenseModal();
      setExpenseAmount("");
      setExpenseTitle("");
      setExpenseDescription("");

      // 데이터 즉시 갱신
      fetchData();
      if (selectedDate) fetchDailyDetails(selectedDate);
    } catch (error: any) {
      showAlert(
        editingId !== null ? "수정 실패" : "등록 실패",
        editingId !== null
          ? "내역 수정에 실패했습니다."
          : "지출 등록에 실패했습니다.",
      );
    }
  };

  // 월 전환 처리
  const changeMonth = (direction: "prev" | "next") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(null);
    setDailyDetails([]);
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (direction === "prev") {
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
    openTransactionModal("EXPENSE");
  };

  // 캘린더 날짜 격자 생성 로직
  const renderCalendar = () => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // 1일의 요일 알아내기 (일요일(0) 시작으로 계산)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];

    // 지난 달 빈칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
    }

    // 이번 달 날짜 채우기
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr =
        currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
      const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const summary = monthlySummary.dailySummaries[fullDateStr];
      const isSelected = selectedDate === fullDateStr;
      const today = fullDateStr === formatDate(new Date());
      const dailyTotal = summary ? summary.income - summary.expense : 0;

      days.push(
        <Pressable
          key={`day-${day}`}
          style={[styles.calendarDayCell, isSelected && styles.selectedDayCell]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            fetchDailyDetails(fullDateStr);
          }}
        >
          <View
            style={[
              {
                height: 24,
                width: 24,
                position: "relative",
                justifyContent: "center",
                alignItems: "center",
              },
              today && {
                backgroundColor: "#506AFF",
                borderRadius: 100,
              },
            ]}
          >
            <Text style={[fonts.caption3_m_13, today && { color: "#FFFFFF" }]}>
              {day}
            </Text>
          </View>
          {dailyTotal !== 0 && (
            <Text
              style={[
                fonts.caption2_sb_12,
                styles.dailyTotalText,
                dailyTotal > 0 ? { color: "#506AFF" } : { color: "#FF3636" },
              ]}
              numberOfLines={1}
            >
              {dailyTotal > 0 ? "+" : ""}
              {dailyTotal.toLocaleString("ko-KR", {})}
            </Text>
          )}
        </Pressable>,
      );
    }

    return days;
  };

  const Container = embedded ? View : SafeAreaView;

  return (
    <Container style={embedded ? { flex: 1 } : commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        {!embedded && (
          <View style={commonStyles.header}>
            {showBackButton ? <AppBackButton fallbackHref="/home" /> : null}
            <Text style={fonts.sub3_sb_16}>지출 관리</Text>
            {showBackButton ? <View style={commonStyles.headerSpacer} /> : null}
          </View>
        )}

        <View style={styles.contentSections}>
          <MonthlyManagementCard
            balance={balance}
            totalIncome={monthlySummary.totalIncome}
            onPressCharge={() => {
              openTransactionModal("INCOME");
            }}
          />

          {/* 월간 수입/지출 체크 표시 (캘린더 상단 요약) */}
          <MonthlySummary
            month={currentMonth + 1}
            totalIncome={monthlySummary.totalIncome}
            totalExpense={monthlySummary.totalExpense}
          />

          {/* 달력 일정 영역 */}
          <View>
            <Text style={fonts.title5_b_20}>나의 지출 관리</Text>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Pressable
                  onPress={() => changeMonth("prev")}
                  style={styles.chevronButton}
                >
                  <ArrowLeftIcon />
                </Pressable>
                <Text style={fonts.sub3_sb_16}>
                  {currentYear}년 {currentMonth + 1}월
                </Text>
                <Pressable
                  onPress={() => changeMonth("next")}
                  style={styles.chevronButton}
                >
                  <ArrowRightIcon />
                </Pressable>
              </View>

              {/* 요일 헤더 */}
              <View style={styles.weekHeader}>
                {["일", "월", "화", "수", "목", "금", "토"].map((w, idx) => (
                  <Text
                    key={`week-${idx}`}
                    style={[
                      fonts.caption3_m_13,
                      {
                        color: "#8B95A1",
                        width: "14.28%",
                        textAlign: "center",
                      },
                    ]}
                  >
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
          </View>
        </View>

        {/* 일간 상세 내역 리스트 */}
        {selectedDate && (
          <View style={styles.detailsContainer}>
            {detailsLoading ? (
              <ActivityIndicator
                size="small"
                color="#123F9F"
                style={{
                  minHeight: 210,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 28,
                }}
              />
            ) : dailyDetails.length === 0 ? (
              <EmptyState
                title="거래 내역이 없는 날입니다"
                description="새로운 거래 내역을 등록해보세요."
              />
            ) : (
              dailyDetails.map((item) => {
                const isIncome = item.type === "INCOME";
                const catInfo = CATEGORIES.find((c) => c.key === item.category);

                return (
                  <View key={item.id} style={styles.detailItemRow}>
                    <View style={styles.detailLeft}>
                      <View style={styles.detailIconPlaceholder} />
                      <View style={styles.detailTextCol}>
                        <Text style={fonts.body1_m_16}>{item.title}</Text>
                        <Text
                          style={[fonts.caption3_m_13, { color: "#6B7684" }]}
                        >
                          {isIncome
                            ? "입금 내역"
                            : `출금 내역 • ${catInfo?.label}`}
                          {item.description ? `• ${item.description}` : ""}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        fonts.sub3_sb_16,
                        { color: isIncome ? "#506AFF" : "#FF3636" },
                      ]}
                    >
                      {isIncome ? "+" : "-"}
                      {item.amount.toLocaleString("ko-KR", {})}
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        setActionItem(item);
                        setActionSheetVisible(true);
                      }}
                    >
                      <DetailIcon />
                    </Pressable>
                  </View>
                );
              })
            )}
            <Button
              onPress={() => openTransactionModal("EXPENSE")}
              title="입출금 등록하기"
              style={{ marginTop: 20 }}
            />
          </View>
        )}
      </ScrollView>

      {/* 1. 잔액 충전 모달 */}
      <TransactionModal
        visible={transactionModalVisible}
        isEditing={editingId !== null}
        category={selectedCategory}
        onChangeCategory={setSelectedCategory}
        type={transactionType}
        amount={transactionType === "INCOME" ? chargeAmount : expenseAmount}
        title={transactionType === "INCOME" ? chargeTitle : expenseTitle}
        transactionDate={expenseDate}
        dateValue={expenseDateValue}
        showDatePicker={showDatePicker}
        onChangeType={setTransactionType}
        onChangeAmount={
          transactionType === "INCOME" ? setChargeAmount : setExpenseAmount
        }
        onChangeTitle={
          transactionType === "INCOME" ? setChargeTitle : setExpenseTitle
        }
        onChangeDate={onDateChange}
        onOpenDatePicker={openDatePicker}
        onCloseDatePicker={() => setShowDatePicker(false)}
        onDismissKeyboardAndPicker={dismissKeyboardAndTabletPicker}
        onClose={closeExpenseModal}
        onSubmit={
          transactionType === "INCOME"
            ? handleChargeSubmit
            : handleExpenseSubmit
        }
      />

      <BottomSheetModal
        visible={actionSheetVisible}
        onRequestClose={closeActionSheet}
        onAfterClose={handleActionSheetAfterClose}
      >
        <View style={styles.actionOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="메뉴 닫기"
            onPress={closeActionSheet}
          />
          <BottomSheetView style={styles.actionSheet}>
            <View style={styles.actionContent}>
              <View style={styles.actionHandle} />
              <Pressable
                accessibilityRole="button"
                style={styles.actionOption}
                onPress={handleEditPress}
              >
                <EditIcon />
                <Text style={styles.actionText}>수정하기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.actionOption}
                onPress={handleDeletePress}
              >
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={Colors.gray[10]}
                />
                <Text style={styles.actionText}>삭제하기</Text>
              </Pressable>
            </View>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetView>
        </View>
      </BottomSheetModal>
      <AppModal
        isOpen={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        title="내역을 삭제할까요?"
        description="삭제한 내역은 복구할 수 없고, 잔액과 요약에 바로 반영돼요."
        primaryButton={{
          label: "삭제",
          tone: "destructive",
          onPress: handleDeleteConfirm,
        }}
        secondaryButton={{
          label: "취소",
          onPress: () => setDeleteVisible(false),
        }}
      />
      <AppModal
        isOpen={alertState.visible}
        onClose={() => setAlertState((c) => ({ ...c, visible: false }))}
        title={alertState.title}
        description={alertState.description}
        primaryButton={{
          label: "확인했어요",
          onPress: () => setAlertState((c) => ({ ...c, visible: false })),
        }}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  actionOverlay: { flex: 1, justifyContent: "flex-end" },
  actionSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  actionContent: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 12,
  },
  actionHandle: {
    position: "absolute",
    top: 9,
    alignSelf: "center",
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D2D6DC",
  },
  actionOption: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionText: { ...fonts.body1_m_16, color: Colors.gray[10] },
  scrollContent: {
    paddingBottom: 40,
  },
  registerTransactionButton: {
    height: 60,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#506AFF",
  },
  registerTransactionButtonText: {
    color: "#FFFFFF",
    ...fonts.sub3_sb_16,
  },
  contentSections: {
    gap: 24,
    paddingHorizontal: 16,
  },
  headerSpacer: {
    width: 38,
    marginLeft: 0,
  },
  progressContainer: {
    marginTop: 24,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  progressValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFCC00",
    borderRadius: 4,
  },
  limitLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  percentageLabel: {
    color: "#FFCC00",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: "center",
    width: (width - 40) / 5 - 8,
  },
  categoryIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A3A3C",
    textAlign: "center",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#EFEFF4",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },
  chevronButton: {
    paddingHorizontal: 40,
  },
  calendarMonthText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    width: "100%",
  },
  weekHeaderText: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#8A8A8F",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  calendarDayCell: {
    position: "relative",
    width: "14.28%",
    height: 47,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
    marginVertical: 1,
    borderRadius: 8,
  },
  selectedDayCell: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#506AFF",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  selectedDayText: {
    fontWeight: "800",
    color: "#123F9F",
  },
  summaryLabelContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 2,
  },
  dailyTotalText: {
    position: "absolute",
    top: 29,
    left: 0,
    right: 0,
    textAlign: "center",
  },
  incomeBadgeText: {
    fontSize: 8,
    color: "#123F9F",
    fontWeight: "700",
  },
  expenseBadgeText: {
    fontSize: 8,
    color: "#FF3B30",
    fontWeight: "700",
  },
  loaderContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsContainer: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
    paddingBottom: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  emptyDetailsText: {
    textAlign: "center",
    color: "#8A8A8F",
    marginVertical: 20,
    fontSize: 14,
  },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginVertical: 10,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailIconPlaceholder: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  detailSubText: {
    fontSize: 12,
    color: "#8A8A8F",
    marginTop: 2,
  },
  detailAmountText: {
    fontSize: 15,
    fontWeight: "800",
  },
});
