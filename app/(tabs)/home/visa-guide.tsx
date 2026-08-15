import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppBackButton } from '@/components/ui/app-back-button';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';

const COUNTRY_HEADER_META: Record<string, { flag: string; title: string; desc: string }> = {
  독일: {
    flag: '🇩🇪',
    title: '독일 교환학생 출국 준비 가이드',
    desc: '출국 전 필요한 정보를 한 곳에서 확인하세요.',
  },
  프랑스: {
    flag: '🇫🇷',
    title: '프랑스 교환학생 출국 준비 가이드',
    desc: '출국 전 필요한 정보를 한 곳에서 확인하세요.',
  },
  미국: {
    flag: '🇺🇸',
    title: '미국 교환학생 출국 준비 가이드',
    desc: '출국 전 필요한 정보를 한 곳에서 확인하세요.',
  },
  일본: {
    flag: '🇯🇵',
    title: '일본 교환학생 출국 준비 가이드',
    desc: '출국 전 필요한 정보를 한 곳에서 확인하세요.',
  },
  체코: {
    flag: '🇨🇿',
    title: '체코 교환학생 출국 준비 가이드',
    desc: '출국 전 필요한 정보를 한 곳에서 확인하세요.',
  },
};

const GUIDE_CATEGORY_ORDER = [
  '슈페어콘토 개설',
  '비자',
  '은행/카드',
  '보험',
  '유심/eSIM',
  '입국 후 등록',
];

const PREP_CATEGORY_META: Record<string, { emoji: string; title: string; desc: string }> = {
  '슈페어콘토 개설': {
    emoji: '💶',
    title: '슈페어콘토 개설',
    desc: '독일 체류비 증명을 위한 계좌 준비하기',
  },
  비자: {
    emoji: '🛂',
    title: '비자',
    desc: '비자 신청 절차 및 준비 서류 확인하기',
  },
  '은행/카드': {
    emoji: '💳',
    title: '은행/카드',
    desc: '해외 결제 카드 및 계좌 정보 확인하기',
  },
  보험: {
    emoji: '🛡️',
    title: '보험',
    desc: '필수 보험 가입 가이드 확인하기',
  },
  '유심/eSIM': {
    emoji: '📱',
    title: '유심/eSIM',
    desc: '현지 통신사 및 유심 정보 확인하기',
  },
  항공권: {
    emoji: '✈️',
    title: '항공권',
    desc: '항공권 예약 및 이동 정보 확인하기',
  },
  숙소: {
    emoji: '🏠',
    title: '숙소',
    desc: '기숙사 및 거주지 관련 정보 확인하기',
  },
  '입국 후 등록': {
    emoji: '📍',
    title: '입국 후 등록',
    desc: '거주지 등록 및 체류 관련 절차 확인하기',
  },
};

type CountryChecklist = {
  name: string;
  title: string;
  subtitle: string;
  accent: string;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  visaUrl: string;
  checklist: {
    id: string;
    title: string;
    category: string;
    required?: boolean;
  }[];
};

const COUNTRY_CHECKLISTS: CountryChecklist[] = [
  {
    name: '독일',
    title: '독일 출국 가이드',
    subtitle: '비자, 보험, 슈페어콘토, 거주지 등록까지 한 번에 준비하세요',
    accent: '#2F66D0',
    tint: '#EEF4FF',
    icon: 'airplane',
    visaUrl: 'https://example.com/visa/de',
    checklist: [
      { id: 'de-blocked-account', title: '슈페어콘토 개설', category: '슈페어콘토 개설', required: true },
      { id: 'de-visa', title: '학생비자 신청 서류 확인', category: '비자', required: true },
      { id: 'de-blocked', title: '슈페어콘토 준비', category: '은행/카드', required: true },
      { id: 'de-insurance', title: '공보험 또는 유학생 보험 가입', category: '보험', required: true },
      { id: 'de-esim', title: '유심/eSIM 준비', category: '유심/eSIM' },
      { id: 'de-flight', title: '항공권 예약', category: '항공권', required: true },
      { id: 'de-house', title: '숙소 계약서 및 주소 확인', category: '숙소' },
      { id: 'de-register', title: '입국 후 거주지 등록 준비', category: '입국 후 등록' },
    ],
  },
  {
    name: '프랑스',
    title: '프랑스 출국 가이드',
    subtitle: '장기 학생비자, 보험, CAF 준비 흐름을 미리 확인하세요',
    accent: '#4569D4',
    tint: '#F0F4FF',
    icon: 'business',
    visaUrl: 'https://example.com/visa/fr',
    checklist: [
      { id: 'fr-campus', title: 'Campus France 절차 확인', category: '비자', required: true },
      { id: 'fr-visa', title: '장기 학생비자 예약', category: '비자', required: true },
      { id: 'fr-insurance', title: '유학생 보험 가입', category: '보험' },
      { id: 'fr-esim', title: '현지 유심/eSIM 준비', category: '유심/eSIM' },
      { id: 'fr-bank', title: '해외 결제 카드 점검', category: '은행/카드' },
      { id: 'fr-house', title: '숙소 증빙 서류 준비', category: '숙소', required: true },
    ],
  },
  {
    name: '미국',
    title: '미국 출국 가이드',
    subtitle: 'F-1/J-1 비자, SEVIS, 캠퍼스 생활 준비를 정리하세요',
    accent: '#1D4ED8',
    tint: '#EDF5FF',
    icon: 'school',
    visaUrl: 'https://example.com/visa/us',
    checklist: [
      { id: 'us-ds', title: 'DS-160 또는 DS-2019 서류 확인', category: '비자', required: true },
      { id: 'us-sevis', title: 'SEVIS Fee 납부', category: '비자', required: true },
      { id: 'us-interview', title: '대사관 인터뷰 예약', category: '비자', required: true },
      { id: 'us-insurance', title: '학교 요구 보험 조건 확인', category: '보험' },
      { id: 'us-card', title: '해외 결제 카드 준비', category: '은행/카드' },
      { id: 'us-flight', title: '항공권 예약', category: '항공권' },
    ],
  },
  {
    name: '일본',
    title: '일본 출국 가이드',
    subtitle: '입국 서류, 재류카드, 생활 준비를 차근차근 챙기세요',
    accent: '#315B9C',
    tint: '#F1F6FF',
    icon: 'file-tray-full',
    visaUrl: 'https://example.com/visa/jp',
    checklist: [
      { id: 'jp-coe', title: '재류자격인정증명서 확인', category: '비자', required: true },
      { id: 'jp-visa', title: '유학비자 신청', category: '비자', required: true },
      { id: 'jp-esim', title: '일본 유심/eSIM 준비', category: '유심/eSIM' },
      { id: 'jp-insurance', title: '국민건강보험 가입 절차 확인', category: '보험' },
      { id: 'jp-cash', title: '초기 생활비와 카드 준비', category: '은행/카드' },
      { id: 'jp-register', title: '입국 후 주민등록 절차 확인', category: '입국 후 등록' },
    ],
  },
  {
    name: '체코',
    title: '체코 출국 가이드',
    subtitle: '장기비자, 보험 영문증명, 숙소 서류를 미리 준비하세요',
    accent: '#2457C5',
    tint: '#EEF4FF',
    icon: 'documents',
    visaUrl: 'https://example.com/visa/cz',
    checklist: [
      { id: 'cz-visa', title: '장기비자 신청 예약', category: '비자', required: true },
      { id: 'cz-docs', title: '입학허가서 및 재정증명 준비', category: '비자', required: true },
      { id: 'cz-insurance', title: '체코 인정 보험 가입', category: '보험', required: true },
      { id: 'cz-house', title: '숙소 확인서 준비', category: '숙소' },
      { id: 'cz-esim', title: '유심/eSIM 준비', category: '유심/eSIM' },
      { id: 'cz-flight', title: '항공권 예약', category: '항공권' },
    ],
  },
];

