import { Text } from "@/components/ui/app-text";
import { BottomSheetModal, BottomSheetView } from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRef } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PhotoPickerSheet({ visible, onClose, onSelect, remaining }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (photos: string[]) => void;
  remaining: number;
}) {
  const pendingSource = useRef<"camera" | "library" | null>(null);
  const insets = useSafeAreaInsets();
  const pick = async () => {
    const source = pendingSource.current;
    pendingSource.current = null;
    if (!source || remaining <= 0) return;
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "권한 필요",
          source === "camera"
            ? "카메라 접근 권한을 허용해주세요."
            : "사진 접근 권한을 허용해주세요.",
        );
        return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
              allowsMultipleSelection: true,
              selectionLimit: remaining,
            });
      if (!result.canceled)
        onSelect(result.assets.map((asset) => asset.uri).slice(0, remaining));
    } catch {
      Alert.alert("사진 등록 실패", "사진을 다시 선택해주세요.");
    }
  };
  return (
      <BottomSheetModal
        visible={visible}
        onRequestClose={() => onClose()}
        onAfterClose={pick}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => onClose()}
            accessibilityLabel="사진 선택 닫기"
          />
          <BottomSheetView
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.handle} />
            {(["camera", "library"] as const).map((source) => (
              <Pressable
                key={source}
                style={styles.option}
                onPress={() => {
                  pendingSource.current = source;
                  onClose();
                }}
              >
                <Ionicons
                  name={
                    source === "camera" ? "camera-outline" : "images-outline"
                  }
                  size={22}
                  color={Colors.gray[11]}
                />
                <Text style={fonts.body2_m_14}>
                  {source === "camera"
                    ? "카메라로 촬영하기"
                    : "앨범에서 이미지 선택"}
                </Text>
              </Pressable>
            ))}
          </BottomSheetView>
        </View>
      </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
});
