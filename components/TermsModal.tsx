import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { signupStyles as styles } from '../src/styles/signupStyles';

type TermsModalProps = {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
  onAgree: () => void;
};

const BOTTOM_THRESHOLD = 24;

export function TermsModal({
  visible,
  title,
  content,
  onClose,
  onAgree,
}: TermsModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setHasReachedEnd(false);
      setScrollViewHeight(0);
      setContentHeight(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }
  }, [content, visible]);

  useEffect(() => {
    if (
      visible &&
      scrollViewHeight > 0 &&
      contentHeight > 0 &&
      contentHeight <= scrollViewHeight + BOTTOM_THRESHOLD
    ) {
      setHasReachedEnd(true);
    }
  }, [contentHeight, scrollViewHeight, visible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >=
      contentSize.height - BOTTOM_THRESHOLD;

    if (isAtBottom) {
      setHasReachedEnd(true);
    }
  };

  const handleAgree = () => {
    if (!hasReachedEnd) {
      return;
    }

    onAgree();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.legalOverlay}>
        <View style={styles.legalModal}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalTitle}>{title}</Text>
            <Pressable style={styles.legalCloseButton} onPress={onClose}>
              <Text style={styles.legalCloseText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.legalScroll}
            contentContainerStyle={styles.legalContent}
            showsVerticalScrollIndicator
            scrollEventThrottle={16}
            onScroll={handleScroll}
            onLayout={(event) =>
              setScrollViewHeight(event.nativeEvent.layout.height)
            }
            onContentSizeChange={(_, height) => setContentHeight(height)}
          >
            <Text style={styles.legalBody}>{content}</Text>
          </ScrollView>

          <View style={styles.legalFooter}>
            <Pressable
              style={[
                styles.legalAgreeButton,
                hasReachedEnd ? styles.legalAgreeButtonActive : null,
              ]}
              onPress={handleAgree}
              disabled={!hasReachedEnd}
            >
              <Text
                style={[
                  styles.legalAgreeButtonText,
                  hasReachedEnd ? styles.legalAgreeButtonTextActive : null,
                ]}
              >
                동의하기
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
