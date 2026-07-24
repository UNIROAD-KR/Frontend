import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'univ:used-item:status';

export type UsedItemTradeStatus = 'AVAILABLE' | 'COMPLETED';
export type UsedItemTradeStatusMap = Record<string, UsedItemTradeStatus>;

export const getUsedItemStatusMap = async () => {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as UsedItemTradeStatusMap;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

export const getUsedItemStatus = async (id: number | string) => {
  const statusMap = await getUsedItemStatusMap();

  return statusMap[String(id)];
};

export const saveUsedItemStatus = async (
  id: number | string,
  status: UsedItemTradeStatus,
) => {
  const statusMap = await getUsedItemStatusMap();

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...statusMap,
      [String(id)]: status,
    }),
  );
};
