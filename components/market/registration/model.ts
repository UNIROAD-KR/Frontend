import type { TradeCategory } from "@/src/api/usedItems";
export type RegistrationItem = { id: string; category: string; name: string; quantity: number; photos: string[]; description: string };
export type RegistrationForm = { title: string; content: string; price: string; country: string; region: string; returnDate: string; semester: string; photos: string[] };
export const itemOptions: Record<string, string[]> = {
  "주방 용품": [
    "냄비",
    "브리타 정수기",
    "프라이팬",
    "주방 소도구(주걱·집게)",
    "밥솥 (1인용)",
    "주방 칼",
    "밥·국 그릇",
    "주방 가위",
    "접시",
    "락앤락 통",
    "컵",
    "수저세트"
  ],
  "욕실 / 청소 용품": [
    "청소 밀대",
    "빨래 건조대",
    "빗자루 세트",
    "빨래 망",
    "욕실 매트",
    "빨래 집게",
    "욕실용 슬리퍼",
    "세제류"
  ],
  "생활 용품": [
    "드라이기",
    "멀티탭",
    "와이파이 공유기",
    "옷걸이",
    "전신 거울",
    "탁상 스탠드",
    "쓰레기통",
    "실내 슬리퍼"
  ],
  "침구류": [
    "이불",
    "베개",
    "침대 시트",
    "담요",
    "매트리스 커버",
    "베개 커버"
  ],
  "각종 소스류": [
    "간장",
    "고추장",
    "참기름",
    "식용유",
    "소금",
    "설탕",
    "후추",
    "파스타 소스"
  ],
  "기타": [
    "보조배터리",
    "우산",
    "캐리어",
    "문구류"
  ]
};
export const categoryCodes: Record<string, TradeCategory> = { "주방 용품": "KITCHEN", "욕실 / 청소 용품": "BATH", "생활 용품": "LIFE", "침구류": "BEDDING", "각종 소스류": "ETC", "기타": "ETC" };
export const categoryLabel = (value: string) => value === "각종 소스류" ? "소스류" : value;
export function parseJson<T>(value: string | undefined, fallback: T): T { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
