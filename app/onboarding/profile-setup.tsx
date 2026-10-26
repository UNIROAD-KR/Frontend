import CalendarModal from "@/components/ui/calendar";
import { InlineDropdown } from "@/components/ui/inline-dropdown";
import { Text, TextInput } from "@/components/ui/app-text";
import { Colors, fonts, commonStyles } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppBackButton } from "@/components/ui/app-back-button";
import { OnboardingSelectModal } from "@/components/ui/onboarding-select-modal";
import { useResetScrollOnFocus } from "@/hooks/use-reset-scroll-on-focus";
import { onboarding, updateMemberProfile, type OnboardingRequest } from "@/src/api/auth";
import {
  countryOptions,
  CUSTOM_COUNTRY_OPTION,
  dispatchSemesterTerms,
  ExchangeStatus,
  formatDispatchSemester,
  getNicknameError,
  ONBOARDING_NICKNAME_KEY,
  parseDispatchSemester,
  universityOptions,
  type DispatchSemesterTerm,
} from "@/src/constants/onboarding";
import { clearOnboardingDraft } from "@/src/storage/onboardingDraft";

type DateStorageKey =
  | "applicationDeadline"
  | "departureDate"
  | "dispatchStartDate";

type StatusOption = {
  value: ExchangeStatus;
  label: string;
  dateLabel: string;
  dateKey: DateStorageKey;
  profileStatus: string;
};

const statusOptions: StatusOption[] = [
  {
    value: "preparing",
    label: "지원 준비 중",
    dateLabel: "지원 마감일",
    dateKey: "applicationDeadline",
    profileStatus: "지원 준비 중",
  },
  {
    value: "accepted",
    label: "출국 준비 중",
    dateLabel: "출국일",
    dateKey: "departureDate",
    profileStatus: "출국 준비 중",
  },
  {
    value: "dispatched",
    label: "파견 중",
    dateLabel: "파견 시작일",
    dateKey: "dispatchStartDate",
    profileStatus: "파견 중",
  },
];

const emptyStatusDates: Record<ExchangeStatus, string> = {
  preparing: "",
  accepted: "",
  dispatched: "",
};

const toStorageDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolveCountrySelection = (savedCountry: string | null) => {
  if (!savedCountry) return { selectedCountry: "", customCountry: "" };
  if (countryOptions.includes(savedCountry)) {
    return { selectedCountry: savedCountry, customCountry: "" };
  }
  return {
    selectedCountry: CUSTOM_COUNTRY_OPTION,
    customCountry: savedCountry,
  };
};

const mapCurrentSituation = (
  status: ExchangeStatus,
): OnboardingRequest["currentSituation"] => {
  if (status === "dispatched") return "DISPATCHED";
  if (status === "accepted") return "PREPARING_DEPARTURE";
  return "PREPARING_APPLICATION";
};

const mapGender = (
  gender: string | null,
): OnboardingRequest["gender"] | undefined => {
  if (gender === "female") return "FEMALE";
  if (gender === "male") return "MALE";
  return undefined;
};

const calculateAge = (birthYear: string | null) => {
  const value = Number(birthYear);
  return Number.isInteger(value) && value > 0
    ? new Date().getFullYear() - value + 1
    : undefined;
};

function Step({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.progressStep, active && styles.progressStepActive]}>
      {active && <Text style={styles.progressNumber}>{label}</Text>}
    </View>
  );
}

type SelectFieldProps = {
  value: string;
  placeholder: string;
  onPress: () => void;
};

