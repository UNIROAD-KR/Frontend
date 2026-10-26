import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/app-text";
import { CalendarEventDetailSheet } from "@/components/management/calendar-event-detail-sheet";
import { Colors, fonts } from "@/constants/theme";
import { deleteCalendarEvent, type CalendarEvent } from "@/src/api/calendar";
import { useAppAlert } from "@/hooks/use-app-alert";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import TrashIcon from "@/assets/icon/delete.svg";
import PenIcon from "@/assets/icon/pen.svg";

function eventPeriod(event: CalendarEvent) {
  const start = (event.occurrenceStartAt || event.startAt)
    .slice(0, 10)
    .replaceAll("-", ". ");
  const end = (event.occurrenceEndAt || event.endAt)
    .slice(0, 10)
    .replaceAll("-", ". ");
  return `${start} - ${end}`;
}

export function CalendarEventList({
  events,
  onChanged,
}: {
  events: CalendarEvent[];
  onChanged: () => void;
}) {
  const [menu, setMenu] = useState<CalendarEvent | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState<number | null>(null);
  const { showAlert, alertElement } = useAppAlert();
  const pendingAction = useRef<(() => void) | null>(null);
  const confirmDelete = (event: CalendarEvent) => {
    showAlert(
      "일정 삭제",
      `‘${event.title || "일정"}’을 삭제할까요?${event.repeatType !== "NONE" ? " 반복 일정 전체가 삭제됩니다." : ""}`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            setDeleting(event.id);
            try {
              await deleteCalendarEvent(event.id);
              onChanged();
            } catch (error: any) {
              showAlert(
                "삭제 실패",
                error.response?.data?.message || "잠시 후 다시 시도해주세요.",
              );
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  };
  const afterClose = (action: () => void) => {
    pendingAction.current = action;
    setMenu(null);
  };
  const remove = () => {
    if (!menu || deleting !== null) return;
    const event = menu;
    afterClose(() => confirmDelete(event));
  };
  const edit = () => {
    if (!menu) return;
    const id = menu.id;
    afterClose(() =>
      router.push({
        pathname: "/calendar-event-create",
        params: { mode: "edit", id: String(id) },
      }),
    );
  };
  return (
    <View style={styles.list}>
      {events.map((event) => {
        const photo = event.photos?.[0];
        const uri = photo?.thumbnailUrl || photo?.imageUrl;
        return (
          <View
            key={`${event.id}-${event.occurrenceStartAt || event.startAt}`}
            style={styles.row}
          >
            <Pressable
              style={styles.body}
              accessibilityRole="button"
              accessibilityLabel={`${event.title || "일정"} 상세 보기`}
              onPress={() => setDetailId(event.id)}
            >
              <View style={styles.titleRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {event.categoryName || "미분류"}
                  </Text>
                </View>
                <Text style={styles.title} numberOfLines={1}>
                  {event.title || "사진 일정"}
                </Text>
              </View>
              <Text style={styles.period}>{eventPeriod(event)}</Text>
            </Pressable>
            <Pressable
              style={styles.thumbnail}
              accessibilityRole="button"
              accessibilityLabel={`${event.title || "일정"} 사진 상세 보기`}
              onPress={() => setDetailId(event.id)}
            >
              {uri ? (
                <Image key={photo.id} source={{ uri }} style={styles.image} />
              ) : null}
            </Pressable>
            <Pressable
              disabled={deleting !== null}
              accessibilityRole="button"
              accessibilityLabel={`${event.title || "일정"} 더보기`}
              hitSlop={4}
              style={styles.more}
              onPress={() => setMenu(event)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={Colors.gray[7]}
              />
            </Pressable>
          </View>
        );
      })}
      <BottomSheetModal
        visible={menu !== null}
        onRequestClose={() => setMenu(null)}
        onAfterClose={() => {
          const action = pendingAction.current;
          pendingAction.current = null;
          action?.();
        }}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="일정 메뉴 닫기"
            onPress={() => setMenu(null)}
          />
          <BottomSheetView
            style={[
              styles.menu,
              { paddingBottom: Math.max(insets.bottom, 28) },
            ]}
          >
            <View style={styles.handle} />
            <Pressable
              style={styles.menuItem}
              accessibilityRole="button"
              onPress={edit}
            >
              <PenIcon width={24} height={24} color={Colors.gray[10]} />
              <Text style={styles.menuText}>수정하기</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              accessibilityRole="button"
              onPress={remove}
            >
              <TrashIcon width={24} height={24} color={Colors.gray[10]} />
              <Text style={styles.menuText}>삭제하기</Text>
            </Pressable>
          </BottomSheetView>
        </View>
      </BottomSheetModal>
      <CalendarEventDetailSheet
        eventId={detailId}
        onClose={() => setDetailId(null)}
      />
      {alertElement}
    </View>
  );
}
const styles = StyleSheet.create({
  list: { gap: 20, marginTop: 16, paddingBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52 },
  body: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    maxWidth: 100,
  },
  badgeText: { ...fonts.caption4_m_12, color: Colors.primary.default },
  title: { ...fonts.body1_m_16, color: Colors.common.black, flex: 1 },
  period: { ...fonts.caption3_m_13, color: Colors.gray[7] },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: Colors.gray[3],
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  more: {
    width: 24,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  menu: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 28,
    paddingHorizontal: 16,
  },
  handle: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 80,
    height: 5,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  menuText: { ...fonts.body1_m_16, color: Colors.gray[10] },
});
