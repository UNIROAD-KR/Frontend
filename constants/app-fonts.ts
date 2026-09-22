import type { FontSource } from 'expo-font';
import { Platform, type TextStyle } from 'react-native';

export const fontFamilies = {
  100: 'Pretendard-Thin',
  200: 'Pretendard-ExtraLight',
  300: 'Pretendard-Light',
  400: 'Pretendard-Regular',
  500: 'Pretendard-Medium',
  600: 'Pretendard-SemiBold',
  700: 'Pretendard-Bold',
  800: 'Pretendard-ExtraBold',
  900: 'Pretendard-Black',
} as const;

// Native uses explicit faces so fontWeight cannot synthesize a different weight.
export const appFontSources: Record<string, FontSource> = Platform.OS === 'web' ? {
  PretendardVariable: require('@/assets/fonts/PretendardVariable.ttf'),
} : {
  'Pretendard-Thin': require('@/assets/fonts/Pretendard-Thin.otf'),
  'Pretendard-ExtraLight': require('@/assets/fonts/Pretendard-ExtraLight.otf'),
  'Pretendard-Light': require('@/assets/fonts/Pretendard-Light.otf'),
  'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('@/assets/fonts/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.otf'),
  'Pretendard-ExtraBold': require('@/assets/fonts/Pretendard-ExtraBold.otf'),
  'Pretendard-Black': require('@/assets/fonts/Pretendard-Black.otf'),
};

export function getAppFontStyle(weight: TextStyle['fontWeight'] = '400'): TextStyle {
  const numeric = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
  const resolved = Math.max(100, Math.min(900, Math.round(numeric / 100) * 100)) as keyof typeof fontFamilies;
  return Platform.OS === 'web'
    ? { fontFamily: 'PretendardVariable', fontWeight: numeric as TextStyle['fontWeight'] }
    : { fontFamily: fontFamilies[resolved], fontWeight: 'normal' };
}
