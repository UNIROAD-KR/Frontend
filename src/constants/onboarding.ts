export type ExchangeStatus = 'preparing' | 'accepted' | 'dispatched';

export const ONBOARDING_NICKNAME_KEY = 'onboardingNickname';
export const CUSTOM_COUNTRY_OPTION = '직접 입력';

export const getNicknameError = (value: string) => {
  if (!value) {
    return '';
  }

  if (/\s/.test(value)) {
    return '공백은 사용할 수 없어요.';
  }

  if (value.length < 2) {
    return '2자 이상 입력해주세요.';
  }

  if (value.length > 12) {
    return '12자 이하로 입력해주세요.';
  }

  if (!/^[가-힣a-zA-Z0-9_]+$/.test(value)) {
    return '한글, 영문, 숫자, 밑줄만 사용할 수 있어요.';
  }

  return '';
};

export const dispatchSemesterTerms = [
  '1학기',
  '2학기',
  '여름단기',
  '겨울단기',
] as const;

export type DispatchSemesterTerm = (typeof dispatchSemesterTerms)[number];

export type ParsedDispatchSemester = {
  year: string;
  term: DispatchSemesterTerm | '';
};

export const formatDispatchSemester = (
  year: string | number,
  term: DispatchSemesterTerm,
) => `${String(year).trim()}-${term}`;

export const parseDispatchSemester = (
  value?: string | number | null,
): ParsedDispatchSemester => {
  const rawValue = value === null || value === undefined ? '' : String(value).trim();
  const year = rawValue.match(/\b(19\d{2}|20\d{2})\b/)?.[1] ?? '';
  let term: DispatchSemesterTerm | '' =
    dispatchSemesterTerms.find((item) => rawValue.includes(item)) ?? '';

  if (!term && /(^|[^0-9])1([^0-9]|$)/.test(rawValue)) {
    term = '1학기';
  }

  if (!term && /(^|[^0-9])2([^0-9]|$)/.test(rawValue)) {
    term = '2학기';
  }

  return {
    year,
    term,
  };
};

export const universityOptions = [
  '서울대학교',
  '서울과학기술대학교',
  '서울시립대학교',
  '서울여자대학교',
  '연세대학교',
  '고려대학교',
  '성균관대학교',
  '한양대학교',
  '중앙대학교',
  '경희대학교',
  '한국외국어대학교',
  '이화여자대학교',
  '건국대학교',
  '동국대학교',
  '홍익대학교',
  '숭실대학교',
  '국민대학교',
  '세종대학교',
  '숙명여자대학교',
  '광운대학교',
  '명지대학교',
  '상명대학교',
  '가천대학교',
  '인하대학교',
  '아주대학교',
  '단국대학교',
  '한국항공대학교',
  '한국공학대학교',
  '한국교원대학교',
  '부산대학교',
  '경북대학교',
  '전남대학교',
  '전북대학교',
  '충남대학교',
  '충북대학교',
  '강원대학교',
  '제주대학교',
  '부경대학교',
  '영남대학교',
  '동아대학교',
  '계명대학교',
  '조선대학교',
  '원광대학교',
  '울산대학교',
  '인천대학교',
  '한림대학교',
  '가톨릭대학교',
  '덕성여자대학교',
  '동덕여자대학교',
  '성신여자대학교',
];

export const countryOptions = [
  '독일',
  '프랑스',
  '스페인',
  '이탈리아',
  '미국',
  '영국',
  '일본',
  '캐나다',
  '호주',
  '네덜란드',
  '체코',
  '포르투갈',
  '벨기에',
  '폴란드',
  '핀란드',
  '노르웨이',
  '스웨덴',
  '아일랜드',
  '덴마크',
  '오스트리아',
  '스위스',
  '중국',
  '대만',
  '싱가포르',
  '홍콩',
  '뉴질랜드',
  '멕시코',
  '브라질',
  '미정',
  CUSTOM_COUNTRY_OPTION,
];
