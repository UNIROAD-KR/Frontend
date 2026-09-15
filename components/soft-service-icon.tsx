import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { SvgProps } from "react-native-svg";

type SoftServiceIconProps = {
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
} & (
  | { Icon: ComponentType<SvgProps>; name?: never; iconSize?: never }
  | {
      Icon?: never;
      name: keyof typeof Ionicons.glyphMap;
      iconSize?: number;
    }
);

export function SoftServiceIcon({
  size = 60,
  Icon,
  name,
  iconSize,
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
      {Icon ? (
        <Icon />
      ) : (
        <Ionicons name={name} size={iconSize ?? size * 0.4} color="#18202B" />
      )}
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
