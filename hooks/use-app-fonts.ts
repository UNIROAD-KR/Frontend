import { useFonts } from 'expo-font';
import { appFontSources } from '@/constants/app-fonts';

export function useAppFonts() {
  return useFonts(appFontSources);
}
