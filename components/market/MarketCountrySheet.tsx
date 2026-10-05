import { Text } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import {
  countryOptions,
  CUSTOM_COUNTRY_OPTION,
} from "@/src/constants/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const initials = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const filters = [
  "전체",
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
export const flags: Record<string, string> = {
  독일: "🇩🇪",
  프랑스: "🇫🇷",
  스페인: "🇪🇸",
  이탈리아: "🇮🇹",
  미국: "🇺🇸",
  영국: "🇬🇧",
  일본: "🇯🇵",
  캐나다: "🇨🇦",
  호주: "🇦🇺",
  네덜란드: "🇳🇱",
  체코: "🇨🇿",
  포르투갈: "🇵🇹",
  벨기에: "🇧🇪",
  폴란드: "🇵🇱",
  핀란드: "🇫🇮",
  노르웨이: "🇳🇴",
  스웨덴: "🇸🇪",
  아일랜드: "🇮🇪",
  덴마크: "🇩🇰",
  오스트리아: "🇦🇹",
  스위스: "🇨🇭",
  중국: "🇨🇳",
  대만: "🇹🇼",
  싱가포르: "🇸🇬",
  홍콩: "🇭🇰",
  뉴질랜드: "🇳🇿",
  멕시코: "🇲🇽",
  브라질: "🇧🇷",
  튀르키예: "🇹🇷",
};
const countries = [
  ...new Set([
    ...countryOptions.filter(
      (country) => country !== CUSTOM_COUNTRY_OPTION && country !== "미정",
    ),
    "튀르키예",
  ]),
].sort((a, b) => a.localeCompare(b, "ko"));
function initialOf(value: string) {
  const code = value.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "";
  const initial = initials[Math.floor(code / 588)];
  return (
    (
      { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" } as Record<
        string,
        string
      >
    )[initial] ?? initial
  );
}

type Props = {
  allowAll?: boolean;
  visible: boolean;
  selectedCountry: string;
  onClose: () => void;
  onSelect: (country: string) => void;
};
export function MarketCountrySheet({
  visible,
  allowAll = true,
  selectedCountry,
  onClose,
  onSelect,
}: Props) {
  const [initial, setInitial] = useState("전체");
  const insets = useSafeAreaInsets();
  const displayed =
    initial === "전체"
      ? countries
      : countries.filter((country) => initialOf(country) === initial);
  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={onClose}
      onAfterClose={() => setInitial("전체")}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="국가 선택 닫기"
        />
        <BottomSheetView
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={fonts.title4_sb_24}>국가 및 지역 선택</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <Ionicons name="close" size={26} color={Colors.common.black} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filters}
          >
            {filters.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: value === initial }}
                onPress={() => setInitial(value)}
                style={[styles.chip, value === initial && styles.activeChip]}
              >
                <Text
                  style={[
                    fonts.body1_m_16,
                    {
                      color:
                        value === initial
                          ? Colors.common.white
                          : Colors.gray[7],
                    },
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView
            key={initial}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {allowAll && initial === "전체" && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCountry === "전체" }}
                onPress={() => onSelect("전체")}
                style={styles.country}
              >
                <View style={styles.flag}>
                  <Ionicons
                    name="globe-outline"
                    size={26}
                    color={Colors.gray[7]}
                  />
                </View>
                <Text
                  style={[
                    fonts.body1_m_16,
                    selectedCountry === "전체" && styles.selected,
                  ]}
                >
                  전체 국가 및 지역
                </Text>
              </Pressable>
            )}
            {displayed.map((country) => (
              <Pressable
                key={country}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCountry === country }}
                onPress={() => onSelect(country)}
                style={styles.country}
              >
                <Text style={styles.flag}>{flags[country]}</Text>
                <Text
                  style={[
                    fonts.body1_m_16,
                    selectedCountry === country && styles.selected,
                  ]}
                >
                  {country}
                </Text>
              </Pressable>
            ))}
            {!displayed.length && (
              <Text style={styles.empty}>해당 초성의 국가가 없어요.</Text>
            )}
          </ScrollView>
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
    marginBottom: 20,
  },
  filterScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 12 },
  filters: { gap: 8 },
  chip: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 24,
    backgroundColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
  },
  activeChip: { backgroundColor: Colors.gray[11] },
  list: { paddingBottom: 12 },
  country: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
  },
  flag: {
    width: 32,
    fontSize: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { color: Colors.primary.default },
  empty: {
    ...fonts.body2_m_14,
    textAlign: "center",
    color: Colors.gray[6],
    paddingVertical: 36,
  },
});
