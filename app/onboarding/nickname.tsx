import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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
import { useResetScrollOnFocus } from '@/hooks/use-reset-scroll-on-focus';
import { getNicknameError, ONBOARDING_NICKNAME_KEY } from '@/src/constants/onboarding';
import { designColors } from '@/src/styles/design-tokens';

export default function NicknamePage() {
  const scrollRef = useResetScrollOnFocus();
  const [nickname, setNickname] = useState('');
  const nicknameError = useMemo(() => getNicknameError(nickname), [nickname]);
  const isValid = nickname.length > 0 && !nicknameError;

  useEffect(() => {
    const loadNickname = async () => {
      const savedNickname = await AsyncStorage.getItem(ONBOARDING_NICKNAME_KEY);

      if (savedNickname) {
        setNickname(savedNickname);
      }
    };

    loadNickname();
  }, []);

  const handleChangeNickname = (value: string) => {
    setNickname(value);
    AsyncStorage.setItem(ONBOARDING_NICKNAME_KEY, value).catch(() => {});
  };

  const handleNext = async () => {
    if (!isValid) {
      return;
    }

    Keyboard.dismiss();

    const nextNickname = nickname.trim();
    await AsyncStorage.setItem(ONBOARDING_NICKNAME_KEY, nextNickname);

    router.push({
      pathname: '/onboarding/profile',
      params: { nickname: nextNickname },
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppBackButton
          onPress={() => router.replace('/login')}
          style={styles.backButton}
        />

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progress} />
          <View style={styles.progress} />
          <View style={styles.progress} />
        </View>

        <Text style={styles.title}>닉네임을{'\n'}입력해주세요.</Text>

        <Text style={styles.subtitle}>앱에서 사용할 닉네임을 설정해주세요.</Text>

        <Text style={styles.label}>닉네임</Text>

        <View
          style={[
            styles.nicknameInputWrapper,
            nicknameError && styles.nicknameInputWrapperError,
          ]}
        >
          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={handleChangeNickname}
            placeholder="닉네임 입력"
            placeholderTextColor="#8F8F8F"
            returnKeyType="done"
            onSubmitEditing={handleNext}
          />

          {nickname.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => handleChangeNickname('')}
            >
              <Image
                source={require('../../assets/images/x.png')}
                style={styles.clearIcon}
              />
            </Pressable>
          )}
        </View>

        <Text style={[styles.helpText, nicknameError && styles.errorText]}>
          {nicknameError || '공백없이 2자 이상 12자 이하로 입력해주세요.'}
        </Text>

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
      </ScrollView>
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
    marginBottom: 58,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },

  nicknameInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#CFCFCF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  nicknameInputWrapperError: {
    borderBottomColor: '#E5484D',
  },

  nicknameInput: {
    flex: 1,
    height: 54,
    fontSize: 17,
    color: '#111111',
    paddingVertical: 0,
  },

  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  clearIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  helpText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 10,
  },

  errorText: {
    color: '#E5484D',
    fontWeight: '700',
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
