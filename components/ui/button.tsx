import React from "react";
import { Text } from "@/components/ui/app-text";
import { Pressable } from "react-native";
import { commonStyles, fonts } from "@/constants/theme";

type ButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  title?: string | React.ReactNode;
  disabledTitleColor?: string;
  style?: object;
};

export default function Button({
  onPress,
  disabled,
  title,
  style,
  disabledTitleColor = "#FFFFFF",
}: ButtonProps) {
  return (
    <Pressable
      style={[
        commonStyles.button,
        disabled && { backgroundColor: "#D3D9FF" },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text
        style={[
          fonts.sub3_sb_16,
          { color: disabled ? disabledTitleColor : "#FFFFFF" },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
