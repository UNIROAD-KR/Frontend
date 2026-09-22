import { createContext, forwardRef, useContext } from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { getAppFontStyle } from '@/constants/app-fonts';

// Keep nested Text (e.g. underlined words) at the parent's weight and family.
const FontContext = createContext<Pick<TextStyle, 'fontFamily' | 'fontWeight'>>({});

export type Text = NativeText;
// Match React Native's component and instance type exports for existing refs.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Text = forwardRef<NativeText, TextProps>(function AppText(
  { style, children, ...props }, ref,
) {
  const inherited = useContext(FontContext);
  const flat = StyleSheet.flatten(style);
  const font = {
    fontFamily: flat?.fontFamily ?? inherited.fontFamily,
    fontWeight: flat?.fontWeight ?? inherited.fontWeight,
  };
  const resolved = font.fontFamily ? font : getAppFontStyle(font.fontWeight);
  return (
    <FontContext.Provider value={font}>
      <NativeText {...props} ref={ref} style={[style, resolved]}>
        {children}
      </NativeText>
    </FontContext.Provider>
  );
});

export type TextInput = NativeTextInput;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput(
  { style, ...props }, ref,
) {
  const flat = StyleSheet.flatten(style);
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      style={[style, !flat?.fontFamily && getAppFontStyle(flat?.fontWeight)]}
    />
  );
});
