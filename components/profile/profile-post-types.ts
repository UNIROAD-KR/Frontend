import type { Ionicons } from "@expo/vector-icons";
import type { TicketType } from "@/src/api/ticket";

export type ProfileListCategory = "free" | "used" | "ticket" | "companion";

export type ListCard = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  category?: ProfileListCategory;
  icon: keyof typeof Ionicons.glyphMap;
  route?: unknown;
  imageUrl?: string;
  authorName?: string;
  country?: string;
  region?: string;
  postStatus?: string;
  commentCount?: number;
  likeCount?: number;
  postCategory?: string;
  price?: number | string;
  originalPrice?: number;
  eventDate?: string;
  eventTime?: string;
  ticketType?: TicketType | string;
  createdAt?: string;
  status?: "AVAILABLE" | "COMPLETED";
};

export type PostCommunityTab = "free" | "companion";
export type PostTicketTab = "all" | TicketType;
export type PostSortMode = "latest" | "oldest";

export const postTicketTabs: { key: PostTicketTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "TOUR", label: "관광 티켓" },
  { key: "CONCERT", label: "콘서트·공연" },
  { key: "TRAIN", label: "기차표" },
  { key: "FLIGHT", label: "항공권" },
];

export const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 10).replaceAll("-", ".");
};

export const formatPrice = (value?: number) => {
  if (!value) {
    return "가격 미정";
  }

  return `${value.toLocaleString()}원`;
};
