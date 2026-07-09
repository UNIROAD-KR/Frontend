import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { ONBOARDING_NICKNAME_KEY } from '@/src/constants/onboarding';

type Gender = 'female' | 'male' | '';

export default function ProfilePage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [birthYear, setBirthYear] = useState('');
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [gender, setGender] = useState<Gender>('');

  const years = Array.from({ length: 60 }, (_, index) =>
    String(new Date().getFullYear() - index),
  );

  const isValid = birthYear !== '' && gender !== '';

  useEffect(() => {
    const loadProfile = async () => {
      const [[, savedBirthYear], [, savedGender]] = await AsyncStorage.multiGet([
        'birthYear',
        'gender',
      ]);

      if (savedBirthYear) {
        setBirthYear(savedBirthYear);
      }

      if (savedGender === 'female' || savedGender === 'male') {
        setGender(savedGender);
      }
    };

    loadProfile();
  }, []);

  const handleSelectBirthYear = async (year: string) => {
    setBirthYear(year);
    await AsyncStorage.setItem('birthYear', year);
    setYearModalVisible(false);
  };

  const handleSelectGender = async (nextGender: Exclude<Gender, ''>) => {
    setGender(nextGender);
    await AsyncStorage.setItem('gender', nextGender);
  };

  const handleNext = async () => {
    if (!isValid) {
      return;
    }

    await AsyncStorage.multiSet([
      ['birthYear', birthYear],
      ['gender', gender],
    ]);

    const savedNickname =
      nickname?.trim() ||
      (await AsyncStorage.getItem(ONBOARDING_NICKNAME_KEY)) ||
      '';

    router.push({
      pathname: '/onboarding/university',
      params: { nickname: savedNickname },
    });
  };

  return (
    <View style={styles.container}>
      <AppBackButton style={styles.backButton} />

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progress} />
        <View style={styles.progress} />
      </View>

      <Text style={styles.title}>출생년도와 성별을{'\n'}알려주세요.</Text>

      <Text style={styles.subtitle}>정보는 맞춤형 서비스 제공에만 사용돼요.</Text>

      <Text style={styles.label}>출생년도</Text>

      <Pressable
        style={styles.selectBox}
        onPress={() => setYearModalVisible(true)}
      >
        <Text style={[styles.selectText, birthYear && styles.selectTextActive]}>
          {birthYear || '출생년도 선택'}
        </Text>

        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Text style={styles.genderLabel}>성별</Text>

      <View style={styles.genderRow}>
        <Pressable
          style={[
            styles.genderCard,
            gender === 'female' && styles.selectedCard,
          ]}
          onPress={() => handleSelectGender('female')}
        >
          <Text style={styles.genderEmoji}>👩</Text>
          <Text
            style={[
              styles.genderText,
              gender === 'female' && styles.genderTextSelected,
            ]}
          >
            여자
          </Text>
        </Pressable>

        <Pressable
          style={[styles.genderCard, gender === 'male' && styles.selectedCard]}
          onPress={() => handleSelectGender('male')}
        >
          <Text style={styles.genderEmoji}>👨</Text>
          <Text
            style={[
              styles.genderText,
              gender === 'male' && styles.genderTextSelected,
            ]}
          >
            남자
          </Text>
        </Pressable>
      </View>

      <View style={styles.bottomSpacer} />

      <Pressable
        style={[styles.nextButton, isValid && styles.nextButtonActive]}
        disabled={!isValid}
        onPress={handleNext}
      >
        <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
          다음
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={yearModalVisible}
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setYearModalVisible(false)}
        >
          <Pressable style={styles.yearModal}>
            <Text style={styles.modalTitle}>출생년도 선택</Text>

            <ScrollView
              style={styles.yearScroll}
              showsVerticalScrollIndicator={false}
            >
              {years.map((year) => (
                <Pressable
                  key={year}
                  style={[
                    styles.yearOption,
                    birthYear === year && styles.yearOptionActive,
                  ]}
                  onPress={() => handleSelectBirthYear(year)}
                >
                  <Text
                    style={[
                      styles.yearOptionText,
                      birthYear === year && styles.yearOptionTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: 35,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 68,
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
    color: '#000000',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 13,
    color: '#B0B0B0',
    marginBottom: 42,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },

  selectBox: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    fontSize: 14,
    color: '#999999',
  },

  selectTextActive: {
    color: '#111111',
  },

  chevron: {
    fontSize: 24,
    color: '#C4C4C4',
    marginTop: -6,
  },

  genderLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 48,
    marginBottom: 16,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },

  genderCard: {
    flex: 1,
    height: 88,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 2,
    backgroundColor: '#F3F7FF',
  },

  genderEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },

  genderText: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '700',
  },

  genderTextSelected: {
    color: BLUE,
    fontWeight: '900',
  },

  bottomSpacer: {
    flex: 1,
    minHeight: 120,
  },

  nextButton: {
    height: 52,
    borderRadius: 5,
    backgroundColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },

  nextButtonActive: {
    backgroundColor: BLUE,
  },

  nextText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9A9A9A',
  },

  nextTextActive: {
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  yearModal: {
    width: 240,
    maxHeight: 380,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
  },

  yearScroll: {
    maxHeight: 310,
  },

  yearOption: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  yearOptionActive: {
    backgroundColor: '#F2F5FF',
  },

  yearOptionText: {
    fontSize: 16,
    color: '#111111',
  },

  yearOptionTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
});
