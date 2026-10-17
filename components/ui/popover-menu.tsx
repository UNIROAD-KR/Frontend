import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

export type PopoverMenuItem = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  tone?: "default" | "danger";
};

type PopoverMenuProps = {
  visible: boolean;
  position: Pick<ViewStyle, "top" | "right">;
  items: PopoverMenuItem[];
  onClose: () => void;
  onDismiss?: () => void;
  accessibilityLabel: string;
  width?: number;
};

export function PopoverMenu({
  visible,
  position,
  items,
  onClose,
  onDismiss,
  accessibilityLabel,
  width,
}: PopoverMenuProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel={accessibilityLabel}
          onPress={onClose}
        />
        <View style={[styles.popover, position, width ? { width } : null]}>
          {items.map((item, index) => (
            <Pressable
              key={`${item.label}-${index}`}
              accessibilityRole="button"
              style={styles.row}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              {item.icon}
              <Text
                style={[
                  styles.text,
                  item.tone === "danger" && styles.dangerText,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  popover: {
    position: "absolute",
    borderRadius: 12,
    backgroundColor: Colors.common.white,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E7ECF3",
    elevation: 8,
    shadowColor: "#0F2042",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 6,
  },
  text: {
    ...fonts.body2_m_14,
    color: "#141416",
    flex: 1,
    flexShrink: 1,
  },
  dangerText: {
    color: "#E5484D",
  },
});
