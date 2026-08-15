import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import {
  registerDeviceForPushNotifications,
  subscribeToFcmTokenRefresh,
  subscribeToForegroundPushNotifications,
} from '@/src/notifications/push';

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      void SplashScreen.hideAsync().catch(() => undefined);
    }

    const unsubscribeForeground = subscribeToForegroundPushNotifications();
    const unsubscribeTokenRefresh = subscribeToFcmTokenRefresh();

    registerDeviceForPushNotifications().catch((error) => {
      console.log('FCM 토큰 등록 실패:', error.response?.data || error.message);
    });

    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen
          name="signup"
          options={{
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        />
        <Stack.Screen name="signup-success" />
        <Stack.Screen name="verification-consent" />
        <Stack.Screen name="verification" />
        <Stack.Screen name="verification-complete" />
        <Stack.Screen name="onboarding/consent" />
        <Stack.Screen name="onboarding/profile-setup" />
        <Stack.Screen name="onboarding/nickname" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="onboarding/university" />
        <Stack.Screen name="onboarding/country" />
        <Stack.Screen name="onboarding/interests" />
        <Stack.Screen name="onboarding/dispatched-country" />
        <Stack.Screen name="onboarding/dispatched-interests" />
        <Stack.Screen name="onboarding/complete" />
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen name="notifications" options={{ animation: 'none' }} />
        <Stack.Screen name="more-menu" options={{ animation: 'none' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="sns-signup"
          options={{
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        />
        <Stack.Screen name="id-login" />
      </Stack>

      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
