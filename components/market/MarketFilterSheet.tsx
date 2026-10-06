import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "@/components/ui/app-text";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import XIcon from "@/assets/icon/x-icon.svg";
import { TicketDateField } from "./registration/TicketDateField";

export type MarketFilters = {
  categories: string[];
  minPrice: number;
  maxPrice: number | null;
  tradeMode: "all" | "in-person" | "not-in-person";
  deadline: string;
};
export const emptyMarketFilters: MarketFilters = {
  categories: [],
  minPrice: 0,
  maxPrice: null,
  tradeMode: "all",
  deadline: "",
};
const usedCategories = [
  ["KITCHEN", "주방 용품"],
  ["BATH", "욕실/청소 용품"],
  ["LIFE", "생활 용품"],
  ["BEDDING", "침구류"],
  ["ELECTRONICS", "전자제품"],
  ["ETC", "기타"],
];
const ticketCategories = [
  ["TOUR", "관광 티켓"],
  ["CONCERT", "콘서트/공연"],
  ["TRAIN", "기차표"],
  ["FLIGHT", "항공권"],
  ["ACCOMMODATION", "숙박"],
  ["OTHER", "기타"],
];
const primary = Colors.primary.default;

export function MarketFilterSheet({
  visible,
  mode,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  mode: "bulk" | "ticket";
  value: MarketFilters;
  onClose: () => void;
  onApply: (value: MarketFilters) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [trackWidth, setTrackWidth] = useState(1);
  const [dragging, setDragging] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);
  const ceiling = Math.max(700000, draft.maxPrice ?? 0, draft.minPrice);
  const max = draft.maxPrice ?? ceiling;
  const patch = (next: Partial<MarketFilters>) =>
    setDraft((prev) => ({ ...prev, ...next }));
  const valid = draft.maxPrice === null || draft.minPrice <= draft.maxPrice;
  const priceAt = (x: number) =>
    Math.round((Math.max(0, Math.min(1, x / trackWidth)) * ceiling) / 1000) *
    1000;
  const [handle, setHandle] = useState<"min" | "max">("max");
  const move = (x: number, target = handle) => {
    const price = priceAt(x);
    patch(
      target === "min"
        ? { minPrice: Math.min(price, max) }
        : { maxPrice: Math.max(price, draft.minPrice) },
    );
  };
  return (
    <BottomSheetModal visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="필터 닫기"
        />
        <BottomSheetView
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>필터 설정하기</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="필터 닫기"
            >
              <XIcon width={24} height={24} />
            </Pressable>
          </View>
          <ScrollView
            scrollEnabled={!dragging}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.section}>
              <Text style={styles.label}>카테고리</Text>
              <View style={styles.chips}>
                {[
                  ["", "전체"],
                  ...(mode === "bulk" ? usedCategories : ticketCategories),
                ].map(([key, label]) => {
                  const selected = key
                    ? draft.categories.includes(key)
                    : draft.categories.length === 0;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() =>
                        patch({
                          categories: !key
                            ? []
                            : draft.categories.includes(key)
                              ? draft.categories.filter((item) => item !== key)
                              : [...draft.categories, key],
                        })
                      }
                      style={[
                        styles.chip,
                        mode === "bulk" && styles.squareChip,
                        selected &&
                          (mode === "bulk"
                            ? styles.selectedSquare
                            : styles.selectedChip),
                      ]}
                    >
                      <Text
                        style={[
                          fonts.body2_m_14,
                          {
                            color: selected
                              ? mode === "bulk"
                                ? primary
                                : "white"
                              : Colors.gray[7],
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>거래 가격</Text>
              <View
                style={styles.slider}
                onLayout={(event) =>
                  setTrackWidth(event.nativeEvent.layout.width)
                }
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(event) => {
                  const x = event.nativeEvent.locationX;
                  const target =
                    Math.abs(priceAt(x) - draft.minPrice) <
                    Math.abs(priceAt(x) - max)
                      ? "min"
                      : "max";
                  setHandle(target);
                  setDragging(true);
                  move(x, target);
                }}
                onResponderMove={(event) => move(event.nativeEvent.locationX)}
                onResponderRelease={() => setDragging(false)}
                onResponderTerminate={() => setDragging(false)}
              >
                <View pointerEvents="none" style={styles.track} />
                <View
                  pointerEvents="none"
                  style={[
                    styles.track,
                    {
                      left: `${(draft.minPrice / ceiling) * 100}%`,
                      right: `${100 - (max / ceiling) * 100}%`,
                      backgroundColor: primary,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.bubble,
                    {
                      left: Math.max(
                        0,
                        Math.min(
                          trackWidth - 76,
                          (max / ceiling) * trackWidth - 38,
                        ),
                      ),
                    },
                  ]}
                >
                  <Text style={styles.bubbleText}>
                    {draft.maxPrice === null
                      ? "제한 없음"
                      : max.toLocaleString("ko-KR")}
                  </Text>
                </View>
                {[draft.minPrice, max].map((amount, index) => (
                  <View
                    pointerEvents="none"
                    key={index}
                    style={[
                      styles.thumb,
                      {
                        left: Math.max(
                          0,
                          Math.min(
                            trackWidth - 20,
                            (amount / ceiling) * trackWidth - 10,
                          ),
                        ),
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.prices}>
                <View style={styles.inputBox}>
                  <TextInput
                    accessibilityLabel="최소 거래 가격"
                    keyboardType="number-pad"
                    value={draft.minPrice.toLocaleString("ko-KR")}
                    onChangeText={(text) =>
                      patch({ minPrice: Number(text.replace(/\D/g, "")) })
                    }
                    style={styles.inputText}
                  />
                </View>
                <View style={styles.inputBox}>
                  <TextInput
                    accessibilityLabel="최대 거래 가격"
                    keyboardType="number-pad"
                    placeholder="제한 없음"
                    value={draft.maxPrice?.toLocaleString("ko-KR") ?? ""}
                    onChangeText={(text) =>
                      patch({
                        maxPrice: text.replace(/\D/g, "")
                          ? Number(text.replace(/\D/g, ""))
                          : null,
                      })
                    }
                    style={styles.inputText}
                  />
                </View>
              </View>
              {!valid && (
                <Text style={styles.hint}>
                  최대 가격을 최소 가격 이상으로 입력해주세요.
                </Text>
              )}
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>
                {mode === "bulk" ? "대면 거래" : "이용 마감일"}
              </Text>
              {mode === "bulk" ? (
                <>
                  <View style={styles.chips}>
                    {(
                      [
                        ["all", "전체"],
                        ["in-person", "대면 거래만"],
                        ["not-in-person", "대면 거래 제외"],
                      ] as const
                    ).map(([tradeMode, label]) => {
                      const selected = draft.tradeMode === tradeMode;
                      return (
                        <Pressable
                          key={tradeMode}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => patch({ tradeMode })}
                          style={[styles.chip, selected && styles.selectedChip]}
                        >
                          <Text
                            style={[
                              fonts.body2_m_14,
                              { color: selected ? "white" : Colors.gray[6] },
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <TicketDateField
                    value={draft.deadline}
                    onChange={(deadline) => patch({ deadline })}
                  />
                  {draft.deadline ? (
                    <Pressable onPress={() => patch({ deadline: "" })}>
                      <Text style={styles.hint}>날짜 선택 해제</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </ScrollView>
          <Pressable
            disabled={!valid}
            onPress={() => onApply(draft)}
            style={[styles.apply, !valid && { opacity: 0.4 }]}
          >
            <Text style={[fonts.sub3_sb_16, { color: "white" }]}>적용하기</Text>
          </Pressable>
        </BottomSheetView>
      </View>
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    height: "85%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  handle: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
    alignSelf: "center",
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "600", color: Colors.common.black },
  content: { paddingBottom: 24, gap: 36 },
  section: { gap: 12 },
  label: { ...fonts.sub3_sb_16, color: Colors.common.black },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.gray[1],
    borderWidth: 1,
    borderColor: "transparent",
  },
  squareChip: { borderRadius: 6 },
  selectedSquare: { borderColor: primary, backgroundColor: "white" },
  selectedChip: { backgroundColor: Colors.gray[10] },
  slider: { height: 56, marginHorizontal: 10 },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 42,
    height: 3,
    backgroundColor: Colors.gray[4],
  },
  thumb: {
    position: "absolute",
    top: 33,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: primary,
    backgroundColor: "white",
  },
  bubble: {
    position: "absolute",
    top: 0,
    width: 76,
    alignItems: "center",
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: primary,
  },
  bubbleText: { color: "white", fontSize: 12 },
  prices: { flexDirection: "row", gap: 6 },
  inputBox: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  inputText: {
    height: 26,
    padding: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
    ...fonts.body3_r_16,
  },
  hint: { ...fonts.body4_r_14, color: Colors.gray[7] },
  apply: {
    backgroundColor: primary,
    height: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
});
