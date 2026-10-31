import { CountryFlag } from "@/components/ui/country-flag";
import Button from "@/components/ui/button";
import {
  countryInitialFilters,
  initialOf,
  sortedCountries,
} from "@/src/constants/countries";
import { Text, TextInput } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import XIcon from "@/assets/icon/x-icon.svg";

type Props = {
  title?: string;
  options?: string[];
  selectionMode?: "immediate" | "confirm";
  searchPlaceholder?: string;
  allowAll?: boolean;
  visible: boolean;
  selectedCountry: string;
  onClose: () => void;
  onSelect: (country: string) => void;
};
export function CountrySelectionSheet({
  title = "국가 및 지역 선택",
  options,
  selectionMode = "immediate",
  searchPlaceholder,
  visible,
  allowAll = true,
  selectedCountry,
  onClose,
  onSelect,
}: Props) {
  const [draftCountry, setDraftCountry] = useState(selectedCountry);
  useEffect(() => {
    if (visible) setDraftCountry(selectedCountry);
  }, [visible, selectedCountry]);
  const select = (value: string) => {
    if (selectionMode === "confirm") setDraftCountry(value);
    else onSelect(value);
  };
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal visible={visible} onRequestClose={onClose}>
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
            <Text style={fonts.title4_sb_24}>{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <XIcon />
            </Pressable>
          </View>
          {visible && (
            <CountrySelectionList
              options={options}
              allowAll={allowAll}
              selectedCountry={
                selectionMode === "confirm" ? draftCountry : selectedCountry
              }
              onSelect={select}
              searchPlaceholder={searchPlaceholder}
            />
          )}
          {selectionMode === "confirm" && (
            <Button
              title="선택하기"
              disabled={!draftCountry}
              onPress={() => {
                onSelect(draftCountry);
                onClose();
              }}
            />
          )}
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}

export function CountrySelectionList({
  options = sortedCountries,
  allowAll = false,
  selectedCountry,
  onSelect,
  searchPlaceholder,
}: {
  options?: string[];
  allowAll?: boolean;
  selectedCountry: string;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
}) {
  const [initial, setInitial] = useState("전체");
  const [query, setQuery] = useState("");
  const displayed = options.filter(
    (country) =>
      (initial === "전체" || initialOf(country) === initial) &&
      country.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <View style={{ flex: 1 }}>
      {searchPlaceholder && (
        <TextInput
          accessibilityLabel={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={query}
          onChangeText={setQuery}
          style={{ minHeight: 44, marginBottom: 12 }}
        />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        {countryInitialFilters.map((value) => (
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
                    value === initial ? Colors.common.white : Colors.gray[7],
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
              <Ionicons name="globe-outline" size={26} color={Colors.gray[7]} />
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
            <View style={styles.flag}>
              <CountryFlag country={country} width={24} height={24} />
            </View>
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
    </View>
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
