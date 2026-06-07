import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sns-signup" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
