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
  showOnlyWhenCanGoBack?: boolean;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
};

export function AppBackButton({
  fallbackHref,
  onPress,
  hitSlop = 15,
  showOnlyWhenCanGoBack = false,
  style,
  iconStyle,
}: AppBackButtonProps) {
  const canGoBack = router.canGoBack();

  if (showOnlyWhenCanGoBack && !canGoBack) {
    return null;
  }

  const handlePress: PressableProps['onPress'] = (event) => {
    if (onPress) {
      onPress(event);
      return;
    }

    if (canGoBack) {
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
      style={[styles.button, style]}
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
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 13,
    height: 20,
    resizeMode: 'contain',
  },
});
