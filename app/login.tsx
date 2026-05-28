import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import NaverLogin from '@react-native-seoul/naver-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { login, socialLogin } from '../src/api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '803840308244-t22hp62jj87ltmq7lkqh0ru27quktc6f.apps.googleusercontent.com',
      iosClientId: '803840308244-onouauek1qv66kqirf9hjmqlb96dck2n.apps.googleusercontent.com',
    });

    NaverLogin.initialize({
      appName: '유니로드',
      consumerKey: '3jo54WreHzQliJbUhzPo',
      consumerSecret: '_N6TMAqNu0',
      serviceUrlSchemeIOS: 'univ',
    });
  }, []);

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

  const handleSocialLogin = async (provider: string) => {
    try {
      let sdkAccessToken = '';
      console.log('provider:', provider);

      if (provider === 'kakao') {
        Alert.alert('알림', '카카오 로그인은 현재 비활성화되어 있습니다.');
        return;
        // console.log('KakaoLogins:', KakaoLogins);
        // try {
        //   await KakaoLogins.unlink();
        // } catch { }

        // const token = await KakaoLogins.login();
        // console.log(token);

        // sdkAccessToken = token.accessToken;
      } else if (provider === 'naver') {
        Alert.alert('알림', '네이버 로그인은 현재 비활성화되어 있습니다.');
        return;
        // const response = await NaverLogin.login();

        // console.log('네이버 로그인:', response);

        // if (!response.isSuccess || !response.successResponse) {
        //   throw new Error(
        //     response.failureResponse?.message || '네이버 로그인 실패'
        //   );
        // }
        // sdkAccessToken = response.successResponse.accessToken;
      } else if (provider === 'google') {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        console.log('구글 로그인:', userInfo);
        const idToken = userInfo.data?.idToken;
        if (!idToken) {
          throw new Error('구글 토큰 없음');
        }
        sdkAccessToken = idToken;
      } else if (provider === 'apple') {
        if (Platform.OS !== 'ios') {
          Alert.alert('지원 불가', 'Apple 로그인은 iOS에서만 사용할 수 있습니다.');
          return;
        }

        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('지원 불가', '이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
          return;
        }

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        console.log('애플 로그인:', credential);

        if (!credential.identityToken) {
          throw new Error('애플 identityToken 없음');
        }

        sdkAccessToken = credential.identityToken;
      }
      else {
        Alert.alert('준비 중', `${provider} 로그인은 아직 구현되지 않았습니다.`);
        return;
      }


      // 2. 백엔드 API로 토큰 전송
      const response = await socialLogin(provider, sdkAccessToken);
      console.log(`${provider} 로그인 성공:`, response.data);

      const { accessToken, refreshToken, status } = response.data.data;

      // 3. 발급받은 서비스 토큰 저장
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      // 4. 상태(status)에 따라 라우팅
      if (status === 'NEED_SIGNUP') {
        router.replace('/sns-signup');
      } else if (status === 'NEED_ONBOARDING') {
        router.replace('/onboarding/nickname');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      console.log(`${provider} 로그인 실패:`, error.response?.data || error.message);
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      Alert.alert('소셜 로그인 실패', '로그인 처리 중 문제가 발생했습니다.');
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
        {/* <Pressable onPress={() => handleSocialLogin('kakao')}>
          <Image
            source={require('../assets/images/kakao.png')}
            style={styles.snsImage}
          />
        </Pressable> */}

        {/* <Pressable onPress={() => handleSocialLogin('google')}>
          <Image
            source={require('../assets/images/google.png')}
            style={styles.snsImage}
          />
        </Pressable> */}

        {/* <Pressable
          style={[styles.snsCircle, styles.naver]}
          onPress={() => handleSocialLogin('naver')}
        >
          <Text style={styles.naverText}>N</Text>
        </Pressable> */}

        <Pressable
          style={[styles.snsCircle, styles.apple]}
          onPress={() => handleSocialLogin('apple')}
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
    paddingTop: 150,
    paddingBottom: 64,
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
    marginBottom: 52,
  },

  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#C9C9C9',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111111',
    marginBottom: 10,
  },

  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: BLUE,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  findRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 34,
  },

  findText: {
    fontSize: 15,
    color: '#222222',
  },

  bar: {
    fontSize: 15,
    color: '#D0D0D0',
    marginHorizontal: 18,
  },

  snsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 108,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D9D9',
  },

  snsTitle: {
    fontSize: 16,
    color: '#777777',
    marginHorizontal: 12,
  },

  snsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 31,
    marginTop: 28,
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
