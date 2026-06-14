import { getMemberMe } from '../api/auth';

const VERIFIED_MARKET_ROLES = ['VERIFIED', 'ADMIN'];
const TEMP_SKIP_MARKET_VERIFICATION = true;

export const canUseMarketWithoutVerification = async () => {
  if (TEMP_SKIP_MARKET_VERIFICATION) {
    return true;
  }

  const response = await getMemberMe();
  const role = response.data?.data?.role;

  return typeof role === 'string' && VERIFIED_MARKET_ROLES.includes(role);
};
