import { Text } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { getCalendarEvent, type CalendarEvent } from "@/src/api/calendar";
import XIcon from "@/assets/icon/x-icon.svg";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CalendarEventDetailSheet({
  eventId,
  onClose,
}: {
  eventId: number | null;
  onClose: () => void;
}) {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());
  const [photoIndex, setPhotoIndex] = useState(0);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photoWidth = width - 32;
  useEffect(() => {
    if (eventId === null) return;
    let active = true;
    setEvent(null);
    setLoading(true);
    setError(false);
    setFailedPhotos(new Set());
    setPhotoIndex(0);
    const attempt = retry;
    getCalendarEvent(eventId)
      .then((response) => {
        if (active) setEvent(response.data.data);
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
  }, [eventId, retry]);

  return (
    <BottomSheetModal visible={eventId !== null} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="일정 상세 닫기"
          onPress={onClose}
        />
        <BottomSheetView
          style={[
            styles.sheet,
            {
              maxHeight: height * 0.82,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {event && (
                <View style={styles.badge}>
                  <Text numberOfLines={1} style={styles.badgeText}>
                    {event.categoryName || "미분류"}
                  </Text>
                </View>
              )}
              <Text style={styles.title}>
                {event?.title || (loading ? "일정 불러오는 중" : "일정 상세")}
              </Text>
            </View>
            <Pressable
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
            >
              <XIcon
                style={{ width: 24, height: 24 }}
                color={Colors.common.black}
              />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={Colors.primary.default} />
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.memo}>일정을 불러오지 못했어요.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRetry((value) => value + 1)}
              >
                <Text style={styles.retry}>다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            event && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
              >
                {!!event.memo && <Text style={styles.memo}>{event.memo}</Text>}
                {event.photos?.length > 0 && (
                  <View style={[styles.photoCarousel, { width: photoWidth }]}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(nativeEvent) => {
                        setPhotoIndex(
                          Math.round(
                            nativeEvent.nativeEvent.contentOffset.x / photoWidth,
                          ),
                        );
                      }}
                    >
                      {event.photos.map((photo) => {
                        const uri = photo.imageUrl || photo.thumbnailUrl;
                        return (
                          <View
                            key={photo.id}
                            style={[styles.photo, { width: photoWidth }]}
                          >
                            {uri ? (
                              <Image
                                source={{ uri }}
                                style={styles.image}
                                resizeMode="cover"
                                accessibilityLabel={`${event.title || "일정"} 첨부 사진`}
                                onError={() =>
                                  setFailedPhotos(
                                    (previous) => new Set([...previous, photo.id]),
                                  )
                                }
                              />
                            ) : null}
                          </View>
                        );
                      })}
                    </ScrollView>
                    {event.photos.length > 1 && (
                      <View style={styles.photoIndicator}>
                        <Text style={styles.photoIndicatorText}>
                          {photoIndex + 1}/{event.photos.length}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )
          )}
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 28,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  handle: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 6,
  },
  badge: {
    maxWidth: 100,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: Colors.normal.default,
  },
  badgeText: { ...fonts.caption4_m_12, color: Colors.primary.default },
  title: { ...fonts.sub1_sb_18, color: Colors.common.black, flex: 1 },
  close: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { gap: 16, paddingBottom: 12 },
  memo: { ...fonts.body4_r_14, color: Colors.gray[7] },
  photoCarousel: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    aspectRatio: 1,
    backgroundColor: Colors.gray[3],
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  photoIndicator: {
    position: "absolute",
    right: 12,
    bottom: 12,
    minWidth: 46,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIndicatorText: {
    ...fonts.body2_m_14,
    color: Colors.common.white,
  },
  state: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  retry: { ...fonts.body2_m_14, color: Colors.primary.default },
});
