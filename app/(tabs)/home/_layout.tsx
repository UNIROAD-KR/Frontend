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
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="profile-field-edit" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile-list" />
      <Stack.Screen name="profile-notifications" />
      <Stack.Screen name="profile-password" />
      <Stack.Screen name="profile-settings" />
      <Stack.Screen name="more-menu" />
      <Stack.Screen name="app-info" />
      <Stack.Screen name="notices" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="mentoring" />
      <Stack.Screen name="school-detail" />
      <Stack.Screen name="market" />
    </Stack>
  );
}
