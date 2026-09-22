import SearchIcon from "@/assets/icon/search-icon.svg";
import XIcon from "@/assets/icon/x-icon.svg";
import { Text, TextInput } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  BottomSheetPressable,
  bottomSheetStyles,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

type OnboardingSelectModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectionMode?: "immediate" | "confirm";
  searchPlaceholder?: string;
};

export function OnboardingSelectModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  selectionMode = "immediate",
  searchPlaceholder = "검색어를 입력해주세요",
}: OnboardingSelectModalProps) {
  const [draftValue, setDraftValue] = useState(selectedValue);
  const [searchQuery, setSearchQuery] = useState("");
  const isConfirmMode = selectionMode === "confirm";

  useEffect(() => {
    if (!visible) return;

    setDraftValue(selectedValue);
    setSearchQuery("");
  }, [selectedValue, visible]);

  const filteredOptions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter((option) => option.toLowerCase().includes(keyword));
  }, [options, searchQuery]);

  const handleSelect = (option: string) => {
    if (isConfirmMode) {
      setDraftValue(option);
      return;
    }

    onSelect(option);
  };

  return (
    <BottomSheetModal visible={visible} onRequestClose={onClose}>
      <Pressable
        style={[styles.overlay, bottomSheetStyles.transparent]}
        onPress={onClose}
      >
        <BottomSheetPressable
          style={[styles.sheet, isConfirmMode && styles.confirmSheet]}
        >
          <View
            style={[styles.handle, isConfirmMode && styles.confirmHandle]}
          />

          {isConfirmMode ? (
            <View style={styles.confirmHeader}>
              <Text
                style={[fonts.title4_sb_24, { color: Colors.common.black }]}
              >
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={12}
                onPress={onClose}
                style={styles.closeButton}
              >
                <XIcon />
              </Pressable>
            </View>
          ) : (
            <Text style={[fonts.title4_sb_24, { color: Colors.common.black }]}>
              {title}
            </Text>
          )}

          {isConfirmMode ? (
            <View style={styles.searchField}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="#9AA5B4"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <SearchIcon />
            </View>
          ) : null}

          <ScrollView
            style={[
              styles.optionScroll,
              isConfirmMode && styles.confirmOptionScroll,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.map((option) => {
              const selected =
                (isConfirmMode ? draftValue : selectedValue) === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.option, isConfirmMode && styles.confirmOption]}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isConfirmMode && styles.confirmOptionText,
                      selected &&
                        (isConfirmMode
                          ? styles.confirmOptionTextSelected
                          : styles.optionTextSelected),
                    ]}
                  >
                    {option}
                  </Text>
                  {isConfirmMode && selected ? (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={Colors.primary.default}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {isConfirmMode ? (
            <Pressable
              style={[
                styles.confirmButton,
                !draftValue && styles.confirmButtonDisabled,
              ]}
              disabled={!draftValue}
              onPress={() => onSelect(draftValue)}
            >
              <Text style={styles.confirmButtonText}>선택하기</Text>
            </Pressable>
          ) : null}
        </BottomSheetPressable>
      </Pressable>
    </BottomSheetModal>
  );
}

const BLUE = "#123F9F";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.28)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
  },
  confirmSheet: {
    height: "69%",
    maxHeight: 580,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9DEE8",
    marginBottom: 18,
  },
  confirmHandle: {
    width: 80,
    marginBottom: 20,
  },
  optionScroll: {
    maxHeight: 440,
  },
  option: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  optionSelected: {
    backgroundColor: "#F2F5FF",
  },
  optionText: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  optionTextSelected: {
    color: BLUE,
  },
  confirmHeader: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  confirmTitle: {
    ...fonts.sub3_sb_16,
    color: Colors.common.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchField: {
    borderWidth: 1,
    borderColor: "#E6E8EB",
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    paddingLeft: 20,
    paddingRight: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#18202B",
    ...fonts.body3_r_16,
    paddingVertical: 0,
  },
  confirmOptionScroll: {
    flex: 1,
    maxHeight: undefined,
  },
  confirmOption: {
    minHeight: 48,
    borderRadius: 0,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  confirmOptionText: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  confirmOptionTextSelected: {
    color: Colors.primary.default,
  },
  confirmButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.primary.light,
  },
  confirmButtonText: {
    ...fonts.sub3_sb_16,
    color: Colors.common.white,
  },
});
