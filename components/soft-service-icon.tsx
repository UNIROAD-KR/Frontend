import type { ComponentType } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { SvgProps } from "react-native-svg";

type SoftServiceIconProps = {
  size?: number;
  Icon: ComponentType<SvgProps>;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SoftServiceIcon({
  size = 60,
  Icon,
  borderRadius = 12,
  style,
}: SoftServiceIconProps) {
  return (
    <View
      style={[
        styles.iconBox,
        style,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: "#F9FAFB",
        },
      ]}
    >
      <Icon />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconDepth: {
    position: "absolute",
    opacity: 0.18,
    transform: [{ translateY: 1.2 }],
  },
});