function SelectField({ value, placeholder, onPress }: SelectFieldProps) {
  return (
    <Pressable style={styles.selectField} onPress={onPress}>
      <Text
        style={[styles.selectValue, !value && styles.placeholder]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color="#18202B" />
    </Pressable>
  );
}

export default function ProfileSetupPage({ dispatchStep = false }: { dispatchStep?: boolean }) {
  const scrollRef = useResetScrollOnFocus();
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [birthYear, setBirthYear] = useState("");
  const [university, setUniversity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [region, setRegion] = useState("");
  const [dispatchedUniversity, setDispatchedUniversity] = useState("");
  const [semesterYear, setSemesterYear] = useState("");
  const [semesterTerm, setSemesterTerm] = useState<DispatchSemesterTerm | "">(
    "",
  );
  const [status, setStatus] = useState<ExchangeStatus | "">("");
  const [statusDates, setStatusDates] =
    useState<Record<ExchangeStatus, string>>(emptyStatusDates);
  const [universityPickerVisible, setUniversityPickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [dateTarget, setDateTarget] = useState<"status" | "return" | null>(null);
  const [onboardingSaved, setOnboardingSaved] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nicknameError = useMemo(() => getNicknameError(nickname), [nickname]);
  const selectedStatus = useMemo(
    () => statusOptions.find((option) => option.value === status) ?? null,
    [status],
  );
  const statusDate = status ? statusDates[status] : "";
  const isCustomCountry = selectedCountry === CUSTOM_COUNTRY_OPTION;
  const finalCountry = isCustomCountry ? customCountry.trim() : selectedCountry;
  const returnDateError = status === "dispatched" && returnDate && statusDate && returnDate < statusDate
    ? "귀국일은 파견 시작일 이후로 선택해주세요." : "";
  const isProfileValid = Boolean(nickname.trim() && !nicknameError && university && status && statusDate && !returnDateError);
  const isValid = isProfileValid && Boolean(finalCountry && semesterYear && semesterTerm);

  const semesterYears = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) =>
        String(new Date().getFullYear() - 3 + index),
      ),
    [],
  );
  useEffect(() => {
    const loadDraft = async () => {
      const entries = await AsyncStorage.multiGet([
        ONBOARDING_NICKNAME_KEY,
        "gender",
        "birthYear",
        "university",
        "dispatchedCountry",
        "dispatchedRegion",
        "dispatchedUniversity",
        "dispatchSemester",
        "dispatchSemesterYear",
        "dispatchSemesterTerm",
        "onboardingSituation",
        "applicationDeadline",
        "departureDate",
        "dispatchStartDate",
        "returnDate",
      ]);
      const saved = Object.fromEntries(entries);
      const country = resolveCountrySelection(saved.dispatchedCountry);
      const parsedSemester = parseDispatchSemester(saved.dispatchSemester);

      setNickname(saved[ONBOARDING_NICKNAME_KEY] ?? "");
      setGender(
        saved.gender === "female" || saved.gender === "male"
          ? saved.gender
          : "",
      );
      setBirthYear(saved.birthYear ?? "");
      setUniversity(saved.university ?? "");
      setReturnDate(saved.returnDate ?? "");
      setSelectedCountry(country.selectedCountry);
      setCustomCountry(country.customCountry);
      setRegion(saved.dispatchedRegion ?? "");
      setDispatchedUniversity(saved.dispatchedUniversity ?? "");
      setSemesterYear(parsedSemester.year || saved.dispatchSemesterYear || "");
      setSemesterTerm(
        parsedSemester.term ||
          (saved.dispatchSemesterTerm as DispatchSemesterTerm) ||
          "",
      );
      setStatus(
        saved.onboardingSituation === "preparing" ||
          saved.onboardingSituation === "accepted" ||
          saved.onboardingSituation === "dispatched"
          ? saved.onboardingSituation
          : "",
      );
      setStatusDates({
        preparing: saved.applicationDeadline ?? "",
        accepted: saved.departureDate ?? "",
        dispatched: saved.dispatchStartDate ?? "",
      });
    };

    void loadDraft();
  }, []);

  const saveNickname = (value: string) => {
    setNickname(value);
    void AsyncStorage.setItem(ONBOARDING_NICKNAME_KEY, value);
  };

  const selectCountry = (value: string) => {
    setSelectedCountry(value);
    setCountryPickerVisible(false);
    if (value !== CUSTOM_COUNTRY_OPTION) {
      setCustomCountry("");
      void AsyncStorage.setItem("dispatchedCountry", value);
    } else {
      setCustomCountry("");
      void AsyncStorage.setItem("dispatchedCountry", "");
    }
  };

  const selectSemesterYear = (year: string) => {
    setSemesterYear(year);
    setYearPickerVisible(false);
    void AsyncStorage.setItem("dispatchSemesterYear", year);
  };

  const selectStatus = (nextStatus: ExchangeStatus) => {
    setStatus(nextStatus);
    setDateTarget(null);
    void AsyncStorage.setItem("onboardingSituation", nextStatus);
  };

  const commitDate = (value: string) => {
    if (dateTarget === "return") {
      setReturnDate(value);
      void AsyncStorage.setItem("returnDate", value);
    } else if (status && selectedStatus) {
      setStatusDates((current) => ({ ...current, [status]: value }));
      void AsyncStorage.setItem(selectedStatus.dateKey, value);
    }
  };

  const openDatePicker = (target: "status" | "return") => {
    Keyboard.dismiss();
    setDateTarget(target);
  };

  const handleNext = async () => {
    if (!isProfileValid || !status || !selectedStatus || submitting) return;
    setSubmitting(true);
    try {
      await AsyncStorage.multiSet([
        [ONBOARDING_NICKNAME_KEY, nickname],
        ["university", university],
        ["onboardingSituation", status],
        [selectedStatus.dateKey, statusDate],
        ["returnDate", returnDate],
      ]);
      Keyboard.dismiss();
      router.push("/onboarding/dispatch-setup");
    } catch {
      Alert.alert("저장 실패", "잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    if (!isValid || !status || !selectedStatus || submitting) return;

    Keyboard.dismiss();
    setSubmitting(true);

    const selectedDateKey = selectedStatus.dateKey;
    const dispatchSemester = formatDispatchSemester(
      semesterYear,
      semesterTerm as DispatchSemesterTerm,
    );

    try {
      const requestGender = mapGender(gender);
      const requestAge = calculateAge(birthYear);

      const request: OnboardingRequest = {
        nickname: nickname.trim(),
        ...(requestGender ? { gender: requestGender } : {}),
        ...(requestAge ? { age: requestAge } : {}),
        currentSituation: mapCurrentSituation(status),
        domesticUniversity: university,
        ...(dispatchedUniversity.trim() ? { dispatchedUniversity: dispatchedUniversity.trim() } : {}),
        dispatchedCountry: finalCountry,
        ...(region.trim() ? { dispatchedRegion: region.trim() } : {}),
        dispatchSemester,
        ...(selectedDateKey === "applicationDeadline"
          ? { applicationDeadline: statusDate }
          : {}),
        ...(selectedDateKey === "departureDate"
          ? { departureDate: statusDate }
          : {}),
        ...(selectedDateKey === "dispatchStartDate"
          ? { dispatchStartDate: statusDate }
          : {}),
      };

      await AsyncStorage.multiSet([
        [ONBOARDING_NICKNAME_KEY, nickname.trim()],
        ["gender", gender],
        ["birthYear", birthYear],
        ["university", university],
        ["dispatchedCountry", finalCountry],
        ["dispatchedRegion", region.trim()],
        ["dispatchedUniversity", dispatchedUniversity.trim()],
        ["dispatchSemester", dispatchSemester],
        ["dispatchSemesterYear", semesterYear],
        ["dispatchSemesterTerm", semesterTerm],
        ["onboardingSituation", status],
        ["exchangeStatus", status],
        ["profileStatus", selectedStatus.profileStatus],
        [
          "applicationDeadline",
          selectedDateKey === "applicationDeadline" ? statusDate : "",
        ],
        [
          "departureDate",
          selectedDateKey === "departureDate" ? statusDate : "",
        ],
        [
          "dispatchStartDate",
          selectedDateKey === "dispatchStartDate" ? statusDate : "",
        ],
      ]);

      if (__DEV__) {
        console.log("[Onboarding] 저장 요청:", request);
      }
      if (!onboardingSaved) {
        await onboarding(request);
        setOnboardingSaved(true);
      } else {
        await updateMemberProfile({
          nickname: request.nickname,
          currentSituation: request.currentSituation,
          domesticUniversity: request.domesticUniversity,
          dispatchedCountry: request.dispatchedCountry,
          dispatchedRegion: region.trim(),
          dispatchedUniversity: dispatchedUniversity.trim(),
          dispatchSemester,
          applicationDeadline: request.applicationDeadline,
          departureDate: request.departureDate,
          dispatchStartDate: request.dispatchStartDate,
        });
      }
      if (status === "dispatched" && returnDate) {
        await updateMemberProfile({ returnDate });
      }
      await AsyncStorage.setItem("returnDate", status === "dispatched" ? returnDate : "");
      await AsyncStorage.setItem("nickname", nickname.trim());
      await clearOnboardingDraft();
      router.replace("/home");
    } catch (error: any) {
      console.log(
        "[Onboarding] 저장 실패:",
        error.response?.status,
        error.response?.data || error.message,
      );
      Alert.alert(
        "온보딩 저장 실패",
        error.response?.data?.message ??
          "입력한 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
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
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppBackButton
            fallbackHref={dispatchStep ? "/onboarding/profile-setup" : "/onboarding/consent"}
            style={styles.backButton}
          />
          <Text style={[fonts.sub3_sb_16, { textAlign: "center" }]}>
            {dispatchStep ? "파견 정보 설정" : "프로필 설정"}
          </Text>
        </View>

        <View style={styles.progressRow}>
          <Step label="1" />
          <Step label="2" active={!dispatchStep} />
          <Step label="3" active={dispatchStep} />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[fonts.title3_b_24, { color: Colors.common.black }]}>
            {dispatchStep ? "파견 정보 설정하기" : "프로필 설정하기"}
          </Text>
          <Text style={[fonts.body4_r_14, { color: Colors.gray[7] }]}>
            {dispatchStep ? "파견 학기와 국가, 지역 정보를 설정해 주세요." : "프로필을 설정하고 나만의 서비스를 시작해 보세요."}
          </Text>
        </View>

        {!dispatchStep ? (<>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>닉네임<Text style={styles.required}> *</Text></Text>
          <View
            style={[styles.textField, nicknameError && styles.textFieldError]}
          >
            <TextInput
              value={nickname}
              onChangeText={saveNickname}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#B3BDC9"
              style={styles.textInput}
              maxLength={12}
              returnKeyType="next"
            />
            <Text style={[fonts.body1_m_16, { color: "#191F28" }]}>
              {nickname.length}/12
            </Text>
          </View>
          {nicknameError ? (
            <Text style={styles.errorText}>{nicknameError}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>소속 대학<Text style={styles.required}> *</Text></Text>
          <SelectField
            value={university}
            placeholder="소속 대학을 선택해주세요"
            onPress={() => setUniversityPickerVisible(true)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견 상태<Text style={styles.required}> *</Text></Text>
          <View style={styles.statusRow}>
            {statusOptions.map((option) => {
              const selected = status === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.statusButton,
                    selected && styles.statusButtonSelected,
                  ]}
                  onPress={() => selectStatus(option.value)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      selected && styles.statusTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedStatus && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{selectedStatus.dateLabel}<Text style={styles.required}> *</Text></Text>
            <Pressable style={styles.selectField} onPress={() => openDatePicker("status")} accessibilityRole="button" accessibilityLabel={selectedStatus.dateLabel}>
              <Text style={[styles.selectValue, !statusDate && styles.placeholder]}>{statusDate ? statusDate.replaceAll("-", ". ") : "날짜를 입력해주세요"}</Text>
              <Ionicons name="calendar-outline" size={22} color="#B3BDC9" />
            </Pressable>
          </View>
        )}
        {status === "dispatched" && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>귀국일</Text>
            <Pressable style={styles.selectField} onPress={() => openDatePicker("return")} accessibilityRole="button" accessibilityLabel="귀국일">
              <Text style={[styles.selectValue, !returnDate && styles.placeholder]}>{returnDate ? returnDate.replaceAll("-", ". ") : "날짜를 입력해주세요"}</Text>
              <Ionicons name="calendar-outline" size={22} color="#B3BDC9" />
            </Pressable>
            {returnDateError ? <Text style={styles.errorText}>{returnDateError}</Text> : null}
          </View>
        )}
        </>) : (<>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견 학기<Text style={styles.required}> *</Text></Text>
          <InlineDropdown
            value={semesterYear}
            displayValue={semesterYear ? `${semesterYear}년` : ""}
            placeholder="0000년"
            open={yearPickerVisible}
            options={semesterYears.map((year) => ({
              value: year,
              label: `${year}년`,
            }))}
            onPress={() => setYearPickerVisible((visible) => !visible)}
            onSelect={selectSemesterYear}
          />
          <View style={styles.termRow}>
            {dispatchSemesterTerms.map((term) => {
              const selected = semesterTerm === term;
              return (
                <Pressable
                  key={term}
                  style={[
                    styles.termButton,
                    selected && styles.termButtonSelected,
                  ]}
                  onPress={() => {
                    setSemesterTerm(term);
                    void AsyncStorage.setItem("dispatchSemesterTerm", term);
                  }}
                >
                  <Text
                    style={[
                      styles.termText,
                      selected && styles.termTextSelected,
                    ]}
                  >
                    {term}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견 국가<Text style={styles.required}> *</Text></Text>
          <SelectField
            value={
              selectedCountry === CUSTOM_COUNTRY_OPTION
                ? customCountry
                : selectedCountry
            }
            placeholder="파견 국가를 선택해주세요"
            onPress={() => setCountryPickerVisible(true)}
          />
          {isCustomCountry ? (
            <TextInput
              value={customCountry}
              onChangeText={(value) => {
                setCustomCountry(value);
                void AsyncStorage.setItem("dispatchedCountry", value.trim());
              }}
              placeholder="파견 국가를 입력해주세요"
              placeholderTextColor="#B3BDC9"
              style={[
                styles.textField,
                styles.followingField,
                styles.textInput,
              ]}
            />
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>상세 지역</Text>
          <TextInput
            value={region}
            onChangeText={(value) => {
              setRegion(value);
              void AsyncStorage.setItem("dispatchedRegion", value.trim());
            }}
            placeholder="상세 지역을 입력해주세요"
            placeholderTextColor="#B3BDC9"
            style={[styles.textField, styles.textInput]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>파견교</Text>
          <TextInput
            value={dispatchedUniversity}
            onChangeText={(value) => {
              setDispatchedUniversity(value);
              void AsyncStorage.setItem("dispatchedUniversity", value.trim());
            }}
            placeholder="파견 대학을 입력해주세요"
            placeholderTextColor="#B3BDC9"
            style={[styles.textField, styles.textInput]}
          />
        </View>

        </>)}

        <Pressable
          style={[styles.startButton, (dispatchStep ? isValid : isProfileValid) && styles.startButtonActive]}
          onPress={dispatchStep ? handleStart : handleNext}
          disabled={!(dispatchStep ? isValid : isProfileValid) || submitting}
        >
          <Text style={styles.startButtonText}>
            {submitting ? "저장 중..." : dispatchStep ? "UNIROAD 시작하기" : "다음 단계로"}
          </Text>
        </Pressable>
      </ScrollView>

      <CalendarModal
        visible={dateTarget !== null}
        value={
          (dateTarget === "return" ? returnDate : statusDate)
            ? new Date(
                `${dateTarget === "return" ? returnDate : statusDate}T12:00:00`,
              )
            : undefined
        }
        minDate={
          dateTarget === "return" && statusDate
            ? new Date(`${statusDate}T12:00:00`)
            : undefined
        }
        onSelect={(date) => {
          commitDate(toStorageDate(date));
          setDateTarget(null);
        }}
        onClose={() => setDateTarget(null)}
      />

      <OnboardingSelectModal
        visible={universityPickerVisible}
        title="소속 대학 선택하기"
        options={universityOptions}
        selectedValue={university}
        selectionMode="confirm"
        searchPlaceholder="학교명으로 찾아보세요"
        onClose={() => setUniversityPickerVisible(false)}
        onSelect={(value) => {
          setUniversity(value);
          setUniversityPickerVisible(false);
          void AsyncStorage.setItem("university", value);
        }}
      />

      <OnboardingSelectModal
        visible={countryPickerVisible}
        title="파견 국가 선택하기"
        options={countryOptions}
        selectedValue={selectedCountry}
        selectionMode="confirm"
        searchPlaceholder="국가명으로 찾아보세요"
        onClose={() => setCountryPickerVisible(false)}
        onSelect={selectCountry}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 36 },
  contentWithOpenDateDropdown: { paddingBottom: 250 },
  header: { height: 60, justifyContent: "center" },
  backButton: { position: "absolute", left: 0 },
  title: {
    color: "#141416",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#7A8491",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 30,
  },
  fieldGroup: { marginTop: 20 },
  required: { color: "#F04452" },
  label: {
    ...commonStyles.inputLabel,
    marginBottom: 4,
  },
  textField: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#E0E5EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  textFieldError: { borderColor: "#F04452" },
  textInput: {
    flex: 1,
    ...fonts.body1_m_16,
    paddingVertical: 0,
  },
  counter: {
    color: "#18202B",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
  },
  errorText: {
    color: "#F04452",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  selectField: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E0E5EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
    marginRight: 10,
  },
  placeholder: { color: "#B3BDC9", ...fonts.body1_m_16 },
  inlineDropdownAnchor: { position: "relative", zIndex: 20, flex: 1 },
  compactDropdownAnchor: { zIndex: 30 },
  inlineDropdownMenu: {
    position: "absolute",
    top: 51,
    left: 0,
    right: 0,
    height: 206,
    borderWidth: 1,
    borderColor: "#E0E5EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 40,
    shadowColor: "#111827",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  compactDropdownMenu: { height: 156 },
  inlineDropdownScroll: { flex: 1 },
  inlineDropdownOption: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  inlineDropdownOptionText: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  inlineDropdownOptionTextSelected: {
    color: Colors.primary.default,
    ...fonts.body1_m_16,
  },
  followingField: { marginTop: 6 },
  genderRow: { flexDirection: "row", gap: 8 },
  genderButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: "#E0E5EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  genderButtonSelected: { borderColor: "#18202B", backgroundColor: "#18202B" },
  genderText: { color: "#7A8491", fontSize: 15, fontWeight: "800" },
  genderTextSelected: { color: "#FFFFFF" },
  termRow: { flexDirection: "row", gap: 5, marginTop: 6 },
  termButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray[1],
  },
  termButtonSelected: {
    backgroundColor: Colors.common.white,
    borderWidth: 1,
    borderColor: Colors.primary.default,
  },
  termText: { color: Colors.gray[7], ...fonts.body1_m_16 },
  termTextSelected: { color: Colors.primary.default },
  statusRow: { flexDirection: "row", gap: 5 },
  statusButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray[1],
  },
  statusButtonSelected: {
    backgroundColor: Colors.common.white,
    borderWidth: 1,
    borderColor: Colors.primary.default,
  },
  statusText: { color: Colors.gray[7], ...fonts.body1_m_16 },
  statusTextSelected: { color: Colors.primary.default },
  startButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.primary.light,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
  },
  startButtonActive: { backgroundColor: Colors.primary.default },
  startButtonText: { color: Colors.common.white, ...fonts.sub3_sb_16 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
    gap: 12,
  },
  progressStep: {
    width: 6,
    height: 6,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray[4],
  },
  progressStepActive: {
    width: 20,
    height: 20,
    backgroundColor: Colors.gray[9],
  },
  progressNumber: {
    ...fonts.caption4_m_12,
    color: Colors.common.white,
  },
});