const visaGuideData = {
  germany: {
    countryName: '독일',
    visaName: '학생비자',
    timeline: ['온라인 비자 신청', '대사관 방문 및 서류 제출', '비자 수령'],
    sections: [
      {
        id: 'prep',
        title: '비자 신청 준비 절차',
        desc: '비자 신청 및 예약 전 준비 과정',
        icon: 'create-outline' as const,
      },
      {
        id: 'issue',
        title: '비자 발급 절차',
        desc: '예약부터 비자 수령까지',
        icon: 'business-outline' as const,
      },
    ],
    entryQuestions: [
      {
        q: '입학허가서를 받을 예정인가요?',
        answer: 'YES',
        meaning: '독일 대학에서 공식 입학허가서 또는 수학 허가서를 받을 예정인지 확인하는 질문입니다.',
        caution: '교환학생으로 독일 대학에 입학 예정이라면 YES를 선택합니다.',
      },
      {
        q: '독일 학위를 취득한 적이 있나요?',
        answer: 'NO',
        meaning: '기존 독일 학위 취득 이력을 묻는 항목입니다.',
        caution: '일반적인 교환학생 준비생은 NO를 선택합니다.',
      },
      {
        q: '정규 학위 과정인가요?',
        answer: 'YES',
        meaning: '대학 학업 목적의 체류인지 확인하는 질문입니다.',
        caution: '교환학생도 대학 수학 목적이므로 YES로 진행합니다.',
      },
      {
        q: '박사과정 예정인가요?',
        answer: 'NO',
        meaning: '박사 연구 또는 박사과정 체류인지 구분합니다.',
        caution: '학부 또는 석사 교환학생이면 NO를 선택합니다.',
      },
      {
        q: '독일어 능력이 있나요?',
        answer: '독일어 성적이 없으면 NO',
        meaning: '독일어 증명서를 제출할 수 있는지 확인합니다.',
        caution: '영어 수업만 수강하고 독일어 성적이 없다면 NO로 두고 영어 성적 제출을 준비합니다.',
      },
      {
        q: '생활비는 어떻게 충당하나요?',
        answer: '슈페어콘토 이용 시 해당 항목 선택',
        meaning: '체류비를 증명하는 방식을 선택하는 항목입니다.',
        caution: 'Blocked Account를 만들었다면 슈페어콘토 항목을 선택합니다.',
      },
      {
        q: '수업 언어는?',
        answer: '영어 수업이면 IELTS/TOEFL 제출',
        meaning: '독일에서 수강할 수업 언어와 어학 증빙을 연결하는 항목입니다.',
        caution: '영어 강의라면 IELTS, TOEFL 등 영어 성적표를 업로드할 수 있게 준비합니다.',
      },
    ],
    uploadDocuments: [
      {
        id: 'passport',
        title: 'Passport',
        desc: '여권 사본 PDF',
      },
      {
        id: 'admission',
        title: 'Admission Letter',
        desc: '파견교 공식 입학허가서',
        warnings: ['이메일 캡처본 불가', '반드시 공식 Admission Letter 필요'],
      },
      {
        id: 'motivation',
        title: 'Motivation Letter',
        desc: '왜 독일에서 공부하려는지 설명하는 문서',
        guide: [
          '자기소개: 학교, 전공, 파견교',
          '학업계획: 독일에서 들을 수업, 교환학생 목표',
          '진로계획: 귀국 후 활용계획',
        ],
        note: '권장분량: 영문 A4 1장',
      },
      {
        id: 'cv',
        title: 'CV',
        desc: '영문 이력서',
        guide: ['Europass 사용 추천', '학력, 활동, 자격증, 어학성적 포함'],
      },
      {
        id: 'language',
        title: 'Language Certificate',
        desc: 'IELTS, TOEFL 등 수업 언어를 증명하는 성적표',
      },
      {
        id: 'livelihood',
        title: 'Proof of Secure Livelihood',
        desc: '슈페어콘토 증명서',
      },
      {
        id: 'insurance',
        title: 'Proof of Health Insurance',
        desc: 'TK 보험 가입 증명서',
      },
      {
        id: 'other',
        title: 'Other Documents',
        desc: '본교 영문 재학증명서',
        warnings: ['추가 요청 방지를 위해 제출 권장'],
      },
    ],
  },
} as const;

const normalizeCountry = (country: string | null) => {
  if (!country) return COUNTRY_CHECKLISTS[0].name;
  return COUNTRY_CHECKLISTS.some((item) => item.name === country)
    ? country
    : COUNTRY_CHECKLISTS[0].name;
};

