import { countryOptions, CUSTOM_COUNTRY_OPTION } from "@/src/constants/onboarding";

const initials = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
export const countryInitialFilters = [
  "전체",
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
export const flags: Record<string, string> = {
  독일: "🇩🇪",
  프랑스: "🇫🇷",
  스페인: "🇪🇸",
  이탈리아: "🇮🇹",
  미국: "🇺🇸",
  영국: "🇬🇧",
  일본: "🇯🇵",
  캐나다: "🇨🇦",
  호주: "🇦🇺",
  네덜란드: "🇳🇱",
  체코: "🇨🇿",
  포르투갈: "🇵🇹",
  벨기에: "🇧🇪",
  폴란드: "🇵🇱",
  핀란드: "🇫🇮",
  노르웨이: "🇳🇴",
  스웨덴: "🇸🇪",
  아일랜드: "🇮🇪",
  덴마크: "🇩🇰",
  오스트리아: "🇦🇹",
  스위스: "🇨🇭",
  중국: "🇨🇳",
  대만: "🇹🇼",
  싱가포르: "🇸🇬",
  홍콩: "🇭🇰",
  뉴질랜드: "🇳🇿",
  멕시코: "🇲🇽",
  브라질: "🇧🇷",
  튀르키예: "🇹🇷",
};
export const sortedCountries = [
  ...new Set([
    ...countryOptions.filter(
      (country) => country !== CUSTOM_COUNTRY_OPTION && country !== "미정",
    ),
    "튀르키예",
  ]),
].sort((a, b) => a.localeCompare(b, "ko"));
export function initialOf(value: string) {
  const code = value.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "";
  const initial = initials[Math.floor(code / 588)];
  return (
    (
      { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" } as Record<
        string,
        string
      >
    )[initial] ?? initial
  );
}

