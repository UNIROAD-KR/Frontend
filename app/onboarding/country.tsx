import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import {
  Alert,
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

const countries = [
  { flag: '🇩🇪', name: '독일' },
  { flag: '🇫🇷', name: '프랑스' },
  { flag: '🇨🇿', name: '체코' },
  { flag: '🇪🇸', name: '스페인' },
  { flag: '🇵🇹', name: '포르투갈' },
  { flag: '🇮🇹', name: '이탈리아' },
  { flag: '🇧🇪', name: '벨기에' },
  { flag: '🇳🇱', name: '네덜란드' },
  { flag: '🇵🇱', name: '폴란드' },
  { flag: '🇫🇮', name: '핀란드' },
  { flag: '🇳🇴', name: '노르웨이' },
  { flag: '🇸🇪', name: '스웨덴' },
  { flag: '🇬🇧', name: '영국' },
  { flag: '🇮🇪', name: '아일랜드' },
  { flag: '🇩🇰', name: '덴마크' },
  { flag: '🇱🇹', name: '리투아니아' },
  { flag: '🇦🇹', name: '오스트리아' },
  { flag: '🇨🇭', name: '스위스' },
  { image: require('../../assets/images/etc.png'), name: '기타' },
  { flag: '❓', name: '미정' },
];

export default function CountryPage() {
  const scrollRef = useRef<ScrollView>(null);
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [selectedCountry, setSelectedCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  
  // 파견 지역, 파견 대학 추가 (준비 중인 학생도 목표 대학/지역을 입력할 수 있도록 함)
  const [region, setRegion] = useState('');
  const [university, setUniversity] = useState('');

  const finalCountry = isCustomCountry ? customCountry.trim() : selectedCountry;
  // 파견 국가만 필수이거나 지역/대학도 입력 받도록 유도할 수 있습니다.
  const isValid = finalCountry.length > 0;

  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);

    if (countryName === '미정') {
      setIsCustomCountry(true);
      setCustomCountry('');

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      setIsCustomCountry(false);
      setCustomCountry('');
    }
  };

  const handleNext = async () => {
    if (!isValid) {
      Alert.alert('입력 오류', '파견 국가를 선택하거나 입력해주세요.');
      return;
    }

    await AsyncStorage.setItem('dispatchedCountry', finalCountry);
    await AsyncStorage.setItem('dispatchedRegion', region.trim());
    await AsyncStorage.setItem('dispatchedUniversity', university.trim());

    router.push({
      pathname: '/onboarding/interests',
      params: {
        nickname,
        country: finalCountry,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹</Text>
      </Pressable>

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progress} />
      </View>

      <Text style={styles.title}>어느 나라를{'\n'}생각하고 계신가요?</Text>

      <Text style={styles.subtitle}>원하는 파견 지역을 알려주세요.</Text>

      <ScrollView
        ref={scrollRef}
        style={styles.countryScroll}
        contentContainerStyle={styles.countryGrid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {countries.map((item) => {
          const selected = selectedCountry === item.name;

          return (
            <Pressable
              key={item.name}
              style={[styles.countryCard, selected && styles.selectedCard]}
              onPress={() => handleSelectCountry(item.name)}
            >
              {'image' in item ? (
                <Image source={item.image} style={styles.countryImage} />
              ) : (
                <Text style={styles.flag}>{item.flag}</Text>
              )}

              <Text style={styles.countryName}>{item.name}</Text>
            </Pressable>
          );
        })}

        {isCustomCountry && (
          <View style={styles.customInputWrap}>
            <Text style={styles.customLabel}>파견 국가 직접 입력</Text>

            <TextInput
              style={styles.customInput}
              placeholder="예: 캐나다, 호주, 일본"
              placeholderTextColor="#9A9A9A"
              value={customCountry}
              onChangeText={setCustomCountry}
            />
          </View>
        )}

        <View style={styles.extraInputWrap}>
          <Text style={styles.customLabel}>희망/예정 파견 지역</Text>
          <TextInput
            style={styles.customInput}
            placeholder="예: 도쿄, 뉴욕 (선택 사항)"
            placeholderTextColor="#9A9A9A"
            value={region}
            onChangeText={setRegion}
          />
        </View>

        <View style={styles.extraInputWrap}>
          <Text style={styles.customLabel}>희망/예정 파견 대학</Text>
          <TextInput
            style={styles.customInput}
            placeholder="파견 예정이거나 희망하는 대학 입력 (선택 사항)"
            placeholderTextColor="#9A9A9A"
            value={university}
            onChangeText={setUniversity}
          />
        </View>
      </ScrollView>

      <Pressable
        style={[styles.nextButton, isValid && styles.nextButtonActive]}
        disabled={!isValid}
        onPress={handleNext}
      >
        <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
          다음 (3/4)
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const BLUE = '#123F9F';
const CARD_WIDTH = '30%';

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

  countryScroll: {
    flex: 1,
    marginBottom: 10,
  },

  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 13,
    rowGap: 13,
    paddingBottom: 10,
  },

  countryCard: {
    width: CARD_WIDTH,
    height: 62,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 1.5,
  },

  flag: {
    fontSize: 22,
    marginBottom: 5,
  },

  countryImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginBottom: 5,
  },

  countryName: {
    fontSize: 12,
    color: '#111',
  },

  customInputWrap: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },

  extraInputWrap: {
    width: '100%',
    marginBottom: 16,
  },

  customLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },

  customInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111111',
  },

  nextButton: {
    height: 53,
    borderRadius: 5,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
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
