import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getCalendarDay, getCalendarMonth, type CalendarOccurrence, type CalendarEvent } from "@/src/api/calendar";
import { CalendarEventList } from "@/components/management/calendar-event-list";
import { calendarWeekRanges, occurrenceCoversDate } from "@/src/utils/calendarRanges";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function monthCells(year: number, month: number) {
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? day : null;
  });
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type Props = { onAddEvent?: (date: string) => void };

export function CalendarTab({ onAddEvent }: Props) {
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [monthEvents, setMonthEvents] = useState<{ key: string; events: CalendarOccurrence[] }>({ key: "", events: [] });
  const [monthError, setMonthError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const cells = monthCells(year, month);
  const today = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    // Retry is an explicit reload even when the selected day is unchanged.
    const attempt = retry;
    getCalendarDay(selectedKey).then((response) => {
      if (active) setSelectedEvents(response.data.data.events ?? []);
    }).catch(() => {
      if (active && attempt === retry) setError(true);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedKey, retry]));

  const monthKey = `${year}-${month}`;
  const from = dateKey(new Date(year, month, 1));
  const to = dateKey(new Date(year, month + 1, 0));
  useFocusEffect(useCallback(() => {
    let active = true;
    setMonthError(false);
    const attempt = retry;
    getCalendarMonth(from, to).then((response) => {
      if (active) setMonthEvents({ key: monthKey, events: response.data.data.events ?? [] });
    }).catch(() => { if (active && attempt === retry) setMonthError(true); });
    return () => { active = false; };
  }, [from, to, monthKey, retry]));
  const visibleMonthEvents = monthEvents.key === monthKey ? monthEvents.events : [];
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));

  const changeMonth = (direction: number) => {
    setSelectedDate((previous) => {
      const first = new Date(previous.getFullYear(), previous.getMonth() + direction, 1);
      const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      return new Date(first.getFullYear(), first.getMonth(), Math.min(previous.getDate(), lastDay));
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.calendar}>
        <View style={styles.monthHeader}>
          <Text accessibilityRole="header" style={styles.monthTitle}>{year}년 {month + 1}월</Text>
          <View style={styles.monthNavigation}>
            <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={4} style={styles.monthButton} onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color={Colors.common.black} />
            </Pressable>
            <View style={styles.navigationDivider} />
            <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={4} style={styles.monthButton} onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color={Colors.common.black} />
            </Pressable>
          </View>
        </View>
        <View style={styles.weekdays}>
          {weekdays.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        </View>
        <View style={styles.grid}>
          {weeks.map((week, weekIndex) => {
            const keys = week.map((day) => day === null ? null : dateKey(new Date(year, month, day)));
            const ranges = calendarWeekRanges(keys, visibleMonthEvents);
            return <View key={weekIndex} style={styles.weekRow}>
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {ranges.map((range) => <View key={`${range.start}-${range.end}`} style={[styles.range, { left: `${range.start / 7 * 100}%`, right: `${(6 - range.end) / 7 * 100}%` }]} />)}
              </View>
              {week.map((day, index) => {
                if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const date = new Date(year, month, day);
                const key = dateKey(date);
                const selected = day === selectedDate.getDate();
                const isToday = key === today;
                const eventCount = visibleMonthEvents.filter((event) => occurrenceCoversDate(event, key)).length;
                return <Pressable key={day} accessibilityRole="button" accessibilityLabel={`${year}년 ${month + 1}월 ${day}일 ${weekdayNames[date.getDay()]}${isToday ? ", 오늘" : ""}, 일정 ${eventCount}개`} accessibilityState={{ selected }} style={styles.dayCell} onPress={() => setSelectedDate(date)}>
                  <View style={[styles.dayCircle, selected && styles.selectedCircle]}>
                    <Text style={[styles.dayText, isToday && styles.todayText, selected && styles.selectedText]}>{day}</Text>
                  </View>
                </Pressable>;
              })}
            </View>;
          })}
        </View>
        {monthError && <Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}><Text style={styles.monthError}>월 일정을 불러오지 못했어요. 다시 시도</Text></Pressable>}

      </View>

      <View style={styles.scheduleHeader}>
        <Text accessibilityRole="header" style={styles.scheduleTitle}>{month + 1}/{selectedDate.getDate()} {weekdayNames[selectedDate.getDay()]}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="선택한 날짜에 일정 추가" style={styles.addButton} onPress={() => onAddEvent ? onAddEvent(dateKey(selectedDate)) : router.push({ pathname: "/calendar-event-create", params: { date: dateKey(selectedDate) } })}>
          <Text style={styles.addText}>일정 추가</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={styles.emptyState} color={Colors.primary.default} /> : error ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>일정을 불러오지 못했어요</Text><Pressable onPress={() => setRetry((value) => value + 1)}><Text style={styles.addText}>다시 시도</Text></Pressable></View> : selectedEvents.length > 0 ? <CalendarEventList events={selectedEvents} onChanged={() => setRetry((value) => value + 1)} /> : <View style={styles.emptyState}>
        <Ionicons name="information-circle" size={32} color={Colors.gray[5]} />
        <Text style={styles.emptyTitle}>등록된 일정이 없습니다</Text>
        <Text style={styles.emptyDescription}>일정을 추가하여 교환 일정을{"\n"}체계적으로 관리해보세요</Text>
      </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.common.white },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 },
  calendar: { borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 20, paddingHorizontal: 12, paddingTop: 20, paddingBottom: 16 },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, marginBottom: 18, gap: 8 },
  monthTitle: { ...fonts.title5_b_20, color: Colors.common.black, flexShrink: 1 },
  monthNavigation: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.gray[4], borderRadius: 24 },
  monthButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navigationDivider: { width: 1, height: 10, backgroundColor: Colors.gray[4] },
  weekdays: { flexDirection: "row", marginBottom: 8 },
  weekday: { ...fonts.caption5_r_13, color: Colors.gray[6], width: "14.285714%", textAlign: "center", paddingVertical: 6 },
  grid: { gap: 0 },
  weekRow: { flexDirection: "row", position: "relative" },
  range: { position: "absolute", top: 6, height: 36, borderRadius: 9, borderWidth: 1, borderColor: Colors.primary.default, backgroundColor: Colors.primary.light, marginHorizontal: 2 },
  monthError: { ...fonts.caption5_r_13, color: Colors.gray[7], textAlign: "center", marginTop: 10 },
  dayCell: { width: "14.285714%", height: 48, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  selectedCircle: { backgroundColor: Colors.primary.default },
  dayText: { ...fonts.body1_m_16, color: Colors.common.black },
  todayText: { color: Colors.primary.default },
  selectedText: { color: Colors.common.white },
  scheduleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, gap: 8 },
  scheduleTitle: { ...fonts.title5_b_20, color: Colors.common.black, flexShrink: 1 },
  addButton: { minHeight: 44, justifyContent: "center", paddingLeft: 12 },
  addText: { ...fonts.body2_m_14, color: Colors.primary.default },
  emptyState: { minHeight: 210, alignItems: "center", justifyContent: "center", paddingVertical: 28 },
  emptyTitle: { ...fonts.sub1_sb_18, color: Colors.common.black, marginTop: 12 },
  emptyDescription: { ...fonts.body4_r_14, color: Colors.gray[7], textAlign: "center", marginTop: 8 },
});
