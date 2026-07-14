import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'univ:ticket:draft';

export type TicketDraft = {
  step: 1 | 2;
  ticketType: string | null;
  eventDate: string;
  checkoutDate: string;
  eventTime: string;
  country: string;
  location: string;
  quantity: number;
  transferPrice: string;
  originalPrice: string;
  title: string;
  content: string;
  updatedAt: string;
};

export const getTicketDraft = async () => {
  const storedDraft = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedDraft) {
    return null;
  }

  try {
    return JSON.parse(storedDraft) as TicketDraft;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveTicketDraft = (
  draft: Omit<TicketDraft, 'updatedAt'>,
) => {
  return AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...draft,
      updatedAt: new Date().toISOString(),
    }),
  );
};

export const clearTicketDraft = () => {
  return AsyncStorage.removeItem(STORAGE_KEY);
};
