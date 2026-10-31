import { useRef, useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Text } from "@/components/ui/app-text";
import { FadeToastHost, Toast } from "@/components/ui/fade-toast";
import { fonts } from "@/constants/theme";

export function ChatImageViewer({ urls, initialIndex, onClose }: {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const save = async (all: boolean) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setMenuOpen(false);
    const targets = all ? urls : [urls[index]];
    let saved = 0;
    try {
      if (Platform.OS !== "web") {
        const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
        if (!permission.granted) {
          Toast.show({ type: "error", text: "사진 저장 권한을 허용해주세요." });
          return;
        }
      }
      for (const [position, url] of targets.entries()) {
        const extension = url.split("?")[0].match(/\.(jpe?g|png|webp|heic|gif)$/i)?.[1] || "jpg";
        const filename = `uniroad_chat_${Date.now()}_${position}.${extension}`;
        if (Platform.OS === "web") {
          const response = await fetch(url);
          if (!response.ok) throw new Error("download failed");
          const objectUrl = URL.createObjectURL(await response.blob());
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } else {
          const destination = `${FileSystem.cacheDirectory}${filename}`;
          try {
            const downloaded = await FileSystem.downloadAsync(url, destination);
            if (downloaded.status !== 200) throw new Error("download failed");
            await MediaLibrary.saveToLibraryAsync(downloaded.uri);
          } finally {
            await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => {});
          }
        }
        saved++;
      }
      Toast.show({ type: "success", text: "이미지가 저장되었습니다" });
    } catch {
      Toast.show({ type: "error", text: saved > 0 ? `${saved}장 저장되었습니다. 나머지 이미지를 저장하지 못했어요.` : "이미지를 저장하지 못했어요. 다시 시도해주세요." });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="이미지 상세 닫기">
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>이미지 상세</Text>
          <Pressable style={styles.headerButton} onPress={() => setMenuOpen(value => !value)} disabled={saving} accessibilityRole="button" accessibilityLabel="이미지 저장 메뉴" accessibilityState={{ expanded: menuOpen, disabled: saving }}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <ScrollView
          key={width}
          style={styles.pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={event => {
            setIndex(Math.max(0, Math.min(urls.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))));
            setMenuOpen(false);
          }}
        >
          {urls.map((uri, position) => (
            <View key={`${position}-${uri}`} style={[styles.page, { width }]}>
              <Image source={{ uri }} style={{ width, height: width }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        <View pointerEvents="none" style={styles.counterArea}>
          <View style={styles.counter}><Text style={styles.counterText}>{index + 1} | {urls.length}</Text></View>
        </View>
        {menuOpen && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} accessibilityLabel="저장 메뉴 닫기" />
            <View style={[styles.menu, { top: insets.top + 52 }]}>
              <Pressable style={styles.menuItem} onPress={() => void save(false)}>
                <Ionicons name="download-outline" size={16} color="#526078" /><Text style={styles.menuText}>이미지 저장</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => void save(true)}>
                <Ionicons name="download-outline" size={16} color="#526078" /><Text style={styles.menuText}>전체 이미지 저장</Text>
              </Pressable>
            </View>
          </>
        )}
        <FadeToastHost />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#191F28" },
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { ...fonts.sub3_sb_16, color: "#FFFFFF" },
  pager: { flex: 1 },
  page: { justifyContent: "center", alignItems: "center" },
  counterArea: { height: 100, alignItems: "center", justifyContent: "center" },
  counter: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)" },
  counterText: { color: "#FFFFFF", fontSize: 14 },
  menu: { position: "absolute", right: 16, width: 154, backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 2 },
  menuItem: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  menuText: { ...fonts.body4_r_14, color: "#070A0D" },
});
