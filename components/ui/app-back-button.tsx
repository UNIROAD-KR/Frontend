import { router, type Href } from 'expo-router';
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
  fallbackHref?: Href;
  onPress?: PressableProps['onPress'];
  hitSlop?: PressableProps['hitSlop'];
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
};

export function AppBackButton({
  fallbackHref,
  onPress,
  hitSlop = 15,
  style,
  iconStyle,
}: AppBackButtonProps) {
  const handlePress: PressableProps['onPress'] = (event) => {
    if (onPress) {
      onPress(event);
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
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      hitSlop={hitSlop}
      onPress={handlePress}
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
