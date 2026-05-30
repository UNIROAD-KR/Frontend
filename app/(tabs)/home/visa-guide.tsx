import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const VISA_CAROUSEL_CARD_WIDTH = Math.min(244, SCREEN_WIDTH - 146);
const VISA_CAROUSEL_GAP = 14;
const VISA_CAROUSEL_SNAP = VISA_CAROUSEL_CARD_WIDTH + VISA_CAROUSEL_GAP;

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
    title: '독일 출국 체크리스트',
    subtitle: '비자, 보험, 슈페어콘토, 거주지 등록까지 한 번에 준비하세요',
    accent: '#2F66D0',
    tint: '#EEF4FF',
    icon: 'airplane',
    visaUrl: 'https://example.com/visa/de',
    checklist: [
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
    title: '프랑스 출국 체크리스트',
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
    title: '미국 출국 체크리스트',
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
    title: '일본 출국 체크리스트',
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
    title: '체코 출국 체크리스트',
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

const SUPPORT_CARDS_BY_COUNTRY = [
  [
    {
      title: '유심/eSIM',
      desc: '독일 통신사 및 eSIM 준비',
      icon: 'phone-portrait-outline' as const,
      color: '#2F66D0',
    },
    {
      title: '보험',
      desc: '공보험/사보험 확인',
      icon: 'shield-checkmark-outline' as const,
      color: '#16A36A',
    },
    {
      title: '은행/카드',
      desc: '슈페어콘토 및 해외 결제 준비',
      icon: 'card-outline' as const,
      color: '#6B55D8',
    },
  ],
  [
    {
      title: '유심/eSIM',
      desc: '프랑스 통신/eSIM 준비',
      icon: 'phone-portrait-outline' as const,
      color: '#2F66D0',
    },
    {
      title: '보험',
      desc: '유학생 보험 및 OFII 관련 확인',
      icon: 'shield-checkmark-outline' as const,
      color: '#16A36A',
    },
    {
      title: '은행/카드',
      desc: '현지 계좌/카드 준비',
      icon: 'card-outline' as const,
      color: '#6B55D8',
    },
  ],
  [
    {
      title: '유심/eSIM',
      desc: '미국 통신사/eSIM 준비',
      icon: 'phone-portrait-outline' as const,
      color: '#2F66D0',
    },
    {
      title: '보험',
      desc: '학교 보험/유학생 보험 확인',
      icon: 'shield-checkmark-outline' as const,
      color: '#16A36A',
    },
    {
      title: '은행/카드',
      desc: '해외 결제 카드 및 계좌 준비',
      icon: 'card-outline' as const,
      color: '#6B55D8',
    },
  ],
  [
    {
      title: '유심/eSIM',
      desc: '일본 유심/eSIM 준비',
      icon: 'phone-portrait-outline' as const,
      color: '#2F66D0',
    },
    {
      title: '보험',
      desc: '국민건강보험 확인',
      icon: 'shield-checkmark-outline' as const,
      color: '#16A36A',
    },
    {
      title: '은행/카드',
      desc: '현지 결제/은행 준비',
      icon: 'card-outline' as const,
      color: '#6B55D8',
    },
  ],
  [
    {
      title: '유심/eSIM',
      desc: '체코 통신/eSIM 준비',
      icon: 'phone-portrait-outline' as const,
      color: '#2F66D0',
    },
    {
      title: '보험',
      desc: '체코 인정 보험 확인',
      icon: 'shield-checkmark-outline' as const,
      color: '#16A36A',
    },
    {
      title: '은행/카드',
      desc: '해외 결제 카드 준비',
      icon: 'card-outline' as const,
      color: '#6B55D8',
    },
  ],
] as const;

const visaGuideData = {
  germany: {
    countryName: '독일',
    visaName: '학생비자',
    timeline: ['온라인 비자 신청', '영사과 방문 예약', '대사관 방문 및 서류 제출', '비자 수령'],
    sections: [
      {
        id: 'prep',
        title: '비자 신청 준비 절차',
        desc: '온라인 비자 신청부터 대사관 예약 전까지 진행하는 단계',
        icon: 'create-outline' as const,
      },
      {
        id: 'issue',
        title: '비자 발급 절차',
        desc: '대사관 방문 예약 이후 실제 비자를 수령하기까지의 단계',
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
  const [screenMode, setScreenMode] = useState<'checklist' | 'visa'>('checklist');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CHECKLISTS[0].name);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [checkedVisaSteps, setCheckedVisaSteps] = useState<Record<number, boolean>>({ 0: true });
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    여권: true,
    증명사진: true,
  });
  const scrollRef = useRef<ScrollView>(null);
  const supportOpacity = useRef(new Animated.Value(1)).current;

  const selectedIndex = COUNTRY_CHECKLISTS.findIndex((item) => item.name === selectedCountry);
  const country = useMemo(
    () => COUNTRY_CHECKLISTS[selectedIndex >= 0 ? selectedIndex : 0],
    [selectedIndex],
  );
  const selectedSupportCards =
    SUPPORT_CARDS_BY_COUNTRY[selectedIndex >= 0 ? selectedIndex : 0] ?? SUPPORT_CARDS_BY_COUNTRY[0];

  useEffect(() => {
    supportOpacity.setValue(0.62);
    Animated.timing(supportOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [selectedCountry, supportOpacity]);

  useEffect(() => {
    const loadCountry = async () => {
      const savedCountry = await AsyncStorage.getItem('dispatchedCountry');
      const initialCountry = normalizeCountry(savedCountry);
      setSelectedCountry(initialCountry);
      const initialIndex = COUNTRY_CHECKLISTS.findIndex((item) => item.name === initialCountry);

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          x: Math.max(0, initialIndex) * SNAP_INTERVAL,
          animated: false,
        });
      });
    };

    loadCountry();
  }, []);

  const selectCountry = (name: string) => {
    const nextIndex = COUNTRY_CHECKLISTS.findIndex((item) => item.name === name);
    setSelectedCountry(name);
    scrollRef.current?.scrollTo({
      x: Math.max(0, nextIndex) * SNAP_INTERVAL,
      animated: true,
    });
  };

  const completedCount = country.checklist.filter((item) => checkedItems[item.id]).length;

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>국가별 체크리스트</Text>

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

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.heroPager}
          contentContainerStyle={styles.heroPagerContent}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
            const nextCountry = COUNTRY_CHECKLISTS[nextIndex];
            if (nextCountry) setSelectedCountry(nextCountry.name);
          }}
        >
          {COUNTRY_CHECKLISTS.map((item, index) => (
            <View key={item.name} style={[styles.heroCard, { backgroundColor: item.tint }]}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroEyebrow}>출국 준비</Text>
                  <Text style={styles.heroTitle}>{item.title}</Text>
                  <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.pagerDots}>
                  {COUNTRY_CHECKLISTS.map((dot, dotIndex) => (
                    <View
                      key={dot.name}
                      style={[
                        styles.pagerDot,
                        dotIndex === index && { backgroundColor: item.accent, width: 18 },
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.illustrationWrap}>
                <View style={[styles.illustrationBlob, { backgroundColor: item.accent }]}>
                  <Ionicons name={item.icon} size={68} color="#FFFFFF" />
                </View>
                <View style={styles.floatBadge}>
                  <Ionicons name="checkmark-done" size={24} color={item.accent} />
                </View>
                <View style={styles.floatPlane}>
                  <Ionicons name="paper-plane" size={22} color={item.accent} />
                </View>
              </View>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => setScreenMode('visa')}
                activeOpacity={0.9}
              >
                <Text style={styles.ctaButtonText}>비자 발급 바로가기</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.supportSectionHeader}>
          <Text style={styles.supportSectionLabel}>{country.name} 준비 항목</Text>
        </View>

        <Animated.View style={[styles.supportGrid, { opacity: supportOpacity }]}>
          {selectedSupportCards.map((item) => (
            <TouchableOpacity key={item.title} style={styles.supportCard} activeOpacity={0.86}>
              <View style={[styles.supportIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.supportTextBox}>
                <Text style={styles.supportTitle}>{item.title}</Text>
                <Text style={styles.supportDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A4ADBA" />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={styles.checkHeader}>
          <View>
            <Text style={styles.sectionTitle}>{country.name} 준비 체크리스트</Text>
            <Text style={styles.sectionSubtitle}>
              {completedCount}/{country.checklist.length}개 완료
            </Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>
              {Math.round((completedCount / country.checklist.length) * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.checklistCard}>
          {country.checklist.map((item, index) => {
            const checked = checkedItems[item.id];

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checkRow,
                  index === country.checklist.length - 1 && styles.lastRow,
                ]}
                onPress={() =>
                  setCheckedItems((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                }
                activeOpacity={0.85}
              >
                <View style={[styles.checkCircle, checked && styles.checkCircleDone]}>
                  {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                </View>

                <View style={styles.checkTextBox}>
                  <View style={styles.checkTitleRow}>
                    <Text style={[styles.checkTitle, checked && styles.checkTitleDone]}>
                      {item.title}
                    </Text>
                    {item.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>필수</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.checkCategory}>{item.category}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
  const [activeGuideIndex, setActiveGuideIndex] = useState(0);
  const [openQuestion, setOpenQuestion] = useState<string | null>('입학허가서를 받을 예정인가요?');
  const [openVidexItem, setOpenVidexItem] = useState<string | null>('개인정보 입력');
  const guide = visaGuideData.germany;
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
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={activeSection === 'overview' ? onBack : () => setActiveSection('overview')}
        >
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={VISA_CAROUSEL_SNAP}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={styles.guideCarouselContent}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(
                  event.nativeEvent.contentOffset.x / VISA_CAROUSEL_SNAP,
                );
                setActiveGuideIndex(Math.max(0, Math.min(nextIndex, guide.sections.length - 1)));
              }}
            >
            {guide.sections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.bigGuideCard,
                  section.id === guide.sections[activeGuideIndex]?.id
                    ? styles.bigGuideCardActive
                    : styles.bigGuideCardInactive,
                ]}
                onPress={() => setActiveSection(section.id)}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.bigGuideIcon,
                    section.id === guide.sections[activeGuideIndex]?.id
                      ? styles.bigGuideIconActive
                      : styles.bigGuideIconInactive,
                  ]}
                >
                  <Ionicons name={section.icon} size={24} color={NAVY} />
                </View>
                <View style={styles.bigGuideText}>
                  <Text
                    style={[
                      styles.bigGuideTitle,
                      section.id === guide.sections[activeGuideIndex]?.id &&
                        styles.bigGuideTitleActive,
                    ]}
                  >
                    {section.title}
                  </Text>
                  <Text
                    style={[
                      styles.bigGuideDesc,
                      section.id === guide.sections[activeGuideIndex]?.id &&
                        styles.bigGuideDescActive,
                    ]}
                  >
                    {section.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.bigGuideArrow,
                    section.id === guide.sections[activeGuideIndex]?.id &&
                      styles.bigGuideArrowActive,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={section.id === guide.sections[activeGuideIndex]?.id ? NAVY : '#FFFFFF'}
                  />
                </View>
              </TouchableOpacity>
            ))}
            </ScrollView>

            <View style={styles.timelineListHeader}>
              <Text style={styles.overviewSectionTitle}>타임라인</Text>
            </View>
            <View style={styles.timelineListCard}>
              {guide.timeline.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.timelineListRow,
                    index === guide.timeline.length - 1 && styles.timelineListRowLast,
                  ]}
                >
                  <View style={styles.timelineNumberBox}>
                    <Text style={styles.timelineNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.timelineListText}>{item}</Text>
                  <View style={styles.timelineEndDot} />
                </View>
              ))}
            </View>
          </View>
        )}

        {activeSection === 'prep' && renderPrepGuide()}
        {activeSection === 'issue' && renderIssueGuide()}
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
  return (
    <View style={styles.guideStepCard}>
      <View style={styles.guideStepHeader}>
        <View style={styles.guideStepBadge}>
          <Text style={styles.guideStepBadgeText}>STEP {index}</Text>
        </View>
        <Text style={styles.guideStepTitle}>{title}</Text>
        <Text style={styles.guideStepDesc}>{desc}</Text>
      </View>
      <View style={styles.guideStepBody}>{children}</View>
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
    backgroundColor: '#F6F8FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#F6F8FB',
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
    fontSize: 18,
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
    paddingTop: 10,
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
    backgroundColor: '#FFFFFF',
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
  heroPager: {
    width: SCREEN_WIDTH,
  },
  heroPagerContent: {
    paddingHorizontal: 20,
  },
  heroCard: {
    width: CARD_WIDTH,
    minHeight: 420,
    borderRadius: 24,
    padding: 22,
    marginRight: CARD_GAP,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '900',
    color: BLUE,
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    color: '#111111',
  },
  heroSubtitle: {
    marginTop: 10,
    maxWidth: 230,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#64748B',
  },
  pagerDots: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
  },
  pagerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4DAE4',
  },
  illustrationWrap: {
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBlob: {
    width: 132,
    height: 132,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  floatBadge: {
    position: 'absolute',
    right: 78,
    top: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatPlane: {
    position: 'absolute',
    left: 72,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  supportSectionHeader: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 10,
  },
  supportSectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  supportCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: NAVY,
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  supportIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  supportTextBox: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },
  supportDesc: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
  progressPill: {
    borderRadius: 14,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
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
  guideCarouselContent: {
    paddingLeft: 28,
    paddingRight: 96,
    gap: VISA_CAROUSEL_GAP,
  },
  bigGuideCard: {
    width: VISA_CAROUSEL_CARD_WIDTH,
    height: 214,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowColor: NAVY,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  bigGuideCardActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
    transform: [{ scale: 1 }],
  },
  bigGuideCardInactive: {
    backgroundColor: '#EFF4FC',
    borderColor: '#E3EAF5',
    transform: [{ scale: 0.94 }],
  },
  bigGuideIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigGuideIconActive: {
    backgroundColor: '#FFFFFF',
  },
  bigGuideIconInactive: {
    backgroundColor: '#DDE8F8',
  },
  bigGuideText: {
    marginTop: 16,
    paddingBottom: 42,
  },
  bigGuideTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
    color: NAVY,
  },
  bigGuideTitleActive: {
    color: '#FFFFFF',
  },
  bigGuideDesc: {
    marginTop: 11,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: '#536277',
  },
  bigGuideDescActive: {
    color: '#DDE7F7',
  },
  bigGuideArrow: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigGuideArrowActive: {
    backgroundColor: '#FFFFFF',
  },
  timelineListHeader: {
    marginTop: 24,
    marginHorizontal: 28,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineListCard: {
    marginHorizontal: 28,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  timelineListRow: {
    minHeight: 54,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F8',
  },
  timelineListRowLast: {
    borderBottomWidth: 0,
  },
  timelineNumberBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  timelineListText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: '#5F6673',
  },
  timelineEndDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20242A',
    marginLeft: 10,
  },
  detailHero: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#EAF1FF',
    padding: 18,
  },
  detailEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: BLUE,
  },
  detailTitle: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    color: NAVY,
  },
  detailDesc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
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
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    marginTop: 10,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: NAVY,
  },
  guideStepDesc: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
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
