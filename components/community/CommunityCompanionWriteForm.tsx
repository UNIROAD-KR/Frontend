import {
  BottomSheetModal,
  bottomSheetStyles,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Text, TextInput } from "@/components/ui/app-text";
import { Modal } from "@/components/ui/modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  CompanionPostRequest,
  createCompanionPost,
  updateCompanionPost,
} from "../../src/api/companion";
import { BLUE } from "../../src/data/community";
import { canUseMarketWithoutVerification } from "../../src/utils/verification";
import { Colors, fonts, commonStyles } from "@/constants/theme";
import { MarketCountrySheet } from "@/components/market/MarketCountrySheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import { useAppAlert } from "@/hooks/use-app-alert";

type DateTarget = "start" | "end" | null;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value?: string) => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

export function CommunityCompanionWriteForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, alertElement } = useAppAlert();
  const params = useLocalSearchParams<{
    mode?: string;
    id?: string;
    title?: string;
    body?: string;
    country?: string;
    region?: string;
    startDate?: string;
    endDate?: string;
    chatLink?: string;
    capacity?: string;
    currentParticipants?: string;
    genderRatio?: string;
    status?: "RECRUITING" | "COMPLETED";
  }>();
  const isEdit = params.mode === "edit";

  const [title, setTitle] = useState(params.title || "");
  const [body, setBody] = useState(params.body || "");
  const [country, setCountry] = useState(params.country || "");
  const [region, setRegion] = useState(params.region || "");
  const [startDate, setStartDate] = useState(params.startDate || "");
  const [endDate, setEndDate] = useState(params.endDate || "");
  const [capacity, setCapacity] = useState(params.capacity || "");
  const [currentParticipants] = useState(params.currentParticipants || "1");
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const chatLink = params.chatLink || "";
  const [status] = useState<"RECRUITING" | "COMPLETED">(
    params.status || "RECRUITING",
  );
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] =
    useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const canWrite = await canUseMarketWithoutVerification();

        if (!canWrite) {
          setVerificationModalVisible(true);
        }
      } catch (error: any) {
        console.log(
          "내 정보 조회 실패:",
          error.response?.data || error.message,
        );
        setVerificationModalVisible(true);
      }
    };

    checkVerification();
  }, []);

  const openDatePicker = (target: Exclude<DateTarget, null>) => {
    setDraftDate(parseDate(target === "start" ? startDate : endDate));
    setDateTarget(target);
  };

  const handleConfirmDate = () => {
    const nextDate = formatDate(draftDate);

    if (dateTarget === "start") {
      setStartDate(nextDate);
      if (endDate && endDate < nextDate) {
        setEndDate("");
      }
    }

    if (dateTarget === "end") {
      setEndDate(nextDate);
      if (startDate && startDate > nextDate) {
        setStartDate("");
      }
    }

    setDateTarget(null);
  };

  const buildPayload = (): CompanionPostRequest | null => {
    const capacityNumber = Number(capacity);
    const currentNumber = Number(currentParticipants);

    if (
      !title.trim() ||
      !body.trim() ||
      !country.trim() ||
      !region.trim() ||
      !startDate ||
      !endDate ||
      !capacity.trim()
    ) {
      showAlert("입력 오류", "필수 항목을 모두 입력해주세요.");
      return null;
    }

    if (!Number.isInteger(capacityNumber) || capacityNumber < 2) {
      showAlert("입력 오류", "모집 인원은 2명 이상 숫자로 입력해주세요.");
      return null;
    }

    if (!Number.isInteger(currentNumber) || currentNumber < 1) {
      showAlert("입력 오류", "현재 인원은 1명 이상 숫자로 입력해주세요.");
      return null;
    }

    if (currentNumber > capacityNumber) {
      showAlert("입력 오류", "현재 인원은 모집 인원보다 클 수 없어요.");
      return null;
    }

    return {
      title: title.trim(),
      content: body.trim(),
      startDate,
      endDate,
      country: country.trim(),
      region: region.trim(),
      chatLink: chatLink.trim(),
      status,
      capacity: capacityNumber,
      currentParticipants: currentNumber,
      genderRatio: isEdit ? params.genderRatio || "무관" : "무관",
    };
  };

  const companionValid = Boolean(
    country.trim() &&
    region.trim() &&
    startDate &&
    endDate &&
    startDate <= endDate &&
    Number.isInteger(Number(capacity)) &&
    Number(capacity) >= 2 &&
    Number.isInteger(Number(currentParticipants)) &&
    Number(currentParticipants) >= 1 &&
    Number(currentParticipants) <= Number(capacity) &&
    title.trim() &&
    body.trim() &&
    body.length <= 200,
  );
  const submitDisabled = submitting || !companionValid;

  const handleSubmit = async () => {
    if (submitDisabled) {
      return;
    }

    setSubmitting(true);

    const payload = buildPayload();

    if (!payload) {
      setSubmitting(false);
      return;
    }

    try {
      if (isEdit && params.id) {
        await updateCompanionPost(Number(params.id), payload);
      } else {
        await createCompanionPost(payload);
      }

      showAlert(
        isEdit ? "수정 완료" : "등록 완료",
        isEdit ? "동행 모집 글을 수정했어요." : "동행 모집 글을 등록했어요.",
        [{ text: "확인했어요", onPress: () => goBackOrReplace("/community") }],
      );
    } catch (error: any) {
      console.log(
        "동행 모집 저장 실패:",
        error.response?.data || error.message,
      );
      showAlert(
        "저장 실패",
        error.response?.data?.message || "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          { height: insets.top + 56, paddingTop: insets.top },
        ]}
      >
        <View style={styles.headerSide}>
          <AppBackButton
            onPress={() => goBackOrReplace("/community")}
            style={styles.backButton}
          />
        </View>
        <Text style={styles.headerTitle}>
          동행 모집 {isEdit ? "수정하기" : "글쓰기"}
        </Text>
        <Pressable
          style={[styles.headerSide, styles.headerSubmit]}
          onPress={handleSubmit}
          disabled={submitDisabled}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? "동행 글 수정 제출" : "동행 글쓰기 제출"}
          accessibilityState={{ disabled: submitDisabled, busy: submitting }}
        >
          <Text
            style={[
              styles.writeText,
              !submitDisabled && { color: Colors.primary.default },
            ]}
          >
            {isEdit ? "수정하기" : "등록하기"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>모집 조건</Text>
        <View style={styles.field}>
          <Text style={styles.label}>국가 및 지역</Text>
          <Pressable
            style={styles.select}
            onPress={() => setCountrySheetVisible(true)}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.value,
                { flex: 1 },
                !country && styles.placeholder,
              ]}
            >
              {country || "국가 및 지역을 선택해주세요"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray[11]} />
          </Pressable>
          {!!country && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={region}
              onChangeText={setRegion}
              placeholder="도시 / 지역을 입력해주세요"
              placeholderTextColor={Colors.gray[5]}
            />
          )}
        </View>
        <View style={styles.dateRow}>
          {(["start", "end"] as const).map((target) => {
            const value = target === "start" ? startDate : endDate;
            return (
              <View key={target} style={{ flex: 1 }}>
                <Text style={styles.label}>
                  일정 {target === "start" ? "시작" : "종료"}
                </Text>
                <Pressable
                  style={styles.dateParts}
                  onPress={() => openDatePicker(target)}
                  accessibilityRole="button"
                  accessibilityLabel={`${target === "start" ? "시작일" : "종료일"} ${value || "선택"}`}
                >
                  <View style={styles.datePart}>
                    <Text style={[styles.value, !value && styles.placeholder]}>
                      {value ? value.slice(0, 4) : "년"}
                    </Text>
                  </View>
                  <View style={styles.datePart}>
                    <Text style={[styles.value, !value && styles.placeholder]}>
                      {value ? value.slice(5).replace("-", ".") : "월 / 일"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>모집 인원</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepButton}
              onPress={() =>
                setCapacity(
                  String(
                    Math.max(
                      Math.max(2, Number(currentParticipants)),
                      (Number(capacity) || 0) - 1,
                    ),
                  ),
                )
              }
              disabled={
                Number(capacity) <= Math.max(2, Number(currentParticipants))
              }
              accessibilityLabel="모집 인원 줄이기"
            >
              <Ionicons name="remove" size={20} color={Colors.gray[7]} />
            </Pressable>
            <View style={styles.stepValue}>
              <Text style={styles.value}>{capacity || "0"}</Text>
            </View>
            <Pressable
              style={styles.stepButton}
              onPress={() =>
                setCapacity(
                  String(
                    Math.max(
                      2,
                      Number(currentParticipants),
                      (Number(capacity) || 0) + 1,
                    ),
                  ),
                )
              }
              accessibilityLabel="모집 인원 늘리기"
            >
              <Ionicons name="add" size={20} color={Colors.gray[7]} />
            </Pressable>
          </View>
        </View>
        {/* <View style={styles.field}> */}
        {/* <Text style={styles.label}>소통 링크</Text>
          <View style={styles.select}>
            <Ionicons name="link-outline" size={22} color={Colors.gray[11]} />
            <TextInput
              style={styles.linkInput}
              value={chatLink}
              onChangeText={setChatLink}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="링크를 입력해주세요"
              placeholderTextColor={Colors.gray[5]}
            />
          </View> */}
        {/* </View> */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>게시글 작성</Text>
        <View style={styles.field}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요"
            placeholderTextColor={Colors.gray[5]}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>내용</Text>
          <View style={styles.bodyBox}>
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={200}
              textAlignVertical="top"
              placeholder="세부적인 동행 모집 내용을 작성해주세요"
              placeholderTextColor={Colors.gray[5]}
            />
            <Text style={styles.bodyCount}>{body.length}/200</Text>
          </View>
        </View>
      </ScrollView>

      <MarketCountrySheet
        visible={countrySheetVisible}
        allowAll={false}
        selectedCountry={country}
        onClose={() => setCountrySheetVisible(false)}
        onSelect={(value) => {
          setCountry(value);
          if (value !== country) setRegion("");
          setCountrySheetVisible(false);
        }}
      />

      <BottomSheetModal
        visible={dateTarget !== null}
        onRequestClose={() => setDateTarget(null)}
      >
        <View style={[styles.pickerOverlay, bottomSheetStyles.transparent]}>
          <Pressable
            style={[styles.pickerBackdrop, bottomSheetStyles.transparent]}
            onPress={() => setDateTarget(null)}
          />

          <BottomSheetView style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable onPress={() => setDateTarget(null)}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>

              <Text style={styles.pickerTitle}>
                {dateTarget === "start" ? "시작일 선택" : "종료일 선택"}
              </Text>

              <Pressable onPress={handleConfirmDate}>
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              locale="ko-KR"
              textColor="#111111"
              themeVariant="light"
              style={styles.iosPicker}
              onChange={(event, date) => {
                if (date) {
                  setDraftDate(date);
                }
              }}
            />
          </BottomSheetView>
        </View>
      </BottomSheetModal>

      <Modal
        isOpen={verificationModalVisible}
        title="교환학생 인증"
        description={"동행 모집 글은 인증된 인원만 작성할 수 있어요."}
        secondaryButton={{
          label: "취소",
          onPress: () => {
            setVerificationModalVisible(false);
            router.back();
          },
        }}
        primaryButton={{
          label: "신원 인증하기",
          onPress: () => {
            setVerificationModalVisible(false);
            router.push("/verification" as never);
          },
        }}
      />
      {alertElement}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSide: { width: 64, minHeight: 44, justifyContent: "center" },
  headerSubmit: { alignItems: "flex-end" },
  headerTitle: {
    ...fonts.sub3_sb_16,
    color: Colors.gray[11],
    flex: 1,
    textAlign: "center",
  },
  writeText: { ...fonts.body2_m_14, color: Colors.gray[6] },
  scroll: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sectionTitle: {
    ...fonts.sub1_sb_18,
    color: Colors.gray[11],
    marginBottom: 22,
  },
  field: { marginBottom: 28 },
  label: {
    ...commonStyles.inputLabel,
    marginBottom: 8,
  },
  input: {
    ...fonts.body3_r_16,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    paddingHorizontal: 16,
    color: Colors.gray[11],
  },
  select: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  value: {
    ...fonts.body3_r_16,
    color: Colors.gray[11],
    flexShrink: 1,
  },
  placeholder: { color: Colors.gray[5] },
  dateRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  dateParts: { flexDirection: "row", gap: 4 },
  datePart: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  stepper: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[2],
    borderRadius: 8,
    padding: 4,
  },
  stepButton: {
    width: 42,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  stepValue: {
    width: 42,
    height: 38,
    borderRadius: 6,
    backgroundColor: Colors.common.white,
    justifyContent: "center",
    alignItems: "center",
  },
  linkInput: {
    ...fonts.body3_r_16,
    flex: 1,
    color: Colors.gray[11],
    paddingVertical: 12,
  },
  divider: {
    height: 10,
    backgroundColor: Colors.gray[2],
    marginHorizontal: -20,
    marginBottom: 24,
  },
  bodyBox: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    padding: 16,
  },
  bodyInput: {
    ...fonts.body3_r_16,
    minHeight: 140,
    color: Colors.gray[11],
    padding: 0,
  },
  bodyCount: {
    ...fonts.body4_r_14,
    textAlign: "right",
    color: Colors.gray[7],
    marginTop: 12,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  pickerBackdrop: { flex: 1 },
  pickerSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingBottom: 24,
    overflow: "hidden",
  },
  pickerHeader: {
    height: 54,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  pickerCancel: { fontSize: 15, fontWeight: "800", color: "#777777" },
  pickerTitle: { fontSize: 16, fontWeight: "900", color: "#111111" },
  pickerDone: { fontSize: 15, fontWeight: "900", color: BLUE },
  iosPicker: { height: 216 },
});
