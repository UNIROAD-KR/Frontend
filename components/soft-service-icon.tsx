import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type IoniconName = keyof typeof Ionicons.glyphMap;

type IconTone = {
  bg: string;
  color: string;
};

const DEFAULT_TONE: IconTone = {
  bg: '#EAF1F8',
  color: '#2F66D0',
};

const ICON_TONES: Partial<Record<IoniconName, IconTone>> = {
  'school-outline': { bg: '#EAF2FF', color: '#2F66D0' },
  'ribbon-outline': { bg: '#FFF4D8', color: '#D89A00' },
  'document-text-outline': { bg: '#EEF2F7', color: '#475569' },
  'business-outline': { bg: '#EEF2F7', color: '#475569' },
  'cart-outline': { bg: '#EAF2FF', color: '#2F66D0' },
  'ticket-outline': { bg: '#FFF0E8', color: '#E06B38' },
  'people-outline': { bg: '#E8F8F0', color: '#16A36A' },
  'wallet-outline': { bg: '#F0ECFF', color: '#6B55D8' },
  'checkmark-done-outline': { bg: '#EAF7F0', color: '#159A62' },
  'create-outline': { bg: '#FCEAF5', color: '#D95FA8' },
  'storefront-outline': { bg: '#FFF0E8', color: '#E06B38' },
  'chatbubbles-outline': { bg: '#EEF0FF', color: '#6B55D8' },
};

const ICON_GLYPHS: Partial<Record<IoniconName, IoniconName>> = {
  'school-outline': 'school',
  'ribbon-outline': 'ribbon',
  'document-text-outline': 'id-card',
  'business-outline': 'business',
  'cart-outline': 'cart',
  'ticket-outline': 'ticket',
  'people-outline': 'people',
  'wallet-outline': 'wallet',
  'checkmark-done-outline': 'checkbox',
  'create-outline': 'create',
  'storefront-outline': 'storefront',
  'chatbubbles-outline': 'chatbubbles',
};

type SoftServiceIconProps = {
  name: IoniconName;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SoftServiceIcon({
  name,
  size = 44,
  iconSize = 23,
  borderRadius = 16,
  style,
}: SoftServiceIconProps) {
  const tone = ICON_TONES[name] ?? DEFAULT_TONE;
  const glyphName = ICON_GLYPHS[name] ?? name;

  return (
    <View
      style={[
        styles.iconBox,
        style,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: tone.bg,
        },
      ]}
    >
      <Ionicons
        name={glyphName}
        size={iconSize}
        color={tone.color}
        style={styles.iconDepth}
      />
      <Ionicons name={glyphName} size={iconSize} color={tone.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDepth: {
    position: 'absolute',
    opacity: 0.18,
    transform: [{ translateY: 1.2 }],
  },
});
