import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerFcmToken } from '@/src/api/notifications';

const LAST_REGISTERED_TOKEN_KEY = 'univ:notifications:last-registered-fcm-token';
const isNativePushRuntime = Platform.OS !== 'web';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (isNativePushRuntime) {
  messaging().setBackgroundMessageHandler(async () => {});
}

const configureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2F66D0',
  });
};

export const registerDeviceForPushNotifications = async (options?: { force?: boolean }) => {
  if (!isNativePushRuntime) {
    return null;
  }

  const accessToken = await AsyncStorage.getItem('accessToken');

  if (!accessToken || !Device.isDevice) {
    return null;
  }

  await configureAndroidChannel();

  const authorizationStatus = await messaging().requestPermission();
  const permissionGranted =
    authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!permissionGranted) {
    return null;
  }

  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();

  if (!token) {
    return null;
  }

  const lastRegisteredToken = await AsyncStorage.getItem(LAST_REGISTERED_TOKEN_KEY);

  if (!options?.force && lastRegisteredToken === token) {
    return token;
  }

  await registerFcmToken({ token });
  await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_KEY, token);

  return token;
};

export const subscribeToFcmTokenRefresh = () => {
  if (!isNativePushRuntime) {
    return () => {};
  }

  return messaging().onTokenRefresh(async (token) => {
    const accessToken = await AsyncStorage.getItem('accessToken');

    if (!accessToken) {
      return;
    }

    await registerFcmToken({ token });
    await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_KEY, token);
  });
};

export const subscribeToForegroundPushNotifications = () => {
  if (!isNativePushRuntime) {
    return () => {};
  }

  return messaging().onMessage(async (remoteMessage) => {
    const title =
      remoteMessage.notification?.title ??
      (typeof remoteMessage.data?.title === 'string' ? remoteMessage.data.title : '새 알림');
    const body =
      remoteMessage.notification?.body ??
      (typeof remoteMessage.data?.body === 'string' ? remoteMessage.data.body : '');

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: remoteMessage.data,
      },
      trigger: null,
    });
  });
};
