import { api } from "./client";
import type { BaseResponse, CursorResponse } from "./types";

export interface BlogPostSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  likedByMe: boolean;
}

export interface BlogPostDetail extends BlogPostSummary {
  contentHtml: string;
  tags: string[];
}

export interface BlogPostLikeResponse {
  postId: number;
  liked: boolean;
  likeCount: number;
}

export const getBlogPosts = (params: { cursorId?: number; size?: number } = {}) =>
  api.get<BaseResponse<CursorResponse<BlogPostSummary>>>("/api/blog/posts", {
    params: { size: 9, ...params },
  });

export const getBlogPost = (slug: string) =>
  api.get<BaseResponse<BlogPostDetail>>(`/api/blog/posts/${encodeURIComponent(slug)}`);

export const toggleBlogPostLike = (postId: number) =>
  api.post<BaseResponse<BlogPostLikeResponse>>(`/api/blog/posts/${postId}/like`);
