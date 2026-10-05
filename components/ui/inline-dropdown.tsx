import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

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

type DropdownOption = {
  label: string;
  value: string;
};

type InlineDropdownProps = SelectFieldProps & {
  open: boolean;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  compact?: boolean;
  displayValue?: string;
};

export function InlineDropdown({
  value,
  placeholder,
  onPress,
  open,
  options,
  onSelect,
  compact = false,
  displayValue,
}: InlineDropdownProps) {
  return (
    <View
      style={[
        styles.inlineDropdownAnchor,
        compact && styles.compactDropdownAnchor,
      ]}
    >
      <SelectField
        value={displayValue ?? value}
        placeholder={placeholder}
        onPress={onPress}
      />
      {open ? (
        <View
          style={[
            styles.inlineDropdownMenu,
            compact && styles.compactDropdownMenu,
          ]}
        >
          <ScrollView
            style={styles.inlineDropdownScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option) => {
              const selected = value === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={styles.inlineDropdownOption}
                  onPress={() => onSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.inlineDropdownOptionText,
                      selected && styles.inlineDropdownOptionTextSelected,
                    ]}
                  >
                    {option.label}
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

const styles = StyleSheet.create({
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
  inlineDropdownAnchor: { position: "relative", zIndex: 20, flex: 1 },
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
  inlineDropdownScroll: { flex: 1 },
  compactDropdownAnchor: { zIndex: 30 },
  inlineDropdownOptionTextSelected: {
    color: Colors.primary.default,
    ...fonts.body1_m_16,
  },
  inlineDropdownOption: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  inlineDropdownOptionText: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  selectValue: {
    ...fonts.body1_m_16,
    color: Colors.common.black,
    marginRight: 10,
  },
  placeholder: { color: "#B3BDC9", ...fonts.body1_m_16 },
});
