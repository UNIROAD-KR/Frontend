import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
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

type LoginError = {
  field: 'username' | 'password';
  message: string;
};

const getUsernameError = (value: string) => {
  const cleanedValue = value.trim();

  if (!cleanedValue) return '';

  if (cleanedValue.length < 4 || cleanedValue.length > 12) {
    return '아이디는 4~12자로 입력해주세요.';
  }

  if (!/^[a-z0-9]+$/.test(cleanedValue)) {
    return '아이디는 영문 소문자와 숫자만 사용할 수 있습니다.';
  }

  return '';
};

const getPasswordError = (value: string) => {
  if (!value) return '';

  if (value.length < 8 || value.length > 20) {
    return '비밀번호는 8~20자로 입력해주세요.';
  }

  if (!/^[A-Za-z0-9@$!%*#?&^_-]+$/.test(value)) {
    return '비밀번호에 사용할 수 없는 문자가 포함되어 있습니다.';
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.';
  }

  return '';
};

export default function EmailLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const usernameFormatError = getUsernameError(username);
  const passwordFormatError = getPasswordError(password);
  const usernameErrorMessage =
    usernameFormatError ||
    (loginError?.field === 'username' ? loginError.message : '');
  const passwordErrorMessage =
    passwordFormatError ||
    (loginError?.field === 'password' ? loginError.message : '');
  const canSubmit =
    Boolean(username.trim() && password.trim()) &&
    !usernameFormatError &&
    !passwordFormatError &&
    !loading;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (usernameFormatError || passwordFormatError) {
      setLoginError({
        field: usernameFormatError ? 'username' : 'password',
        message: usernameFormatError || passwordFormatError,
      });
      return;
    }

    setLoading(true);
    setLoginError(null);
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

      const serverMessage = String(error.response?.data?.message || '');
      const isUsernameError =
        error.response?.status === 404 ||
        /존재하지|not.?found|username|user.?id/i.test(serverMessage);

      setLoginError({
        field: isUsernameError ? 'username' : 'password',
        message: isUsernameError
          ? '존재하지 않는 아이디입니다.'
          : '일치하지 않는 비밀번호입니다.',
      });
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
        contentContainerStyle={[
          styles.content,
          isKeyboardVisible && styles.contentKeyboardOpen,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <AppBackButton fallbackHref="/login" style={styles.backButton} />
          <Text style={styles.headerTitle}>아이디로 로그인</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>아이디로 로그인</Text>
            <Text style={styles.subtitle}>UNIROAD에 오신 것을 환영합니다!</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>아이디</Text>
            <TextInput
              style={[
                styles.input,
                Boolean(usernameErrorMessage) && styles.inputError,
              ]}
              placeholder="아이디를 입력하세요"
              placeholderTextColor="#B9C2CF"
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                setLoginError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            {usernameErrorMessage ? (
              <View style={styles.inlineError}>
                <Text style={styles.errorMark}>!</Text>
                <Text style={styles.errorText}>{usernameErrorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.passwordLabel}>비밀번호</Text>
            <TextInput
              ref={passwordRef}
              style={[
                styles.input,
                Boolean(passwordErrorMessage) && styles.inputError,
              ]}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor="#B9C2CF"
              secureTextEntry
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setLoginError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {passwordErrorMessage ? (
              <View style={styles.inlineError}>
                <Text style={styles.errorMark}>!</Text>
                <Text style={styles.errorText}>{passwordErrorMessage}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {!isKeyboardVisible ? (
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && canSubmit && styles.loginButtonPressed,
                !canSubmit && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!canSubmit}
            >
              <Text style={styles.loginButtonText}>
                {loading ? '로그인 중...' : '로그인'}
              </Text>
            </Pressable>

            <View style={styles.findRow}>
              <TouchableOpacity onPress={showAccountGuide}>
                <Text style={styles.findText}>
                  <Text style={styles.findTextUnderline}>아이디</Text>
                  <Text> 또는 </Text>
                  <Text style={styles.findTextUnderline}>비밀번호</Text>
                  <Text>가 기억나지 않아요</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 44,
  },
  contentKeyboardOpen: {
    paddingBottom: 0,
  },
  header: {
    height: 64,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#252C37',
    textAlign: 'center',
  },
  formSection: {
    flexShrink: 0,
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: 67,
    marginBottom: 51,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#070A0D',
    lineHeight: 32,
    letterSpacing: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: '#6B7684',
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: '#4E5968',
    marginBottom: 8,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: '#4E5968',
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#252C37',
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
  footer: {
    marginTop: 'auto',
  },
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#171E28',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonPressed: {
    backgroundColor: '#111720',
  },
  loginButtonDisabled: {
    backgroundColor: '#B3BDC9',
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
    marginTop: 14,
  },
  findText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    color: '#8A96A5',
  },
  findTextUnderline: {
    textDecorationLine: 'underline',
  },
  findDivider: {
    width: 1,
    height: 13,
    backgroundColor: '#DDDDDD',
  },
});
