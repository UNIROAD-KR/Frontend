import { Text } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import type { LocalMarketItemGroup } from "@/src/storage/marketPosts";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = { groups: LocalMarketItemGroup[] };

export function MarketItemList({ groups }: Props) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = groups.flatMap((group, groupIndex) =>
    group.items.map((item, index) => ({
      ...item,
      id: `${groupIndex}-${index}`,
      category: group.category,
      photos: (item.photos ?? group.photos ?? []).filter(Boolean),
      description:
        item.description?.trim() ||
        group.description?.trim() ||
        "등록된 설명이 없어요.",
    })),
  );
  const categories = Array.from(new Set(items.map((item) => item.category)));
  const activeCategory =
    category && categories.includes(category) ? category : null;
  const visibleItems = activeCategory
    ? items.filter((item) => item.category === activeCategory)
    : items;
  const selected = items.find((item) => item.id === selectedId);
  const closeSheet = () => setSelectedId(null);

  return (
    <View>
      <Text style={fonts.title5_b_20}>
        총 <Text style={{ color: Colors.primary.default }}>{items.length}</Text>
        개
      </Text>
      {!!items.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {[null, ...categories].map((value) => (
            <Pressable
              key={value ?? "all"}
              accessibilityRole="button"
              accessibilityState={{ selected: activeCategory === value }}
              onPress={() => setCategory(value)}
              style={[
                styles.filter,
                activeCategory === value && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  fonts.body2_m_14,
                  {
                    color:
                      activeCategory === value
                        ? Colors.common.white
                        : Colors.gray[7],
                  },
                ]}
              >
                {value ?? "전체"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={styles.list}>
        {visibleItems.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} ${item.quantity}개 상세 보기`}
            onPress={() => setSelectedId(item.id)}
            style={styles.card}
          >
            {item.photos[0] ? (
              <Image
                source={{ uri: item.photos[0] }}
                style={styles.thumbnail}
              />
            ) : (
              <View style={[styles.thumbnail, styles.placeholder]}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={Colors.gray[5]}
                />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text numberOfLines={1} style={fonts.sub3_sb_16}>
                {item.name} {item.quantity}개
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  fonts.caption4_m_12,
                  {
                    color: Colors.gray[6],
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    marginTop: 4,
                  },
                ]}
              >
                {item.description}
              </Text>
              <View style={styles.tag}>
                <Text
                  style={[fonts.body2_m_14, { color: Colors.primary.default }]}
                >
                  {item.category}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={Colors.gray[11]}
            />
          </Pressable>
        ))}
        {!items.length && (
          <Text style={[fonts.body2_m_14, styles.empty]}>
            등록된 물품이 없어요
          </Text>
        )}
      </View>

      <BottomSheetModal visible={Boolean(selected)} onRequestClose={closeSheet}>
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel="물품 상세 닫기"
          />
          <BottomSheetView
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[fonts.title5_b_20, styles.sheetTitle]}>
                {selected?.name}
              </Text>
              <View style={[styles.tag, styles.sheetTag]}>
                <Text
                  style={[fonts.body2_m_14, { color: Colors.primary.default }]}
                >
                  {selected?.category}
                </Text>
              </View>
              <Pressable
                onPress={closeSheet}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={styles.close}
              >
                <Ionicons name="close" size={24} color={Colors.common.black} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              {selected?.photos.length ? (
                selected.photos.map((photo, index) => (
                  <Image
                    key={`${photo}-${index}`}
                    source={{ uri: photo }}
                    style={styles.detailPhoto}
                  />
                ))
              ) : (
                <View style={[styles.detailPhoto, styles.placeholder]}>
                  <Ionicons
                    name="image-outline"
                    size={36}
                    color={Colors.gray[5]}
                  />
                  <Text style={[fonts.body2_m_14, { color: Colors.gray[6] }]}>
                    등록된 사진이 없어요
                  </Text>
                </View>
              )}
              <Text style={[fonts.body2_m_14, { color: Colors.gray[7] }]}>
                {selected?.description}
              </Text>
            </ScrollView>
          </BottomSheetView>
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingTop: 12, paddingBottom: 14 },
  filter: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.gray[1],
  },
  activeFilter: { backgroundColor: Colors.gray[11] },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.gray[2],
    borderWidth: 1,
    borderColor: Colors.gray[3],
  },
  placeholder: { alignItems: "center", justifyContent: "center", gap: 8 },
  itemInfo: { flex: 1, minWidth: 0 },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 8,
  },
  empty: { paddingVertical: 24, textAlign: "center", color: Colors.gray[6] },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sheetTitle: { flexShrink: 1 },
  sheetTag: { alignSelf: "center", marginTop: 0 },
  close: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { gap: 12, paddingBottom: 20 },
  detailPhoto: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: 6,
    backgroundColor: Colors.gray[2],
    resizeMode: "cover",
  },
});
