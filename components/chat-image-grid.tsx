import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/app-text";
import { ChatImageViewer } from "@/components/chat-image-viewer";

export function ChatImageGrid({ urls, isMine }: { urls: string[]; isMine: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const columns = urls.length === 4 ? 2 : Math.min(urls.length, 3);
  const width = columns * 88 + (columns - 1) * 4;
  const tileSize = (Math.min(width, availableWidth ?? width) - (columns - 1) * 4) / columns;
  return (
    <>
      <View onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)} style={[styles.grid, { width, justifyContent: isMine ? "flex-end" : "flex-start" }]}>
        {urls.slice(0, 6).map((uri, index) => (
          <Pressable key={`${index}-${uri}`} onPress={() => setSelected(index)} accessibilityRole="button" accessibilityLabel={`${index + 1}번째 이미지 보기`}>
            <Image source={{ uri }} style={[styles.image, { width: tileSize, height: tileSize }]} />
            {index === 5 && urls.length > 6 && (
              <View style={styles.moreOverlay}>
                <View style={styles.badge}><Text style={styles.moreText}>+{urls.length - 6}장</Text></View>
              </View>
            )}
          </Pressable>
        ))}
      </View>
      {selected !== null && <ChatImageViewer urls={urls} initialIndex={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4, flexShrink: 1 },
  image: { width: 88, height: 88, borderRadius: 8, backgroundColor: "#E1E5E9" },
  moreOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  badge: { backgroundColor: "rgba(80, 90, 105, 0.3)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 },
  moreText: { color: "#FFFFFF", fontSize: 12 },
});
