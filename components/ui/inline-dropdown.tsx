import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

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
  disabled?: boolean;
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
  const anchor = useRef<View>(null);
  const [bounds, setBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const window = useWindowDimensions();
  useEffect(() => {
    if (!open) { setBounds(null); return; }
    anchor.current?.measureInWindow((x, y, width, height) => setBounds({ x, y, width, height }));
  }, [open, window.width, window.height]);
  const menuHeight = Math.min(compact ? 156 : 206, Math.max(48, options.length * 48), window.height - 32);
  const below = bounds ? bounds.y + bounds.height : 0;
  const top = bounds ? Math.max(16, below + menuHeight <= window.height - 16 ? below : bounds.y - menuHeight) : 0;
  return (
    <View ref={anchor} collapsable={false} style={styles.inlineDropdownAnchor}>
      <SelectField value={displayValue ?? value} placeholder={placeholder} onPress={onPress} />
      <Modal transparent visible={open && bounds !== null} animationType="none" statusBarTranslucent onRequestClose={onPress}>
        <View style={{ flex: 1 }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onPress} accessibilityRole="button" accessibilityLabel="선택 목록 닫기" />
          {bounds && <View style={[styles.inlineDropdownMenu, { top, left: Math.max(8, Math.min(bounds.x, window.width - bounds.width - 8)), width: bounds.width, height: menuHeight }]}>
            <ScrollView showsVerticalScrollIndicator persistentScrollbar nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {options.map((option) => (
                <Pressable key={option.value} disabled={option.disabled} accessibilityRole="button" accessibilityState={{ selected: value === option.value, disabled: option.disabled }} style={styles.inlineDropdownOption} onPress={() => onSelect(option.value)}>
                  <Text style={[styles.inlineDropdownOptionText, value === option.value && styles.inlineDropdownOptionTextSelected, option.disabled && { color: Colors.gray[4] }]}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineDropdownMenu: {
    position: "absolute",
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
  inlineDropdownAnchor: { flex: 1 },
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
