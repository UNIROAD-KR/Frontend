import type { ImageSourcePropType } from "react-native";

export interface PartnerSchoolExample {
  id: string;
  name: string;
  country: string;
  city: string;
  rating: number;
  tags: string[];
  image: ImageSourcePropType;
}

export const partnerSchoolExamples: PartnerSchoolExample[] = [
  {
    id: '1',
    name: '뮌헨 공과대학교 (TUM)',
    country: '독일',
    city: '뮌헨',
    rating: 4.8,
    tags: ['#기숙사좋음', '#영어수업많음', '#물가높음'],
    image: require('../../assets/images/Munich.png'),
  },
  {
    id: '2',
    name: '베를린 자유대학교',
    country: '독일',
    city: '베를린',
    rating: 4.6,
    tags: ['#기숙사보장', '#도시라이프', '#역사깊음'],
    image: require('../../assets/images/Munich.png'),
  },
  {
    id: '3',
    name: '콘스탄츠 공과대학교',
    country: '독일',
    city: '콘스탄츠',
    rating: 4.5,
    tags: ['#호수근처', '#소도시감성', '#치안좋음'],
    image: require('../../assets/images/Munich.png'),
  },
  {
    id: '4',
    name: '아우크스부르크 공과대학교',
    country: '독일',
    city: '아우크스부르크',
    rating: 4.4,
    tags: ['#물가저렴', '#친절한버디', '#조용한캠퍼스'],
    image: require('../../assets/images/Munich.png'),
  },
  {
    id: '5',
    name: 'UCLA (University of California, LA)',
    country: '미국',
    city: '로스앤젤레스',
    rating: 4.9,
    tags: ['#날씨최고', '#캠퍼스낭만', '#물가매우높음'],
    image: require('../../assets/images/UCLA.png'),
  },
  {
    id: '6',
    name: '캘리포니아 주립대 롱비치 (CSULB)',
    country: '미국',
    city: '롱비치',
    rating: 4.5,
    tags: ['#해변근접', '#서핑천국', '#따뜻한기후'],
    image: require('../../assets/images/UCLA.png'),
  },
  {
    id: '7',
    name: '파리 1대학 판테온 소르본',
    country: '프랑스',
    city: '파리',
    rating: 4.7,
    tags: ['#파리중심', '#예술인문', '#유럽여행쉬움'],
    image: require('../../assets/images/franch.png'),
  },
  {
    id: '8',
    name: '리옹 3대학',
    country: '프랑스',
    city: '리옹',
    rating: 4.4,
    tags: ['#미식의도시', '#프랑스남부', '#적당한물가'],
    image: require('../../assets/images/franch.png'),
  },
  {
    id: '9',
    name: '와세다 대학교',
    country: '일본',
    city: '도쿄',
    rating: 4.7,
    tags: ['#WISH기숙사', '#신주쿠인접', '#한국유학생많음'],
    image: require('../../assets/images/japan.png'),
  },
  {
    id: '10',
    name: '교토 대학교',
    country: '일본',
    city: '교토',
    rating: 4.8,
    tags: ['#전통적캠퍼스', '#벚꽃명소', '#조용한생활'],
    image: require('../../assets/images/japan.png'),
  },
];
