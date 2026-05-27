import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="school-info" />
      <Stack.Screen name="my-school-info" />
      <Stack.Screen name="scholarship-info" />
      <Stack.Screen name="guide" />
      <Stack.Screen name="visa-guide" />
      <Stack.Screen name="departure-checklist" />
      <Stack.Screen name="profile-card" />
      <Stack.Screen name="mentoring" />
      <Stack.Screen name="school-detail" />
      <Stack.Screen name="market" />
    </Stack>
  );
}
