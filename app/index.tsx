import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppSplashScreen } from '@/components/ui/app-splash-screen';

const MIN_SPLASH_DURATION_MS = 2000;

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<'/home' | '/login' | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    const resolveInitialRoute = async () => {
      const startedAt = Date.now();
      let route: '/home' | '/login' = '/login';

      try {
        const [[, accessToken], [, refreshToken]] = await AsyncStorage.multiGet([
          'accessToken',
          'refreshToken',
        ]);

        route = accessToken || refreshToken ? '/home' : '/login';
      } catch {
        route = '/login';
      }

      const remainingDuration = Math.max(
        0,
        MIN_SPLASH_DURATION_MS - (Date.now() - startedAt),
      );

      if (remainingDuration > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDuration));
      }

      if (active) {
        setInitialRoute(route);
      }
    };

    resolveInitialRoute();

    return () => {
      active = false;
    };
  }, []);

  if (!initialRoute) return <AppSplashScreen />;

  return <Redirect href={initialRoute} />;
}
