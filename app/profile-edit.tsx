import { commonStyles, fonts, Colors } from "@/constants/theme";
import { PhotoPickerSheet } from "@/components/ui/photo-picker-sheet";
import { Text, TextInput } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  getMemberMe,
  updateMemberProfile,
  type CurrentSituation,
  type MemberProfileUpdateRequest,
} from "../src/api/auth";
import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import { useAppAlert } from "@/hooks/use-app-alert";
import { OnboardingSelectModal } from "@/components/ui/onboarding-select-modal";
import DropdownArrowIcon from "@/assets/icon/Property 1=arrow2, Property 2=down.svg";
import ProfileEditAvatarActionIcon from "@/assets/icon/profile/profile-edit-avatar-action.svg";
import ProfileEditAvatarBackground from "@/assets/icon/profile/profile-edit-avatar-background.svg";
import {
  CUSTOM_COUNTRY_OPTION,
  countryOptions,
  dispatchSemesterTerms,
  formatDispatchSemester,
  getNicknameError,
  parseDispatchSemester,
  universityOptions,
} from "@/src/constants/onboarding";

const INK = "#1A2029";
const MUTED = "#7A8491";
const PAGE = "#F6F7F9";

const statusOptions = ["지원 준비 중", "출국 준비 중", "파견 중"];
const semesterYearOptions = Array.from({ length: 12 }, (_, index) =>
  String(new Date().getFullYear() - 3 + index),
);
const dateLabels: Record<string, string> = {
  "지원 준비 중": "지원 마감일",
  "출국 준비 중": "출국일",
  "파견 중": "파견 시작일",
  귀국: "귀국일",
};
const exchangeStatusByProfileStatus: Record<string, string> = {
  "지원 준비 중": "preparing",
  "출국 준비 중": "accepted",
  "파견 중": "dispatched",
  귀국: "returned",
};
const currentSituationByProfileStatus: Record<string, CurrentSituation> = {
  "지원 준비 중": "PREPARING_APPLICATION",
  "출국 준비 중": "PREPARING_DEPARTURE",
  "파견 중": "DISPATCHED",
  귀국: "RETURNED",
};
const profileStatusByCurrentSituation: Record<CurrentSituation, string> = {
  PREPARING_APPLICATION: "지원 준비 중",
  WAITING_RESULT: "지원 준비 중",
  ACCEPTED: "지원 준비 중",
  PREPARING_DEPARTURE: "출국 준비 중",
  DISPATCHED: "파견 중",
  RETURNED: "귀국",
};
type DateFieldKey =
  | "applicationDeadline"
  | "departureDate"
  | "dispatchStartDate"
  | "returnDate";
type DatePart = "year" | "month" | "day";
type EditSnapshot = {
  avatarUri: string;
  nickname: string;
  homeUniversity: string;
  country: string;
  region: string;
  dispatchedUniversity: string;
  status: string;
  applicationDeadline: string;
  departureDate: string;
  dispatchStartDate: string;
  returnDate: string;
  dispatchSemester: string;
};

const createDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);
const toDateValue = (value: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toStorageDate = (date: Date | null) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";
const normalizeDispatchSemester = (value?: string | number | null) => {
  if (value === null || value === undefined) return "";

  const trimmedValue = String(value).trim();
  const parsedValue = parseDispatchSemester(trimmedValue);

  if (/^\d{4}$/.test(trimmedValue)) return "";
  if (parsedValue.year && parsedValue.term) {
    return formatDispatchSemester(parsedValue.year, parsedValue.term);
  }

  return trimmedValue;
};

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert, alertElement } = useAppAlert();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"프로필 정보" | "파견 정보">(
    "프로필 정보",
  );
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState("");
  const [homeUniversity, setHomeUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [dispatchedUniversity, setDispatchedUniversity] = useState("");
  const [status, setStatus] = useState("출국 준비 중");
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(
    null,
  );
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [dispatchStartDate, setDispatchStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [dispatchSemester, setDispatchSemester] = useState("");
  const [universityPickerVisible, setUniversityPickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [semesterYearPickerVisible, setSemesterYearPickerVisible] =
    useState(false);
  const [customCountryMode, setCustomCountryMode] = useState(false);
  const [openDateDropdown, setOpenDateDropdown] = useState<{
    field: DateFieldKey;
    part: DatePart;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<EditSnapshot | null>(
    null,
  );
  const [loadedCurrentSituation, setLoadedCurrentSituation] =
    useState<CurrentSituation | null>(null);

  const currentSnapshot: EditSnapshot = {
    avatarUri: avatarUri || "",
    nickname: nickname.trim(),
    homeUniversity: homeUniversity.trim(),
    country: country.trim(),
    region: region.trim(),
    dispatchedUniversity: dispatchedUniversity.trim(),
    status,
    applicationDeadline: toStorageDate(applicationDeadline),
    departureDate: toStorageDate(departureDate),
    dispatchStartDate: toStorageDate(dispatchStartDate),
    returnDate: toStorageDate(returnDate),
    dispatchSemester: dispatchSemester.trim(),
  };

  const hasChanges =
    !!initialSnapshot &&
    Object.keys(currentSnapshot).some((key) => {
      const snapshotKey = key as keyof EditSnapshot;
      return currentSnapshot[snapshotKey] !== initialSnapshot[snapshotKey];
    });
  const nicknameError = getNicknameError(nickname);
  const parsedDispatchSemester = parseDispatchSemester(dispatchSemester);
  const isDispatchSemesterValid =
    !dispatchSemester ||
    Boolean(parsedDispatchSemester.year && parsedDispatchSemester.term);
  const activeStatusDate =
    status === "지원 준비 중"
      ? applicationDeadline
      : status === "출국 준비 중"
        ? departureDate
        : status === "파견 중"
          ? dispatchStartDate
          : returnDate;
  const returnDateError =
    status === "파견 중" &&
    returnDate &&
    dispatchStartDate &&
    returnDate < dispatchStartDate
      ? "귀국일은 파견 시작일 이후로 선택해주세요."
      : "";
  const canSave =
    !saving &&
    hasChanges &&
    Boolean(nickname.trim()) &&
    !nicknameError &&
    isDispatchSemesterValid &&
    Boolean(
      homeUniversity.trim() &&
      country.trim() &&
      parsedDispatchSemester.year &&
      parsedDispatchSemester.term,
    ) &&
    (status === "귀국" || Boolean(activeStatusDate)) &&
    !returnDateError;

  const selectUniversity = (value: string) => {
    setHomeUniversity(value);
    setUniversityPickerVisible(false);
  };

  const selectCountry = (value: string) => {
    if (value === CUSTOM_COUNTRY_OPTION) {
      setCountry("");
      setCustomCountryMode(true);
    } else {
      setCountry(value);
      setCustomCountryMode(false);
    }

    setCountryPickerVisible(false);
  };

  const selectSemesterYear = (year: string) => {
    const { term } = parseDispatchSemester(dispatchSemester);
    setDispatchSemester(term ? formatDispatchSemester(year, term) : year);
    setSemesterYearPickerVisible(false);
  };

  const selectSemesterTerm = (term: (typeof dispatchSemesterTerms)[number]) => {
    const { year } = parseDispatchSemester(dispatchSemester);
    setDispatchSemester(year ? formatDispatchSemester(year, term) : term);
  };

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const [
          savedAvatar,
          savedNickname,
          savedUniversity,
          savedHomeUniversity,
          savedDispatchedUniversity,
          savedCountry,
          savedRegion,
          savedStatus,
          savedApplicationDeadline,
          savedDepartureDate,
          savedDispatchStartDate,
          savedReturnDate,
          savedDispatchSemester,
          savedOverrides,
        ] = await Promise.all([
          AsyncStorage.getItem("profileAvatarUri"),
          AsyncStorage.getItem("nickname"),
          AsyncStorage.getItem("university"),
          AsyncStorage.getItem("homeUniversity"),
          AsyncStorage.getItem("dispatchedUniversity"),
          AsyncStorage.getItem("dispatchedCountry"),
          AsyncStorage.getItem("dispatchedRegion"),
          AsyncStorage.getItem("profileStatus"),
          AsyncStorage.getItem("applicationDeadline"),
          AsyncStorage.getItem("departureDate"),
          AsyncStorage.getItem("dispatchStartDate"),
          AsyncStorage.getItem("returnDate"),
          AsyncStorage.getItem("dispatchSemester"),
          AsyncStorage.getItem("profileFieldOverrides"),
        ]);

        const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

        const nextAvatar = savedAvatar || null;
        let nextNickname = savedNickname || "";
        let nextHomeUniversity = savedHomeUniversity || savedUniversity || "";
        let nextDispatchedUniversity = savedDispatchedUniversity || "";
        let nextCountry = savedCountry || "";
        let nextRegion = savedRegion || "";
        let nextStatus =
          savedStatus && statusOptions.includes(savedStatus)
            ? savedStatus
            : statusOptions[1];
        let nextCurrentSituation: CurrentSituation | null = null;
        let nextApplicationDeadline = toDateValue(savedApplicationDeadline);
        let nextDepartureDate = toDateValue(savedDepartureDate);
        let nextDispatchStartDate = toDateValue(savedDispatchStartDate);
        const nextReturnDate = toDateValue(savedReturnDate);
        let nextDispatchSemester = normalizeDispatchSemester(
          savedDispatchSemester,
        );

        try {
          const memberRes = await getMemberMe();
          const member = memberRes.data?.data;

          if (member?.nickname && !overrides.nickname)
            nextNickname = member.nickname;
          if (
            (member?.homeUniversity || member?.domesticUniversity) &&
            !overrides.homeUniversity
          ) {
            nextHomeUniversity =
              member.homeUniversity || member.domesticUniversity || "";
          }
          if (member?.dispatchedCountry && !overrides.country)
            nextCountry = member.dispatchedCountry;
          if (member?.dispatchedRegion && !overrides.region)
            nextRegion = member.dispatchedRegion;
          if (member?.dispatchedUniversity && !overrides.dispatchedUniversity) {
            nextDispatchedUniversity = member.dispatchedUniversity;
          }
          if (member?.dispatchSemester && !overrides.dispatchSemester) {
            nextDispatchSemester = normalizeDispatchSemester(
              member.dispatchSemester,
            );
          }
          if (member?.applicationDeadline)
            nextApplicationDeadline = toDateValue(member.applicationDeadline);
          if (member?.departureDate)
            nextDepartureDate = toDateValue(member.departureDate);
          if (member?.dispatchStartDate)
            nextDispatchStartDate = toDateValue(member.dispatchStartDate);
          if (member?.currentSituation) {
            nextCurrentSituation = member.currentSituation;
            nextStatus =
              profileStatusByCurrentSituation[member.currentSituation] ||
              nextStatus;
          }
        } catch (error) {
          console.log("내 정보 조회 실패:", error);
        }

        setAvatarUri(nextAvatar);
        setNickname(nextNickname);
        setHomeUniversity(nextHomeUniversity);
        setDispatchedUniversity(nextDispatchedUniversity);
        setCountry(nextCountry);
        setCustomCountryMode(
          Boolean(nextCountry) && !countryOptions.includes(nextCountry),
        );
        setRegion(nextRegion);
        setStatus(nextStatus);
        setLoadedCurrentSituation(nextCurrentSituation);
        setApplicationDeadline(nextApplicationDeadline);
        setDepartureDate(nextDepartureDate);
        setDispatchStartDate(nextDispatchStartDate);
        setReturnDate(nextReturnDate);
        setDispatchSemester(nextDispatchSemester);
        const loadedSnapshot = {
          avatarUri: nextAvatar || "",
          nickname: nextNickname.trim(),
          homeUniversity: nextHomeUniversity.trim(),
          country: nextCountry.trim(),
          region: nextRegion.trim(),
          dispatchedUniversity: nextDispatchedUniversity.trim(),
          status: nextStatus,
          applicationDeadline: toStorageDate(nextApplicationDeadline),
          departureDate: toStorageDate(nextDepartureDate),
          dispatchStartDate: toStorageDate(nextDispatchStartDate),
          returnDate: toStorageDate(nextReturnDate),
          dispatchSemester: nextDispatchSemester.trim(),
        };

        setInitialSnapshot((prev) => prev ?? loadedSnapshot);
      };

      loadProfile();
    }, []),
  );

  const setDateForField = (field: DateFieldKey, date: Date) => {
    if (field === "applicationDeadline") {
      setApplicationDeadline(date);
      return;
    }

    if (field === "departureDate") {
      setDepartureDate(date);
      return;
    }

    if (field === "dispatchStartDate") {
      setDispatchStartDate(date);
      return;
    }

    setReturnDate(date);
  };

  const getDateByField = (field: DateFieldKey) => {
    if (field === "applicationDeadline") return applicationDeadline;
    if (field === "departureDate") return departureDate;
    if (field === "dispatchStartDate") return dispatchStartDate;
    return returnDate;
  };

  const toggleDateDropdown = (field: DateFieldKey, part: DatePart) => {
    setOpenDateDropdown((current) =>
      current?.field === field && current.part === part
        ? null
        : { field, part },
    );

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const selectDatePart = (
    field: DateFieldKey,
    part: DatePart,
    value: string,
  ) => {
    const currentDate = getDateByField(field) || new Date();
    const nextYear =
      part === "year" ? Number(value) : currentDate.getFullYear();
    const nextMonth =
      part === "month" ? Number(value) : currentDate.getMonth() + 1;
    const maxDay = new Date(nextYear, nextMonth, 0).getDate();
    const nextDay = Math.min(
      part === "day" ? Number(value) : currentDate.getDate(),
      maxDay,
    );

    setDateForField(field, createDate(nextYear, nextMonth, nextDay));
    setOpenDateDropdown(null);
  };

  const saveProfile = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    try {
      const [savedStatus, savedDeparturePrepStartDate] = await Promise.all([
        AsyncStorage.getItem("profileStatus"),
        AsyncStorage.getItem("departurePrepStartDate"),
      ]);
      const departurePrepStartDateTask =
        status === "출국 준비 중"
          ? savedStatus !== status || !savedDeparturePrepStartDate
            ? AsyncStorage.setItem(
                "departurePrepStartDate",
                toStorageDate(new Date()),
              )
            : Promise.resolve()
          : AsyncStorage.removeItem("departurePrepStartDate");
      const nextCurrentSituation =
        loadedCurrentSituation &&
        profileStatusByCurrentSituation[loadedCurrentSituation] === status
          ? loadedCurrentSituation
          : currentSituationByProfileStatus[status];
      const requestBody: MemberProfileUpdateRequest = {
        nickname: nickname.trim(),
        dispatchedCountry: country.trim(),
        dispatchedRegion: region.trim(),
        currentSituation: nextCurrentSituation,
        dispatchedUniversity: dispatchedUniversity.trim(),
        domesticUniversity: homeUniversity.trim(),
        applicationDeadline: applicationDeadline
          ? toStorageDate(applicationDeadline)
          : null,
        departureDate: departureDate ? toStorageDate(departureDate) : null,
        dispatchStartDate: dispatchStartDate
          ? toStorageDate(dispatchStartDate)
          : null,
        returnDate: returnDate ? toStorageDate(returnDate) : null,
        dispatchSemester: dispatchSemester.trim(),
      };

      try {
        await updateMemberProfile(requestBody);
      } catch (error: any) {
        console.log("프로필 수정 실패:", error.response?.data || error.message);
        showAlert(
          "저장 실패",
          "프로필 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
        );
        return;
      }

      await Promise.all([
        AsyncStorage.setItem("nickname", nickname.trim()),
        AsyncStorage.setItem("university", homeUniversity.trim()),
        AsyncStorage.setItem("homeUniversity", homeUniversity.trim()),
        AsyncStorage.setItem("dispatchedCountry", country.trim()),
        AsyncStorage.setItem("dispatchedRegion", region.trim()),
        AsyncStorage.setItem(
          "dispatchedUniversity",
          dispatchedUniversity.trim(),
        ),
        AsyncStorage.setItem("profileStatus", status),
        AsyncStorage.setItem(
          "exchangeStatus",
          exchangeStatusByProfileStatus[status],
        ),
        applicationDeadline
          ? AsyncStorage.setItem(
              "applicationDeadline",
              toStorageDate(applicationDeadline),
            )
          : AsyncStorage.removeItem("applicationDeadline"),
        departureDate
          ? AsyncStorage.setItem("departureDate", toStorageDate(departureDate))
          : AsyncStorage.removeItem("departureDate"),
        dispatchStartDate
          ? AsyncStorage.setItem(
              "dispatchStartDate",
              toStorageDate(dispatchStartDate),
            )
          : AsyncStorage.removeItem("dispatchStartDate"),
        returnDate
          ? AsyncStorage.setItem("returnDate", toStorageDate(returnDate))
          : AsyncStorage.removeItem("returnDate"),
        dispatchSemester.trim()
          ? AsyncStorage.setItem("dispatchSemester", dispatchSemester.trim())
          : AsyncStorage.removeItem("dispatchSemester"),
        avatarUri
          ? AsyncStorage.setItem("profileAvatarUri", avatarUri)
          : AsyncStorage.removeItem("profileAvatarUri"),
        AsyncStorage.removeItem("profileFieldOverrides"),
        departurePrepStartDateTask,
      ]);

      setInitialSnapshot(currentSnapshot);
      setLoadedCurrentSituation(nextCurrentSituation);

      showAlert("저장 완료", "프로필 정보가 저장되었습니다.", [
        { text: "확인했어요", onPress: () => router.back() },
      ]);
    } catch {
      showAlert(
        "저장 실패",
        "프로필 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ProfileScreenHeader
        title="프로필 편집"
        rightAction={
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={saveProfile}
            style={styles.headerSave}
          >
            <Text
              style={[
                styles.headerSaveText,
                !canSave && styles.headerSaveDisabled,
              ]}
            >
              완료
            </Text>
          </Pressable>
        }
      />
      <View style={styles.introWrap}>
        <View style={styles.profileIntro}>
          <View style={styles.profileIntroText}>
            <Text style={styles.screenTitle}>프로필 편집하기</Text>
            <Text style={styles.screenDescription}>
              내 프로필/파견 정보를 편집할 수 있어요
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 변경"
            style={styles.avatarEditButton}
            onPress={() => setAvatarPickerVisible(true)}
          >
            <ProfileEditAvatarBackground width={80} height={80} />
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : null}
            <ProfileEditAvatarActionIcon
              width={24}
              height={24}
              style={styles.avatarEditIcon}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.tabs}>
        {(["프로필 정보", "파견 정보"] as const).map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === tab }}
            onPress={() => {
              Keyboard.dismiss();
              setOpenDateDropdown(null);
              setSemesterYearPickerVisible(false);
              setSelectedTab(tab);
              scrollRef.current?.scrollTo({ y: 0, animated: false });
            }}
            style={[styles.tab, selectedTab === tab && styles.tabSelected]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextSelected,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {selectedTab === "프로필 정보" ? (
          <>
            <ProfileTextField
              label="닉네임"
              required
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              counter={`${nickname.length}/12`}
              error={nicknameError}
            />

            <ProfileSelectField
              label="소속 대학"
              required
              value={homeUniversity}
              placeholder="소속 대학 선택"
              onPress={() => setUniversityPickerVisible(true)}
            />

            <View style={styles.statusField}>
              <Text style={styles.fieldLabel}>
                파견 상태 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionGrid}>
                {statusOptions.map((option) => {
                  const selected = status === option;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.statusChip,
                        selected && styles.statusChipSelected,
                      ]}
                      onPress={() => {
                        setStatus(option);
                        setOpenDateDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          selected && styles.statusChipTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {status === "파견 중" ? (
              <>
                <DateField
                  field="dispatchStartDate"
                  label="파견 시작일"
                  value={dispatchStartDate}
                  openPart={
                    openDateDropdown?.field === "dispatchStartDate"
                      ? openDateDropdown.part
                      : null
                  }
                  onToggle={toggleDateDropdown}
                  onSelect={selectDatePart}
                />
                <DateField
                  field="returnDate"
                  label="귀국일"
                  value={returnDate}
                  openPart={
                    openDateDropdown?.field === "returnDate"
                      ? openDateDropdown.part
                      : null
                  }
                  onToggle={toggleDateDropdown}
                  onSelect={selectDatePart}
                  optional
                />
              </>
            ) : (
              <DateField
                field={
                  status === "지원 준비 중"
                    ? "applicationDeadline"
                    : status === "출국 준비 중"
                      ? "departureDate"
                      : "returnDate"
                }
                label={dateLabels[status]}
                value={
                  status === "지원 준비 중"
                    ? applicationDeadline
                    : status === "출국 준비 중"
                      ? departureDate
                      : returnDate
                }
                openPart={
                  openDateDropdown?.field ===
                  (status === "지원 준비 중"
                    ? "applicationDeadline"
                    : status === "출국 준비 중"
                      ? "departureDate"
                      : "returnDate")
                    ? openDateDropdown.part
                    : null
                }
                onToggle={toggleDateDropdown}
                onSelect={selectDatePart}
                optional={status === "귀국"}
              />
            )}
            {!!returnDateError && (
              <Text style={styles.nicknameError}>{returnDateError}</Text>
            )}
          </>
        ) : (
          <>
            <SemesterField
              value={dispatchSemester}
              onPress={() => {
                setSemesterYearPickerVisible((visible) => !visible);
                requestAnimationFrame(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                });
              }}
              onSelectTerm={selectSemesterTerm}
              yearOptions={semesterYearOptions}
              yearPickerVisible={semesterYearPickerVisible}
              onSelectYear={selectSemesterYear}
            />

            <CountryRegionFields
              country={country}
              region={region}
              customCountryMode={customCountryMode}
              onPress={() => setCountryPickerVisible(true)}
              onChangeCountry={setCountry}
              onChangeRegion={setRegion}
            />

            <ProfileSelectField
              label="파견교"
              value={dispatchedUniversity}
              placeholder="파견교 입력"
              editable
              onChangeText={setDispatchedUniversity}
            />
          </>
        )}
      </ScrollView>

      <PhotoPickerSheet
        visible={avatarPickerVisible}
        onClose={() => setAvatarPickerVisible(false)}
        onSelect={(photos) => setAvatarUri(photos[0] ?? null)}
        remaining={1}
      />

      <OnboardingSelectModal
        visible={universityPickerVisible}
        title="소속 대학 선택하기"
        options={universityOptions}
        selectedValue={homeUniversity}
        selectionMode="confirm"
        searchPlaceholder="학교명으로 찾아보세요"
        onClose={() => setUniversityPickerVisible(false)}
        onSelect={selectUniversity}
      />

      <OnboardingSelectModal
        visible={countryPickerVisible}
        title="파견 국가 선택하기"
        options={countryOptions}
        selectedValue={customCountryMode ? CUSTOM_COUNTRY_OPTION : country}
        selectionMode="confirm"
        searchPlaceholder="국가명으로 찾아보세요"
        onClose={() => setCountryPickerVisible(false)}
        onSelect={selectCountry}
      />
      {alertElement}
    </KeyboardAvoidingView>
  );
}

