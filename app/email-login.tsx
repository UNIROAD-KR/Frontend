import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { login } from '../src/api/auth';
import { registerDeviceForPushNotifications } from '../src/notifications/push';

export default function EmailLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const canSubmit = Boolean(username.trim() && password.trim()) && !loading;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setLoginError('');
    try {
      const response = await login({ username: username.trim(), password });
      console.log('로그인 성공:', response.data);

      const accessToken = response.data.data.accessToken;
      const refreshToken = response.data.data.refreshToken;

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      registerDeviceForPushNotifications({ force: true }).catch((error) => {
        console.log('FCM 토큰 등록 실패:', error.response?.data || error.message);
      });

      router.replace('/home');
    } catch (error: any) {
      console.log('로그인 실패:', error.response?.data || error.message);
      if (error.code === 'ECONNABORTED') {
        Alert.alert(
          '서버 연결 실패',
          '로그인 서버가 응답하지 않아요. 백엔드 서버 상태를 확인해주세요.',
        );
        return;
      }

      setLoginError('입력하신 아이디 또는 비밀번호를 확인해주세요.');
      Alert.alert('로그인 실패', '아이디 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };
  const showAccountGuide = () => {
  Alert.alert(
    '안내',
    '소셜 로그인으로 로그인 이후.\n\n홈화면 > 프로필 설정에서 가입 정보를 확인하거나 수정할 수 있습니다.'
  );
};
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppBackButton fallbackHref="/login" style={styles.backButton} />

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>아이디로 로그인</Text>
          <Text style={styles.subtitle}>UNIROAD에 오신 것을 환영합니다!</Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>아이디</Text>
          <TextInput
            style={styles.input}
            placeholder="아이디를 입력하세요"
            placeholderTextColor="#BBBBBB"
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setLoginError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>비밀번호</Text>
          <TextInput
            ref={passwordRef}
            style={[styles.input, loginError ? styles.inputError : null]}
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#BBBBBB"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setLoginError('');
            }}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          {loginError ? (
            <View style={styles.inlineError}>
              <Text style={styles.errorMark}>!</Text>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}
        </View>

        {/* Login Button */}
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
            !canSubmit && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={!canSubmit}
        >
          <Text style={styles.loginButtonText}>
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </Pressable>

        {/* Find Account Row */}
       <View style={styles.findRow}>
        <TouchableOpacity onPress={showAccountGuide}>
        <Text style={styles.findText}>
        아이디/비밀번호가 기억나지 않아요
         </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 60,
  },
  backButton: {
    marginBottom: 82,
    marginLeft: -7,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#151B24',
    lineHeight: 32,
    letterSpacing: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A94A1',
  },
  inputGroup: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#66717F',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E4E8EC',
    borderRadius: 7,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#1B222C',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E5484D',
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  errorMark: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#E5484D',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5484D',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#19212C',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  loginButtonPressed: {
    backgroundColor: '#111720',
  },
  loginButtonDisabled: {
    backgroundColor: '#B7C0CB',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  findRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  findText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9AA4B0',
  },
  findDivider: {
    width: 1,
    height: 13,
    backgroundColor: '#DDDDDD',
  },
});
