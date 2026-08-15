import { router, useNavigation, type Href } from 'expo-router';
import type { SvgProps } from 'react-native-svg';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import BackArrowIcon from '@/assets/icon/back-arrow.svg';

type AppBackButtonProps = {
  fallbackHref?: Href;
  onPress?: PressableProps['onPress'];
  hitSlop?: PressableProps['hitSlop'];
  showOnlyWhenCanGoBack?: boolean;
  style?: StyleProp<ViewStyle>;
  iconStyle?: SvgProps['style'];
};

export function goBackOrReplace(fallbackHref: Href = '/home') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}

export function AppBackButton({
  fallbackHref,
  onPress,
  hitSlop = 15,
  showOnlyWhenCanGoBack = false,
  style,
  iconStyle,
}: AppBackButtonProps) {
  const navigation = useNavigation();

  const getBackNavigation = () => {
    let currentNavigation: any = navigation;

    while (currentNavigation) {
      if (currentNavigation.canGoBack?.()) {
        return currentNavigation;
      }

      currentNavigation = currentNavigation.getParent?.();
    }

    return null;
  };

  const canGoBack = router.canGoBack() || Boolean(getBackNavigation());

  if (showOnlyWhenCanGoBack && !canGoBack) {
    return null;
  }

  const handlePress: PressableProps['onPress'] = (event) => {
    if (onPress) {
      onPress(event);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    const backNavigation = getBackNavigation();

    if (backNavigation?.canGoBack?.()) {
      backNavigation.goBack();
      return;
    }

    // A screen opened with replace() has no native history. Keep the button responsive.
    router.replace(fallbackHref ?? '/home');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      hitSlop={hitSlop}
      onPress={handlePress}
      style={[styles.button, style]}
    >
      <View pointerEvents="none" style={styles.iconWrap}>
        <BackArrowIcon width={9} height={16} style={iconStyle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    zIndex: 2,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 9,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
