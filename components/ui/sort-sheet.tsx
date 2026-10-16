import { Text } from "@/components/ui/app-text";
import { BottomSheetModal, BottomSheetView } from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props<T extends string> = {
  visible: boolean;
  value: T;
  onClose: () => void;
  onSelect: (value: T) => void;
  options: readonly { value: T; label: string }[];
};

export function SortSheet<T extends string>({ visible, value, onClose, onSelect, options }: Props<T>) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="정렬 선택 닫기" onPress={onClose} />
        <BottomSheetView style={styles.sheet}>
          <View style={styles.options}>
            <View style={styles.handle} />
            {options.map((option) => (
              <Pressable key={option.value} style={styles.option} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} onPress={() => onSelect(option.value)}>
                <Text style={[fonts.body1_m_16, { color: Colors.gray[10] }]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ height: insets.bottom }} />
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" },
  options: { backgroundColor: Colors.common.white, paddingHorizontal: 16, paddingVertical: 28 },
  handle: { position: "absolute", top: 8, alignSelf: "center", width: 72, height: 4, borderRadius: 2, backgroundColor: Colors.gray[4] },
  option: { paddingVertical: 10, minHeight: 44, justifyContent: "center" },
});
