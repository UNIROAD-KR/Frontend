import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login } from '../src/api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await login({
        username: email,
        password,
      });

      console.log('로그인 성공:', response.data);

      const accessToken = response.data.data.accessToken;
      const refreshToken = response.data.data.refreshToken;

      // 토큰 저장
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      // 로그인은 무조건 홈으로
      router.replace('/home');
    } catch (error: any) {
      console.log('로그인 실패:', error.response?.data || error.message);

      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Image
        source={require('../assets/images/school_icon.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>
        UNIROAD 에 오신 것을{'\n'}
        환영합니다.
      </Text>

      {/* 이메일 */}
      <TextInput
        style={styles.input}
        placeholder="아이디 입력"
        placeholderTextColor="#8A8A8A"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {/* 비밀번호 */}
      <TextInput
        style={styles.input}
        placeholder="비밀번호 입력"
        placeholderTextColor="#8A8A8A"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* 로그인 버튼 */}
      <Pressable style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </Pressable>

      {/* 하단 메뉴 */}
      <View style={styles.findRow}>
        <Text style={styles.findText}>아이디 찾기</Text>

        <Text style={styles.bar}>|</Text>

        <Text style={styles.findText}>비밀번호 찾기</Text>
      </View>

      {/* SNS 로그인 */}
      <View style={styles.snsTitleRow}>
        <View style={styles.line} />
        <Text style={styles.snsTitle}>SNS 계정으로 로그인 / 회원가입</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.snsRow}>
        <Pressable onPress={() => router.push('/sns-signup')}>
          <Image
            source={require('../assets/images/kakao.png')}
            style={styles.snsImage}
          />
        </Pressable>

        <Pressable onPress={() => router.push('/sns-signup')}>
          <Image
            source={require('../assets/images/google.png')}
            style={styles.snsImage}
          />
        </Pressable>

        <Pressable
          style={[styles.snsCircle, styles.naver]}
          onPress={() => router.push('/sns-signup')}
        >
          <Text style={styles.naverText}>N</Text>
        </Pressable>

        <Pressable
          style={[styles.snsCircle, styles.apple]}
          onPress={() => router.push('/sns-signup')}
        >
          <Text style={styles.appleText}></Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 30,
    paddingTop: 170,
    paddingBottom: 80,
  },

  logo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    lineHeight: 49,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -2,
    marginBottom: 55,
  },

  input: {
    width: '100%',
    height: 59,
    borderWidth: 1,
    borderColor: '#C9C9C9',
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 20,
    color: '#111111',
    marginBottom: 14,
  },

  loginButton: {
    width: '100%',
    height: 59,
    backgroundColor: BLUE,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },

  findRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 31,
  },

  findText: {
    fontSize: 18,
    color: '#222222',
  },

  bar: {
    fontSize: 18,
    color: '#D0D0D0',
    marginHorizontal: 19,
  },

  snsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 105,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D9D9',
  },

  snsTitle: {
    fontSize: 18,
    color: '#777777',
    marginHorizontal: 15,
  },

  snsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 31,
    marginTop: 35,
  },

  snsCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  naver: {
    backgroundColor: '#03C75A',
  },

  apple: {
    backgroundColor: '#000000',
  },

  naverText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  appleText: {
    fontSize: 35,
    color: '#FFFFFF',
    marginBottom: 4,
  },

  snsImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
});
