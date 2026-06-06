import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppBackButton } from '@/components/ui/app-back-button';

const interests = [
  '교환학생 준비 가이드',
  '교환학생 생활 팁',
  '출국 전 준비 정보',
  '중고 물품 구매',
];

export default function InterestsPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = (item: string) => {
    setSelected((prev) =>
      prev.includes(item)
        ? prev.filter((value) => value !== item)
        : [...prev, item],
    );
  };

  const isValid = selected.length > 0;

  return (
    <View style={styles.container}>
      <AppBackButton style={styles.backButton} />

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
      </View>

      <Text style={styles.title}>현재 관심사를{'\n'}알려주세요.</Text>

      <Text style={styles.subtitle}>원하는 정보 혹은 기능을 알려주세요.</Text>

      <View style={styles.interestGrid}>
        {interests.map((item) => {
          const isSelected = selected.includes(item);

          return (
            <Pressable
              key={item}
              style={[
                styles.interestButton,
                isSelected && styles.selectedButton,
              ]}
              onPress={() => toggleInterest(item)}
            >
              <Text
                style={[
                  styles.interestText,
                  isSelected && styles.selectedInterestText,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.nextButton, isValid && styles.nextButtonActive]}
        disabled={!isValid}
        onPress={() =>
          router.push({
            pathname: '/onboarding/complete',
            params: { nickname },
          })
        }
      >
        <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
          다음 (4/4)
        </Text>
      </Pressable>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 52,
  },

  backButton: {
    marginBottom: 20,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 72,
  },

  progress: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#DDDDDD',
  },

  progressActive: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  title: {
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '900',
    color: '#000',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 13,
    color: '#B0B0B0',
    marginBottom: 34,
  },

  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  interestButton: {
    width: '48%',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedButton: {
    backgroundColor: BLUE,
  },

  interestText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },

  selectedInterestText: {
    color: '#FFFFFF',
  },

  nextButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 60,
    height: 53,
    borderRadius: 5,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonActive: {
    backgroundColor: BLUE,
  },

  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A9A9A',
  },

  nextTextActive: {
    color: '#FFFFFF',
  },
});
