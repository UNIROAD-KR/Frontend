import AsyncStorage from '@react-native-async-storage/async-storage';

import { getMemberMe } from '../api/auth';
import { getMyVerifications } from '../api/verification';

const VERIFIED_MARKET_ROLES = ['VERIFIED', 'ADMIN'];
export const VERIFICATION_CONSENT_AGREED_KEY = 'verificationConsentAgreed';

export type MarketAccess = 'allowed' | 'verification' | 'verificationPending';

export const getMarketAccess = async (): Promise<MarketAccess> => {
  const member = (await getMemberMe()).data.data;

  if (VERIFIED_MARKET_ROLES.includes(member.role)) return 'allowed';

  const verifications = (await getMyVerifications()).data.data;

  return verifications.some((item) => item.status === 'PENDING')
    ? 'verificationPending'
    : 'verification';
};

export const canUseMarketWithoutVerification = async () => {
  const storedVerification = await AsyncStorage.getItem('isVerified');

  if (storedVerification === 'true') {
    return true;
  }

  const response = await getMemberMe();
  const role = response.data?.data?.role;

  return typeof role === 'string' && VERIFIED_MARKET_ROLES.includes(role);
};
