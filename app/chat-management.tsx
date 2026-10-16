import { Text } from "@/components/ui/app-text";
import { AppBackButton, goBackOrReplace } from "@/components/ui/app-back-button";
import { useChatListSettings } from "@/components/chat/chat-list-settings";
import { Colors, fonts } from "@/constants/theme";
import { getChatRooms, type ChatRoomResponse } from "@/src/api/chat";
import { sortChatRooms } from "@/src/utils/chatSort";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const ROW_HEIGHT = 82;
const labels = { TRADE: "중고거래", TICKET: "티켓 양도", COMPANION: "동행 모집", MENTOR: "멘토링" };

type Drag = { id: number; origin: number; startScroll: number; dy: number; pointerY: number };

export default function ChatManagementPage() {
  const { refreshSettings, saveRoomOrder } = useChatListSettings();
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<{ id: number; top: number } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const viewport = useRef<View>(null);
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const offset = useRef(0);
  const bounds = useRef({ top: 0, height: 0 });
  const drag = useRef<Drag | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getChatRooms(), refreshSettings()]).then(([response, settings]) => {
      if (active) setRooms(sortChatRooms(Array.isArray(response.data) ? response.data : [], settings.sortOrder, settings.roomOrder));
    }).catch(() => {
      if (active) {
        setFailed(true);
        Alert.alert("채팅방 조회 실패", "잠시 후 다시 시도해주세요.");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [refreshSettings]);

  const updateDrag = () => {
    const current = drag.current;
    if (!current) return;
    const list = roomsRef.current;
    const top = Math.max(0, Math.min((list.length - 1) * ROW_HEIGHT,
      current.origin + current.dy + offset.current - current.startScroll));
    const from = list.findIndex((room) => room.roomId === current.id);
    const to = Math.round(top / ROW_HEIGHT);
    if (from !== to && from >= 0) {
      const next = [...list];
      next.splice(to, 0, next.splice(from, 1)[0]);
      roomsRef.current = next;
      setRooms(next);
    }
    setDragging({ id: current.id, top });
  };
  const endDrag = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    drag.current = null;
    setDragging(null);
  };
  const startDrag = (id: number, pointerY: number) => {
    if (saving) return;
    const index = roomsRef.current.findIndex((room) => room.roomId === id);
    drag.current = { id, origin: index * ROW_HEIGHT, startScroll: offset.current, dy: 0, pointerY };
    viewport.current?.measureInWindow((_x, y, _width, height) => { bounds.current = { top: y, height }; });
    setDragging({ id, top: index * ROW_HEIGHT });
    timer.current = setInterval(() => {
      const current = drag.current;
      if (!current) return;
      const { top, height } = bounds.current;
      if (!height) return;
      const step = current.pointerY < top + 48 ? -8 : current.pointerY > top + height - 48 ? 8 : 0;
      if (!step) return;
      const next = Math.max(0, Math.min(Math.max(0, roomsRef.current.length * ROW_HEIGHT - height), offset.current + step));
      offset.current = next;
      scroll.current?.scrollTo({ y: next, animated: false });
      updateDrag();
    }, 16);
  };
  const finish = async () => {
    if (loading || failed || saving || drag.current) return;
    setSaving(true);
    try {
      await saveRoomOrder(roomsRef.current.map((room) => room.roomId));
      goBackOrReplace("/chat");
    } catch {
      Alert.alert("순서 저장 실패", "잠시 후 다시 시도해주세요.");
      setSaving(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.header}>
        <AppBackButton fallbackHref="/chat" />
        <Text style={styles.heading}>채팅방 관리</Text>
        <Pressable accessibilityRole="button" disabled={loading || failed || saving || !!dragging} onPress={finish} style={styles.done}>
          <Text style={styles.doneText}>{saving ? "저장 중" : "완료"}</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={styles.loading} color={Colors.primary.default} /> : (
        <View ref={viewport} style={styles.list} collapsable={false}>
          <ScrollView
            ref={scroll}
            removeClippedSubviews={false}
            scrollEnabled={!dragging && !saving}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => { offset.current = event.nativeEvent.contentOffset.y; }}
            contentContainerStyle={{ height: Math.max(160, rooms.length * ROW_HEIGHT) }}
          >
            {rooms.length === 0 && <Text style={styles.empty}>{failed ? "채팅방을 불러오지 못했어요" : "아직 열린 채팅방이 없어요"}</Text>}
            {rooms.map((room, index) => (
              <View key={room.roomId} style={[styles.position, { top: dragging?.id === room.roomId ? dragging.top : index * ROW_HEIGHT, zIndex: dragging?.id === room.roomId ? 2 : 0 }]}>
                <View style={styles.row}>
                  <View style={styles.thumbnail} />
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <View style={styles.badge}><Text style={styles.badgeText}>{labels[room.referenceType]}</Text></View>
                      <Text numberOfLines={1} style={styles.title}>{room.opponentNickname || room.opponentName || `${labels[room.referenceType]} 채팅`}</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.preview}>{room.lastMessage || (room.lastMessageType === "ENTER" ? "채팅방에 입장했어요" : "아직 메시지가 없어요")}</Text>
                  </View>
                  <DragHandle
                    disabled={saving}
                    onStart={(y) => startDrag(room.roomId, y)}
                    onMove={(dy, y) => { if (drag.current) { drag.current.dy = dy; drag.current.pointerY = y; updateDrag(); } }}
                    onEnd={endDrag}
                    onStep={(step) => {
                      const next = [...roomsRef.current];
                      const target = index + step;
                      if (target < 0 || target >= next.length || saving) return;
                      next.splice(target, 0, next.splice(index, 1)[0]);
                      roomsRef.current = next;
                      setRooms(next);
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function DragHandle(props: { disabled: boolean; onStart: (y: number) => void; onMove: (dy: number, y: number) => void; onEnd: () => void; onStep: (step: number) => void }) {
  const latest = useRef(props);
  latest.current = props;
  const gesture = useMemo(() => Gesture.Pan()
    .enabled(!props.disabled)
    .runOnJS(true)
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onBegin((event) => latest.current.onStart(event.absoluteY))
    .onUpdate((event) => latest.current.onMove(event.translationY, event.absoluteY))
    .onFinalize(() => latest.current.onEnd()), [props.disabled]);
  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={styles.handle} accessible accessibilityRole="adjustable" accessibilityLabel="채팅방 순서 변경" accessibilityHint="위아래로 드래그해 순서를 변경하세요" accessibilityActions={[{ name: "increment", label: "아래로 이동" }, { name: "decrement", label: "위로 이동" }]} onAccessibilityAction={(event) => latest.current.onStep(event.nativeEvent.actionName === "increment" ? 1 : -1)}>
        <Ionicons pointerEvents="none" name="menu-outline" size={24} color={Colors.gray[8]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  heading: { ...fonts.sub3_sb_16, color: Colors.common.black },
  done: { minWidth: 40, minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  doneText: { ...fonts.body2_m_14, color: Colors.primary.default },
  list: { flex: 1 },
  loading: { flex: 1 },
  empty: { ...fonts.body4_r_14, color: Colors.gray[7], textAlign: "center", marginTop: 40 },
  position: { position: "absolute", left: 0, right: 0, height: ROW_HEIGHT },
  row: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, backgroundColor: "#FFFFFF" },
  thumbnail: { width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.gray[3], marginRight: 12 },
  content: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  title: { ...fonts.sub3_sb_16, color: Colors.common.black, flexShrink: 1 },
  badge: { paddingHorizontal: 4, paddingVertical: 3, borderRadius: 3, backgroundColor: "#EAF0FF" },
  badgeText: { ...fonts.caption5_r_13, color: Colors.primary.default },
  preview: { ...fonts.body4_r_14, color: Colors.gray[7] },
  handle: { width: 44, height: 64, alignItems: "flex-end", justifyContent: "center", marginLeft: 8 },
});
