import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'univ:market:draft';

export type DraftItemState = {
  name: string;
  checked: boolean;
  quantity: number;
  originalName?: string;
  editable?: boolean;
  editing?: boolean;
};

export type DraftCategoryDetail = {
  photos: string[];
  description: string;
};

export type MarketDraft = {
  step: 'write' | 'category' | 'preview';
  updatedAt: string;
  write: {
    type?: string;
    title: string;
    content: string;
    price: string;
    region: string;
    returnDate: string;
    semester?: string;
    photos: string[];
    allowOffer?: boolean;
  };
  category?: {
    selectedCategories: string[];
    itemsByCategory: Record<string, DraftItemState[]>;
  };
  preview?: {
    selectedItems: string;
    itemsByCategory: Record<string, DraftItemState[]>;
    categoryDetails: Record<string, DraftCategoryDetail>;
  };
};

export const getMarketDraft = async () => {
  const storedDraft = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedDraft) {
    return null;
  }

  try {
    return JSON.parse(storedDraft) as MarketDraft;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveMarketDraft = (draft: Omit<MarketDraft, 'updatedAt'>) => {
  const nextDraft: MarketDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
};

export const clearMarketDraft = () => {
  return AsyncStorage.removeItem(STORAGE_KEY);
};
