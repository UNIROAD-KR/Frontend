import { router, type Href } from 'expo-router';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

type BackButtonProps = {
  accessibilityLabel?: string;
  fallbackHref?: Href;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function BackButton({
  accessibilityLabel = '뒤로가기',
  fallbackHref,
  onPress,
  style,
}: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackHref) {
      router.replace(fallbackHref);
    }
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M19 12H5"
          stroke="#102443"
          strokeLinecap="round"
          strokeWidth={2.6}
        />
        <Path
          d="M12 5L5 12L12 19"
          stroke="#102443"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.65,
  },
});
