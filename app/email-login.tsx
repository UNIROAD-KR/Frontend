import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
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

        {/* Logo */}
        <Image
          source={require('../assets/images/school_icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>아이디로 로그인</Text>
        <Text style={styles.subtitle}>유니로드에 오신 것을 환영합니다.</Text>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>아이디</Text>
          <TextInput
            style={styles.input}
            placeholder="아이디를 입력하세요"
            placeholderTextColor="#BBBBBB"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>비밀번호</Text>
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#BBBBBB"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        {/* Login Button */}
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
            loading && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FC',
    marginBottom: 32,
    marginLeft: -6,
  },
  logo: {
    width: 38,
    height: 38,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 40,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#0B48B8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  loginButtonPressed: {
    backgroundColor: '#333333',
  },
  loginButtonDisabled: {
    backgroundColor: '#888888',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  findRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  findText: {
    fontSize: 14,
    color: '#888888',
  },
  findDivider: {
    width: 1,
    height: 13,
    backgroundColor: '#DDDDDD',
  },
});
