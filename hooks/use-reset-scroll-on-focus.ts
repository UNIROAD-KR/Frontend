import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';

export function useResetScrollOnFocus() {
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      const resetScroll = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };

      resetScroll();
      const timer = setTimeout(resetScroll, 50);

      return () => clearTimeout(timer);
    }, []),
  );

  return scrollRef;
}
