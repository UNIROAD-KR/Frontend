import { Text } from "@/components/ui/app-text";
import { BottomSheetModal, BottomSheetView } from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CalendarDateTimeField({ date, time, onDate, onTime }: { date: string; time: string; onDate: (value: string) => void; onTime: (value: string) => void }) {
  const [mode, setMode] = useState<"date" | "time" | null>(null);
  const [draft, setDraft] = useState(new Date());
  const insets = useSafeAreaInsets();
  const open = (next: "date" | "time") => {
    const today = new Date();
    const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const value = new Date(`${date || fallback}T${time || "09:00"}:00`);
    setDraft(Number.isNaN(value.getTime()) ? new Date() : value);
    setMode(next);
  };
  const apply = (value: Date) => {
    if (mode === "date") onDate(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`);
    else onTime(`${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`);
    setMode(null);
  };
  return <View>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="날짜 선택" style={styles.field} onPress={() => open("date")}><Text style={[styles.text, !date && styles.placeholder]}>{date ? date.replaceAll("-", ". ") : "0000. 00. 00"}</Text><Ionicons name="calendar-outline" size={20} color={Colors.gray[5]} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="시간 선택" style={styles.field} onPress={() => open("time")}><Text style={[styles.text, !time && styles.placeholder]}>{time || "00:00"}</Text></Pressable>
    </View>
    {Platform.OS === "android" && mode && <DateTimePicker mode={mode} value={draft} is24Hour onChange={(event, value) => { if (event.type === "set" && value) apply(value); else setMode(null); }} />}
    {Platform.OS !== "android" && <BottomSheetModal visible={mode !== null} onRequestClose={() => setMode(null)}><View style={styles.overlay}><Pressable style={StyleSheet.absoluteFill} onPress={() => setMode(null)} /><BottomSheetView style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}><View style={styles.toolbar}><Pressable onPress={() => setMode(null)}><Text style={styles.text}>취소</Text></Pressable><Pressable onPress={() => apply(draft)}><Text style={styles.confirm}>확인</Text></Pressable></View>{mode && <DateTimePicker mode={mode} value={draft} display="spinner" locale="ko-KR" is24Hour textColor={Colors.common.black} onChange={(_event, value) => { if (value) setDraft(value); }} />}</BottomSheetView></View></BottomSheetModal>}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  field: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  text: { ...fonts.body4_r_14, color: Colors.common.black },
  placeholder: { color: Colors.gray[5] },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  confirm: { ...fonts.body1_m_16, color: Colors.primary.default },
});
