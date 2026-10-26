import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import ArrowLeftIcon from "@/assets/icon/arrow-left.svg";
import ArrowRightIcon from "@/assets/icon/arrow-right.svg";
import { fonts, Colors } from "@/constants/theme";
import { Text } from "@/components/ui/app-text";
import { Modal } from "@/components/ui/modal";

export const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
export const weekdayNames = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

export function monthCells(year: number, month: number) {
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? day : null;
  });
}

export default function CalendarModal({
  visible,
  value,
  minDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value?: Date;
  minDate?: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const initial = value ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  useEffect(() => {
    if (visible) {
      const base = value ?? new Date();
      setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  }, [visible, value]);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const cells = monthCells(year, month);

  const changeMonth = (direction: number) => {
    setVisibleMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + direction, 1),
    );
  };

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      paddingHorizontal={12}
    >
      <View style={styles.calendar}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>
            {year}년 {month + 1}월
          </Text>
          <View style={styles.monthNavigation}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 달"
              hitSlop={8}
              style={styles.monthButton}
              onPress={() => changeMonth(-1)}
            >
              <ArrowLeftIcon />
            </Pressable>
            <View style={styles.navigationDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 달"
              hitSlop={8}
              style={styles.monthButton}
              onPress={() => changeMonth(1)}
            >
              <ArrowRightIcon />
            </Pressable>
          </View>
        </View>
        <View style={styles.weekdays}>
          {weekdays.map((day) => (
            <Text key={day} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, index) => {
            if (day === null) return <View key={index} style={styles.cell} />;
            const date = new Date(year, month, day);
            const selected =
              !!value &&
              date.getFullYear() === value.getFullYear() &&
              date.getMonth() === value.getMonth() &&
              date.getDate() === value.getDate();
            const disabled =
              !!minDate &&
              date <
                new Date(
                  minDate.getFullYear(),
                  minDate.getMonth(),
                  minDate.getDate(),
                );
            const today = new Date();
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();
            return (
              <View key={index} style={styles.cell}>
                <Pressable
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${year}년 ${month + 1}월 ${day}일`}
                  accessibilityState={{ selected, disabled }}
                  onPress={() => onSelect(date)}
                  style={[
                    styles.day,
                    isToday && styles.todayDay,
                    selected && styles.selectedDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      disabled && styles.disabledText,
                      selected && styles.selectedText,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  calendar: {},
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  monthTitle: { ...fonts.title5_b_20, color: Colors.common.black },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.gray[4],
    borderRadius: 1000,
  },
  monthButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationDivider: { width: 1, height: 9, backgroundColor: Colors.gray[4] },
  weekdays: { flexDirection: "row", marginBottom: 18 },
  weekday: {
    flex: 1,
    ...fonts.caption3_m_13,
    color: Colors.gray[6],
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 28,
    height: 28,
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDay: { backgroundColor: Colors.primary.default },
  todayDay: {
    borderWidth: 1,
    borderColor: Colors.primary.default,
    borderRadius: 8,
  },
  dayText: { ...fonts.body1_m_16, color: Colors.gray[11] },
  selectedText: { color: Colors.common.white },
  disabledText: { color: Colors.gray[4] },
});
