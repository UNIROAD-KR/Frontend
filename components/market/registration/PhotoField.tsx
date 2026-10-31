import { Text } from "@/components/ui/app-text";
import InfoCircleIcon from "@/assets/icon/info-circle.svg";
import PhotoIcon from "@/assets/icon/photo.svg";
import { PhotoPickerSheet } from "@/components/ui/photo-picker-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DeleteIcon from "@/assets/icon/delete.svg";

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
            <PhotoIcon />
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
              <DeleteIcon width={18} height={18} color="white" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <View style={styles.hint}>
        <InfoCircleIcon width={16} height={16} color={Colors.gray[5]} />
        <Text style={[fonts.caption3_m_13, { color: Colors.gray[6] }]}>
          최대 {limit}장까지 등록 가능합니다
        </Text>
      </View>
      <PhotoPickerSheet
        visible={visible}
        onClose={() => setVisible(false)}
        remaining={limit - photos.length}
        onSelect={(selected) =>
          onChange([...photos, ...selected].slice(0, limit))
        }
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
    gap: 6,
  },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 30,
    height: 30,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
});
