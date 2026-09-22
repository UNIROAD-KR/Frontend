import { Text } from '@/components/ui/app-text';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login as kakaoLogin } from "@react-native-seoul/kakao-login";
import NaverLogin from "@react-native-seoul/naver-login";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, BackHandler, Dimensions, FlatList, Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import {
  CAROUSEL_ITEMS,
  SHOW_TEMP_ONBOARDING_SIGNUP,
  SOCIAL_LOGIN_ICONS,
  SocialProvider,
} from "@/components/constants";
import { commonStyles, fonts } from "@/constants/theme";
import { socialLogin } from "../src/api/auth";
import { registerDeviceForPushNotifications } from "../src/notifications/push";
import { clearOnboardingDraft } from "../src/storage/onboardingDraft";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ILLUSTRATION_SIZE = Math.min(SCREEN_WIDTH - 40, 240);

type SheetType = "login" | "signup" | null;
type SocialIntent = "login" | "signup";

const SocialButtons = memo(function SocialButtons({
  intent,
  onSocialLogin,
}: {
  intent: SocialIntent;
  onSocialLogin: (provider: SocialProvider, intent: SocialIntent) => void;
}) {
  const socialButtons: { provider: SocialProvider; light?: boolean }[] = [
    { provider: "kakao" },
    { provider: "naver" },
    { provider: "google", light: true },
    { provider: "apple", light: true },
  ];

  return (
    <View style={styles.socialRow}>
      {socialButtons.map(({ provider, light }) => (
        <TouchableOpacity
          key={provider}
          style={[styles.socialButton, light && styles.lightSocialButton]}
          onPress={() => onSocialLogin(provider, intent)}
        >
          <Image
            source={SOCIAL_LOGIN_ICONS[provider]}
            style={[
              styles.socialIcon,
              provider === "apple" && styles.appleSocialIcon,
            ]}
            fadeDuration={0}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
});

export default function LoginPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "803840308244-t22hp62jj87ltmq7lkqh0ru27quktc6f.apps.googleusercontent.com",
      iosClientId:
        "803840308244-onouauek1qv66kqirf9hjmqlb96dck2n.apps.googleusercontent.com",
    });

    NaverLogin.initialize({
      appName: "유니로드",
      consumerKey: "3jo54WreHzQliJbUhzPo",
      consumerSecret: "_N6TMAqNu0",
      serviceUrlSchemeIOS: "naverlogin",
    });
  }, []);

  useEffect(() => {
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
      Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
        {
          text: "아니요",
          style: "cancel",
        },
        {
          text: "예",
          onPress: () => BackHandler.exitApp(),
        },
      ]);

      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => subscription.remove();
  }, [activeSheet]);
  const handleIdLogin = () => {
    closeSheet(() => router.push("/email-login"));
  };

  const handleTemporarySignup = async () => {
    await AsyncStorage.multiSet([
      ["accessToken", "mock-access-token"],
      ["refreshToken", "mock-refresh-token"],
    ]);
    await clearOnboardingDraft();
    closeSheet(() => router.push("/signup-success"));
  };

  const openUiPreview = async () => {
    await AsyncStorage.multiSet([
      ["nickname", "김하니"],
      ["university", "한국대학교"],
      ["homeUniversity", "한국대학교"],
      ["dispatchedCountry", "독일"],
      ["dispatchedRegion", "베를린"],
      ["dispatchedUniversity", "베를린 자유대학교"],
      ["profileStatus", "출국 준비 중"],
      ["dispatchSemester", "2026년 2학기"],
      ["isVerified", "true"],
    ]);

    router.replace({
      pathname: "/home/profile-card",
      params: { preview: "true" },
    } as any);
  };

  const handleSocialLogin = useCallback(
    async (provider: SocialProvider, intent: SocialIntent) => {
      try {
        let sdkAccessToken = "";

        if (provider === "kakao") {
          const token = await kakaoLogin();
          if (!token.accessToken) throw new Error("카카오 토큰 없음");
          sdkAccessToken = token.accessToken;
        } else if (provider === "naver") {
          const response = await NaverLogin.login();
          if (!response.isSuccess || !response.successResponse) {
            throw new Error(
              response.failureResponse?.message || "네이버 로그인 실패",
            );
          }
          sdkAccessToken = response.successResponse.accessToken;
        } else if (provider === "google") {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          const idToken = userInfo.data?.idToken;
          if (!idToken) throw new Error("구글 토큰 없음");
          sdkAccessToken = idToken;
        } else if (provider === "apple") {
          if (Platform.OS !== "ios") {
            Alert.alert(
              "지원 불가",
              "Apple 로그인은 iOS에서만 사용할 수 있습니다.",
            );
            return;
          }
          const isAvailable = await AppleAuthentication.isAvailableAsync();
          if (!isAvailable) {
            Alert.alert(
              "지원 불가",
              "이 기기에서는 Apple 로그인을 사용할 수 없습니다.",
            );
            return;
          }
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (!credential.identityToken)
            throw new Error("애플 identityToken 없음");
          sdkAccessToken = credential.identityToken;
        } else {
          Alert.alert(
            "준비 중",
            `${provider} 로그인은 아직 구현되지 않았습니다.`,
          );
          return;
        }

        const response = await socialLogin(provider, sdkAccessToken);
        const { accessToken, refreshToken, status } = response.data.data;

        if (intent === "signup" && status === "ACTIVE") {
          await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
          Alert.alert(
            "이미 가입된 계정",
            "이 SNS 계정은 이미 가입되어 있어요. 로그인 버튼에서 다시 이용해주세요.",
          );
          return;
        }

        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        registerDeviceForPushNotifications({ force: true }).catch((error) => {
          console.log(
            "FCM 토큰 등록 실패:",
            error.response?.data || error.message,
          );
        });

        if (status === "NEED_SIGNUP") {
          await clearOnboardingDraft();
          router.replace("/sns-signup");
        } else if (status === "NEED_ONBOARDING") {
          await clearOnboardingDraft();
          router.replace("/onboarding/nickname");
        } else {
          router.replace("/home");
        }
      } catch (error: any) {
        console.log(
          `${provider} 로그인 실패:`,
          error.response?.data || error.message,
        );
        if (error.code === "ERR_REQUEST_CANCELED") return;
        if (error.code === "ECONNABORTED") {
          Alert.alert(
            "서버 연결 실패",
            "로그인 서버가 응답하지 않아요. 백엔드 서버 상태를 확인해주세요.",
          );
          return;
        }

        Alert.alert(
          intent === "signup" ? "소셜 회원가입 실패" : "소셜 로그인 실패",
          "처리 중 문제가 발생했습니다.",
        );
      }
    },
    [],
  );

  const renderCarouselItem = ({
    item,
  }: {
    item: (typeof CAROUSEL_ITEMS)[0];
  }) => (
    <View style={styles.carouselItem}>
      <View style={styles.categoryPill}>
        <Text style={[fonts.caption1_sb_13, { color: "#333D4B" }]}>
          {item.category}
        </Text>
      </View>
      <View style={styles.illustrationContainer}>
        {/* <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        /> */}
      </View>
      <View style={{ gap: 16 }}>
        <Text style={[fonts.title3_b_24, { textAlign: "center" }]}>
          {item.title}
        </Text>
        <Text
          style={[fonts.body4_r_14, { textAlign: "center", color: "#6B7684" }]}
        >
          {item.description}
        </Text>
      </View>
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
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setCurrentIndex(index);
        }}
        style={styles.carousel}
      />

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {CAROUSEL_ITEMS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => openSheet("login")}
        >
          <Text style={[fonts.sub3_sb_16, { color: "#252C37" }]}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => openSheet("signup")}
        >
          <Text style={[fonts.sub3_sb_16, { color: "#FFFFFF" }]}>회원가입</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay + Bottom Sheet */}
      {activeSheet !== null && (
        <>
          <Animated.View
            style={[commonStyles.dimmed, { opacity: overlayAnim }]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => closeSheet()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sheetHandle} />

            {/* LOGIN SHEET */}
            {activeSheet === "login" && (
              <>
                <Text
                  style={[
                    fonts.sub1_sb_18,
                    { color: "#070A0D", textAlign: "center", marginBottom: 20 },
                  ]}
                >
                  로그인 방식
                </Text>
                <SocialButtons
                  intent="login"
                  onSocialLogin={handleSocialLogin}
                />
                <TouchableOpacity
                  style={styles.idButton}
                  onPress={handleIdLogin}
                >
                  <Text style={[fonts.sub3_sb_16, { color: "#252C37" }]}>
                    아이디로 로그인
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* SIGNUP SHEET */}
            {activeSheet === "signup" && (
              <>
                <Text style={styles.sheetTitle}>SNS 계정으로 회원가입</Text>
                <Text style={styles.sheetSubtitle}>
                  소셜 계정으로 간편하게 시작하세요
                </Text>
                <SocialButtons
                  intent="signup"
                  onSocialLogin={handleSocialLogin}
                />
                {SHOW_TEMP_ONBOARDING_SIGNUP ? (
                  <TouchableOpacity
                    style={styles.temporarySignupButton}
                    onPress={handleTemporarySignup}
                  >
                    <Text style={styles.temporarySignupButtonText}>
                      온보딩 확인용 임시 회원가입
                    </Text>
                  </TouchableOpacity>
                ) : null}
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
    backgroundColor: "#FFFFFF",
  },
  carousel: {
    flex: 1,
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 30,
    paddingTop: 173,
    paddingBottom: 24,
  },
  categoryPill: {
    borderRadius: 8,
    backgroundColor: "#F0F2F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  illustrationContainer: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  carouselCategory: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#5F6875",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 94,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#506AFF",
  },
  dotInactive: {
    backgroundColor: "#D1D6DC",
  },
  bottomButtons: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 52,
    height: 50,
  },
  loginButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D6DC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C222B",
  },
  signupButton: {
    flex: 1,
    height: 52,
    backgroundColor: "#506AFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  findAccountRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  findAccountText: {
    fontSize: 14,
    color: "#888888",
  },
  findAccountLink: {
    fontSize: 14,
    color: "#888888",
    textDecorationLine: "underline",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 52,
    paddingTop: 8,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 80,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#D1D6DC",
    alignSelf: "center",
    marginBottom: 19,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#161C25",
    textAlign: "center",
    marginBottom: 20,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#7A8491",
    textAlign: "center",
    marginTop: -15,
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 26,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  lightSocialButton: {
    backgroundColor: "#FFFFFF",
  },
  socialIcon: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },
  appleSocialIcon: {
    transform: [{ translateX: -8 }, { translateY: -8 }],
  },
  temporarySignupButton: {
    height: 48,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#C9D1DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  temporarySignupButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#252C37",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  dividerText: {
    fontSize: 13,
    color: "#AAAAAA",
  },
  idButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D6DC",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
  },
  idButtonIcon: {
    fontSize: 17,
  },
  idButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A2029",
  },
});
