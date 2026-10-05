import { Text } from "@/components/ui/app-text";
import { BottomSheetModal, BottomSheetView } from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PhotoField({ photos, onChange, limit }: { photos: string[]; onChange: (photos: string[]) => void; limit: number }) {
  const [visible, setVisible] = useState(false);
  const pendingSource = useRef<"camera" | "library" | null>(null);
  const insets = useSafeAreaInsets();
  const pick = async () => {
    const source = pendingSource.current;
    pendingSource.current = null;
    if (!source || photos.length >= limit) return;
    try {
      const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert("권한 필요", source === "camera" ? "카메라 접근 권한을 허용해주세요." : "사진 접근 권한을 허용해주세요."); return; }
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true, selectionLimit: limit - photos.length });
      if (!result.canceled) onChange([...photos, ...result.assets.map((asset) => asset.uri)].slice(0, limit));
    } catch { Alert.alert("사진 등록 실패", "사진을 다시 선택해주세요."); }
  };
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
        {photos.length < limit && <Pressable accessibilityRole="button" accessibilityLabel="이미지 등록" style={styles.add} onPress={() => setVisible(true)}>
          <Ionicons name="image" size={24} color={Colors.gray[5]} /><Text style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}>이미지 등록</Text>
        </Pressable>}
        {photos.map((photo, index) => <View key={`${photo}-${index}`}>
          <Image source={{ uri: photo }} style={styles.photo} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${index + 1}번째 사진 삭제`} style={styles.remove} onPress={() => onChange(photos.filter((_, i) => i !== index))}>
            <Ionicons name="trash-outline" size={18} color="white" />
          </Pressable>
        </View>)}
      </ScrollView>
      <View style={styles.hint}><Ionicons name="information-circle" size={13} color={Colors.gray[5]} /><Text style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}>최대 {limit}장까지 등록할 수 있어요.</Text></View>
      <BottomSheetModal visible={visible} onRequestClose={() => setVisible(false)} onAfterClose={pick}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} accessibilityLabel="사진 선택 닫기" />
          <BottomSheetView style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.handle} />
            {(["camera", "library"] as const).map((source) => <Pressable key={source} style={styles.option} onPress={() => { pendingSource.current = source; setVisible(false); }}>
              <Ionicons name={source === "camera" ? "camera-outline" : "images-outline"} size={22} color={Colors.gray[11]} />
              <Text style={fonts.body2_m_14}>{source === "camera" ? "카메라로 촬영하기" : "앨범에서 이미지 선택"}</Text>
            </Pressable>)}
          </BottomSheetView>
        </View>
      </BottomSheetModal>
    </View>
  );
}
const styles = StyleSheet.create({
  photos: { gap: 8 }, photo: { width: 88, height: 88, borderRadius: 8 },
  add: { width: 88, height: 88, borderWidth: 1, borderStyle: "dashed", borderColor: Colors.gray[4], borderRadius: 8, backgroundColor: Colors.gray[1], alignItems: "center", justifyContent: "center", gap: 7 },
  remove: { position: "absolute", top: 4, right: 4, width: 30, height: 30, backgroundColor: "#00000088", borderRadius: 7, alignItems: "center", justifyContent: "center" },
  hint: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
  overlay: { flex: 1, justifyContent: "flex-end" }, sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 20 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: Colors.gray[4], alignSelf: "center", marginTop: 8, marginBottom: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 },
});
