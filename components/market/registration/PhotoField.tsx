import { Text } from "@/components/ui/app-text";
import { PhotoPickerSheet } from "@/components/ui/photo-picker-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export function PhotoField({
  photos,
  onChange,
  limit,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  limit: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photos}
      >
        {photos.length < limit && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이미지 등록"
            style={styles.add}
            onPress={() => setVisible(true)}
          >
            <Ionicons name="image" size={21} color={Colors.gray[5]} />
            <Text style={[fonts.caption2_sb_12, { color: Colors.gray[6] }]}>
              이미지 등록
            </Text>
          </Pressable>
        )}
        {photos.map((photo, index) => (
          <View key={`${photo}-${index}`}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}번째 사진 삭제`}
              style={styles.remove}
              onPress={() => onChange(photos.filter((_, i) => i !== index))}
            >
              <Ionicons name="trash-outline" size={18} color="white" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <View style={styles.hint}>
        <Ionicons name="information-circle" size={13} color={Colors.gray[5]} />
        <Text style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}>
          최대 {limit}장까지 등록할 수 있어요.
        </Text>
      </View>
      <PhotoPickerSheet
        visible={visible}
        onClose={() => setVisible(false)}
        remaining={limit - photos.length}
        onSelect={(selected) => onChange([...photos, ...selected].slice(0, limit))}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  photos: { gap: 8 },
  photo: { width: 100, height: 100, borderRadius: 10 },
  add: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.gray[4],
    borderRadius: 10,
    backgroundColor: Colors.gray[1],
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 30,
    height: 30,
    backgroundColor: "#00000088",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
});
