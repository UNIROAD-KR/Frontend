import { useEffect, useRef, useSyncExternalStore } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import CheckIcon from "@/assets/icon/check-primary.svg";

type ToastOptions = {
  type?: "success" | "error" | "info";
  text: string;
  visibilityTime?: number;
};

let current: (ToastOptions & { id: number; visible: boolean }) | null = null;
let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => current;

export const Toast = {
  show(options: ToastOptions) {
    current = { ...options, id: ++nextId, visible: true };
    emit();
  },
  hide() {
    if (!current) return;
    current = { ...current, visible: false };
    emit();
  },
};

export function FadeToastHost() {
  const toast = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const fadeOut = Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    });
    if (toast.visible) opacity.setValue(0);
    const animation = toast.visible
      ? Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, toast.visibilityTime ?? 1500)),
          fadeOut,
        ])
      : fadeOut;
    animation.start(({ finished }) => {
      // An older animation must not remove a newer message.
      if (finished && current?.id === toast.id) {
        current = null;
        emit();
      }
    });
    return () => animation.stop();
  }, [toast, opacity]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { bottom: insets.bottom + 24 }]}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.content, { opacity }]}
      >
        <CheckIcon width={20} height={20} />
        <Text style={styles.text}>{toast.text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[11],
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    borderRadius: 1000,
  },
  text: {
    ...fonts.body2_m_14,
    color: Colors.common.white,
    flexShrink: 1,
  },
});
