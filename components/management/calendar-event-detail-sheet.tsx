import { Text } from "@/components/ui/app-text";
import { BottomSheetModal, BottomSheetView } from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { getCalendarEvent, type CalendarEvent } from "@/src/api/calendar";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CalendarEventDetailSheet({ eventId, onClose }: { eventId: number | null; onClose: () => void }) {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (eventId === null) return;
    let active = true;
    setEvent(null);
    setLoading(true);
    setError(false);
    setFailedPhotos(new Set());
    const attempt = retry;
    getCalendarEvent(eventId).then((response) => { if (active) setEvent(response.data.data); })
      .catch(() => { if (active && attempt === retry) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, retry]);

  return (
    <BottomSheetModal visible={eventId !== null} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="일정 상세 닫기" onPress={onClose} />
        <BottomSheetView style={[styles.sheet, { maxHeight: height * 0.82, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {event && <View style={styles.badge}><Text numberOfLines={1} style={styles.badgeText}>{event.categoryName || "미분류"}</Text></View>}
              <Text style={styles.title}>{event?.title || (loading ? "일정 불러오는 중" : "일정 상세")}</Text>
            </View>
            <Pressable style={styles.close} accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose}><Ionicons name="close" size={24} color={Colors.common.black} /></Pressable>
          </View>
          {loading ? <View style={styles.state}><ActivityIndicator color={Colors.primary.default} /></View> : error ? <View style={styles.state}><Text style={styles.memo}>일정을 불러오지 못했어요.</Text><Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}><Text style={styles.retry}>다시 시도</Text></Pressable></View> : event && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {!!event.memo && <Text style={styles.memo}>{event.memo}</Text>}
              {event.photos?.map((photo) => {
                const uri = photo.imageUrl || photo.thumbnailUrl;
                return <View key={photo.id} style={styles.photo}>
                  {uri && !failedPhotos.has(photo.id) ? <Image source={{ uri }} style={styles.image} resizeMode="cover" accessibilityLabel={`${event.title || "일정"} 첨부 사진`} onError={() => setFailedPhotos((previous) => new Set([...previous, photo.id]))} /> : <Ionicons name="image-outline" size={36} color={Colors.gray[5]} />}
                </View>;
              })}
            </ScrollView>
          )}
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 28, paddingHorizontal: 16, overflow: "hidden" },
  handle: { position: "absolute", top: 8, alignSelf: "center", width: 72, height: 4, borderRadius: 2, backgroundColor: Colors.gray[4] },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  titleRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 6 },
  badge: { maxWidth: 100, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3, backgroundColor: Colors.normal.default },
  badgeText: { ...fonts.caption4_m_12, color: Colors.primary.default },
  title: { ...fonts.sub1_sb_18, color: Colors.common.black, flex: 1 },
  close: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  content: { gap: 16, paddingBottom: 12 },
  memo: { ...fonts.body4_r_14, color: Colors.gray[7] },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", backgroundColor: Colors.gray[3], alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  state: { minHeight: 160, alignItems: "center", justifyContent: "center", gap: 16 },
  retry: { ...fonts.body2_m_14, color: Colors.primary.default },
});
