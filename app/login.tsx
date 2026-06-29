import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { socialLogin } from '../src/api/auth';
import { registerDeviceForPushNotifications } from '../src/notifications/push';
import { clearOnboardingDraft } from '../src/storage/onboardingDraft';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CAROUSEL_ITEMS = [
  {
    id: '1',
    category: '중고거래',
    title: '인증된 학생들과\n안전하게 거래하세요',
    description: '교환학생이 직접 인증한 회원들과 티켓, 생활용품, 교재를 거래할 수 있어요.',
    image: require('../assets/images/illust_trade.png'),
  },
  {
    id: '2',
    category: '동행',
    title: '같이 가는 친구를\n쉽게 찾을 수 있어요',
    description: '여행, 공연, 맛집 탐방까지 같은 학교 학생들과 동행을 구해보세요.',
    image: require('../assets/images/illust_companion.png'),
  },
  {
    id: '3',
    category: '커뮤니티',
    title: '선배들의 경험을\n한눈에 확인하세요',
    description: '기숙사, 수강신청, 생활 정보 등 실제 파견 학생들의 이야기를 만나보세요.',
    image: require('../assets/images/illust_community.png'),
  },
  {
    id: '4',
    category: '정보탐색',
    title: '교환학생 정보를\n빠르게 찾아보세요',
    description: '학교별 후기와 국가별 정보를 한 곳에서 확인할 수 있어요.',
    image: require('../assets/images/illust_info.png'),
  },
];

type SheetType = 'login' | 'signup' | null;
type SocialIntent = 'login' | 'signup';

