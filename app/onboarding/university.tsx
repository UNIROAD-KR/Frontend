import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const universities = [
  '서울대학교',
  '서울과학기술대학교',
  '서울시립대학교',
  '서울여자대학교',
  '연세대학교',
  '고려대학교',
  '성균관대학교',
  '한양대학교',
  '중앙대학교',
  '경희대학교',
  '한국외국어대학교',
  '이화여자대학교',
  '건국대학교',
  '동국대학교',
  '홍익대학교',
  '숭실대학교',
  '국민대학교',
  '세종대학교',
  '숙명여자대학교',
  '광운대학교',
  '명지대학교',
  '상명대학교',
  '가천대학교',
  '인하대학교',
  '아주대학교',
  '단국대학교',
  '한국항공대학교',
  '한국공학대학교',
  '한국교원대학교',
  '부산대학교',
  '경북대학교',
  '전남대학교',
  '전북대학교',
  '충남대학교',
  '충북대학교',
  '강원대학교',
  '제주대학교',
  '부경대학교',
  '영남대학교',
  '동아대학교',
  '계명대학교',
  '조선대학교',
  '원광대학교',
  '울산대학교',
  '인천대학교',
  '한림대학교',
  '가톨릭대학교',
  '덕성여자대학교',
  '동덕여자대학교',
  '성신여자대학교',
];

export default function UniversityPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [university, setUniversity] = useState('');
  const [status, setStatus] = useState<'preparing' | 'dispatched' | ''>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isValid = university !== '' && status !== '';
  const filteredUniversities = useMemo(() => {
    if (!showSuggestions || university.trim().length === 0) {
      return [];
    }

    return universities.filter((item) => item.includes(university.trim()));
  }, [showSuggestions, university]);

  const handleSelectUniversity = (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    setShowSuggestions(false);
  };

  const handleNext = async () => {
    if (!isValid) {
      return;
    }

    await AsyncStorage.setItem('university', university);
    await AsyncStorage.setItem('exchangeStatus', status);
    await AsyncStorage.setItem(
      'profileStatus',
      status === 'preparing' ? '지원 준비 중' : '파견 중',
    );

    if (status === 'preparing') {
      router.push({
        pathname: '/onboarding/country',
        params: { nickname },
      });
      return;
    }

    router.push({
      pathname: '/onboarding/dispatched-country',
      params: { nickname },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progress} />
          <View style={styles.progress} />
        </View>

        <Text style={styles.title}>
          소속대학과{'\n'}현재 본인의 상태를 알려주세요.
        </Text>

        <Text style={styles.subtitle}>현재 본인의 단계는 어디인가요?</Text>

        <Text style={styles.label}>소속대학</Text>

        <View style={styles.inputArea}>
          <TextInput
            style={styles.universityInput}
            placeholder="소속대학 입력"
            placeholderTextColor="#555555"
            value={university}
            onFocus={() => setShowSuggestions(true)}
            onChangeText={(text) => {
              setUniversity(text);
              setShowSuggestions(true);
            }}
          />

          {university.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setUniversity('');
                setShowSuggestions(false);
              }}
            >
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          )}
        </View>

        {filteredUniversities.length > 0 && (
          <View style={styles.suggestionBox}>
            {filteredUniversities.map((item) => (
              <Pressable
                key={item}
                style={styles.suggestionItem}
                onPress={() => handleSelectUniversity(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.statusLabel}>현재 상황</Text>

        <View style={styles.statusRow}>
          <Pressable
            style={[
              styles.statusCard,
              status === 'preparing' && styles.selectedCard,
            ]}
            onPress={() => setStatus('preparing')}
          >
            <Image
              source={require('../../assets/images/ready.png')}
              style={styles.statusImage}
            />
            <Text style={styles.statusText}>교환학생 준비 중</Text>
          </Pressable>

          <Pressable
            style={[
              styles.statusCard,
              status === 'dispatched' && styles.selectedCard,
            ]}
            onPress={() => setStatus('dispatched')}
          >
            <Text style={styles.emoji}>🧚</Text>
            <Text style={styles.statusText}>현재 파견 중</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />

        <Pressable
          style={[styles.nextButton, isValid && styles.nextButtonActive]}
          disabled={!isValid}
          onPress={handleNext}
        >
          <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
            다음 (2/4)
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 36,
  },

  back: {
    fontSize: 30,
    lineHeight: 32,
    color: '#000',
    marginBottom: 35,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 92,
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
    color: '#111111',
    marginBottom: 12,
  },

  inputArea: {
    height: 54,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  universityInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
  },

  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  clearText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: -1,
  },

  suggestionBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 230,
    overflow: 'hidden',
  },

  suggestionItem: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  suggestionText: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '600',
  },

  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginTop: 48,
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statusCard: {
    flex: 1,
    height: 110,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 2,
  },

  statusImage: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginBottom: 9,
  },

  emoji: {
    fontSize: 34,
    marginBottom: 9,
  },

  statusText: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '800',
  },

  bottomSpacer: {
    flex: 1,
    minHeight: 120,
  },

  nextButton: {
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
