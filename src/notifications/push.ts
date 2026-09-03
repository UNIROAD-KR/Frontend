import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerFcmToken } from "@/src/api/notifications";

const LAST_REGISTERED_TOKEN_KEY =
  "univ:notifications:last-registered-fcm-token";
export const NOTIFICATION_SETTINGS_STORAGE_KEY =
  "univ:profile:notification-settings";
const isNativePushRuntime = Platform.OS !== "web";

const logFcmToken = (message: string, token?: string | null) => {
  if (__DEV__) {
    console.log(`[FCM] ${message}`, token ?? "토큰 없음");
  }
};

const areNotificationsEnabled = async () => {
  const rawSettings = await AsyncStorage.getItem(
    NOTIFICATION_SETTINGS_STORAGE_KEY,
  );

  if (!rawSettings) {
    return true;
  }

  try {
    return JSON.parse(rawSettings).allEnabled ?? true;
  } catch {
    return true;
  }
};

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
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2F66D0",
  });
};

export const requestNotificationPermission = async () => {
  if (!isNativePushRuntime) {
    console.log("[FCM] 웹에서는 알림 권한을 요청하지 않습니다.");
    return false;
  }

  await configureAndroidChannel();

  const currentPermissions = await Notifications.getPermissionsAsync();
  if (currentPermissions.granted) {
    console.log("[FCM] 알림 권한이 이미 허용되어 있습니다.");
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  console.log(`[FCM] 알림 권한 요청 결과: ${requestedPermissions.status}`);
  return requestedPermissions.granted;
};

export const registerDeviceForPushNotifications = async (options?: {
  force?: boolean;
}) => {
  if (!isNativePushRuntime) {
    console.log("[FCM] 웹에서는 토큰을 등록하지 않습니다.");
    return null;
  }

  const accessToken = await AsyncStorage.getItem("accessToken");
  const notificationsEnabled = await areNotificationsEnabled();

  const unsupportedIosSimulator = Platform.OS === "ios" && !Device.isDevice;

  if (!accessToken) {
    console.log("[FCM] 로그인 전이라 토큰 등록을 건너뜁니다.");
    return null;
  }

  if (unsupportedIosSimulator) {
    console.log("[FCM] iOS 시뮬레이터에서는 토큰 등록을 건너뜁니다.");
    return null;
  }

  if (!notificationsEnabled) {
    console.log("[FCM] 전체 알림이 꺼져 있어 토큰 등록을 건너뜁니다.");
    return null;
  }

  const permissionGranted = await requestNotificationPermission();

  if (!permissionGranted) {
    console.log("[FCM] 알림 권한이 없어 토큰 등록을 중단합니다.");
    return null;
  }

  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();
  logFcmToken("기기 토큰 발급:", token);

  if (!token) {
    return null;
  }

  const lastRegisteredToken = await AsyncStorage.getItem(
    LAST_REGISTERED_TOKEN_KEY,
  );

  if (!options?.force && lastRegisteredToken === token) {
    logFcmToken("백엔드에 등록된 토큰:", token);
    return token;
  }

  logFcmToken("백엔드 등록 요청:", token);
  await registerFcmToken({ token });
  await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_KEY, token);
  console.log("[FCM] 백엔드 토큰 등록 성공");

  return token;
};

export const disableDevicePushNotifications = async () => {
  if (!isNativePushRuntime) {
    return;
  }

  const cachedToken = await AsyncStorage.getItem(LAST_REGISTERED_TOKEN_KEY);
  logFcmToken("토큰 삭제 요청:", cachedToken);
  await messaging().deleteToken();
  await AsyncStorage.removeItem(LAST_REGISTERED_TOKEN_KEY);
  console.log("[FCM] 기기 토큰 삭제 성공");
};

export const subscribeToFcmTokenRefresh = () => {
  if (!isNativePushRuntime) {
    return () => {};
  }

  return messaging().onTokenRefresh(async (token) => {
    logFcmToken("토큰 갱신 감지:", token);
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (!accessToken) {
      console.log("[FCM] 로그인 전이라 갱신 토큰 등록을 건너뜁니다.");
      return;
    }

    try {
      await registerFcmToken({ token });
      await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_KEY, token);
      console.log("[FCM] 갱신 토큰 백엔드 등록 성공");
    } catch (error) {
      console.log("[FCM] 갱신 토큰 백엔드 등록 실패:", error);
    }
  });
};

export const subscribeToForegroundPushNotifications = () => {
  if (!isNativePushRuntime) {
    return () => {};
  }

  return messaging().onMessage(async (remoteMessage) => {
    if (!(await areNotificationsEnabled())) {
      return;
    }

    const title =
      remoteMessage.notification?.title ??
      (typeof remoteMessage.data?.title === "string"
        ? remoteMessage.data.title
        : "새 알림");
    const body =
      remoteMessage.notification?.body ??
      (typeof remoteMessage.data?.body === "string"
        ? remoteMessage.data.body
        : "");

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
