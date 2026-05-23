import { getMemberMe } from '../api/auth';

const VERIFIED_MARKET_ROLES = ['VERIFIED', 'ADMIN'];

export const canUseMarketWithoutVerification = async () => {
  const response = await getMemberMe();
  const role = response.data?.data?.role;

  return typeof role === 'string' && VERIFIED_MARKET_ROLES.includes(role);
};
