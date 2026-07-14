import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<'/home' | '/login' | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    const resolveInitialRoute = async () => {
      try {
        const [[, accessToken], [, refreshToken]] = await AsyncStorage.multiGet([
          'accessToken',
          'refreshToken',
        ]);

        if (!active) return;

        setInitialRoute(accessToken || refreshToken ? '/home' : '/login');
      } catch {
        if (active) {
          setInitialRoute('/login');
        }
      }
    };

    resolveInitialRoute();

    return () => {
      active = false;
    };
  }, []);

  if (!initialRoute) return null;

  return <Redirect href={initialRoute} />;
}
