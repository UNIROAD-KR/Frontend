import React from "react";
import { Pressable, Text } from "react-native";
import { commonStyles, fonts } from "@/constants/theme";

type ButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  title?: string | React.ReactNode;
};

export default function Button({ onPress, disabled, title }: ButtonProps) {
  return (
    <Pressable
      style={[commonStyles.button, disabled && { backgroundColor: "#D3D9FF" }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={[fonts.sub3_sb_16, { color: "#FFFFFF" }]}>{title}</Text>
    </Pressable>
  );
}
