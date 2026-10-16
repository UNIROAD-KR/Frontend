import { Image } from "react-native";
import { getCalendarPhotoUploadUrls, readCalendarUploadGrant, type CalendarPhotoInput } from "./calendar";

export async function uploadCalendarPhoto(uri: string): Promise<CalendarPhotoInput> {
  const file = await fetch(uri);
  if (!file.ok && file.status !== 0) throw new Error("선택한 사진을 읽지 못했어요.");
  const blob = await file.blob();
  const extension = uri.split("?")[0].split(".").pop()?.toLowerCase();
  const fallback = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "";
  const contentType = blob.type && blob.type !== "application/octet-stream" ? blob.type : fallback;
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) throw new Error("JPEG, PNG, WebP 형식의 사진을 선택해주세요.");
  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
  const response = await getCalendarPhotoUploadUrls(contentType);
  const grant = readCalendarUploadGrant(response.data.data?.photos?.[0]);
  const uploaded = await fetch(grant.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  if (!uploaded.ok) throw new Error("사진 업로드에 실패했어요. 다시 시도해주세요.");
  // Thumbnail upload is optional per CalendarEventRequest.Photo. Omit its key
  // until the thumbnail grant format is documented; never pretend it was uploaded.
  return { key: grant.key, ...dimensions };
}
