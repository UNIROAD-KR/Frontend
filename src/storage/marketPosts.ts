import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'univ:market:my-posts';

export type LocalMarketItem = {
  name: string;
  quantity: number;
  description?: string;
};

export type LocalMarketItemGroup = {
  category: string;
  items: LocalMarketItem[];
  photos?: string[];
  description?: string;
};

export type LocalMarketPost = {
  id: string;
  title: string;
  content: string;
  price: number;
  priceText: string;
  country: string;
  sellerCountry?: string;
  region: string;
  semester: string;
  returnDate: string;
  photos: string[];
  itemGroups: LocalMarketItemGroup[];
  authorName: string;
  authorDomesticUniversity?: string;
  authorHomeUniversity?: string;
  authorDispatchedUniversity?: string;
  authorDispatchedCountry?: string;
  authorDispatchedRegion?: string;
  authorDispatchSemester?: string;
  authorVerified?: boolean;
  createdAt: string;
};

export type LocalMarketPostInput = Omit<LocalMarketPost, 'id' | 'createdAt'>;

const readPosts = async (): Promise<LocalMarketPost[]> => {
  const storedPosts = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedPosts) {
    return [];
  }

  try {
    const parsedPosts = JSON.parse(storedPosts);
    return Array.isArray(parsedPosts) ? (parsedPosts as LocalMarketPost[]) : [];
  } catch {
    return [];
  }
};

const writePosts = (posts: LocalMarketPost[]) => {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
};

export const getLocalMarketPosts = async () => {
  const posts = await readPosts();

  return [...posts].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getLocalMarketPost = async (id: string) => {
  const posts = await readPosts();

  return posts.find((post) => post.id === id) ?? null;
};

export const deleteLocalMarketPost = async (id: string) => {
  const posts = await readPosts();

  await writePosts(posts.filter((post) => post.id !== id));
};

export const saveLocalMarketPost = async (
  input: LocalMarketPostInput,
  forcedId?: string | number,
) => {
  const posts = await readPosts();
  const post: LocalMarketPost = {
    ...input,
    id: forcedId
      ? String(forcedId)
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  await writePosts([post, ...posts]);

  return post;
};
