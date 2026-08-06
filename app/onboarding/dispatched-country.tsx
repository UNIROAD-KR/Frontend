import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { OnboardingSelectModal } from '@/components/ui/onboarding-select-modal';
import { useResetScrollOnFocus } from '@/hooks/use-reset-scroll-on-focus';
import {
  countryOptions,
  CUSTOM_COUNTRY_OPTION,
  ExchangeStatus,
  ONBOARDING_NICKNAME_KEY,
} from '@/src/constants/onboarding';
import { designColors } from '@/src/styles/design-tokens';

const resolveCountrySelection = (savedCountry: string | null) => {
  if (!savedCountry) {
    return { selectedCountry: '', customCountry: '' };
  }

  if (countryOptions.includes(savedCountry)) {
    return { selectedCountry: savedCountry, customCountry: '' };
  }

  return {
    selectedCountry: CUSTOM_COUNTRY_OPTION,
    customCountry: savedCountry,
  };
};

const isExchangeStatus = (value: string | null): value is ExchangeStatus =>
  value === 'preparing' || value === 'accepted' || value === 'dispatched';

export default function DispatchedCountryPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const scrollRef = useResetScrollOnFocus();

  const [selectedCountry, setSelectedCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [region, setRegion] = useState('');
  const [university, setUniversity] = useState('');
  const [status, setStatus] = useState<ExchangeStatus>('dispatched');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const isCustomCountry = selectedCountry === CUSTOM_COUNTRY_OPTION;
  const finalCountry = isCustomCountry ? customCountry.trim() : selectedCountry;
  const isValid =
    finalCountry.length > 0 && region.trim().length > 0 && university.trim().length > 0;

  const copy = useMemo(() => {
    if (status === 'accepted') {
      return {
        title: '출국 예정인{break}지역이 어디인가요?',
        subtitle: '예정된 파견 국가, 지역, 대학을 알려주세요.',
      };
    }

    return {
      title: '현재 파견 중인{break}지역이 어디인가요?',
      subtitle: '파견 중인 국가, 지역, 대학을 알려주세요.',
    };
  }, [status]);

  useEffect(() => {
    const loadCountryStep = async () => {
      const [
        [, savedCountry],
        [, savedRegion],
        [, savedUniversity],
        [, savedStatus],
      ] = await AsyncStorage.multiGet([
        'dispatchedCountry',
        'dispatchedRegion',
        'dispatchedUniversity',
        'onboardingSituation',
      ]);

      const countrySelection = resolveCountrySelection(savedCountry);
      setSelectedCountry(countrySelection.selectedCountry);
      setCustomCountry(countrySelection.customCountry);
      setRegion(savedRegion ?? '');
      setUniversity(savedUniversity ?? '');

      if (isExchangeStatus(savedStatus)) {
        setStatus(savedStatus);
      }
    };

    loadCountryStep();
  }, []);

  const handleSelectCountry = async (countryName: string) => {
    setSelectedCountry(countryName);
    setCountryModalVisible(false);

    if (countryName === CUSTOM_COUNTRY_OPTION) {
      setCustomCountry('');
      await AsyncStorage.setItem('dispatchedCountry', '');
      return;
    }

    setCustomCountry('');
    await AsyncStorage.setItem('dispatchedCountry', countryName);
  };

  const handleChangeCustomCountry = (value: string) => {
    setCustomCountry(value);
    AsyncStorage.setItem('dispatchedCountry', value.trim()).catch(() => {});
  };

  const handleChangeRegion = (value: string) => {
    setRegion(value);
    AsyncStorage.setItem('dispatchedRegion', value.trim()).catch(() => {});
  };

  const handleChangeUniversity = (value: string) => {
    setUniversity(value);
    AsyncStorage.setItem('dispatchedUniversity', value.trim()).catch(() => {});
  };

  const handleComplete = async () => {
    if (!isValid) {
      return;
    }

    Keyboard.dismiss();

    await AsyncStorage.multiSet([
      ['dispatchedCountry', finalCountry],
      ['dispatchedRegion', region.trim()],
      ['dispatchedUniversity', university.trim()],
    ]);

    const savedNickname =
      nickname?.trim() ||
      (await AsyncStorage.getItem(ONBOARDING_NICKNAME_KEY)) ||
      '';

    router.push({
      pathname: '/onboarding/complete',
      params: { nickname: savedNickname },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppBackButton style={styles.backButton} />

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>

        <Text style={styles.title}>
          {copy.title.split('{break}')[0]}
          {'\n'}
          {copy.title.split('{break}')[1]}
        </Text>

        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <Text style={styles.label}>파견 국가</Text>

        <Pressable
          style={styles.selectBox}
          onPress={() => setCountryModalVisible(true)}
        >
          <Text
            style={[styles.selectText, selectedCountry && styles.selectTextActive]}
          >
            {selectedCountry || '파견 국가 선택'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#777777" />
        </Pressable>

        {isCustomCountry && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>파견 국가 직접 입력</Text>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="예: 캐나다, 호주, 일본"
                placeholderTextColor="#9A9A9A"
                value={customCountry}
                onChangeText={handleChangeCustomCountry}
                returnKeyType="next"
              />

              {customCountry.length > 0 && (
                <Pressable onPress={() => handleChangeCustomCountry('')}>
                  <Image
                    source={require('../../assets/images/x.png')}
                    style={styles.clearIcon}
                  />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>파견 지역</Text>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="예: 베를린, 파리"
              placeholderTextColor="#9A9A9A"
              value={region}
              onChangeText={handleChangeRegion}
              returnKeyType="next"
            />

            {region.length > 0 && (
              <Pressable onPress={() => handleChangeRegion('')}>
                <Image
                  source={require('../../assets/images/x.png')}
                  style={styles.clearIcon}
                />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>파견 대학</Text>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="파견 대학 입력"
              placeholderTextColor="#9A9A9A"
              value={university}
              onChangeText={handleChangeUniversity}
              returnKeyType="done"
              onSubmitEditing={handleComplete}
            />

            {university.length > 0 && (
              <Pressable onPress={() => handleChangeUniversity('')}>
                <Image
                  source={require('../../assets/images/x.png')}
                  style={styles.clearIcon}
                />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />

        <Pressable
          style={[styles.nextButton, isValid && styles.nextButtonActive]}
          disabled={!isValid}
          onPress={handleComplete}
        >
          <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
            완료
          </Text>
        </Pressable>
      </ScrollView>

      <OnboardingSelectModal
        visible={countryModalVisible}
        title="파견 국가 선택"
        options={countryOptions}
        selectedValue={selectedCountry}
        onClose={() => setCountryModalVisible(false)}
        onSelect={handleSelectCountry}
      />
    </KeyboardAvoidingView>
  );
}

const BLUE = designColors.ink;

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
    color: '#111111',
    marginBottom: 12,
  },

  selectBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginBottom: 28,
  },

  selectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
  },

  selectTextActive: {
    color: '#111111',
    fontWeight: '800',
  },

  inputGroup: {
    marginBottom: 28,
  },

  inputBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    paddingVertical: 0,
  },

  clearIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginLeft: 8,
  },

  bottomSpacer: {
    flex: 1,
    minHeight: 92,
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