export default function LoginPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '803840308244-t22hp62jj87ltmq7lkqh0ru27quktc6f.apps.googleusercontent.com',
      iosClientId: '803840308244-onouauek1qv66kqirf9hjmqlb96dck2n.apps.googleusercontent.com',
    });

    NaverLogin.initialize({
      appName: '유니로드',
      consumerKey: '3jo54WreHzQliJbUhzPo',
      consumerSecret: '_N6TMAqNu0',
      serviceUrlSchemeIOS: 'naverlogin',
    });

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % CAROUSEL_ITEMS.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const openSheet = (type: SheetType) => {
    setActiveSheet(type);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveSheet(null);
      callback?.();
    });
  };
  useEffect(() => {
  const backAction = () => {
    // 로그인/회원가입 시트가 열려있으면 닫기
    if (activeSheet !== null) {
      closeSheet();
      return true;
    }

    // 메인 화면이면 종료 확인
    Alert.alert(
      '앱 종료',
      '앱을 종료하시겠습니까?',
      [
        {
          text: '아니요',
          style: 'cancel',
        },
        {
          text: '예',
          onPress: () => BackHandler.exitApp(),
        },
      ]
    );

    return true;
  };

  const subscription = BackHandler.addEventListener(
    'hardwareBackPress',
    backAction
  );

  return () => subscription.remove();
}, [activeSheet]);
  const handleIdLogin = () => {
    closeSheet(() => router.push('/email-login'));
  };

  const handleSocialLogin = async (provider: string, intent: SocialIntent) => {
    try {
      let sdkAccessToken = '';

      if (provider === 'kakao') {
        const token = await kakaoLogin();
        if (!token.accessToken) throw new Error('카카오 토큰 없음');
        sdkAccessToken = token.accessToken;
      } else if (provider === 'naver') {
        const response = await NaverLogin.login();
        if (!response.isSuccess || !response.successResponse) {
          throw new Error(response.failureResponse?.message || '네이버 로그인 실패');
        }
        sdkAccessToken = response.successResponse.accessToken;
      } else if (provider === 'google') {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const idToken = userInfo.data?.idToken;
        if (!idToken) throw new Error('구글 토큰 없음');
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
        if (!credential.identityToken) throw new Error('애플 identityToken 없음');
        sdkAccessToken = credential.identityToken;
      } else {
        Alert.alert('준비 중', `${provider} 로그인은 아직 구현되지 않았습니다.`);
        return;
      }

      const response = await socialLogin(provider, sdkAccessToken);
      const { accessToken, refreshToken, status } = response.data.data;

      if (intent === 'signup' && status === 'ACTIVE') {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        Alert.alert(
          '이미 가입된 계정',
          '이 SNS 계정은 이미 가입되어 있어요. 로그인 버튼에서 다시 이용해주세요.',
        );
        return;
      }

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      registerDeviceForPushNotifications({ force: true }).catch((error) => {
        console.log('FCM 토큰 등록 실패:', error.response?.data || error.message);
      });

      if (status === 'NEED_SIGNUP') {
        await clearOnboardingDraft();
        router.replace('/sns-signup');
      } else if (status === 'NEED_ONBOARDING') {
        await clearOnboardingDraft();
        router.replace('/onboarding/nickname');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      console.log(`${provider} 로그인 실패:`, error.response?.data || error.message);
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(
        intent === 'signup' ? '소셜 회원가입 실패' : '소셜 로그인 실패',
        '처리 중 문제가 발생했습니다.',
      );
    }
  };

  const renderCarouselItem = ({ item }: { item: typeof CAROUSEL_ITEMS[0] }) => (
    <View style={styles.carouselItem}>
      <View style={styles.illustrationContainer}>
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.carouselCategory}>{item.category}</Text>
      <Text style={styles.carouselTitle}>{item.title}</Text>
      <Text style={styles.carouselDescription}>{item.description}</Text>
    </View>
  );

  // Social buttons used in both sheets
  const SocialButtons = ({ intent }: { intent: SocialIntent }) => (
    <View style={styles.socialRow}>
      <TouchableOpacity
        style={[styles.socialCircle, styles.naverBg]}
        onPress={() => handleSocialLogin('naver', intent)}
      >
        <Text style={styles.naverText}>N</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleSocialLogin('google', intent)}>
        <Image source={require('../assets/images/google.png')} style={styles.socialImage} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleSocialLogin('kakao', intent)}>
        <Image source={require('../assets/images/kakao.png')} style={styles.socialImage} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleSocialLogin('apple', intent)}>
    <Image source={require('../assets/images/apple.png')} style={styles.appleImage}/>
    </TouchableOpacity>

    </View>
  );

  return (
    <View style={styles.container}>
      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={CAROUSEL_ITEMS}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        style={styles.carousel}
      />

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {CAROUSEL_ITEMS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.loginButton} onPress={() => openSheet('login')}>
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={() => openSheet('signup')}>
          <Text style={styles.signupButtonText}>회원가입</Text>
        </TouchableOpacity>
      </View>

      {/* Find account */}
      <TouchableOpacity style={styles.findAccountRow}>
        <Text style={styles.findAccountText}>  </Text>
        <Text style={styles.findAccountLink}> </Text>
      </TouchableOpacity>

      {/* Overlay + Bottom Sheet */}
      {activeSheet !== null && (
        <>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => closeSheet()} />
          </Animated.View>

          <Animated.View
            style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.sheetHandle} />

            {/* LOGIN SHEET */}
            {activeSheet === 'login' && (
              <>
                <Text style={styles.sheetTitle}>로그인 방법 선택</Text>
                <SocialButtons intent="login" />
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>또는</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity style={styles.idButton} onPress={handleIdLogin}>
                  <Text style={styles.idButtonIcon}>👤</Text>
                  <Text style={styles.idButtonText}>아이디로 로그인</Text>
                </TouchableOpacity>
              </>
            )}

            {/* SIGNUP SHEET */}
            {activeSheet === 'signup' && (
              <>
                <Text style={styles.sheetTitle}>SNS 계정으로 회원가입</Text>
                <Text style={styles.sheetSubtitle}>
                  소셜 계정으로 간편하게 시작하세요
                </Text>
                <SocialButtons intent="signup" />
              </>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  carousel: {
    flex: 1,
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 20,
  },
  illustrationContainer: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  carouselCategory: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  carouselTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  carouselDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#0B48B8',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D9D9D9',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    height: 48,
  },
  loginButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  signupButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#0B48B8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  findAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  findAccountText: {
    fontSize: 14,
    color: '#888888',
  },
  findAccountLink: {
    fontSize: 14,
    color: '#888888',
    textDecorationLine: 'underline',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 12,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  socialCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialImage: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  appleImage:{
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginLeft: -8,
  },
  naverBg: {
    backgroundColor: '#03C75A',
  },
  appleBg: {
    backgroundColor: '#000000',
  },
  naverText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appleText: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  idButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    gap: 10,
  },
  idButtonIcon: {
    fontSize: 17,
  },
  idButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222222',
  },
});
