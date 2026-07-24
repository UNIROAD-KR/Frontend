import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'univ:ticket:metadata';

export type TicketMetadataMap = Record<string, { currencyUnit?: string }>;

export const getTicketMetadataMap = async (): Promise<TicketMetadataMap> => {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    return parsedValue && typeof parsedValue === 'object'
      ? (parsedValue as TicketMetadataMap)
      : {};
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

export const getTicketCurrency = async (ticketId: number | string) => {
  const metadataMap = await getTicketMetadataMap();

  return metadataMap[String(ticketId)]?.currencyUnit;
};

export const saveTicketCurrency = async (
  ticketId: number | string,
  currencyUnit: string,
) => {
  const metadataMap = await getTicketMetadataMap();

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...metadataMap,
      [String(ticketId)]: {
        ...metadataMap[String(ticketId)],
        currencyUnit,
      },
    }),
  );
};
