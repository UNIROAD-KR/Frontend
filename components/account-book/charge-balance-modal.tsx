import { Ionicons } from "@expo/vector-icons";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type ChargeBalanceModalProps = {
  visible: boolean;
  amount: string;
  title: string;
  onChangeAmount: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ChargeBalanceModal({
  visible,
  amount,
  title,
  onChangeAmount,
  onChangeTitle,
  onClose,
  onSubmit,
}: ChargeBalanceModalProps) {
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>잔액 충전</Text>
              <Pressable onPress={handleClose}>
                <Ionicons name="close" size={24} color="#000" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>충전 금액 (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 50.5"
              placeholderTextColor="#C7C7CC"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={onChangeAmount}
            />

            <Text style={styles.inputLabel}>내역 설명</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 용돈 입금, 비상금 충전"
              placeholderTextColor="#C7C7CC"
              value={title}
              onChangeText={onChangeTitle}
            />

            <Pressable style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitButtonText}>충전하기</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3A3A3C",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1C1C1E",
  },
  submitButton: {
    height: 54,
    backgroundColor: "#123F9F",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
