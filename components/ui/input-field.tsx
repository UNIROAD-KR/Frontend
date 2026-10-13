import { Colors, fonts } from "@/constants/theme";
import { TextInput, Text, View, StyleSheet } from "react-native";
import type { TextInputProps } from "react-native";
import ErrorIcon from "@/assets/icon/error.svg";

interface InputFieldProps extends TextInputProps {
  size?: "sm" | "lg";
  error?: string;
}

export default function InputField({
  size,
  placeholder,
  error,
  keyboardType,
  onChangeText,
}: InputFieldProps) {
  return (
    <>
      <TextInput
        style={[
          styles.input,
          size === "sm" && styles.inputSm,
          size === "lg" && styles.inputLg,
        ]}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#B1B8C1"
        keyboardType={keyboardType ?? "default"}
        returnKeyType="next"
        onChangeText={onChangeText}
        cursorColor={Colors.primary.default}
      />
      {error && (
        <View style={styles.errorContainer}>
          <ErrorIcon />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderColor: "#E6E8EB",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    ...fonts.body1_m_16,
  },
  inputSm: {
    height: 52,
  },
  inputLg: {
    height: 184,
  },
  errorContainer: {
    marginTop: 8,
    gap: 4,
    flexDirection: "row",
  },
  errorText: {
    color: "#FF3636",
    ...fonts.caption3_m_13,
  },
  subText: {
    color: "#191F28",
    ...fonts.body1_m_16,
  },
});
