import AsyncStorage from "@react-native-async-storage/async-storage";
type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  required?: boolean;
  done: boolean;
};
type PackingCategory = {
  id: string;
  title: string;
  items: string[];
};
export type PreparationItem = {
  id: string;
  title: string;
  done: boolean;
};
export type PreparationGroup = {
  id: string;
  title: string;
  items: PreparationItem[];
};
export const SCHEDULE_TYPES = [
  "여행",
  "학업",
  "국제 교류",
  "커리어",
  "개인 용무",
] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type DeparturePreparation = {
  id: string;
  title: string;
  country: string;
  university: string;
  scheduleType?: ScheduleType;
  region?: string;
  departureDate: string;
  createdAt: string;
  essentials: PreparationItem[];
  groups: PreparationGroup[];
};
const STORAGE_KEY = "univ:departure:preparations:v1";
export const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export function progress(list: DeparturePreparation) {
  const items = [
    ...list.essentials,
    ...list.groups.flatMap((group) => group.items),
  ];
  const done = items.filter((item) => item.done).length;
  return {
    done,
    total: items.length,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
  };
}
export function createPreparation(
  fields: Pick<
    DeparturePreparation,
    | "title"
    | "country"
    | "university"
    | "departureDate"
    | "scheduleType"
    | "region"
  >,
): DeparturePreparation {
  return {
    ...fields,
    id: makeId(),
    createdAt: new Date().toISOString(),
    essentials: initialEssentials(),
    groups: DEFAULT_PACKING_CATEGORIES.map((group) => ({
      id: group.id,
      title: group.title,
      items: group.items.map((title) => ({ id: makeId(), title, done: false })),
    })),
  };
}
function validItems(items: unknown): items is PreparationItem[] {
  return (
    Array.isArray(items) &&
    items.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.done === "boolean",
    )
  );
}
function validPreparation(value: unknown): value is DeparturePreparation {
  if (!value || typeof value !== "object") return false;
  const list = value as Record<string, unknown>;
  return (
    [
      "id",
      "title",
      "country",
      "university",
      "departureDate",
      "createdAt",
    ].every((key) => typeof list[key] === "string") &&
    validItems(list.essentials) &&
    Array.isArray(list.groups) &&
    list.groups.every((group: unknown) => {
      if (!group || typeof group !== "object") return false;
      const preparationGroup = group as Record<string, unknown>;
      return (
        typeof preparationGroup.id === "string" &&
        typeof preparationGroup.title === "string" &&
        validItems(preparationGroup.items)
      );
    })
  );
}
export async function loadPreparations(): Promise<DeparturePreparation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(validPreparation)) {
    throw new Error("출국 준비 저장 데이터를 읽을 수 없습니다.");
  }
  const requiredItems = INITIAL_ITEMS.filter((item) => item.required);
  return data.map((list) => {
    const existingIds = new Set(list.essentials.map((item) => item.id));
    const missingEssentials = requiredItems
      .filter((item) => !existingIds.has(item.id))
      .map((item) => ({ id: item.id, title: item.title, done: false }));
    const essentials = [...list.essentials, ...missingEssentials];
    const order = new Map(
      requiredItems.map((item, index) => [item.id, index]),
    );
    essentials.sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
    return { ...list, essentials };
  });
}
export const savePreparations = (lists: DeparturePreparation[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
const DOCUMENT_PACKING_CATEGORY: PackingCategory = {
  id: "documents",
  title: "서류",
  items: [
    "여권",
    "여권 사본",
    "입학허가서",
    "항공 예매 확인서",
    "호텔 예약 확인서",
    "여권용 증사",
    "비자",
    "영문 재적증명서",
    "신분증",
    "운전면허증",
  ],
};
export const INITIAL_ITEMS: ChecklistItem[] = [
  {
    id: "visa-apply",
    title: "비자 신청",
    category: "비자",
    required: true,
    done: true,
  },
  {
    id: "visa-pickup",
    title: "비자 수령",
    category: "비자",
    required: true,
    done: false,
  },
  {
    id: "housing-secure",
    title: "숙소 확보",
    category: "거주",
    required: true,
    done: true,
  },
  {
    id: "insurance-join",
    title: "보험 가입",
    category: "보험",
    required: true,
    done: true,
  },
  {
    id: "blocked-account",
    title: "해외결제 카드 준비",
    category: "은행/재정",
    required: true,
    done: true,
  },
  {
    id: "card-ready",
    title: "해외결제 카드 준비",
    category: "은행/재정",
    required: true,
    done: false,
  },
  {
    id: "esim-ready",
    title: "유심/eSIM 준비",
    category: "통신",
    required: true,
    done: false,
  },
  {
    id: "flight-booking",
    title: "항공권 예약",
    category: "항공",
    required: true,
    done: true,
  },
];

function initialEssentials(): PreparationItem[] {
  return INITIAL_ITEMS.filter((item) => item.required).map((item) => ({
    id: item.id,
    title: item.title,
    done: false,
  }));
}

export const DEFAULT_PACKING_CATEGORIES: PackingCategory[] = [
  {
    id: "daily",
    title: "생활용품",
    items: [
      "우산",
      "작은 우산",
      "수건",
      "손톱깎이",
      "장바구니",
      "멀티어댑터",
      "텀블러",
      "스탠드",
      "가위",
      "칼",
    ],
  },
  {
    id: "bath",
    title: "욕실용품",
    items: [
      "샴푸",
      "트리트먼트",
      "샤워타올/볼",
      "칫솔",
      "치약",
      "바디워시",
      "샤워헤드",
      "샤워필터",
    ],
  },
  {
    id: "kitchen",
    title: "주방용품",
    items: ["고무장갑", "수세미", "행주", "코인육수", "블럭국"],
  },
  {
    id: "electronics",
    title: "전자기기",
    items: [
      "휴대폰 충전기",
      "C타입 충전기",
      "워치 충전기",
      "노트북 충전기",
      "보조배터리",
      "에어팟",
      "노트북",
      "아이패드",
      "블루투스 마우스",
      "건전지",
      "고데기",
      "카메라",
    ],
  },
  {
    id: "travel",
    title: "여행용품",
    items: [
      "도난방지줄",
      "자물쇠",
      "자전거 자물쇠",
      "안대",
      "마스크",
      "백팩",
      "에코백",
      "크로스백",
    ],
  },
  {
    id: "clothes",
    title: "의류",
    items: [
      "잠옷",
      "반팔티",
      "얇은 긴팔",
      "바람막이",
      "후드집업",
      "후드티",
      "츄리닝바지",
      "패딩",
      "코트",
      "속옷",
      "양말",
      "수면양말",
    ],
  },
  {
    id: "shoes",
    title: "신발",
    items: ["크록스", "운동화", "러닝화"],
  },
  {
    id: "sports",
    title: "운동용품",
    items: ["레깅스", "반바지", "운동 반팔", "수영복"],
  },
  {
    id: "cosmetics",
    title: "화장품",
    items: [
      "크림",
      "스킨",
      "앰플",
      "콜라겐",
      "립밤/바세린",
      "핸드크림",
      "머리빗",
      "머리끈",
      "오일 클렌저",
      "폼 클렌저",
      "선크림",
      "쿠션",
      "파운데이션",
      "브로우카라",
      "틴트",
      "쉐딩",
      "블러셔",
      "마스카라",
      "아이라이너",
      "브러쉬",
      "향수",
      "화장솜",
      "면봉",
    ],
  },
  {
    id: "medicine",
    title: "상비약",
    items: [
      "타이레놀",
      "종합감기약",
      "소화제",
      "배탈약",
      "인공눈물",
      "후시딘",
      "마데카솔",
      "여드름 패치",
      "여드름 연고",
      "파스",
      "기침약",
      "밴드",
      "벌레 물렸을 때 바르는 약",
      "유산균",
    ],
  },
  {
    ...DOCUMENT_PACKING_CATEGORY,
  },
];
