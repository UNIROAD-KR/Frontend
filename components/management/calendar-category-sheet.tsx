import { Text } from "@/components/ui/app-text";
import InputField from "@/components/ui/input-field";
import Button from "@/components/ui/button";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CalendarCategorySheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  return (
    <BottomSheetModal visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="카테고리 추가 닫기"
          onPress={close}
        />
        <BottomSheetView
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.heading}>카테고리 추가</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              hitSlop={12}
              onPress={close}
            >
              <Ionicons name="close" size={24} color={Colors.common.black} />
            </Pressable>
          </View>
          <Text style={styles.label}>카테고리명</Text>
          <InputField
            value={name}
            onChangeText={setName}
            placeholder="카테고리명을 입력해주세요"
            returnKeyType="done"
          />
          {!!error && <Text style={styles.label}>{error}</Text>}
          <View style={styles.button}>
            <Button
              title={saving ? "추가 중..." : "추가하기"}
              disabled={!name.trim() || saving}
              disabledTitleColor={Colors.primary.heavy}
              onPress={async () => {
                if (!name.trim() || saving) return;
                setSaving(true);
                setError("");
                try {
                  await onAdd(name.trim());
                  setName("");
                  close();
                } catch (failure: any) {
                  setError(
                    failure.response?.data?.message ||
                      failure.message ||
                      "카테고리를 추가하지 못했어요.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            />
          </View>
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  handle: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  heading: { ...fonts.title5_b_20, color: Colors.common.black },
  label: { ...fonts.sub4_sb_14, color: Colors.common.black, marginBottom: 8 },
  button: { flexDirection: "row", marginTop: 32 },
});
