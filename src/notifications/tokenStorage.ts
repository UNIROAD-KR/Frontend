import AsyncStorage from "@react-native-async-storage/async-storage";

export const LAST_REGISTERED_TOKEN_KEY =
  "univ:notifications:last-registered-fcm-token";

export const getRegisteredFcmToken = () =>
  AsyncStorage.getItem(LAST_REGISTERED_TOKEN_KEY);