export default function VisaGuideScreen() {
  const [screenMode, setScreenMode] = useState<
    'checklist' | 'visa' | 'bank' | 'sim' | 'insurance' | 'blockedAccount'
  >('checklist');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CHECKLISTS[0].name);
  const [checkedVisaSteps, setCheckedVisaSteps] = useState<Record<number, boolean>>({ 0: true });
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    여권: true,
    증명사진: true,
  });

  const selectedIndex = COUNTRY_CHECKLISTS.findIndex((item) => item.name === selectedCountry);
  const country = useMemo(
    () => COUNTRY_CHECKLISTS[selectedIndex >= 0 ? selectedIndex : 0],
    [selectedIndex],
  );
  const countryMeta = COUNTRY_HEADER_META[country.name] ?? COUNTRY_HEADER_META.독일;
  const guideCategories = useMemo(() => {
    const availableCategories = new Set(country.checklist.map((item) => item.category));
    return GUIDE_CATEGORY_ORDER.filter((category) => availableCategories.has(category));
  }, [country.checklist]);

  useEffect(() => {
    const loadCountry = async () => {
      const savedCountry = await AsyncStorage.getItem('dispatchedCountry');
      const initialCountry = normalizeCountry(savedCountry);
      setSelectedCountry(initialCountry);
    };

    loadCountry();
  }, []);

  const selectCountry = (name: string) => {
    setSelectedCountry(name);
  };

  if (screenMode === 'visa') {
    return (
      <VisaApplicationGuide
        countryName={country.name}
        checkedVisaSteps={checkedVisaSteps}
        checkedDocs={checkedDocs}
        onBack={() => setScreenMode('checklist')}
        onToggleStep={(index) =>
          setCheckedVisaSteps((prev) => ({ ...prev, [index]: !prev[index] }))
        }
        onToggleDoc={(doc) => setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }))}
      />
    );
  }

  if (screenMode === 'bank') {
    return <BankAccountGuide onBack={() => setScreenMode('checklist')} />;
  }

  if (screenMode === 'sim') {
    return <SimGuide onBack={() => setScreenMode('checklist')} />;
  }

  if (screenMode === 'insurance') {
    return <InsuranceGuide onBack={() => setScreenMode('checklist')} />;
  }

  if (screenMode === 'blockedAccount') {
    return <BlockedAccountGuide onBack={() => setScreenMode('checklist')} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />

        <Text style={styles.headerTitle}>국가별 출국 가이드</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
          contentContainerStyle={styles.countryContent}
        >
          {COUNTRY_CHECKLISTS.map((item) => {
            const active = item.name === selectedCountry;

            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.countryChip, active && styles.countryChipActive]}
                onPress={() => selectCountry(item.name)}
                activeOpacity={0.85}
              >
                <Text style={[styles.countryChipText, active && styles.countryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.countrySummary}>
          <Text style={styles.countryFlag}>{countryMeta.flag}</Text>
          <View style={styles.countrySummaryText}>
            <Text style={styles.countrySummaryGuideTitle}>{countryMeta.title}</Text>
            <Text style={styles.countrySummaryDesc}>{countryMeta.desc}</Text>
          </View>
        </View>

        <View style={styles.guideList}>
          <Text style={styles.guideListHeaderTitle}>출국 준비 가이드</Text>
          {guideCategories.map((category, index) => {
            const meta = PREP_CATEGORY_META[category] ?? {
              emoji: '✅',
              title: category,
              desc: `${category} 정보 확인하기`,
            };
            const isVisa = category === '비자';
            const isBank = category === '은행/카드';
            const isSim = category === '유심/eSIM';
            const isInsurance = category === '보험';
            const isBlockedAccount = category === '슈페어콘토 개설';

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.guideListItem,
                  index === guideCategories.length - 1 && styles.guideListItemLast,
                ]}
                onPress={() => {
                  if (isVisa) setScreenMode('visa');
                  if (isBank) setScreenMode('bank');
                  if (isSim) setScreenMode('sim');
                  if (isInsurance) setScreenMode('insurance');
                  if (isBlockedAccount) setScreenMode('blockedAccount');
                }}
                activeOpacity={0.86}
              >
                <View style={styles.guideListIconBox}>
                  <Text style={styles.guideListEmoji}>{meta.emoji}</Text>
                </View>
                <View style={styles.guideListText}>
                  <Text style={styles.guideListTitle}>{meta.title}</Text>
                  <Text style={styles.guideListDesc}>{meta.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

function BankAccountGuide({ onBack }: { onBack: () => void }) {
  const [openAccountCard, setOpenAccountCard] = useState<string | null>(null);
  const accountCards = [
    {
      id: 'n26',
      title: 'N26 계좌',
      desc: '독일 현지 생활비 관리와 카드 사용을 위한 계좌',
      points: [
        '독일 현지 IBAN을 제공해 기숙사비, 보험료, 통신비 납부에 편리',
        '모바일 앱으로 계좌 관리가 가능하고 영어 지원이 잘 되어 있음',
        '계좌 개설 시 여권을 이용한 영상 인증(화상통화)이 필요',
      ],
      links: [
        {
          title: 'N26 장단점 바로가기',
          url: 'https://blog.naver.com/ottff123/224197289904',
        },
        {
          title: 'N26 개설 방법 바로가기',
          url: 'https://blog.naver.com/ottff123/224200944417',
        },
      ],
      icon: 'card-outline' as const,
    },
    {
      id: 'wise',
      title: 'Wise 계좌',
      desc: '해외 송금과 환전 수수료를 함께 확인하기 좋은 계좌',
      points: [
        '벨기에 기반 금융 서비스로 다양한 통화 관리 가능',
        '한국 → 독일 송금 시 환율이 투명한 편',
        '온라인으로 화상통화 없이 간편하게 개설 가능',
      ],
      links: [
         {
          title: 'Wise 장단점 바로가기',
          url: 'https://blog.naver.com/moinmoin99/224148034214',
        },
        {
          title: 'Wise 개설 방법 바로가기',
          url: 'https://blog.naver.com/moinmoin99/224148034214',
        },
      ],
      icon: 'globe-outline' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton onPress={onBack} style={styles.iconBtn} />

        <Text style={styles.headerTitle}>은행/카드 가이드</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.telecomCardList}>
          {accountCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.telecomCard}
              onPress={() => setOpenAccountCard((prev) => (prev === card.id ? null : card.id))}
              activeOpacity={0.88}
            >
              <View style={styles.bigGuideIcon}>
                <Ionicons name={card.icon} size={19} color={BLUE} />
              </View>
              <View style={styles.telecomCardTitleRow}>
                <Text style={styles.telecomCardTitle}>{card.title}</Text>
                <Ionicons
                  name={openAccountCard === card.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.telecomCardDesc}>{card.desc}</Text>
              {openAccountCard === card.id && (
                <View style={styles.telecomPointList}>
                  {card.points.map((point) => (
                    <Text key={point} style={styles.telecomPointText}>
                      - {point}
                    </Text>
                  ))}
                  <View style={styles.telecomBlogLinkSpacer} />
                  {card.links.map((link) => (
                    <TouchableOpacity
                      key={link.url}
                      style={styles.telecomBlogLink}
                      onPress={() => Linking.openURL(link.url)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="reader-outline" size={16} color={BLUE} />
                      <Text style={styles.telecomBlogLinkText}>{link.title}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.accountNoteBox}>
          <Text style={styles.accountNoteText}>
            교환학생들 사이에서는 보통 다음과 같이 쓰는 경우가 많습니다.
          </Text>
          <Text style={styles.accountNoteHighlightText}>
            1) N26 = 독일 생활용 주계좌 {'\n'}2) Wise = 한국에서 생활비 받을 때 쓰는 송금용 계좌
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function BlockedAccountGuide({ onBack }: { onBack: () => void }) {
  const [openBlockedSection, setOpenBlockedSection] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton onPress={onBack} style={styles.iconBtn} />

        <Text style={styles.headerTitle}>슈페어콘토 개설</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.blockedAccountCard}>
          <View style={styles.bigGuideIcon}>
            <Ionicons name="wallet-outline" size={19} color={BLUE} />
          </View>
          <Text style={styles.blockedAccountTitle}>독일 학생비자 재정 증명 준비</Text>
          <Text style={styles.blockedAccountLead}>
            독일 학생비자 발급을 위해 필요한 동결 계좌입니다. 체류 기간 동안 사용할 생활비를 미리 예치해두고, 독일 입국 후 매달 일정 금액을 인출하여 사용할 수 있습니다.
          </Text>

          <TouchableOpacity
            style={styles.blockedAccountBlogLink}
            onPress={() => Linking.openURL('https://blog.naver.com/oiseohyun/224302083472')}
            activeOpacity={0.85}
          >
            <Ionicons name="reader-outline" size={16} color={BLUE} />
            <Text style={styles.telecomBlogLinkText}>슈페어콘토 개설 방법 바로가기</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.blockedAccountSection}>
            <TouchableOpacity
              style={styles.blockedAccountSectionHeader}
              onPress={() => setOpenBlockedSection((prev) => (prev === 'about' ? null : 'about'))}
              activeOpacity={0.85}
            >
              <Text style={styles.blockedAccountSectionTitle}>슈페어콘토란?</Text>
              <Ionicons name={openBlockedSection === 'about' ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
            </TouchableOpacity>
            {openBlockedSection === 'about' && (
              <View style={styles.blockedAccountContentBox}>
                {[
                  '독일 정부가 요구하는 재정 증명 수단',
                  '체류 기간 동안 생활비를 미리 예치',
                  '매월 정해진 금액만 인출 가능',
                ].map((item) => (
                  <Text key={item} style={styles.blockedAccountBullet}>- {item}</Text>
                ))}
              </View>
            )}
          </View>

          <View style={styles.blockedAccountSection}>
            <TouchableOpacity
              style={styles.blockedAccountSectionHeader}
              onPress={() => setOpenBlockedSection((prev) => (prev === 'amount' ? null : 'amount'))}
              activeOpacity={0.85}
            >
              <Text style={styles.blockedAccountSectionTitle}>필요 금액 (2026년 기준)</Text>
              <Ionicons name={openBlockedSection === 'amount' ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
            </TouchableOpacity>
            {openBlockedSection === 'amount' && (
              <View style={styles.blockedAccountContentBox}>
                {[
                  '월 생활비 증빙: 992유로',
                  '월 계좌 수수료: 5유로',
                  '개설비: 89유로',
                  '예치 버퍼: 100유로',
                ].map((item) => (
                  <Text key={item} style={styles.blockedAccountBullet}>- {item}</Text>
                ))}
                <View style={styles.blockedAccountFormulaBox}>
                  <Text style={styles.blockedAccountFormulaLabel}>예상 필요 금액</Text>
                  <Text style={styles.blockedAccountFormula}>189 + (997 × 체류 개월 수) 유로</Text>
                </View>
                <Text style={styles.blockedAccountExample}>예시) 5개월 체류: 약 5,174유로</Text>
                <Text style={styles.blockedAccountExample}>예시) 6개월 체류: 약 6,171유로</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.accountNoteBox}>
          <Text style={styles.accountNoteText}>
            개설기간의 경우,{'\n'}비자 기간을 충분히 커버할 수 있도록 설정하는 것이 좋습니다.
          </Text>
          <Text style={[styles.accountNoteText, styles.insuranceRecommendFirstLine]}>
            <Text style={styles.accountNoteHighlightText}>
              대부분의 교환학생은 5~6개월로 개설하며, Expatrio를 가장 많이 이용합니다.
            </Text>
            {' '}Expatrio에서는 슈페어콘토 단독 가입 또는 공보험이 포함된 Value Package를 선택할 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SimGuide({ onBack }: { onBack: () => void }) {
  const [openTelecomCard, setOpenTelecomCard] = useState<string | null>(null);
  const telecomCards = [
    {
      id: 'aldi-talk',
      title: 'Aldi Talk',
      desc: 'Aldi 마트에서 실물 유심을 편하게 구매할 수 있는 선불 유심',
      points: [
        '앱에서 데이터 사용량 조회와 충전 가능',
        '신규 starter pack으로 10유로 4주 요금제 혜택',
        'O2 네트워크 기반, 제공 데이터 대비 가격이 합리적인 편',
      ],
      links: [
        {
          title: 'Aldi Talk 개설 방법 바로가기',
          url: 'https://blog.naver.com/ukkeat/224223133487',
        },
      ],
      icon: 'storefront-outline' as const,
    },
    {
      id: 'o2',
      title: 'O2',
      desc: '저가 중심의 대형 통신사로 eSIM을 지원하는 선택지',
      points: [
        '후기상 Aldi Talk보다 빠르고 5G가 잘 터지는 편',
        '선불 요금제 기준 9.99유로에 6GB 사용 가능',
        '한국 유심과 함께 쓰기 편해 O2 매장에서 많이 구매',
      ],
      links: [
        {
          title: 'O2 개설 방법 바로가기',
          url: 'https://blog.naver.com/eawoniya/224256449745',
        },
      ],
      icon: 'phone-portrait-outline' as const,
    },
    {
      id: 'fraenk',
      title: 'fraenk',
      desc: '앱으로 가입부터 번호 발급까지 진행할 수 있는 eSIM',
      points: [
        '실물 유심 없이 휴대폰에서 회선만 바꿔 사용할 수 있어 편리',
        'fraenk 앱에서 가입, 번호 발급, 데이터 사용량 확인 가능',
        '유럽 여러 지역에서 사용하기 좋고 여행 중에도 안정적인 편',
      ],
      links: [
        {
          title: 'fraenk 개설 방법 바로가기 1',
          url: 'https://blog.naver.com/2_nxm_2/224276074032',
        },
        {
          title: 'fraenk 개설 방법 바로가기 2',
          url: 'https://blog.naver.com/may_12kr/224228376856',
        },
      ],
      icon: 'radio-outline' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton onPress={onBack} style={styles.iconBtn} />

        <Text style={styles.headerTitle}>유심/eSIM 가이드</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.telecomCardList}>
          {telecomCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.telecomCard}
              onPress={() => setOpenTelecomCard((prev) => (prev === card.id ? null : card.id))}
              activeOpacity={0.88}
            >
              <View style={styles.bigGuideIcon}>
                <Ionicons name={card.icon} size={19} color={BLUE} />
              </View>
              <View style={styles.telecomCardTitleRow}>
                <Text style={styles.telecomCardTitle}>{card.title}</Text>
                <Ionicons
                  name={openTelecomCard === card.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.telecomCardDesc}>{card.desc}</Text>
              {openTelecomCard === card.id && (
                <View style={styles.telecomPointList}>
                  {card.points.map((point) => (
                    <Text key={point} style={styles.telecomPointText}>
                      - {point}
                    </Text>
                  ))}
                  <View style={styles.telecomBlogLinkSpacer} />
                  {card.links.map((link) => (
                    <TouchableOpacity
                      key={link.url}
                      style={styles.telecomBlogLink}
                      onPress={() => Linking.openURL(link.url)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="reader-outline" size={16} color={BLUE} />
                      <Text style={styles.telecomBlogLinkText}>{link.title}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.telecomNoteBox}>
          <Text style={styles.telecomNoteText}>
            세 통신사 모두 EU 내에서 자유롭게 데이터 사용이 가능합니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InsuranceGuide({ onBack }: { onBack: () => void }) {
  const [openInsuranceCard, setOpenInsuranceCard] = useState<string | null>(null);
  const [openInsuranceCompare, setOpenInsuranceCompare] = useState(false);
  const insuranceCards = [
    {
      id: 'public',
      title: 'TK 공보험',
      desc: '한국인 유학생들이 가장 선호하는 공보험사 중 하나',
      points: [
        '독일 대학이나 비자 절차에서 인정받기 쉬운 편',
        '병원 이용 시 보장 범위가 넓고 안정적',
        '사보험보다 비용이 높지만, 여러가지 혜택 존재',
      ],
       links: [
        {
          title: 'TK 공보험 활성화 절차 바로가기',
          url: 'https://blog.naver.com/nknk040820/224259526932',
        },
      ],
      icon: 'shield-checkmark-outline' as const,
    },
    {
      id: 'private',
      title: '사보험',
      desc: '단기 체류나 교환학생 조건에 맞춰 비교해볼 수 있는 보험',
      points: [
        '공보험 대비 보험료가 저렴한 편',
        '이후 공보험사 공증 받는 절차 필요',
        '학교나 비자 신청에서 인정되는 보험인지 먼저 확인하는 것이 중요',
      ],
      links: [
        {
          title: '마비스타(MAWISTA) 가입 방법 바로가기',
          url: 'https://blog.naver.com/imnoting_/224299059998',
        },
        {
          title: '공증 신청 바로가기',
          url: 'https://blog.naver.com/lovelovelov3/224230722270',
        },
      ],
      icon: 'medical-outline' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton onPress={onBack} style={styles.iconBtn} />

        <Text style={styles.headerTitle}>보험 가이드</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.telecomCardList}>
          {insuranceCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.telecomCard}
              onPress={() => setOpenInsuranceCard((prev) => (prev === card.id ? null : card.id))}
              activeOpacity={0.88}
            >
              <View style={styles.bigGuideIcon}>
                <Ionicons name={card.icon} size={19} color={BLUE} />
              </View>
              <View style={styles.telecomCardTitleRow}>
                <Text style={styles.telecomCardTitle}>{card.title}</Text>
                <Ionicons
                  name={openInsuranceCard === card.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.telecomCardDesc}>{card.desc}</Text>
              {openInsuranceCard === card.id && (
                <View style={styles.telecomPointList}>
                  {card.points.map((point) => (
                    <Text key={point} style={styles.telecomPointText}>
                      - {point}
                    </Text>
                  ))}
                  <View style={styles.telecomBlogLinkSpacer} />
                  {card.links.map((link) => (
                    <TouchableOpacity
                      key={link.url}
                      style={styles.telecomBlogLink}
                      onPress={() => Linking.openURL(link.url)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="reader-outline" size={16} color={BLUE} />
                      <Text style={styles.telecomBlogLinkText}>{link.title}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.insuranceCompareBox}
          onPress={() => setOpenInsuranceCompare((prev) => !prev)}
          activeOpacity={0.88}
        >
          <View style={styles.insuranceCompareHeader}>
            <Text style={styles.insuranceCompareTitle}>TK vs MAWISTA 한눈에 비교하기</Text>
            <Ionicons
              name={openInsuranceCompare ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#94A3B8"
            />
          </View>

          {openInsuranceCompare && (
            <View style={styles.insuranceCompareTable}>
              <View style={[styles.insuranceCompareTableRow, styles.insuranceCompareTableHeader]}>
                <Text style={[styles.insuranceCompareTableCell, styles.insuranceCompareTableLabel]}>항목</Text>
                <Text style={[styles.insuranceCompareTableCell, styles.insuranceCompareTableHeadText]}>TK</Text>
                <Text style={[styles.insuranceCompareTableCell, styles.insuranceCompareTableHeadText]}>MAWISTA</Text>
              </View>
              {[
                ['월 보험료', '상대적으로 높음', '상대적으로 저렴'],
                ['비자 및 학교 인정', '인정 절차가 비교적 수월함', '학교 및 비자 요건 확인 필요'],
                ['보장 범위', '넓고 안정적인 보장', '상품에 따라 상이'],
                ['추천 대상', '장기 유학생, 안정성을 중시하는 학생', '교환학생, 비용을 아끼고 싶은 학생'],
              ].map(([label, tk, mawista]) => (
                <View key={label} style={styles.insuranceCompareTableRow}>
                  <Text style={[styles.insuranceCompareTableCell, styles.insuranceCompareTableLabel]}>{label}</Text>
                  <Text style={styles.insuranceCompareTableCell}>{tk}</Text>
                  <Text style={styles.insuranceCompareTableCell}>{mawista}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.accountNoteBox}>
          <Text style={styles.accountNoteText}>
            독일 대학과 비자 요건에 따라 인정 여부가 달라질 수 있으므로,{'\n'}가입 전 반드시 확인하세요.
          </Text>
          <Text style={[styles.accountNoteHighlightText, styles.insuranceRecommendFirstLine]}>
            비용을 우선한다면? → MAWISTA
          </Text>
          <Text style={styles.accountNoteHighlightText}>안정성과 행정 편의성 및 공보험 혜택을 원한다면? → TK</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function VisaApplicationGuide({
  countryName: _countryName,
  checkedVisaSteps: _checkedVisaSteps,
  checkedDocs,
  onBack,
  onToggleStep: _onToggleStep,
  onToggleDoc,
}: {
  countryName: string;
  checkedVisaSteps: Record<number, boolean>;
  checkedDocs: Record<string, boolean>;
  onBack: () => void;
  onToggleStep: (index: number) => void;
  onToggleDoc: (doc: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<'overview' | 'prep' | 'issue'>('overview');
  const [openQuestion, setOpenQuestion] = useState<string | null>('입학허가서를 받을 예정인가요?');
  const [openVidexItem, setOpenVidexItem] = useState<string | null>('개인정보 입력');
  const guide = visaGuideData.germany;
  const overviewBlogLinks = [
    {
      id: 'visa-blog',
      title: '독일 학생비자 후기',
      desc: '신청 흐름과 준비 팁을 블로그에서 더 찾아보기',
      url: `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent('독일 학생비자 교환학생 후기')}`,
    },
    {
      id: 'documents-blog',
      title: '비자 서류 준비 후기',
      desc: '슈페어콘토, 보험, 입학허가서 준비 사례 보기',
      url: `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent('독일 학생비자 서류 준비 후기')}`,
    },
  ];
  const prepBlogLinks = [
    {
      id: 'documents-blog',
      title: '비자 서류 준비 후기',
      desc: '서류 준비 사례와 체크 포인트 보기',
      url: `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent('독일 학생비자 서류 준비 후기')}`,
    },
  ];
  const issueBlogLinks = [
    {
      id: 'pickup-blog',
      title: '비자 수령 후기',
      desc: '대사관 방문 이후 수령 과정 살펴보기',
      url: `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent('독일 학생비자 수령 후기')}`,
    },
  ];
  const blogLinks =
    activeSection === 'prep'
      ? prepBlogLinks
      : activeSection === 'issue'
        ? issueBlogLinks
        : overviewBlogLinks;
  void _countryName;
  void _checkedVisaSteps;
  void _onToggleStep;

  const toggleChecklist = (id: string) => onToggleDoc(id);

  const videxItems = [
    {
      title: '개인정보 입력',
      desc: '이름, 생년월일, 국적 등 기본 정보를 여권 표기와 동일하게 입력합니다.',
    },
    {
      title: '여권정보 입력',
      desc: '여권번호, 발급일, 만료일을 여권 원본과 동일하게 입력합니다.',
    },
    {
      title: '체류정보 입력',
      desc: '독일 체류 기간, 체류 목적, 파견 대학 정보를 신청 내용과 맞춰 입력합니다.',
    },
    {
      title: '부모님 정보 입력',
      desc: '부모님 성함, 생년월일, 주소를 요청 형식에 맞춰 입력합니다.',
    },
    {
      title: '독일 주소 입력',
      desc: '기숙사 주소가 있으면 해당 주소를, 아직 확정 전이면 예정 거주지를 입력합니다.',
    },
  ];

  const renderChecklistRow = (id: string, label: string) => {
    const checked = checkedDocs[id];

    return (
      <TouchableOpacity
        key={id}
        style={[styles.guideCheckRow, checked && styles.guideCheckRowDone]}
        onPress={() => toggleChecklist(id)}
        activeOpacity={0.85}
      >
        <View style={[styles.guideCheckBox, checked && styles.guideCheckBoxDone]}>
          {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
        <Text style={[styles.guideCheckText, checked && styles.guideCheckTextDone]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, desc: string) => (
    <View style={styles.detailHero}>
      <Text style={styles.detailEyebrow}>{guide.countryName} {guide.visaName}</Text>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailDesc}>{desc}</Text>
    </View>
  );

  const renderNumberedGuide = (items: string[]) => (
    <View style={styles.numberedList}>
      {items.map((item, index) => (
        <View key={item} style={styles.numberedRow}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.numberedText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderPrepGuide = () => (
    <>
      {renderSectionHeader(
        '비자 신청 준비 절차',
        'Consular Service Portal 계정 생성부터 서류 업로드 후 최종 제출까지 그대로 따라가세요.',
      )}

      <GuideStep index={1} title="독일 해외포털 계정 생성" desc="독일 비자 신청은 Consular Service Portal에서 시작됩니다.">
        {renderNumberedGuide([
          '해외포털 접속 및 회원가입',
          '국적 Korea 선택',
          'Visa for Study purposes and seeking a university place 선택',
          'Create Process 생성',
        ])}
        <TipBox tips={['이메일 2개 준비 권장', '로그인 시 인증코드 필요']} />
      </GuideStep>

      <GuideStep index={2} title="Entry Form 작성" desc="비자 신청 자격을 확인하는 사전 질문지입니다.">
        <View style={styles.accordionList}>
          {guide.entryQuestions.map((item) => {
            const open = openQuestion === item.q;

            return (
              <TouchableOpacity
                key={item.q}
                style={[styles.accordionItem, open && styles.accordionItemOpen]}
                onPress={() => setOpenQuestion(open ? null : item.q)}
                activeOpacity={0.88}
              >
                <View style={styles.accordionHeader}>
                  <Text style={styles.accordionQuestion}>{item.q}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={NAVY} />
                </View>
                {open && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.answerBadge}>권장 답변: {item.answer}</Text>
                    <Text style={styles.accordionText}>{item.meaning}</Text>
                    <Text style={styles.accordionCaution}>{item.caution}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </GuideStep>

      <GuideStep index={3} title="Application Form (VIDEX)" desc="실제 비자 신청서를 작성하는 단계입니다.">
        <View style={styles.accordionList}>
          {videxItems.map((item) => {
            const open = openVidexItem === item.title;

            return (
              <TouchableOpacity
                key={item.title}
                style={[styles.accordionItem, open && styles.accordionItemOpen]}
                onPress={() => setOpenVidexItem(open ? null : item.title)}
                activeOpacity={0.88}
              >
                <View style={styles.accordionHeader}>
                  <Text style={styles.accordionQuestion}>{item.title}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={NAVY} />
                </View>
                {open && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.accordionText}>{item.desc}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <WarningBox
          title="주의사항"
          lines={['VIDEX 작성 후 반드시 PDF 저장', '반드시 출력', '대사관 방문 시 지참']}
        />
      </GuideStep>

      <GuideStep index={4} title="서류 업로드" desc="Entry Form과 VIDEX 작성 후 필요한 서류를 업로드합니다.">
        <View style={styles.documentGrid}>
          {guide.uploadDocuments.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.documentCard, checkedDocs[doc.id] && styles.documentCardDone]}
              onPress={() => toggleChecklist(doc.id)}
              activeOpacity={0.9}
            >
              <View style={styles.documentHeader}>
                <View style={[styles.guideCheckBox, checkedDocs[doc.id] && styles.guideCheckBoxDone]}>
                  {checkedDocs[doc.id] && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.documentTitle}>{doc.title}</Text>
              </View>
              <Text style={styles.documentDesc}>{doc.desc}</Text>
              {'warnings' in doc &&
                doc.warnings?.map((warning) => (
                  <Text key={warning} style={styles.warningLine}>주의: {warning}</Text>
                ))}
              {'guide' in doc &&
                doc.guide?.map((guideLine) => (
                  <Text key={guideLine} style={styles.guideBullet}>- {guideLine}</Text>
                ))}
              {'note' in doc && <Text style={styles.documentNote}>{doc.note}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </GuideStep>

      <GuideStep index={5} title="최종 제출" desc="모든 입력과 업로드가 끝난 뒤 제출 상태까지 확인합니다.">
        <WarningBox
          title="가장 많이 하는 실수"
          lines={['서류 업로드만 하고 최종 Submit 버튼을 누르지 않는 경우가 많습니다.']}
        />
        {renderNumberedGuide([
          '업로드한 서류가 빠짐없이 들어갔는지 다시 확인',
          '최종 Submit 버튼 클릭',
          '제출 상태가 완료로 표시되는지 확인',
        ])}
      </GuideStep>
    </>
  );

  const renderIssueGuide = () => (
    <>
      {renderSectionHeader(
        '비자 발급 절차',
        '대사관 검토 이후 예약, 방문, 수령까지 놓치기 쉬운 실행 항목을 확인하세요.',
      )}

      <GuideStep index={1} title="서류 검토" desc="대사관이 제출 서류를 검토합니다.">
        <InfoRow label="예상 소요" value="약 1주일" />
        <InfoRow label="가능한 결과" value="승인 또는 보완 요청" />
      </GuideStep>

      <GuideStep index={2} title="영사과 방문 예약" desc="검토 완료 후 예약이 가능합니다. 경쟁이 심하므로 가능한 빨리 예약하세요.">
        {renderChecklistRow('booking-slot', '예약 슬롯 확인')}
        {renderChecklistRow('booking-complete', '예약 완료')}
        {renderChecklistRow('booking-confirmation', 'Booking Confirmation 저장')}
        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>예약 입력 정보</Text>
          {['성', '이름', '이메일', '국적', '생년월일', '성별', '여권번호', '전화번호'].map((item) => (
            <Text key={item} style={styles.infoPanelText}>- {item}</Text>
          ))}
        </View>
      </GuideStep>

      <GuideStep index={3} title="대사관 방문" desc="예약 시간에 맞춰 방문하고 원본 서류와 출력본을 제출합니다.">
        {renderChecklistRow('visit-passport', '여권')}
        {renderChecklistRow('visit-videx', 'VIDEX 출력본')}
        {renderChecklistRow('visit-booking', '예약 확인서')}
        {renderChecklistRow('visit-originals', '제출 서류 원본')}
        <WarningBox title="주의" lines={['예약 시간 10분 전 도착']} />
      </GuideStep>

      <GuideStep index={4} title="비자 수령" desc="인터뷰 이후 안내받은 일정에 맞춰 비자를 수령합니다.">
        {renderChecklistRow('pickup-schedule', '수령 일정 확인')}
        {renderChecklistRow('pickup-visa', '비자 수령 완료')}
      </GuideStep>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton
          style={styles.iconBtn}
          onPress={activeSection === 'overview' ? onBack : () => setActiveSection('overview')}
        />

        <Text style={styles.headerTitle}>독일 학생비자 가이드</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'overview' && (
          <View style={styles.guideCarouselSection}>
            <View style={styles.guideCardRow}>
              {guide.sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={styles.bigGuideCard}
                  onPress={() => setActiveSection(section.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.bigGuideIcon}>
                    <Ionicons
                      name={section.id === 'prep' ? 'document-text-outline' : 'shield-checkmark-outline'}
                      size={19}
                      color={BLUE}
                    />
                  </View>
                  <Text style={styles.bigGuideTitle}>{section.title}</Text>
                  <Text style={styles.bigGuideDesc} numberOfLines={2}>
                    {section.desc}
                  </Text>
                  <View style={styles.bigGuideArrow}>
                    <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        )}

        {activeSection === 'prep' && renderPrepGuide()}
        {activeSection === 'issue' && renderIssueGuide()}

        <View style={styles.blogLinkSection}>
          <Text style={[styles.blogLinkTitle, activeSection !== 'overview' && styles.relatedBlogLinkTitle]}>
            {activeSection === 'overview' ? '블로그 후기 모아보기' : '관련 블로그'}
          </Text>
          <View style={[styles.blogLinkList, activeSection !== 'overview' && styles.relatedBlogLinkList]}>
            {blogLinks.map((link, index) => (
              <TouchableOpacity
                key={link.id}
                style={[
                  styles.blogLinkItem,
                  activeSection !== 'overview' && styles.relatedBlogLinkItem,
                  index === blogLinks.length - 1 && styles.blogLinkItemLast,
                ]}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(link.url)}
              >
                <View style={[styles.blogLinkIcon, activeSection !== 'overview' && styles.relatedBlogLinkIcon]}>
                  <Ionicons name="reader-outline" size={18} color={BLUE} />
                </View>
                <View style={styles.blogLinkTextBox}>
                  <Text style={styles.blogLinkItemTitle}>{link.title}</Text>
                  <Text style={styles.blogLinkDesc}>{link.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function GuideStep({
  index,
  title,
  desc,
  children,
}: {
  index: number;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(index === 1);

  return (
    <View style={styles.guideStepCard}>
      <TouchableOpacity
        style={[styles.guideStepHeader, !open && styles.guideStepHeaderClosed]}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
      >
        <View style={styles.guideStepTopRow}>
          <View style={styles.guideStepBadge}>
            <Text style={styles.guideStepBadgeText}>STEP {index}</Text>
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={NAVY} />
        </View>
        <Text style={styles.guideStepTitle}>{title}</Text>
        <Text style={styles.guideStepDesc}>{desc}</Text>
      </TouchableOpacity>
      {open && <View style={styles.guideStepBody}>{children}</View>}
    </View>
  );
}

function TipBox({ tips }: { tips: string[] }) {
  return (
    <View style={styles.tipBox}>
      <Text style={styles.tipTitle}>추가 팁</Text>
      {tips.map((tip) => (
        <Text key={tip} style={styles.tipText}>- {tip}</Text>
      ))}
    </View>
  );
}

function WarningBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.warningBox}>
      <Text style={styles.warningTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.warningBoxText}>- {line}</Text>
      ))}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  headerRight: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 130,
  },
  countryScroll: {
    marginBottom: 14,
  },
  countryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  countryChip: {
    height: 36,
    paddingHorizontal: 17,
    borderRadius: 18,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryChipActive: {
    backgroundColor: NAVY,
  },
  countryChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  countryChipTextActive: {
    color: '#FFFFFF',
  },
  countrySummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#F3F6FA',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 14,
  },
  countrySummaryText: {
    flex: 1,
  },
  countrySummaryTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: '#111827',
  },
  countrySummaryDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  countrySummaryGuideTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: NAVY,
  },
  guideIntro: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  guideList: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  guideListHeaderTitle: {
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  guideListItem: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  guideListItemLast: {
    borderBottomWidth: 0,
  },
  guideListIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  guideListEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  guideListText: {
    flex: 1,
    paddingRight: 10,
  },
  guideListTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: '#111827',
  },
  guideListDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#7A8494',
  },
  checkHeader: {
    marginTop: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  sectionSubtitle: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  checklistCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  checkRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkCircleDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  guideListIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkTextBox: {
    flex: 1,
  },
  checkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  checkTitle: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
  checkTitleDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  checkCategory: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  requiredBadge: {
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: BLUE,
  },
  visaTimeline: {
    marginHorizontal: 20,
    gap: 12,
  },
  visaStepCard: {
    minHeight: 118,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  stepNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberBadgeDone: {
    backgroundColor: NAVY,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  stepNumberTextDone: {
    color: '#FFFFFF',
  },
  stepBody: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: NAVY,
  },
  stepDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  durationPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  guideCarouselSection: {
    marginTop: 10,
  },
  overviewSectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: '#2D3138',
  },
  guideCardRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  bigGuideCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#EEF3FA',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    justifyContent: 'space-between',
  },
  bigGuideIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigGuideTitle: {
    marginTop: 28,
    paddingRight: 18,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: NAVY,
  },
  bigGuideDesc: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: '#536277',
  },
  bigGuideArrow: {
    position: 'absolute',
    right: 12,
    top: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telecomCardList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  telecomCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#EEF3FA',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  telecomCardTitleRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  telecomCardTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: NAVY,
  },
  telecomCardDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#536277',
  },
  telecomPointList: {
    marginTop: 10,
    gap: 5,
  },
  telecomPointText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    color: '#64748B',
  },
  telecomBlogLinkSpacer: {
    height: 5,
  },
  telecomBlogLink: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telecomBlogLinkText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: NAVY,
  },
  telecomNoteBox: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  telecomNoteText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: NAVY,
  },
  accountNoteBox: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accountNoteText: {
    fontSize: 12,
    lineHeight: 21,
    fontWeight: '800',
    color: NAVY,
  },
  accountNoteHighlightText: {
    fontSize: 12,
    lineHeight: 21,
    fontWeight: '900',
    color: BLUE,
  },
  blockedAccountCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#EEF3FA',
    padding: 15,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  blockedAccountTitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: NAVY,
  },
  blockedAccountLead: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '700',
    color: '#536277',
  },
  blockedAccountSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#DDE7F4',
    paddingTop: 12,
  },
  blockedAccountSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  blockedAccountSectionTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: NAVY,
  },
  blockedAccountContentBox: {
    marginTop: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 5,
  },
  blockedAccountBullet: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    color: '#64748B',
  },
  blockedAccountText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#536277',
  },
  blockedAccountFormulaBox: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  blockedAccountFormulaLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    color: NAVY,
  },
  blockedAccountFormula: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: BLUE,
  },
  blockedAccountExample: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
    color: NAVY,
  },
  blockedAccountBlogLink: {
    minHeight: 40,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insuranceRecommendFirstLine: {
    marginTop: 8,
  },
  insuranceCompareBox: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8EEF7',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  insuranceCompareTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '900',
    color: NAVY,
  },
  insuranceCompareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  insuranceCompareTable: {
    marginTop: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#E8EEF7',
  },
  insuranceCompareTableRow: {
    flexDirection: 'row',
  },
  insuranceCompareTableHeader: {
    backgroundColor: '#EEF4FF',
  },
  insuranceCompareTableCell: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8EEF7',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  insuranceCompareTableLabel: {
    flex: 0.82,
    fontWeight: '900',
    color: NAVY,
  },
  insuranceCompareTableHeadText: {
    fontWeight: '900',
    color: NAVY,
  },
  insuranceCompareNotice: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
    color: '#475569',
  },
  insuranceRecommendBox: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  insuranceRecommendTitle: {
    marginBottom: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    color: NAVY,
  },
  insuranceRecommendText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
    color: BLUE,
  },
  timelineListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  timelineListCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: NAVY,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  timelineListRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineListRowLast: {
    minHeight: 0,
  },
  timelineNumberBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D8E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    marginTop: 2,
  },
  timelineNumberText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2F66D0',
  },
  timelineListTextBox: {
    flex: 1,
  },
  timelineListText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: '#111827',
  },
  timelineListDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#7A8494',
  },
  blogLinkSection: {
    marginHorizontal: 20,
    marginTop: 28,
  },
  blogLinkTitle: {
    marginBottom: 10,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    color: NAVY,
  },
  relatedBlogLinkTitle: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  blogLinkList: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: NAVY,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  relatedBlogLinkList: {
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8EEF7',
    shadowOpacity: 0,
    elevation: 0,
  },
  blogLinkItem: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  relatedBlogLinkItem: {
    minHeight: 64,
  },
  blogLinkItemLast: {
    borderBottomWidth: 0,
  },
  blogLinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relatedBlogLinkIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F3F6FA',
    marginRight: 10,
  },
  blogLinkTextBox: {
    flex: 1,
    paddingRight: 10,
  },
  blogLinkItemTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: NAVY,
  },
  blogLinkDesc: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  detailHero: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: '#EEF3FA',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  detailEyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    color: BLUE,
  },
  detailTitle: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: NAVY,
  },
  detailDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#475569',
  },
  guideStepCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF7',
    overflow: 'hidden',
  },
  guideStepHeader: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  guideStepHeaderClosed: {
    borderBottomWidth: 0,
  },
  guideStepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideStepBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  guideStepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  guideStepTitle: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: NAVY,
  },
  guideStepDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  guideStepBody: {
    padding: 14,
    gap: 10,
  },
  numberedList: {
    gap: 9,
  },
  numberedRow: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: NAVY,
  },
  numberedText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    color: NAVY,
  },
  guideCheckRow: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideCheckRowDone: {
    backgroundColor: '#EEF4FF',
  },
  guideCheckBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  guideCheckBoxDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  guideCheckText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    color: NAVY,
  },
  guideCheckTextDone: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  tipBox: {
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    padding: 14,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#075985',
  },
  tipText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#0F4C75',
  },
  warningBox: {
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9A3412',
  },
  warningBoxText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: '#9A3412',
  },
  accordionList: {
    gap: 9,
  },
  accordionItem: {
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    overflow: 'hidden',
  },
  accordionItemOpen: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8D7F5',
  },
  accordionHeader: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  accordionQuestion: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '900',
    color: NAVY,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  answerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
    overflow: 'hidden',
  },
  accordionText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#475569',
  },
  accordionCaution: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: NAVY,
  },
  documentGrid: {
    gap: 10,
  },
  documentCard: {
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    padding: 14,
  },
  documentCardDone: {
    backgroundColor: '#EEF4FF',
    borderColor: '#C8D7F5',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: NAVY,
  },
  documentDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  warningLine: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    color: '#B45309',
  },
  guideBullet: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#475569',
  },
  documentNote: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    color: BLUE,
  },
  infoRow: {
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    color: NAVY,
  },
  infoPanel: {
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  infoPanelTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
  },
  infoPanelText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#475569',
  },
});
