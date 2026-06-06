import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackButton } from '@/components/back-button';

export default function NicknamePage() {
  const [nickname, setNickname] = useState('');

  const isValid = nickname.length >= 2 && nickname.length <= 12;

  return (
    <View style={styles.container}>
      <BackButton style={styles.backButton} />

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progress} />
        <View style={styles.progress} />
        <View style={styles.progress} />
        <View style={styles.progress} />
      </View>

      <Text style={styles.title}>닉네임을{'\n'}입력해주세요.</Text>

      <Text style={styles.subtitle}>앱에서 사용할 닉네임을 설정해주세요.</Text>

      <Text style={styles.label}>닉네임</Text>

      <View style={styles.nicknameInputWrapper}>
        <TextInput
          style={styles.nicknameInput}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임 입력"
          placeholderTextColor="#8F8F8F"
        />

        {nickname.length > 0 && (
          <Pressable style={styles.clearButton} onPress={() => setNickname('')}>
            <Image
              source={require('../../assets/images/x.png')}
              style={styles.clearIcon}
            />
          </Pressable>
        )}
      </View>

      <Text style={styles.helpText}>
        공백없이 2자 이상 12자 이하로 입력해주세요.
      </Text>

      <Pressable
        style={[styles.nextButton, isValid && styles.nextButtonActive]}
        disabled={!isValid}
        onPress={() =>
          router.push({
            pathname: '/onboarding/profile',
            params: { nickname },
          })
        }
      >
        <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
          다음
        </Text>
      </Pressable>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  nicknameInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#CFCFCF',
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#000',
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

  input: {
    height: 42,
    borderBottomWidth: 1.5,
    borderBottomColor: '#CFCFCF',
    fontSize: 15,
    color: '#111',
  },

  helpText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 10,
  },

  nextButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
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
