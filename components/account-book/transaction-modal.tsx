import XIcon from "@/assets/icon/x-icon.svg";
import InputField from "@/components/ui/input-field";
import { validateTransactionInput } from "./transaction-validation";
import { Text, TextInput } from "@/components/ui/app-text";
import ErrorIcon from "@/assets/icon/error.svg";
import {
  BottomSheetModal,
  bottomSheetStyles,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts, commonStyles } from "@/constants/theme";
import CalanderFillIcon from "@/assets/icon/calendar-fill.svg";
import CalendarModal from "@/components/ui/calendar";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import Button from "../ui/button";

type TransactionType = "INCOME" | "EXPENSE";
const expenseTags = ["식비", "교통비", "쇼핑", "여행", "기타"] as const;

const tagCategory = {
  식비: "FOOD",
  교통비: "TRANSPORT",
  쇼핑: "SHOPPING",
  여행: "TRAVEL",
  기타: "ETC",
} as const;

type TransactionModalProps = {
  category?: string;
  onChangeCategory?: (
    category: (typeof tagCategory)[keyof typeof tagCategory],
  ) => void;
  visible: boolean;
  isEditing?: boolean;
  type: TransactionType;
  amount: string;
  title: string;
  transactionDate: string;
  dateValue: Date;
  showDatePicker: boolean;
  onChangeType: (type: TransactionType) => void;
  onChangeAmount: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onChangeDate: (date: Date) => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDismissKeyboardAndPicker: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function TransactionModal({
  category,
  onChangeCategory,
  visible,
  isEditing = false,
  type,
  amount,
  title,
  transactionDate,
  dateValue,
  showDatePicker,
  onChangeType,
  onChangeAmount,
  onChangeTitle,
  onChangeDate,
  onOpenDatePicker,
  onCloseDatePicker,
  onDismissKeyboardAndPicker,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  // UI-only selection; intentionally separate from the submitted category.
  const [selectedTag, setSelectedTag] =
    useState<(typeof expenseTags)[number]>("식비");
  const [tagRowHeight, setTagRowHeight] = useState(
    fonts.sub4_sb_14.lineHeight + 20,
  );
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fieldsY = useRef(0);
  const amountY = useRef(0);
  const titleY = useRef(0);
  const scrollFieldToTop = (fieldY: number) => {
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: fieldsY.current + fieldY,
          animated: true,
        }),
      350,
    );
  };
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const isIncome = type === "INCOME";
  const handleClose = () => {
    Keyboard.dismiss();
    onCloseDatePicker();
    onClose();
  };

  const { amountError, titleError, isValid } = validateTransactionInput(
    amount,
    title,
    isIncome,
  );

  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={handleClose}
      onAfterClose={() => {
        onChangeType("INCOME");
        setSelectedTag("식비");
        onChangeCategory?.("FOOD");
      }}
    >
      <TouchableWithoutFeedback
        onPress={onDismissKeyboardAndPicker}
        accessible={false}
      >
        <View style={[styles.overlay, bottomSheetStyles.transparent]}>
          <BottomSheetView style={styles.content}>
            <View
              style={styles.handle}
              pointerEvents="none"
              accessible={false}
            />
            <ScrollView
              ref={scrollRef}
              style={{ maxHeight: windowHeight * 0.75 }}
              contentContainerStyle={{
                paddingBottom: keyboardHeight ? windowHeight * 0.6 : 0,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={fonts.title3_b_24}>
                  {isEditing ? "입출금 수정하기" : "입출금 등록하기"}
                </Text>
                <Pressable onPress={handleClose} accessibilityLabel="모달 닫기">
                  <XIcon />
                </Pressable>
              </View>

              <View style={styles.tabs}>
                <Pressable
                  style={[styles.tab, isIncome && styles.activeTab]}
                  disabled={isEditing}
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
                  disabled={isEditing}
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
                onLayout={(event) =>
                  setTagRowHeight(event.nativeEvent.layout.height)
                }
                pointerEvents={isIncome ? "none" : "auto"}
                accessibilityElementsHidden={isIncome}
                importantForAccessibility={
                  isIncome ? "no-hide-descendants" : "auto"
                }
                aria-hidden={isIncome}
              >
                {expenseTags.map((tag) => {
                  const selected = category
                    ? tagCategory[tag] === category
                    : selectedTag === tag;
                  return (
                    <Pressable
                      key={tag}
                      accessibilityRole="radio"
                      accessibilityLabel={tag}
                      accessibilityState={{ checked: selected }}
                      disabled={isIncome}
                      onPress={() => {
                        setSelectedTag(tag);
                        onChangeCategory?.(tagCategory[tag]);
                      }}
                      style={[styles.tag, selected && styles.selectedTag]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          selected && styles.selectedTagText,
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={{ gap: 24 }}
                onLayout={(e) => {
                  fieldsY.current = e.nativeEvent.layout.y;
                }}
              >
                <View>
                  <Text style={styles.label}>
                    {isIncome ? "입금 일자" : "출금 일자"}
                  </Text>
                  <Pressable
                    style={styles.decoratedField}
                    onPress={onOpenDatePicker}
                    accessibilityRole="button"
                    accessibilityLabel={`거래 일자 선택, ${transactionDate || "미선택"}`}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.dateText,
                        !transactionDate && styles.placeholder,
                      ]}
                    >
                      {transactionDate
                        ? transactionDate.replaceAll("-", ". ")
                        : "날짜를 입력해주세요"}
                    </Text>
                    <View style={styles.fieldAccessory} pointerEvents="none">
                      <CalanderFillIcon
                        width={20}
                        height={20}
                        color={Colors.gray[5]}
                      />
                    </View>
                  </Pressable>
                </View>

                <View
                  onLayout={(e) => {
                    amountY.current = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.label}>
                    {isIncome ? "입금 금액" : "출금 금액"}
                  </Text>
                  <View style={styles.amountField}>
                    <TextInput
                      onFocus={() => scrollFieldToTop(amountY.current)}
                      style={styles.decoratedField}
                      placeholder={
                        isIncome
                          ? "입금 금액을 입력해주세요"
                          : "출금 금액을 입력해주세요"
                      }
                      placeholderTextColor="#B1B8C1"
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={onChangeAmount}
                      selectionColor={Colors.primary.default}
                      accessibilityLabel={isIncome ? "입금 금액" : "출금 금액"}
                    />
                    <View style={styles.fieldAccessory} pointerEvents="none">
                      <Text style={fonts.body1_m_16}>원</Text>
                    </View>
                  </View>
                  {amountError && (
                    <View style={styles.amountError}>
                      <ErrorIcon />
                      <Text style={styles.amountErrorText}>{amountError}</Text>
                    </View>
                  )}
                </View>
                <View
                  onLayout={(e) => {
                    titleY.current = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.label}>내역 이름</Text>
                  <InputField
                    onFocus={() => scrollFieldToTop(titleY.current)}
                    style={styles.input}
                    placeholder="내역 이름을 입력해주세요"
                    placeholderTextColor="#B1B8C1"
                    value={title}
                    onChangeText={onChangeTitle}
                    error={titleError}
                  />
                </View>
              </View>

              {isIncome && (
                <View
                  pointerEvents="none"
                  style={{ height: tagRowHeight + styles.tagRow.marginBottom }}
                />
              )}
              <View style={{ flexDirection: "row", marginTop: 30 }}>
                <Button
                  title={isEditing ? "수정하기" : "등록하기"}
                  onPress={() => {
                    if (isValid) onSubmit();
                  }}
                  disabled={!isValid}
                />
              </View>
            </ScrollView>
          </BottomSheetView>
        </View>
      </TouchableWithoutFeedback>

      <CalendarModal
        visible={showDatePicker}
        value={dateValue}
        onSelect={(date) => {
          onChangeDate(date);
          onCloseDatePicker();
        }}
        onClose={onCloseDatePicker}
      />
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
    paddingTop: 34,
    paddingBottom: 32,
    overflow: "visible",
  },
  handle: {
    position: "absolute",
    top: 9,
    alignSelf: "center",
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D2D6DC",
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
    ...commonStyles.inputLabel,
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
  decoratedField: {
    height: 58,
    borderWidth: 1,
    borderColor: "#DDE2E8",
    borderRadius: 11,
    paddingLeft: 16,
    paddingRight: 52,
    justifyContent: "center",
    ...fonts.body1_m_16,
    color: "#1C1C1E",
  },
  amountField: {
    position: "relative",
  },
  fieldAccessory: {
    position: "absolute",
    right: 16,
    top: 0,
    height: 58,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    color: "#B1B8C1",
  },
  amountError: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  amountErrorText: {
    ...fonts.caption3_m_13,
    color: "#FF3636",
    flexShrink: 1,
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
    ...fonts.body1_m_16,
    color: "#1C1C1E",
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
