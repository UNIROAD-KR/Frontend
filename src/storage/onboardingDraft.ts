import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_NICKNAME_KEY } from '@/src/constants/onboarding';

const ONBOARDING_DRAFT_KEYS = [
  ONBOARDING_NICKNAME_KEY,
  'birthYear',
  'gender',
  'university',
  'onboardingSituation',
  'exchangeStatus',
  'profileStatus',
  'dispatchedCountry',
  'dispatchedRegion',
  'dispatchedUniversity',
  'applicationDeadline',
  'departureDate',
  'dispatchStartDate',
];

export const clearOnboardingDraft = () => {
  return AsyncStorage.multiRemove(ONBOARDING_DRAFT_KEYS);
};
