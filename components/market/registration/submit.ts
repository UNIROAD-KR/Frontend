import { getMemberMe } from "@/src/api/auth";
import { getUploadUrl, uploadFileToStorage } from "@/src/api/upload";
import { createUsedItem, updateUsedItem, type UsedItemRequest } from "@/src/api/usedItems";
import { saveLocalMarketPost } from "@/src/storage/marketPosts";
import { categoryCodes, type RegistrationForm, type RegistrationItem } from "./model";

async function uploadImage(uri: string, index: string) {
  if (/^https?:\/\//.test(uri)) return uri;
  const response = await getUploadUrl({ fileName: `used_item_${Date.now()}_${index}.jpg`, contentType: "image/jpeg", fileType: "IMAGE" });
  await uploadFileToStorage(response.data.data.uploadUrl, uri, "image/jpeg");
  return response.data.data.fileUrl;
}

export async function submitRegistration(form: RegistrationForm, items: RegistrationItem[], editId?: string) {
  const existingId = editId === undefined ? undefined : Number(editId);
  if (existingId !== undefined && (!Number.isSafeInteger(existingId) || existingId <= 0)) {
    throw new Error("수정할 게시글 ID가 올바르지 않습니다.");
  }
  const photos = await Promise.all(form.photos.map((uri, index) => uploadImage(uri, `main_${index}`)));
  const uploadedItems = await Promise.all(items.map(async (item, index) => ({ ...item,
    photos: await Promise.all(item.photos.map((uri, photoIndex) => uploadImage(uri, `${index}_${photoIndex}`))),
  })));
  const profile = await getMemberMe().then((response) => response.data.data).catch(() => null);
  const semester = form.semester || profile?.dispatchSemester || "";
  const request: UsedItemRequest = {
    title: form.title.trim(), content: form.content.trim(), price: Number(form.price.replace(/\D/g, "")),
    country: form.country.trim(), region: form.region.trim(), returnDate: form.returnDate, semester,
    thumbnailImageUrl: photos[0],
    items: uploadedItems.map((item) => ({ category: categoryCodes[item.category] ?? "ETC", name: item.name.trim(), quantity: item.quantity, description: item.description.trim() })),
    categoryImages: uploadedItems.flatMap((item) => item.photos.map((imageUrl) => ({ category: categoryCodes[item.category] ?? "ETC", imageUrl }))),
  };
  const postId = existingId === undefined
    ? (await createUsedItem(request)).data.data
    : (await updateUsedItem(existingId, request), existingId);
  // The server currently groups photos by category; preserve each item's own photos locally.
  try {
    await saveLocalMarketPost({
      ...form, title: form.title.trim(), content: form.content.trim(), semester,
      price: Number(form.price.replace(/\D/g, "")), priceText: `${Number(form.price.replace(/\D/g, "")).toLocaleString("ko-KR")}원`, photos,
      itemGroups: Array.from(new Set(items.map((item) => item.category))).map((category) => ({
        category, items: uploadedItems.filter((item) => item.category === category),
        photos: uploadedItems.filter((item) => item.category === category).flatMap((item) => item.photos),
      })),
      authorName: profile?.nickname || "나", sellerCountry: profile?.dispatchedCountry || form.country,
      authorDomesticUniversity: profile?.domesticUniversity || profile?.homeUniversity || "",
      authorHomeUniversity: profile?.homeUniversity || "", authorDispatchedUniversity: profile?.dispatchedUniversity || "",
      authorDispatchedCountry: profile?.dispatchedCountry || "", authorDispatchedRegion: profile?.dispatchedRegion || "",
      authorDispatchSemester: semester, authorVerified: true,
    }, postId);
  } catch (error) { console.warn("등록 후 로컬 목록 저장 실패", error); }
  return postId;
}