function ProfileTextField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  counter,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  counter?: string;
  error?: string;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View style={[styles.textInputWrap, error && styles.textInputWrapError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B1B8C1"
          maxLength={12}
          returnKeyType="done"
          style={styles.profileTextInput}
        />
        {counter ? <Text style={styles.textCounter}>{counter}</Text> : null}
      </View>
      {error ? <Text style={styles.nicknameError}>{error}</Text> : null}
    </View>
  );
}

function ProfileSelectField({
  label,
  required,
  value,
  placeholder,
  onPress,
  editable = false,
  onChangeText,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  onPress?: () => void;
  editable?: boolean;
  onChangeText?: (value: string) => void;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {editable ? (
        <View style={styles.selectInput}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#B1B8C1"
            style={styles.selectTextInput}
            returnKeyType="done"
          />
        </View>
      ) : (
        <Pressable style={styles.selectInput} onPress={onPress}>
          <Text
            style={[
              styles.selectInputText,
              !value && styles.selectInputPlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>
          <DropdownArrowIcon width={16} height={16} />
        </Pressable>
      )}
    </View>
  );
}

function CountryRegionFields({
  country,
  region,
  customCountryMode,
  onPress,
  onChangeCountry,
  onChangeRegion,
}: {
  country: string;
  region: string;
  customCountryMode: boolean;
  onPress: () => void;
  onChangeCountry: (value: string) => void;
  onChangeRegion: (value: string) => void;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>
        파견 국가 및 지역 <Text style={styles.required}>*</Text>
      </Text>
      {customCountryMode ? (
        <View style={styles.selectInput}>
          <TextInput
            value={country}
            onChangeText={onChangeCountry}
            placeholder="파견 국가 입력"
            placeholderTextColor="#B1B8C1"
            style={styles.selectTextInput}
            returnKeyType="next"
          />
        </View>
      ) : (
        <Pressable style={styles.selectInput} onPress={onPress}>
          <Text
            style={[
              styles.selectInputText,
              !country && styles.selectInputPlaceholder,
            ]}
          >
            {country || "파견 국가 선택"}
          </Text>
          <DropdownArrowIcon width={16} height={16} />
        </Pressable>
      )}
      <View style={[styles.selectInput, styles.regionInput]}>
        <TextInput
          value={region}
          onChangeText={onChangeRegion}
          placeholder="파견 지역 입력"
          placeholderTextColor="#B1B8C1"
          style={styles.selectTextInput}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

function SemesterField({
  value,
  onPress,
  onSelectTerm,
  yearOptions,
  yearPickerVisible,
  onSelectYear,
}: {
  value: string;
  onPress: () => void;
  onSelectTerm: (term: (typeof dispatchSemesterTerms)[number]) => void;
  yearOptions: string[];
  yearPickerVisible: boolean;
  onSelectYear: (year: string) => void;
}) {
  const { year, term } = parseDispatchSemester(value);

  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>
        파견 학기 <Text style={styles.required}>*</Text>
      </Text>
      <InlineDropdown
        value={year}
        placeholder="파견 년도 선택"
        open={yearPickerVisible}
        options={yearOptions}
        onPress={onPress}
        onSelect={onSelectYear}
        displayValue={year ? `${year}년` : ""}
      />
      <View style={styles.semesterChipRow}>
        {dispatchSemesterTerms.map((option) => {
          const selected = term === option;

          return (
            <Pressable
              key={option}
              style={[
                styles.semesterChip,
                selected && styles.semesterChipSelected,
              ]}
              onPress={() => onSelectTerm(option)}
            >
              <Text
                style={[
                  styles.semesterChipText,
                  selected && styles.semesterChipTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function InlineDropdown({
  value,
  placeholder,
  open,
  options,
  onPress,
  onSelect,
  displayValue,
}: {
  value: string;
  placeholder: string;
  open: boolean;
  options: string[];
  onPress: () => void;
  onSelect: (value: string) => void;
  displayValue?: string;
}) {
  return (
    <View
      style={[
        styles.inlineDropdownAnchor,
        open && styles.inlineDropdownAnchorOpen,
      ]}
    >
      <Pressable style={styles.selectInput} onPress={onPress}>
        <Text
          style={[
            styles.selectInputText,
            !value && styles.selectInputPlaceholder,
          ]}
        >
          {displayValue || value || placeholder}
        </Text>
        <DropdownArrowIcon width={16} height={16} />
      </Pressable>
      {open ? (
        <View style={styles.inlineDropdownMenu}>
          <ScrollView
            style={styles.inlineDropdownScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
            nestedScrollEnabled
          >
            {options.map((option) => {
              const selected = option === value;

              return (
                <Pressable
                  key={option}
                  style={styles.inlineDropdownOption}
                  onPress={() => onSelect(option)}
                >
                  <Text
                    style={[
                      styles.inlineDropdownOptionText,
                      selected && styles.inlineDropdownOptionTextSelected,
                    ]}
                  >
                    {option.endsWith("년") ||
                    option.endsWith("월") ||
                    option.endsWith("일")
                      ? option
                      : `${option}년`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function DateField({
  field,
  label,
  value,
  openPart,
  onToggle,
  onSelect,
  optional = false,
}: {
  field: DateFieldKey;
  label: string;
  value: Date | null;
  openPart: DatePart | null;
  onToggle: (field: DateFieldKey, part: DatePart) => void;
  onSelect: (field: DateFieldKey, part: DatePart, value: string) => void;
  optional?: boolean;
}) {
  const referenceDate = value || new Date();
  const year = value ? String(value.getFullYear()) : "";
  const month = value ? String(value.getMonth() + 1).padStart(2, "0") : "";
  const day = value ? String(value.getDate()).padStart(2, "0") : "";
  const yearOptions = Array.from({ length: 12 }, (_, index) =>
    String(new Date().getFullYear() - 3 + index),
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );
  const dayOptions = Array.from(
    {
      length: new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + 1,
        0,
      ).getDate(),
    },
    (_, index) => String(index + 1).padStart(2, "0"),
  );

  return (
    <View style={styles.dateField}>
      <View style={styles.dateLabelRow}>
        <Text style={styles.fieldLabel}>
          {label}
          {!optional && <Text style={styles.required}> *</Text>}
        </Text>
        {optional && <Text style={styles.optionalText}>선택</Text>}
      </View>

      <View style={styles.dateSelectRow}>
        <CompactInlineDropdown
          value={year}
          placeholder="연도"
          suffix="년"
          open={openPart === "year"}
          options={yearOptions}
          onPress={() => onToggle(field, "year")}
          onSelect={(nextValue) => onSelect(field, "year", nextValue)}
        />
        <CompactInlineDropdown
          value={month}
          placeholder="월"
          suffix="월"
          open={openPart === "month"}
          options={monthOptions}
          onPress={() => onToggle(field, "month")}
          onSelect={(nextValue) => onSelect(field, "month", nextValue)}
        />
        <CompactInlineDropdown
          value={day}
          placeholder="일"
          suffix="일"
          open={openPart === "day"}
          options={dayOptions}
          onPress={() => onToggle(field, "day")}
          onSelect={(nextValue) => onSelect(field, "day", nextValue)}
        />
      </View>
    </View>
  );
}

function CompactInlineDropdown({
  value,
  placeholder,
  suffix,
  open,
  options,
  onPress,
  onSelect,
}: {
  value: string;
  placeholder: string;
  suffix: string;
  open: boolean;
  options: string[];
  onPress: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View
      style={[
        styles.compactDropdownAnchor,
        open && styles.compactDropdownAnchorOpen,
      ]}
    >
      <Pressable style={styles.dateSelect} onPress={onPress}>
        <Text
          style={[
            styles.dateSelectText,
            !value && styles.dateSelectPlaceholder,
          ]}
        >
          {value ? `${value}${suffix}` : placeholder}
        </Text>
        <DropdownArrowIcon width={16} height={16} />
      </Pressable>
      {open ? (
        <View style={styles.compactDropdownMenu}>
          <ScrollView
            style={styles.inlineDropdownScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
            nestedScrollEnabled
          >
            {options.map((option) => (
              <Pressable
                key={option}
                style={styles.inlineDropdownOption}
                onPress={() => onSelect(option)}
              >
                <Text
                  style={[
                    styles.inlineDropdownOptionText,
                    value === option && styles.inlineDropdownOptionTextSelected,
                  ]}
                >
                  {option}
                  {suffix}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  required: { color: "#FF4D4F" },
  introWrap: { paddingHorizontal: 16, paddingTop: 24 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[3],
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: Colors.common.white,
  },
  tabSelected: { borderBottomColor: Colors.gray[10] },
  tabText: { ...fonts.sub4_sb_14, color: Colors.gray[6] },
  tabTextSelected: { color: Colors.gray[10] },
  headerSave: {
    minWidth: 40,
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerSaveText: { ...fonts.body2_m_14, color: Colors.primary.default },
  headerSaveDisabled: { color: Colors.gray[5] },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 146,
  },
  profileIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileIntroText: {
    flex: 1,
    paddingTop: 7,
  },
  screenTitle: {
    ...fonts.title3_b_24,
    color: Colors.common.black,
  },
  screenDescription: {
    marginTop: 6,
    ...fonts.body4_r_14,
    color: Colors.gray[8],
  },
  avatarEditButton: {
    width: 80,
    height: 80,
    marginLeft: 16,
    position: "relative",
  },
  avatar: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarEditIcon: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  profileField: {
    marginBottom: 22,
  },
  fieldLabel: {
    ...commonStyles.inputLabel,
    marginBottom: 8,
  },
  textInputWrap: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E4E9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  textInputWrapError: {
    borderColor: "#FF4D4F",
  },
  profileTextInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    padding: 0,
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  textCounter: {
    marginLeft: 12,
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  nicknameError: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#FF4D4F",
  },
  readonlyInput: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#F0F2F6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readonlyInputText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B1B8C1",
  },
  readonlyInputPlaceholder: {
    color: "#B1B8C1",
  },
  sectionDivider: {
    height: 8,
    marginHorizontal: -16,
    marginBottom: 22,
    backgroundColor: "#EEF1F4",
  },
  selectInput: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E4E9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectInputText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
    ...fonts.body1_m_16,
  },
  selectTextInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    padding: 0,
    ...fonts.body1_m_16,
  },
  selectInputPlaceholder: {
    color: "#B1B8C1",
  },
  regionInput: {
    marginTop: 6,
  },
  semesterChipRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  inlineDropdownAnchor: {
    position: "relative",
    zIndex: 1,
  },
  inlineDropdownAnchorOpen: {
    zIndex: 30,
  },
  inlineDropdownMenu: {
    position: "absolute",
    top: 51,
    right: 0,
    left: 0,
    height: 206,
    borderWidth: 1,
    borderColor: "#E1E4E9",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#141416",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  compactDropdownAnchor: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  compactDropdownAnchorOpen: {
    zIndex: 30,
  },
  compactDropdownMenu: {
    position: "absolute",
    top: 51,
    right: 0,
    left: 0,
    height: 156,
    borderWidth: 1,
    borderColor: "#E1E4E9",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#141416",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  inlineDropdownScroll: {
    flex: 1,
  },
  inlineDropdownOption: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  inlineDropdownOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  inlineDropdownOptionTextSelected: {
    fontWeight: "900",
    color: "#006BFF",
  },
  semesterChip: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.gray[1],
    borderWidth: 1,
    borderColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
  },
  semesterChipSelected: {
    backgroundColor: Colors.common.white,
    borderColor: Colors.primary.default,
  },
  semesterChipText: {
    ...fonts.body1_m_16,
    color: Colors.gray[7],
  },
  semesterChipTextSelected: {
    color: Colors.primary.default,
  },
  statusField: {
    marginBottom: 22,
  },
  optionGrid: {
    flexDirection: "row",
    gap: 6,
  },
  dateField: {
    marginBottom: 22,
  },
  dateLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionalText: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "800",
    color: MUTED,
  },
  dateSelectRow: {
    flexDirection: "row",
    gap: 6,
  },
  dateSelect: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E4E9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateSelectText: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  dateSelectPlaceholder: {
    color: "#B1B8C1",
  },
  statusChip: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.gray[1],
    borderWidth: 1,
    borderColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
  },
  statusChipSelected: {
    backgroundColor: Colors.common.white,
    borderColor: Colors.primary.default,
  },
  statusChipText: {
    ...fonts.body1_m_16,
    color: Colors.gray[7],
  },
  statusChipTextSelected: {
    color: Colors.primary.default,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: PAGE,
  },
  footerButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#191F28",
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonDisabled: {
    backgroundColor: "#B1B8C1",
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  footerButtonTextDisabled: {
    color: "#FFFFFF",
  },
});
