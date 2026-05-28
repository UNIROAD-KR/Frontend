import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProfilePage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [birthYear, setBirthYear] = useState('');
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | ''>('');

  const years = Array.from({ length: 60 }, (_, index) =>
    String(new Date().getFullYear() - index),
  );

  const isValid = birthYear !== '' && gender !== '';

  const handleNext = async () => {
    if (!isValid) return;

    await AsyncStorage.setItem('birthYear', birthYear);
    await AsyncStorage.setItem('gender', gender);

    router.push({
      pathname: '/onboarding/university',
      params: { nickname },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹</Text>
      </Pressable>

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progress} />
        <View style={styles.progress} />
        <View style={styles.progress} />
      </View>

      <Text style={styles.title}>출생년도와 성별을{'\n'}알려주세요.</Text>

      <Text style={styles.subtitle}>정보는 ~외에 사용되지 않습니다.</Text>

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
            gender === 'FEMALE' && styles.selectedCard,
          ]}
          onPress={() => setGender('FEMALE')}
        >
          <Image
            source={require('../../assets/images/woman.png')}
            style={styles.genderImage}
          />
          <Text style={styles.genderText}>여자</Text>
        </Pressable>

        <Pressable
          style={[styles.genderCard, gender === 'MALE' && styles.selectedCard]}
          onPress={() => setGender('MALE')}
        >
          <Image
            source={require('../../assets/images/man.png')}
            style={styles.genderImage}
          />
          <Text style={styles.genderText}>남자</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.nextButton, isValid && styles.nextButtonActive]}
        disabled={!isValid}
        onPress={handleNext}
      >
        <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
          다음 (1/4)
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
            <Text style={styles.modalTitle}>출생연도 선택</Text>

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
                  onPress={async () => {
                    setBirthYear(year);
                    await AsyncStorage.setItem('birthYear', year);
                    setYearModalVisible(false);
                  }}
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

  back: {
    fontSize: 38,
    color: '#000',
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
    color: '#000',
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
    height: 66,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 2,
  },

  genderImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 3,
  },

  genderText: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '600',
  },

  nextButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    height: 52,
    borderRadius: 5,
    backgroundColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
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
