import { Text } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  bottomSheetStyles,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  title: string;
  value?: Date;
  minDate?: Date;
  onClose: () => void;
  onAfterClose?: () => void;
  onSelect: (date: Date) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function CalendarPickerSheet({
  visible,
  title,
  value,
  minDate,
  onClose,
  onAfterClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => startOfDay(value ?? new Date()));

  useEffect(() => {
    if (visible) {
      const base = startOfDay(value ?? new Date());
      setMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  }, [visible, value]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const min = minDate ? startOfDay(minDate) : null;

  return (
    <BottomSheetModal visible={visible} onRequestClose={onClose} onAfterClose={onAfterClose}>
      <View style={[styles.overlay, bottomSheetStyles.transparent]}>
        <Pressable
          style={[styles.backdrop, bottomSheetStyles.transparent]}
          onPress={onClose}
        />
        <BottomSheetView
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.header}>
            <Text style={fonts.sub3_sb_16}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel="닫기">
              <Ionicons name="close" size={24} color={Colors.gray[8]} />
            </Pressable>
          </View>

          <View style={styles.monthRow}>
            <Pressable
              hitSlop={12}
              onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}
              accessibilityLabel="이전 달"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.gray[9]} />
            </Pressable>
            <Text style={fonts.sub3_sb_16}>
              {year}년 {monthIndex + 1}월
            </Text>
            <Pressable
              hitSlop={12}
              onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}
              accessibilityLabel="다음 달"
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={Colors.gray[9]}
              />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, i) => (
              <Text
                key={day}
                style={[
                  styles.weekday,
                  i === 0 && styles.sunday,
                  i === 6 && styles.saturday,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) return <View key={index} style={styles.cell} />;
              const date = new Date(year, monthIndex, day);
              const selected = !!value && isSameDay(date, value);
              const disabled = !!min && date < min;
              return (
                <View key={index} style={styles.cell}>
                  <Pressable
                    disabled={disabled}
                    onPress={() => onSelect(date)}
                    style={[styles.day, selected && styles.selectedDay]}
                    accessibilityRole="button"
                    accessibilityLabel={`${year}년 ${monthIndex + 1}월 ${day}일`}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        index % 7 === 0 && styles.sunday,
                        index % 7 === 6 && styles.saturday,
                        isSameDay(date, today) && styles.todayText,
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
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: "center",
    ...fonts.body2_m_14,
    color: Colors.gray[6],
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDay: { backgroundColor: Colors.primary.default },
  dayText: { ...fonts.body1_m_16, color: Colors.gray[11] },
  sunday: { color: "#FF4D4F" },
  saturday: { color: "#506AFF" },
  todayText: { fontWeight: "700" },
  disabledText: { color: Colors.gray[4] },
  selectedText: { color: "#FFFFFF" },
});
