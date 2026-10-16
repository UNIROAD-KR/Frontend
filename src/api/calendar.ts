import { api } from "./client";
import type { BaseResponse } from "./types";

export type CalendarRepeatType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type CalendarCategory = { id: number; name: string; color: string };
export type CalendarPhotoInput = { photoId: number } | { key: string; thumbnailKey?: string; width?: number; height?: number };
export type CalendarEventRequest = {
  categoryId: number | null; title: string; allDay: boolean; startAt: string; endAt: string;
  reminder: "NONE" | "AT_TIME" | "MIN_10" | "HOUR_1" | "DAY_1"; repeatType: CalendarRepeatType; repeatUntil?: string | null; memo: string; photos: CalendarPhotoInput[];
};
export type CalendarEvent = {
  id: number; categoryId: number | null; categoryName: string | null; title: string;
  startAt: string; endAt: string; occurrenceStartAt?: string; occurrenceEndAt?: string;
  allDay: boolean; memo: string; repeatType: CalendarRepeatType;
  reminder?: CalendarEventRequest["reminder"]; repeatUntil?: string | null;
  photos: { id: number; imageUrl: string; thumbnailUrl: string | null }[];
};
export type CalendarOccurrence = {
  eventId: number; title: string; categoryId: number | null; color: string | null;
  allDay: boolean; startAt: string; endAt: string; repeating: boolean; photoCount: number;
};
export type CalendarMonth = {
  events: CalendarOccurrence[];
  dayCovers: { date: string; photoId: number; eventId: number; thumbnailUrl: string }[];
};
export const getCalendarMonth = (from: string, to: string) => api.get<BaseResponse<CalendarMonth>>("/api/calendar", { params: { from, to } });
export const deleteCalendarEvent = (id: number) => api.delete<BaseResponse<unknown>>(`/api/calendar/events/${id}`);
export const getCalendarCategories = () => api.get<BaseResponse<CalendarCategory[]>>("/api/calendar/categories");
export const createCalendarCategory = (data: { name: string; color: string }) => api.post<BaseResponse<CalendarCategory>>("/api/calendar/categories", data);
export const createCalendarEvent = (data: CalendarEventRequest) => api.post<BaseResponse<CalendarEvent>>("/api/calendar/events", data);
export const updateCalendarEvent = (id: number, data: CalendarEventRequest) => api.put<BaseResponse<CalendarEvent>>(`/api/calendar/events/${id}`, data);
export const getCalendarDay = (date: string) => api.get<BaseResponse<{ date: string; events: CalendarEvent[] }>>(`/api/calendar/days/${date}`);
export const getCalendarEvent = (id: number) => api.get<BaseResponse<CalendarEvent>>(`/api/calendar/events/${id}`);

// Swagger currently describes the request's Item type as the response too.
// Keep this unknown and validate the upload grant before touching storage.
export const getCalendarPhotoUploadUrls = (contentType: string) => api.post<BaseResponse<{ photos: unknown[] }>>("/api/calendar/photos/presigned-urls", { photos: [{ contentType, thumbnailContentType: contentType }] });

export function readCalendarUploadGrant(value: unknown): { uploadUrl: string; key: string } {
  if (!value || typeof value !== "object") throw new Error("사진 업로드 응답이 올바르지 않아요.");
  const grant = value as Record<string, unknown>;
  // uploadUrl/key follow the existing S3 upload API convention; the calendar
  // backend must return these fields or this adapter must match its actual DTO.
  if (typeof grant.uploadUrl !== "string" || typeof grant.key !== "string" || !grant.key || !/^https:\/\//.test(grant.uploadUrl)) {
    throw new Error("사진 업로드 응답에 uploadUrl 또는 key가 없어요. 백엔드 응답 규격을 확인해주세요.");
  }
  return { uploadUrl: grant.uploadUrl, key: grant.key };
}
