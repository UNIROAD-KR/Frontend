/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform, StyleSheet } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const fonts = StyleSheet.create({
  head1_b_40: {
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 56,
    letterSpacing: -1.6,
  },
  head2_sb_40: {
    fontSize: 40,
    fontWeight: "600",
    lineHeight: 56,
    letterSpacing: -1.6,
  },
  head3_b_36: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 50.4,
    letterSpacing: -1.44,
  },
  head4_sb_36: {
    fontSize: 36,
    fontWeight: "600",
    lineHeight: 50.4,
    letterSpacing: -1.44,
  },
  title1_b_28: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 39.2,
    letterSpacing: -1.12,
  },
  title2_sb_28: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 39.2,
    letterSpacing: -1.12,
  },
  title3_b_24: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 33.6,
    letterSpacing: -0.96,
  },
  title4_sb_24: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 33.6,
    letterSpacing: -0.96,
  },
  title5_b_20: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: -0.8,
  },
  title6_sb_20: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: -0.8,
  },
  sub1_sb_18: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 25.2,
    letterSpacing: -0.72,
  },
  sub2_m_18: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 25.2,
    letterSpacing: -0.72,
  },
  sub3_sb_16: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22.4,
    letterSpacing: -0.64,
  },
  sub4_sb_14: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19.6,
    letterSpacing: -0.56,
  },
  body1_m_16: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: -0.64,
  },
  body2_m_14: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    letterSpacing: -0.56,
  },
  body3_r_16: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: -0.64,
  },
  body4_r_14: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 21,
    letterSpacing: -0.56,
  },
  caption1_sb_13: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16.9,
    letterSpacing: -0.52,
  },
  caption2_sb_12: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15.6,
    letterSpacing: -0.48,
  },
  caption3_m_13: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 16.9,
    letterSpacing: -0.52,
  },
  caption4_m_12: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15.6,
    letterSpacing: -0.48,
  },
  caption5_r_13: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 16.9,
    letterSpacing: -0.52,
  },
  caption6_r_12: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 15.6,
    letterSpacing: -0.48,
  },
});
