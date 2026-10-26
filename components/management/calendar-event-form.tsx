import { Text } from "@/components/ui/app-text";
import InputField from "@/components/ui/input-field";
import { FieldLabel } from "@/components/ui/field-label";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import { InlineDropdown } from "@/components/ui/inline-dropdown";
import { PhotoField } from "@/components/market/registration/PhotoField";
import { CalendarCategorySheet } from "@/components/management/calendar-category-sheet";
import { CalendarDateTimeField } from "@/components/management/calendar-date-time-field";
import {
  createCalendarCategory,
  createCalendarEvent,
  updateCalendarEvent,
  getCalendarEvent,
  type CalendarEvent,
  getCalendarCategories,
  type CalendarCategory,
  type CalendarRepeatType,
  type CalendarPhotoInput,
} from "@/src/api/calendar";
import { uploadCalendarPhoto } from "@/src/api/calendarUpload";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const repeatOptions = [
  { label: "없음", value: "NONE" },
  { label: "매일", value: "DAILY" },
  { label: "매주", value: "WEEKLY" },
  { label: "매월", value: "MONTHLY" },
  { label: "매년", value: "YEARLY" },
];

export function CalendarEventForm() {
  const params = useLocalSearchParams<{
    date?: string;
    mode?: string;
    id?: string;
  }>();
  const isEdit = params.mode === "edit";
  const eventId = Number(params.id);
  const initialDate =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : "";
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [categoryError, setCategoryError] = useState(false);
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setCategoryError(false);
    getCalendarCategories()
      .then((response) => {
        if (!active) return;
        const values = response.data.data;
        setCategories(values);
        setCategory((previous) =>
          values.some((item) => item.id === previous)
            ? previous
            : isEdit
              ? previous
              : (values[0]?.id ?? null),
        );
      })
      .catch(() => {
        if (active) setCategoryError(true);
      });
    return () => {
      active = false;
    };
  }, [categoryAttempt, isEdit]);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState("");
  const [repeat, setRepeat] = useState<CalendarRepeatType>("NONE");
  const [submitting, setSubmitting] = useState(false);
  const uploadedPhotos = useRef(new Map<string, CalendarPhotoInput>());
  const [original, setOriginal] = useState<CalendarEvent | null>(null);
  const [editLoading, setEditLoading] = useState(isEdit);
  const [editError, setEditError] = useState(false);
  const [editAttempt, setEditAttempt] = useState(0);
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    setEditLoading(true);
    setEditError(false);
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setEditError(true);
      setEditLoading(false);
      return;
    }
    getCalendarEvent(eventId)
      .then((response) => {
        if (!active) return;
        const event = response.data.data;
        setOriginal(event);
        setCategory(event.categoryId);
        setTitle(event.title || "");
        setDescription(event.memo || "");
        setPhotos(
          (event.photos || []).map(
            (photo) => photo.imageUrl || photo.thumbnailUrl || "",
          ),
        );
        setStartDate(event.startAt.slice(0, 10));
        setStartTime(event.startAt.slice(11, 16));
        setEndDate(event.endAt.slice(0, 10));
        setEndTime(event.endAt.slice(11, 16));
        setRepeat(event.repeatType || "NONE");
      })
      .catch(() => {
        if (active) setEditError(true);
      })
      .finally(() => {
        if (active) setEditLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEdit, eventId, editAttempt]);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const submitted = useRef(false);
  const start = Date.parse(`${startDate}T${startTime}:00`);
  const end = Date.parse(`${endDate}T${endTime}:00`);
  const invalidRange =
    Number.isFinite(start) && Number.isFinite(end) && end < start;
  const canSubmit =
    !submitting &&
    !editLoading &&
    !editError &&
    !categoryError &&
    (category !== null || (isEdit && original?.categoryId === null)) &&
    !!title.trim() &&
    !!description.trim() &&
    photos.length > 0 &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    !invalidRange;
  const submit = async () => {
    if (!canSubmit || submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      const photoInputs = await Promise.all(
        photos.map(async (uri) => {
          const existing = original?.photos?.find(
            (photo) => (photo.imageUrl || photo.thumbnailUrl) === uri,
          );
          if (existing) return { photoId: existing.id };
          const cached = uploadedPhotos.current.get(uri);
          if (cached) return cached;
          const uploaded = await uploadCalendarPhoto(uri);
          uploadedPhotos.current.set(uri, uploaded);
          return uploaded;
        }),
      );
      const payload = {
        categoryId: category,
        title: title.trim(),
        memo: description.trim(),
        allDay: original?.allDay ?? false,
        startAt:
          original?.startAt.slice(0, 16) === `${startDate}T${startTime}`
            ? original.startAt
            : `${startDate}T${startTime}:00`,
        endAt:
          original?.endAt.slice(0, 16) === `${endDate}T${endTime}`
            ? original.endAt
            : `${endDate}T${endTime}:00`,
        reminder: original?.reminder ?? ("NONE" as const),
        repeatType: repeat,
        ...(isEdit && repeat === original?.repeatType
          ? { repeatUntil: original?.repeatUntil }
          : {}),
        photos: photoInputs,
      };
      if (isEdit) await updateCalendarEvent(eventId, payload);
      else await createCalendarEvent(payload);
      Keyboard.dismiss();
      goBackOrReplace("/management");
    } catch (error: any) {
      Alert.alert(
        isEdit ? "일정 수정 실패" : "일정 등록 실패",
        error.response?.data?.message ||
          error.message ||
          "잠시 후 다시 시도해주세요.",
      );
    } finally {
      submitted.current = false;
      setSubmitting(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppBackButton fallbackHref="/management" />
        <Text style={styles.heading}>{isEdit ? "일정 수정" : "일정 등록"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          disabled={!canSubmit}
          style={styles.submit}
          onPress={submit}
        >
          <Text style={[styles.submitText, canSubmit && styles.submitActive]}>
            {submitting ? "등록 중..." : "등록하기"}
          </Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {editLoading ? (
          <View style={styles.loadState}>
            <ActivityIndicator color={Colors.primary.default} />
          </View>
        ) : editError ? (
          <View style={styles.loadState}>
            <Text style={styles.label}>일정을 불러오지 못했어요.</Text>
            <Pressable onPress={() => setEditAttempt((value) => value + 1)}>
              <Text style={styles.submitActive}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.fieldGroup}>
              <FieldLabel title="카테고리" />
              {categoryError && (
                <Pressable
                  onPress={() => setCategoryAttempt((value) => value + 1)}
                >
                  <Text style={styles.rangeError}>
                    카테고리를 불러오지 못했어요. 눌러서 다시 시도
                  </Text>
                </Pressable>
              )}
              <View style={styles.categories}>
                {isEdit && original?.categoryId === null && (
                  <Pressable
                    onPress={() => setCategory(null)}
                    style={[
                      styles.category,
                      category === null && styles.categoryActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === null && styles.categoryTextActive,
                      ]}
                    >
                      미분류
                    </Text>
                  </Pressable>
                )}
                {categories.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === item.id }}
                    onPress={() => setCategory(item.id)}
                    style={[
                      styles.category,
                      category === item.id && styles.categoryActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === item.id && styles.categoryTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.addCategory}
                  accessibilityRole="button"
                  accessibilityLabel="카테고리 추가"
                  onPress={() => {
                    Keyboard.dismiss();
                    setCategoryVisible(true);
                  }}
                >
                  <Ionicons name="add" size={22} color={Colors.gray[8]} />
                </Pressable>
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel title="일정 제목" />
              <View>
                <InputField
                  accessibilityLabel="일정 제목"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={20}
                  placeholder="제목을 입력해주세요"
                  style={styles.titleInput}
                />
                <Text pointerEvents="none" style={styles.titleCounter}>
                  {title.length}/20
                </Text>
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel title="상세 내용" />
              <View>
                <InputField
                  accessibilityLabel="상세 내용"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="default"
                  placeholder="세부적인 일정 내용을 작성해주세요"
                  style={styles.descriptionInput}
                />
                <Text pointerEvents="none" style={styles.descriptionCounter}>
                  {description.length}/200
                </Text>
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel title="이미지" />
              <PhotoField
                photos={photos}
                onChange={setPhotos}
                limit={Math.max(1, original?.photos?.length || 0)}
              />
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel title="일정 시작" />
              <CalendarDateTimeField
                date={startDate}
                time={startTime}
                onDate={setStartDate}
                onTime={setStartTime}
              />
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel title="일정 종료" />
              <CalendarDateTimeField
                date={endDate}
                time={endTime}
                onDate={setEndDate}
                onTime={setEndTime}
              />
              {invalidRange && (
                <Text style={styles.rangeError}>
                  종료 일시는 시작 일시 이후로 설정해주세요.
                </Text>
              )}
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel title="반복 설정" />
              <InlineDropdown
                value={repeat}
                displayValue={
                  repeatOptions.find((option) => option.value === repeat)?.label
                }
                placeholder="없음"
                open={repeatOpen}
                onPress={() => {
                  Keyboard.dismiss();
                  setRepeatOpen((value) => !value);
                }}
                options={repeatOptions}
                onSelect={(value) => {
                  setRepeat(value as CalendarRepeatType);
                  setRepeatOpen(false);
                }}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <CalendarCategorySheet
        visible={categoryVisible}
        onClose={() => setCategoryVisible(false)}
        onAdd={async (name) => {
          const existing = categories.find((item) => item.name === name);
          if (existing) {
            setCategory(existing.id);
            return;
          }
          const response = await createCalendarCategory({
            name,
            color: Colors.primary.default,
          });
          const created = response.data.data;
          setCategories((items) => [...items, created]);
          setCategory(created.id);
          setCategoryError(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  container: { flex: 1, backgroundColor: Colors.common.white },
  flex: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { ...fonts.sub3_sb_16, color: Colors.common.black },
  submit: {
    minHeight: 44,
    minWidth: 64,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  submitText: { ...fonts.body1_m_16, color: Colors.gray[7] },
  submitActive: { color: Colors.primary.default },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 16,
  },
  fieldGroup: { gap: 8 },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  category: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.gray[1],
  },
  categoryActive: { backgroundColor: Colors.gray[11] },
  categoryText: { ...fonts.body2_m_14, color: Colors.gray[7] },
  categoryTextActive: { color: Colors.common.white },
  addCategory: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[2],
    alignItems: "center",
    justifyContent: "center",
  },
  titleInput: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
    paddingRight: 58,
    borderColor: Colors.gray[3],
  },
  titleCounter: {
    position: "absolute",
    right: 14,
    top: 16,
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  descriptionInput: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
    height: 184,
    paddingBottom: 36,
    borderColor: Colors.gray[3],
  },
  descriptionCounter: {
    position: "absolute",
    right: 14,
    bottom: 12,
    ...fonts.caption3_m_13,
    color: Colors.gray[7],
  },
  rangeError: { ...fonts.caption5_r_13, color: Colors.primary.heavy },
});
