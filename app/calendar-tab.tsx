import { Text } from "@/components/ui/app-text";
import EmptyState from "@/components/ui/empty-state";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import { weekdays, weekdayNames, monthCells } from "@/components/ui/calendar";
import { router } from "expo-router";
import {
  getCalendarDay,
  getCalendarMonth,
  type CalendarOccurrence,
  type CalendarEvent,
} from "@/src/api/calendar";
import { CalendarEventList } from "@/components/management/calendar-event-list";
import {
  calendarWeekRanges,
  occurrenceCoversDate,
} from "@/src/utils/calendarRanges";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import ArrowLeftIcon from "@/assets/icon/arrow-left.svg";
import ArrowRightIcon from "@/assets/icon/arrow-right.svg";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type Props = { onAddEvent?: (date: string) => void };

export function CalendarTab({ onAddEvent }: Props) {
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [monthEvents, setMonthEvents] = useState<{
    key: string;
    events: CalendarOccurrence[];
  }>({ key: "", events: [] });
  const [monthError, setMonthError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const cells = monthCells(year, month);
  const today = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(false);
      // Retry is an explicit reload even when the selected day is unchanged.
      const attempt = retry;
      getCalendarDay(selectedKey)
        .then((response) => {
          if (active) setSelectedEvents(response.data.data.events ?? []);
        })
        .catch(() => {
          if (active && attempt === retry) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [selectedKey, retry]),
  );

  const monthKey = `${year}-${month}`;
  const from = dateKey(new Date(year, month, 1));
  const to = dateKey(new Date(year, month + 1, 0));
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setMonthError(false);
      const attempt = retry;
      getCalendarMonth(from, to)
        .then((response) => {
          if (active)
            setMonthEvents({
              key: monthKey,
              events: response.data.data.events ?? [],
            });
        })
        .catch(() => {
          if (active && attempt === retry) setMonthError(true);
        });
      return () => {
        active = false;
      };
    }, [from, to, monthKey, retry]),
  );
  const visibleMonthEvents =
    monthEvents.key === monthKey ? monthEvents.events : [];
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );

  const changeMonth = (direction: number) => {
    setVisibleMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + direction, 1),
    );
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.calendar}>
        <View style={styles.monthHeader}>
          <Text accessibilityRole="header" style={styles.monthTitle}>
            {year}년 {month + 1}월
          </Text>
          <View style={styles.monthNavigation}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 달"
              hitSlop={4}
              style={styles.monthButton}
              onPress={() => changeMonth(-1)}
            >
              <ArrowLeftIcon />
            </Pressable>
            <View style={styles.navigationDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 달"
              hitSlop={4}
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
          {weeks.map((week, weekIndex) => {
            const keys = week.map((day) =>
              day === null ? null : dateKey(new Date(year, month, day)),
            );
            const ranges = calendarWeekRanges(keys, visibleMonthEvents);
            return (
              <View key={weekIndex} style={styles.weekRow}>
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {ranges.map((range) => (
                    <View
                      key={`${range.start}-${range.end}`}
                      style={[
                        styles.rangeSlot,
                        {
                          left: `${(range.start / 7) * 100}%`,
                          right: `${((6 - range.end) / 7) * 100}%`,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.range,
                          range.start === range.end && styles.singleRange,
                        ]}
                      />
                    </View>
                  ))}
                </View>
                {week.map((day, index) => {
                  if (day === null)
                    return (
                      <View key={`empty-${index}`} style={styles.dayCell} />
                    );
                  const date = new Date(year, month, day);
                  const key = dateKey(date);
                  const selected = key === selectedKey;
                  const isToday = key === today;
                  const eventCount = visibleMonthEvents.filter((event) =>
                    occurrenceCoversDate(event, key),
                  ).length;
                  const selectedWithoutEvents = selected && eventCount === 0;
                  return (
                    <Pressable
                      key={day}
                      accessibilityRole="button"
                      accessibilityLabel={`${year}년 ${month + 1}월 ${day}일 ${weekdayNames[date.getDay()]}${isToday ? ", 오늘" : ""}, 일정 ${eventCount}개`}
                      accessibilityState={{ selected }}
                      style={styles.dayCell}
                      onPress={() => setSelectedDate(date)}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          selectedWithoutEvents && styles.selectedCircle,
                          isToday && !selected && styles.todayCircle,
                        ]}
                      >
                        {isToday && selectedWithoutEvents ? (
                          <View style={styles.todayCircle}>
                            <Text style={[styles.dayText, styles.todayText]}>
                              {day}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.dayText,
                              isToday && eventCount === 0 && styles.todayText,
                            ]}
                          >
                            {day}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
        {monthError && (
          <EmptyState
            title="월 일정을 불러오지 못했어요"
            description="잠시 후 다시 시도해주세요"
          />
        )}
      </View>

      <View style={styles.scheduleHeader}>
        <Text accessibilityRole="header" style={styles.scheduleTitle}>
          {month + 1}/{selectedDate.getDate()}{" "}
          {weekdayNames[selectedDate.getDay()]}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="선택한 날짜에 일정 추가"
          style={styles.addButton}
          onPress={() =>
            onAddEvent
              ? onAddEvent(dateKey(selectedDate))
              : router.push({
                  pathname: "/calendar-event-create",
                  params: { date: dateKey(selectedDate) },
                })
          }
        >
          <Text style={styles.addText}>일정 추가</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator
          style={styles.emptyState}
          color={Colors.primary.default}
        />
      ) : error ? (
        <EmptyState
          title="일정을 불러오지 못했어요"
          description="잠시 후 다시 시도해주세요"
        />
      ) : selectedEvents.length > 0 ? (
        <CalendarEventList
          events={selectedEvents}
          onChanged={() => setRetry((value) => value + 1)}
        />
      ) : (
        <EmptyState
          title="등록된 일정이 없습니다"
          description={"일정을 추가하여 교환 일정을\n체계적으로 관리해보세요"}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 },
  calendar: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  monthTitle: {
    ...fonts.title5_b_20,
    color: Colors.common.black,
    flexShrink: 1,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.gray[4],
    borderRadius: 1000,
  },
  monthButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  navigationDivider: { width: 1, height: 9, backgroundColor: Colors.gray[4] },
  weekdays: { flexDirection: "row", marginBottom: 8 },
  weekday: {
    ...fonts.caption3_m_13,
    color: Colors.gray[6],
    width: "14.285714%",
    textAlign: "center",
    paddingVertical: 6,
  },
  grid: { gap: 0 },
  weekRow: { flexDirection: "row", position: "relative" },
  rangeSlot: {
    position: "absolute",
    top: 4,
    height: 40,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  range: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    backgroundColor: Colors.primary.light,
  },
  singleRange: { width: 40 },
  monthError: {
    ...fonts.caption5_r_13,
    color: Colors.gray[7],
    textAlign: "center",
    marginTop: 10,
  },
  dayCell: {
    width: "14.285714%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    borderWidth: 1,
    borderColor: Colors.primary.default,
  },
  todayCircle: {
    width: 28,
    height: 28,
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.default,
  },
  dayText: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
    textAlign: "center",
  },
  todayText: { color: Colors.common.white },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  scheduleTitle: {
    ...fonts.title5_b_20,
    color: Colors.common.black,
    flexShrink: 1,
  },
  addButton: { justifyContent: "center" },
  addText: { ...fonts.body2_m_14, color: Colors.primary.default },
  emptyState: {
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
});
