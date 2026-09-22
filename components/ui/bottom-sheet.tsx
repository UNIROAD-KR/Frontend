import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type ModalProps,
  type PressableProps,
  type TouchableOpacityProps,
  type ViewProps,
} from 'react-native';

// Match the login sheet's Animated.timing defaults and backdrop color.
export const BOTTOM_SHEET_MOTION = { open: 300, close: 250 } as const;
export const bottomSheetStyles = StyleSheet.create({
  transparent: { backgroundColor: 'transparent' },
});

const MotionContext = createContext<{
  visible: boolean;
  progress: Animated.Value;
  dragOffset: Animated.Value;
} | null>(null);

export function useBottomSheetMotion() {
  const motion = useContext(MotionContext);
  if (!motion) throw new Error('Bottom sheet surfaces require BottomSheetModal');
  return motion;
}

export function BottomSheetModal({
  visible = false,
  children,
  onShow,
  onDismiss,
  onAfterClose,
  ...props
}: Omit<ModalProps, 'animationType' | 'transparent'> & { onAfterClose?: () => void }) {
  const [mounted, setMounted] = useState(visible);
  const [shown, setShown] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();
  const lastChildren = useRef<ReactNode>(children);
  const currentVisible = useRef(visible);
  const wasMounted = useRef(false);
  currentVisible.current = visible;
  // Retain the last open content when its owner clears selection on close.
  if (visible) lastChildren.current = children;

  useEffect(() => {
    if (visible) setMounted(true);
    if (!shown) return;

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? BOTTOM_SHEET_MOTION.open : BOTTOM_SHEET_MOTION.close,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !currentVisible.current) {
        setMounted(false);
        setShown(false);
        dragOffset.setValue(0);
      }
    });
    return () => animation.stop();
  }, [visible, shown, progress, dragOffset]);

  useEffect(() => {
    if (mounted) {
      wasMounted.current = true;
    } else if (wasMounted.current) {
      wasMounted.current = false;
      if (Platform.OS !== 'ios' && !currentVisible.current) onAfterClose?.();
    }
  }, [mounted, onAfterClose]);

  const dragOpacity = dragOffset.interpolate({
    inputRange: [0, height * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      {...props}
      transparent
      animationType="none"
      visible={visible || mounted}
      onDismiss={() => {
        onDismiss?.();
        if (Platform.OS === 'ios' && !currentVisible.current) onAfterClose?.();
      }}
      onShow={(event) => {
        setShown(true);
        onShow?.(event);
      }}
    >
      <MotionContext.Provider value={{ visible, progress, dragOffset }}>
        <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: Animated.multiply(progress, dragOpacity) }]}
          />
          {visible ? children : lastChildren.current}
        </View>
      </MotionContext.Provider>
    </Modal>
  );
}

function useSurface(onLayout?: (event: LayoutChangeEvent) => void) {
  const { progress, dragOffset } = useBottomSheetMotion();
  const { height } = useWindowDimensions();
  const distance = useRef(new Animated.Value(height)).current;
  const offset = Animated.add(
    Animated.multiply(Animated.subtract(1, progress), distance),
    Animated.multiply(progress, dragOffset.interpolate({
      inputRange: [-1, 0, height],
      outputRange: [0, 0, height],
      extrapolate: 'clamp',
    })),
  );
  return {
    style: { backgroundColor: '#FFFFFF', transform: [{ translateY: offset }] },
    onLayout: (event: LayoutChangeEvent) => {
      distance.setValue(event.nativeEvent.layout.height);
      onLayout?.(event);
    },
  };
}

export const BottomSheetView = forwardRef<View, ViewProps>(function BottomSheetView(
  { style, onLayout, ...props }, ref,
) {
  const surface = useSurface(onLayout);
  return <Animated.View {...props} ref={ref} onLayout={surface.onLayout} style={[style, surface.style]} />;
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const BottomSheetPressable = forwardRef<View, PressableProps>(function BottomSheetPressable(
  { style, onLayout, ...props }, ref,
) {
  const surface = useSurface(onLayout);
  return (
    <AnimatedPressable
      {...props}
      ref={ref}
      onLayout={surface.onLayout}
      style={typeof style === 'function'
        ? (state) => [style(state), surface.style]
        : [style, surface.style]}
    />
  );
});

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
export const BottomSheetTouchable = forwardRef<View, TouchableOpacityProps>(function BottomSheetTouchable(
  { style, onLayout, ...props }, ref,
) {
  const surface = useSurface(onLayout);
  return <AnimatedTouchable {...props} ref={ref} onLayout={surface.onLayout} style={[style, surface.style]} />;
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
