import XIcon from "@/assets/icon/x-icon.svg";
import { Text, TextInput } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  bottomSheetStyles,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type TransactionType = "INCOME" | "EXPENSE";
const expenseTags = ["식비", "교통비", "쇼핑", "여행", "기타"] as const;

type TransactionModalProps = {
  visible: boolean;
  type: TransactionType;
  amount: string;
  title: string;
  description: string;
  transactionDate: string;
  dateValue: Date;
  showDatePicker: boolean;
  isTabletDatePicker: boolean;
  onChangeType: (type: TransactionType) => void;
  onChangeAmount: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeDate: (event: any, date?: Date) => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDismissKeyboardAndPicker: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

const formatDatePart = (date: string, index: number, fallback: string) =>
  date.split("-")[index] || fallback;

export function TransactionModal({
  visible,
  type,
  amount,
  title,
  description,
  transactionDate,
  dateValue,
  showDatePicker,
  isTabletDatePicker,
  onChangeType,
  onChangeAmount,
  onChangeTitle,
  onChangeDescription,
  onChangeDate,
  onOpenDatePicker,
  onCloseDatePicker,
  onDismissKeyboardAndPicker,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  // UI-only selection; intentionally separate from the submitted category.
  const [selectedTag, setSelectedTag] = useState<(typeof expenseTags)[number]>("식비");
  const [tagRowHeight, setTagRowHeight] = useState(
    fonts.sub4_sb_14.lineHeight + 20,
  );
  const isIncome = type === "INCOME";
  const handleClose = () => {
    Keyboard.dismiss();
    onCloseDatePicker();
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={handleClose}
      onAfterClose={() => {
        onChangeType("INCOME");
        setSelectedTag("식비");
      }}
    >
      <TouchableWithoutFeedback
        onPress={onDismissKeyboardAndPicker}
        accessible={false}
      >
        <View style={[styles.overlay, bottomSheetStyles.transparent]}>
          <BottomSheetView style={styles.content}>
            {showDatePicker && isTabletDatePicker && (
              <Pressable
                style={styles.dismissLayer}
                onPress={onCloseDatePicker}
              />
            )}

            <View style={styles.header}>
              <Text style={fonts.title3_b_24}>입출금 등록하기</Text>
              <Pressable onPress={handleClose} accessibilityLabel="모달 닫기">
                <XIcon />
              </Pressable>
            </View>

            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, isIncome && styles.activeTab]}
                onPress={() => onChangeType("INCOME")}
              >
                <Text
                  style={[styles.tabText, isIncome && styles.activeTabText]}
                >
                  입금 등록
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, !isIncome && styles.activeTab]}
                onPress={() => onChangeType("EXPENSE")}
              >
                <Text
                  style={[styles.tabText, !isIncome && styles.activeTabText]}
                >
                  출금 등록
                </Text>
              </Pressable>
            </View>

            <View
              style={[styles.tagRow, isIncome && styles.hiddenTagRow]}
              onLayout={(event) => setTagRowHeight(event.nativeEvent.layout.height)}
              pointerEvents={isIncome ? "none" : "auto"}
              accessibilityElementsHidden={isIncome}
              importantForAccessibility={isIncome ? "no-hide-descendants" : "auto"}
              aria-hidden={isIncome}
            >
                {expenseTags.map((tag) => {
                  const selected = selectedTag === tag;
                  return (
                    <Pressable
                      key={tag}
                      accessibilityRole="radio"
                      accessibilityLabel={tag}
                      accessibilityState={{ checked: selected }}
                      disabled={isIncome}
                      onPress={() => setSelectedTag(tag)}
                      style={[styles.tag, selected && styles.selectedTag]}
                    >
                      <Text style={[styles.tagText, selected && styles.selectedTagText]}>
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>

            <View style={{ gap: 24 }}>
              <View>
                <Text style={styles.label}>
                  {isIncome ? "입금 일자" : "출금 일자"}
                </Text>
                <View style={styles.dateRow}>
                  {[0, 1, 2].map((index) => (
                    <Pressable
                      key={index}
                      style={styles.dateField}
                      onPress={onOpenDatePicker}
                    >
                      <Text style={styles.dateText}>
                        {formatDatePart(
                          transactionDate,
                          index,
                          index === 0 ? "2026" : "01",
                        )}
                      </Text>
                      <Ionicons name="chevron-down" size={21} color="#111111" />
                    </Pressable>
                  ))}
                </View>
              </View>

              {showDatePicker && isTabletDatePicker && (
                <View style={styles.tabletPicker}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>거래 일자 선택</Text>
                    <Pressable onPress={onCloseDatePicker}>
                      <Ionicons name="close" size={18} color="#8E8E93" />
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={dateValue}
                    mode="date"
                    display="inline"
                    locale="ko-KR"
                    textColor="#111111"
                    accentColor="#506AFF"
                    themeVariant="light"
                    style={styles.iosPicker}
                    onChange={onChangeDate}
                  />
                </View>
              )}
              <View>
                <Text style={styles.label}>
                  {isIncome ? "입금 금액" : "출금 금액"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="금액을 입력해주세요"
                  placeholderTextColor="#A8B0BB"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={onChangeAmount}
                />
              </View>
              <View>
                <Text style={styles.label}>내역 이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="내역 이름을 입력해주세요"
                  placeholderTextColor="#A8B0BB"
                  value={title}
                  onChangeText={onChangeTitle}
                />
              </View>
            </View>
            {/* {!isIncome && (
              <>
                <Text style={styles.label}>메모 (선택)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="메모를 입력해주세요"
                  placeholderTextColor="#A8B0BB"
                  value={description}
                  onChangeText={onChangeDescription}
                />
              </>
            )} */}

            {isIncome && (
              <View
                pointerEvents="none"
                style={{ height: tagRowHeight + styles.tagRow.marginBottom }}
              />
            )}
            <Pressable style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitButtonText}>등록하기</Text>
            </Pressable>
          </BottomSheetView>

          {showDatePicker && Platform.OS === "ios" && !isTabletDatePicker && (
            <View style={[styles.pickerOverlay, bottomSheetStyles.transparent]}>
              <Pressable
                style={[styles.pickerBackdrop, bottomSheetStyles.transparent]}
                onPress={onCloseDatePicker}
              />
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Pressable onPress={onCloseDatePicker}>
                    <Text style={styles.cancelText}>취소</Text>
                  </Pressable>
                  <Text style={styles.pickerTitle}>거래 일자 선택</Text>
                  <Pressable onPress={onCloseDatePicker}>
                    <Text style={styles.doneText}>완료</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="inline"
                  locale="ko-KR"
                  textColor="#111111"
                  accentColor="#506AFF"
                  themeVariant="light"
                  style={styles.iosPicker}
                  onChange={onChangeDate}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="calendar"
          onChange={onChangeDate}
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    overflow: "visible",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    height: 42,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: "#252C37",
  },
  tabText: {
    ...fonts.body2_m_14,
    color: Colors.gray[6],
  },
  activeTabText: {
    ...fonts.sub4_sb_14,
    color: Colors.gray[11],
  },
  label: {
    ...fonts.sub4_sb_14,
    color: Colors.gray[8],
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  hiddenTagRow: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 0,
    opacity: 0,
  },
  tag: {
    borderRadius: 100,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray[1],
  },
  selectedTag: {
    backgroundColor: Colors.gray[11],
  },
  tagText: {
    ...fonts.sub4_sb_14,
    color: Colors.gray[7],
  },
  selectedTagText: {
    color: Colors.common.white,
  },
  dateRow: {
    flexDirection: "row",
    gap: 6,
  },
  dateField: {
    flex: 1,
    height: 58,
    borderWidth: 1,
    borderColor: "#DDE2E8",
    borderRadius: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 17,
    color: "#1C1C1E",
    fontWeight: "600",
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: "#DDE2E8",
    borderRadius: 11,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1C1C1E",
  },
  submitButton: {
    height: 60,
    marginTop: 30,
    borderRadius: 11,
    backgroundColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    ...fonts.sub3_sb_16,
    color: Colors.common.white,
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  tabletPicker: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 14,
    overflow: "hidden",
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  pickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    overflow: "hidden",
  },
  pickerHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  pickerTitle: {
    fontSize: 17,
    color: "#111111",
    fontWeight: "800",
  },
  cancelText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "700",
  },
  doneText: {
    fontSize: 16,
    color: "#506AFF",
    fontWeight: "800",
  },
  iosPicker: {
    height: 360,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
});
