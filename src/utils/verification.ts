import AsyncStorage from '@react-native-async-storage/async-storage';

import { getMemberMe } from '../api/auth';

const VERIFIED_MARKET_ROLES = ['VERIFIED', 'ADMIN'];
export const VERIFICATION_CONSENT_AGREED_KEY = 'verificationConsentAgreed';

export const canUseMarketWithoutVerification = async () => {
  const storedVerification = await AsyncStorage.getItem('isVerified');

  if (storedVerification === 'true') {
    return true;
  }

  const response = await getMemberMe();
  const role = response.data?.data?.role;

  return typeof role === 'string' && VERIFIED_MARKET_ROLES.includes(role);
};
