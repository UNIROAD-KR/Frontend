import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  registerDeviceForPushNotifications,
  subscribeToFcmTokenRefresh,
  subscribeToForegroundPushNotifications,
} from '@/src/notifications/push';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verification" />
        <Stack.Screen name="verification-complete" />
        <Stack.Screen name="onboarding/nickname" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="onboarding/university" />
        <Stack.Screen name="onboarding/country" />
        <Stack.Screen name="onboarding/interests" />
        <Stack.Screen name="onboarding/dispatched-country" />
        <Stack.Screen name="onboarding/dispatched-interests" />
        <Stack.Screen name="onboarding/complete" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" options={{ animation: 'none' }} />
        <Stack.Screen name="more-menu" options={{ animation: 'none' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sns-signup" />
        <Stack.Screen name="id-login" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
