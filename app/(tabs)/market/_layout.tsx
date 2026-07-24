import { Stack } from 'expo-router';

export default function MarketLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonMenuEnabled: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="ticket-write" />
    </Stack>
  );
}
