import { Text, TextInput } from "@/components/ui/app-text";
import Button from "@/components/ui/button";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { InlineDropdown } from "@/components/ui/inline-dropdown";
import { CountryFlag } from "@/components/ui/country-flag";
import { Colors, fonts, commonStyles } from "@/constants/theme";
import {
  countryInitialFilters,
  initialOf,
  sortedCountries,
} from "@/components/market/MarketCountrySheet";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CompanionFilters = {
  country: string;
  region: string;
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  maxParticipants: number;
  gender: "ANY" | "FEMALE" | "MALE";
};

export const emptyCompanionFilters: CompanionFilters = {
  country: "",
  region: "",
  startYear: "",
  startMonth: "",
  endYear: "",
  endMonth: "",
  maxParticipants: 0,
  gender: "ANY",
};

function toMonthNumber(year: string, month: string) {
  return Number(year) * 12 + Number(month) - 1;
}

type DatePart = "startYear" | "startMonth" | "endYear" | "endMonth";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 8 }, (_, i) => {
  const year = String(currentYear - 1 + i);
  return { label: `${year}년`, value: year };
});
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}월`,
  value: String(i + 1).padStart(2, "0"),
}));

export function matchesCompanionFilters(
  post: {
    country: string;
    region: string;
    startDate: string;
    endDate: string;
    capacity: number;
    genderRatio?: string;
  },
  filters: CompanionFilters,
) {
  if (
    filters.country &&
    !post.country.toLowerCase().includes(filters.country.toLowerCase())
  ) {
    return false;
  }
  if (
    filters.region &&
    !post.region.toLowerCase().includes(filters.region.toLowerCase())
  ) {
    return false;
  }
  if (filters.maxParticipants > 0 && post.capacity > filters.maxParticipants) {
    return false;
  }

  if (filters.gender !== "ANY") {
    const gender = post.genderRatio?.toLowerCase() ?? "";
    const accepted =
      filters.gender === "FEMALE"
        ? gender.includes("여성") || gender.includes("female")
        : gender.includes("남성") || gender.includes("male");
    if (!accepted) return false;
  }

  const hasStart = Boolean(filters.startYear && filters.startMonth);
  const hasEnd = Boolean(filters.endYear && filters.endMonth);
  if (hasStart || hasEnd) {
    const postStart = new Date(post.startDate);
    const postEnd = new Date(post.endDate);
    if (Number.isNaN(postStart.getTime()) || Number.isNaN(postEnd.getTime())) {
      return false;
    }
    const filterStart = hasStart
      ? toMonthNumber(filters.startYear, filters.startMonth)
      : Number.NEGATIVE_INFINITY;
    const filterEnd = hasEnd
      ? toMonthNumber(filters.endYear, filters.endMonth)
      : Number.POSITIVE_INFINITY;
    const postStartMonth = postStart.getFullYear() * 12 + postStart.getMonth();
    const postEndMonth = postEnd.getFullYear() * 12 + postEnd.getMonth();
    if (postStartMonth > filterEnd || postEndMonth < filterStart) {
      return false;
    }
  }

  return true;
}

export function CompanionFilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: CompanionFilters;
  onClose: () => void;
  onApply: (filters: CompanionFilters) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const { width } = useWindowDimensions();
  const [openPart, setOpenPart] = useState<DatePart | null>(null);
  const [countryPageOpen, setCountryPageOpen] = useState(false);
  const [initial, setInitial] = useState("전체");
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setOpenPart(null);
      setCountryPageOpen(false);
      setInitial("전체");
      progress.setValue(0);
    }
  }, [visible, value, progress]);

  const patch = (next: Partial<CompanionFilters>) =>
    setDraft((current) => ({ ...current, ...next }));
  const showCountryPage = (open: boolean) => {
    setOpenPart(null);
    setCountryPageOpen(open);
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const selectDatePart = (part: DatePart, next: string) => {
    const merged = { ...draft, [part]: next };
    if (
      merged.startYear &&
      merged.startMonth &&
      merged.endYear &&
      merged.endMonth &&
      toMonthNumber(merged.startYear, merged.startMonth) >
        toMonthNumber(merged.endYear, merged.endMonth)
    ) {
      if (part.startsWith("start")) {
        merged.endYear = "";
        merged.endMonth = "";
      } else {
        merged.startYear = "";
        merged.startMonth = "";
      }
    }
    setDraft(merged);
    setOpenPart(null);
  };
  const displayedCountries =
    initial === "전체"
      ? sortedCountries
      : sortedCountries.filter((country) => initialOf(country) === initial);
  const filterPageX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });
  const countryPageX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });
  const hasCompleteStart =
    Boolean(draft.startYear) === Boolean(draft.startMonth);
  const hasCompleteEnd = Boolean(draft.endYear) === Boolean(draft.endMonth);
  const validMonthRange =
    !(draft.startYear && draft.startMonth && draft.endYear && draft.endMonth) ||
    toMonthNumber(draft.startYear, draft.startMonth) <=
      toMonthNumber(draft.endYear, draft.endMonth);
  const valid =
    hasCompleteStart &&
    hasCompleteEnd &&
    validMonthRange &&
    (!draft.startYear || Number(draft.startYear) >= 1900) &&
    (!draft.endYear || Number(draft.endYear) >= 1900) &&
    (!draft.startMonth ||
      (Number(draft.startMonth) >= 1 && Number(draft.startMonth) <= 12)) &&
    (!draft.endMonth ||
      (Number(draft.endMonth) >= 1 && Number(draft.endMonth) <= 12));

  return (
    <BottomSheetModal visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="필터 닫기"
        />
        <BottomSheetView
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.handle} />
          <View style={styles.pages}>
            <Animated.View
              style={[
                styles.page,
                { transform: [{ translateX: filterPageX }] },
              ]}
              pointerEvents={countryPageOpen ? "none" : "auto"}
            >
              <View style={styles.header}>
                <Text style={styles.title}>필터 설정하기</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="필터 닫기"
                >
                  <Ionicons
                    name="close"
                    size={26}
                    color={Colors.common.black}
                  />
                </Pressable>
              </View>
              <ScrollView
                style={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
              >
                <View style={styles.section}>
                  <Text style={styles.label}>국가 및 지역</Text>
                  <Pressable
                    style={styles.locationRow}
                    onPress={() => showCountryPage(true)}
                    accessibilityRole="button"
                    accessibilityLabel="국가 및 지역 선택"
                  >
                    <Text
                      style={[
                        styles.locationText,
                        !draft.country && styles.placeholder,
                      ]}
                      numberOfLines={1}
                    >
                      {draft.country
                        ? `${draft.country}${draft.region ? ` · ${draft.region}` : ""}`
                        : "국가 및 지역을 입력해주세요"}
                    </Text>
                    <View pointerEvents="none">
                      <Ionicons
                        name="chevron-down"
                        size={22}
                        color={Colors.common.black}
                      />
                    </View>
                  </Pressable>
                  {draft.country ? (
                    <TextInput
                      style={styles.regionInput}
                      value={draft.region}
                      onChangeText={(region) => patch({ region })}
                      placeholder="도시 / 지역을 입력해주세요"
                      placeholderTextColor={Colors.gray[5]}
                    />
                  ) : null}
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>시작일</Text>
                  <View style={styles.dateRow}>
                    <InlineDropdown
                      compact
                      value={draft.startYear}
                      displayValue={
                        draft.startYear ? `${draft.startYear}년` : ""
                      }
                      placeholder="연도"
                      open={openPart === "startYear"}
                      options={yearOptions}
                      onPress={() =>
                        setOpenPart(
                          openPart === "startYear" ? null : "startYear",
                        )
                      }
                      onSelect={(next) => selectDatePart("startYear", next)}
                    />
                    <InlineDropdown
                      compact
                      value={draft.startMonth}
                      displayValue={
                        draft.startMonth ? `${Number(draft.startMonth)}월` : ""
                      }
                      placeholder="월"
                      open={openPart === "startMonth"}
                      options={monthOptions}
                      onPress={() =>
                        setOpenPart(
                          openPart === "startMonth" ? null : "startMonth",
                        )
                      }
                      onSelect={(next) => selectDatePart("startMonth", next)}
                    />
                  </View>
                </View>
                <View style={styles.section}>
                  <Text style={styles.label}>종료일</Text>
                  <View style={styles.dateRow}>
                    <InlineDropdown
                      compact
                      value={draft.endYear}
                      displayValue={draft.endYear ? `${draft.endYear}년` : ""}
                      placeholder="연도"
                      open={openPart === "endYear"}
                      options={yearOptions}
                      onPress={() =>
                        setOpenPart(openPart === "endYear" ? null : "endYear")
                      }
                      onSelect={(next) => selectDatePart("endYear", next)}
                    />
                    <InlineDropdown
                      compact
                      value={draft.endMonth}
                      displayValue={
                        draft.endMonth ? `${Number(draft.endMonth)}월` : ""
                      }
                      placeholder="월"
                      open={openPart === "endMonth"}
                      options={monthOptions}
                      onPress={() =>
                        setOpenPart(openPart === "endMonth" ? null : "endMonth")
                      }
                      onSelect={(next) => selectDatePart("endMonth", next)}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>최대 인원</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="최대 인원 줄이기"
                      onPress={() =>
                        patch({
                          maxParticipants: Math.max(
                            0,
                            draft.maxParticipants - 1,
                          ),
                        })
                      }
                      style={styles.stepButton}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={Colors.gray[7]}
                      />
                    </Pressable>
                    <View style={styles.stepValue}>
                      <Text style={styles.stepValueText}>
                        {draft.maxParticipants}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="최대 인원 늘리기"
                      onPress={() =>
                        patch({ maxParticipants: draft.maxParticipants + 1 })
                      }
                      style={styles.stepButton}
                    >
                      <Ionicons name="add" size={20} color={Colors.gray[7]} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>성별 조건</Text>
                  <View style={styles.genderOptions}>
                    {(
                      [
                        ["ANY", "무관"],
                        ["FEMALE", "여성만"],
                        ["MALE", "남성만"],
                      ] as const
                    ).map(([value, label]) => {
                      const selected = draft.gender === value;
                      return (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => patch({ gender: value })}
                          style={[
                            styles.genderChip,
                            selected && styles.genderChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              fonts.body2_m_14,
                              selected
                                ? styles.genderTextSelected
                                : styles.genderText,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
              <View style={styles.footer}>
                <Button
                  disabled={!valid}
                  title="적용하기"
                  onPress={() => {
                    onApply(draft);
                  }}
                />
              </View>
            </Animated.View>
            <Animated.View
              style={[
                styles.page,
                { transform: [{ translateX: countryPageX }] },
              ]}
              pointerEvents={countryPageOpen ? "auto" : "none"}
            >
              <View style={styles.countryHeader}>
                <Pressable
                  onPress={() => showCountryPage(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="뒤로가기"
                >
                  <Ionicons
                    name="chevron-back"
                    size={28}
                    color={Colors.common.black}
                  />
                </Pressable>
                <Text style={styles.title}>국가 및 지역 선택</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chips}
              >
                {countryInitialFilters.map((chip) => (
                  <Pressable
                    key={chip}
                    accessibilityRole="button"
                    accessibilityState={{ selected: chip === initial }}
                    onPress={() => setInitial(chip)}
                    style={[styles.chip, chip === initial && styles.chipActive]}
                  >
                    <Text
                      style={[
                        fonts.body1_m_16,
                        {
                          color:
                            chip === initial
                              ? Colors.common.white
                              : Colors.gray[7],
                        },
                      ]}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <ScrollView key={initial} showsVerticalScrollIndicator={false}>
                {displayedCountries.map((country) => (
                  <Pressable
                    key={country}
                    accessibilityRole="button"
                    accessibilityState={{ selected: draft.country === country }}
                    onPress={() => {
                      patch({
                        country,
                        region: country === draft.country ? draft.region : "",
                      });
                      showCountryPage(false);
                    }}
                    style={styles.countryRow}
                  >
                    <CountryFlag country={country} width={32} height={24} />
                    <Text
                      style={[
                        fonts.body1_m_16,
                        styles.countryName,
                        draft.country === country && {
                          color: Colors.primary.default,
                        },
                      ]}
                    >
                      {country}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.gray[5]}
                    />
                  </Pressable>
                ))}
                {!displayedCountries.length && (
                  <Text style={styles.empty}>해당 초성의 국가가 없어요.</Text>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    height: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    ...fonts.title4_sb_24,
    color: Colors.common.black,
  },
  content: {
    gap: 38,
    paddingBottom: 24,
  },
  scroll: { flex: 1 },
  section: { gap: 12 },
  label: {
    ...commonStyles.inputLabel,
    marginBottom: 0,
  },
  locationRow: {
    height: 60,
    borderWidth: 1,
    borderColor: "#E2E5E9",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    ...fonts.body2_m_14,
    flex: 1,
    color: Colors.common.black,
  },
  placeholder: { color: Colors.gray[5] },
  regionInput: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E2E5E9",
    borderRadius: 12,
    paddingHorizontal: 16,
    ...fonts.body2_m_14,
    color: Colors.common.black,
  },
  pages: { flex: 1, overflow: "hidden" },
  page: { ...StyleSheet.absoluteFillObject },
  countryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    marginLeft: -6,
  },
  chipScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 12 },
  chips: { gap: 8 },
  chip: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 24,
    backgroundColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: Colors.gray[11] },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
  },
  countryName: { flex: 1 },
  flag: { width: 32, fontSize: 27 },
  empty: {
    ...fonts.body2_m_14,
    textAlign: "center",
    color: Colors.gray[6],
    paddingVertical: 36,
  },
  dateRow: { flexDirection: "row", gap: 8 },
  stepper: {
    alignSelf: "flex-start",
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.gray[1],
    padding: 4,
  },
  stepButton: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 48,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepValueText: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  genderOptions: { flexDirection: "row", gap: 8 },
  genderChip: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipSelected: { backgroundColor: Colors.gray[11] },
  genderText: { color: Colors.gray[7] },
  genderTextSelected: { color: Colors.common.white },
  footer: {
    flexDirection: "row",
    paddingTop: 12,
  },
  applyButton: {
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonDisabled: { opacity: 0.35 },
  applyText: {
    ...fonts.body1_m_16,
    color: Colors.common.white,
  },
});
