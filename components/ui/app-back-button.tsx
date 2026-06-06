import { router } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  type ImageStyle,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AppBackButtonProps = {
  onPress?: PressableProps['onPress'];
  hitSlop?: PressableProps['hitSlop'];
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
};

export function AppBackButton({
  onPress,
  hitSlop = 15,
  style,
  iconStyle,
}: AppBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      hitSlop={hitSlop}
      onPress={onPress ?? (() => router.back())}
      style={[style, styles.button]}
    >
      <Image
        source={require('../../assets/images/back.png')}
        style={[styles.icon, iconStyle]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 15,
    height: 24,
    resizeMode: 'contain',
  },
});
