import { Text, TextInput } from "@/components/ui/app-text";
import { BottomSheetModal, BottomSheetView } from "@/components/ui/bottom-sheet";
import { Colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoField } from "./PhotoField";
import { itemOptions, categoryLabel, type RegistrationItem } from "./model";
import { styles } from "./styles";

export function ItemEditor({ initial, items, onClose, onSave }: { initial: RegistrationItem; items: RegistrationItem[]; onClose: () => void; onSave: (item: RegistrationItem) => void }) {
  const [item, setItem] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [custom, setCustom] = useState(Boolean(initial.name && !(itemOptions[initial.category] ?? []).includes(initial.name)));
  const insets = useSafeAreaInsets();
  const duplicate = items.some((other) => other.id !== item.id && other.category === item.category && other.name.trim() === item.name.trim());
  const valid = Boolean(item.category && item.name.trim() && item.quantity > 0 && !duplicate);
  return (
    <BottomSheetModal visible onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable style={{ position: "absolute", inset: 0 }} onPress={onClose} accessibilityLabel="세부 물품 등록 닫기" />
        <BottomSheetView style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}><Text style={fonts.title5_b_20}>세부 물품 등록하기</Text><Pressable hitSlop={12} onPress={onClose} accessibilityLabel="닫기"><Ionicons name="close" size={24} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.field}><Text style={styles.label}>카테고리</Text><View style={styles.chips}>
              {Object.keys(itemOptions).map((category) => <Pressable key={category} accessibilityState={{ selected: category === item.category }} style={[styles.chip, category === item.category && styles.chipActive]} onPress={() => { setItem({ ...item, category, name: "" }); setCustom(false); setExpanded(false); }}><Text style={[fonts.caption4_m_12, { color: category === item.category ? "white" : Colors.gray[7] }]}>{categoryLabel(category)}</Text></Pressable>)}
            </View></View>
            <View style={styles.field}><Text style={styles.label}>상세 물품</Text>
              <Pressable disabled={!item.category} style={styles.select} onPress={() => setExpanded(!expanded)}><Text style={[fonts.body2_m_14, { color: item.name ? Colors.gray[11] : Colors.gray[5] }]}>{item.name || "상세 물품을 선택해주세요"}</Text><Ionicons name="chevron-down" size={18} /></Pressable>
              {expanded && <ScrollView nestedScrollEnabled style={styles.dropdown} keyboardShouldPersistTaps="handled">
                {[...(itemOptions[item.category] ?? []), "직접 입력"].map((name) => {
                  const taken = items.some((other) => other.id !== item.id && other.category === item.category && other.name === name);
                  return <Pressable key={name} disabled={taken} style={styles.option} onPress={() => { setCustom(name === "직접 입력"); setItem({ ...item, name: name === "직접 입력" ? "" : name }); setExpanded(false); }}><Text style={[fonts.body2_m_14, { color: taken ? Colors.gray[4] : name === item.name ? Colors.primary.default : Colors.gray[11] }]}>{name}{taken ? " (등록됨)" : ""}</Text></Pressable>;
                })}
              </ScrollView>}
              {custom && <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="물품 이름을 입력해주세요" value={item.name} onChangeText={(name) => setItem({ ...item, name })} maxLength={40} />}
              {duplicate && <Text style={[fonts.caption4_m_12, { color: Colors.gray[7] }]}>이미 등록한 물품이에요.</Text>}
            </View>
            <View style={styles.field}><Text style={styles.label}>물품 개수</Text><View style={styles.stepper}>
              <Pressable accessibilityLabel="수량 줄이기" style={styles.stepperButton} onPress={() => setItem({ ...item, quantity: Math.max(0, item.quantity - 1) })}><Ionicons name="remove" size={20} color={Colors.gray[7]} /></Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Pressable accessibilityLabel="수량 늘리기" style={styles.stepperButton} onPress={() => setItem({ ...item, quantity: item.quantity + 1 })}><Ionicons name="add" size={20} color={Colors.gray[7]} /></Pressable>
            </View></View>
            <View style={styles.field}><Text style={styles.label}>이미지 등록</Text><PhotoField photos={item.photos} onChange={(photos) => setItem({ ...item, photos })} limit={3} /></View>
            <View style={styles.field}><Text style={styles.label}>상세 설명</Text><View style={styles.textBox}><TextInput style={styles.textarea} multiline placeholder="상태, 브랜드, 구매처 등을 입력해주세요" placeholderTextColor={Colors.gray[5]} value={item.description} onChangeText={(description) => setItem({ ...item, description })} /></View></View>
          </ScrollView>
          <Pressable disabled={!valid} style={[styles.button, !valid && styles.disabled]} onPress={() => onSave({ ...item, name: item.name.trim() })}><Text style={styles.buttonText}>{items.some((other) => other.id === item.id) ? "수정하기" : "등록하기"}</Text></Pressable>
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}
