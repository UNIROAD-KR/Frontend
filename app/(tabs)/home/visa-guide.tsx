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

const VISA_GUIDE_STEPS = [
  {
    title: '여권 유효기간 확인',
    desc: '귀국 예정일 이후 6개월 이상 남아있는지 먼저 확인하세요.',
    duration: '10분',
  },
  {
    title: '입학허가서 준비',
    desc: '파견교에서 발급한 공식 서류를 PDF와 출력본으로 보관합니다.',
    duration: '1~2주',
  },
  {
    title: '재정증명 준비',
    desc: '잔고증명, 장학금 증명, 체류비 증빙 자료를 국가 기준에 맞게 준비합니다.',
    duration: '2~5일',
  },
  {
    title: '보험 가입',
    desc: '국가별 요구 조건에 맞는 유학생 보험 또는 공보험 가입 여부를 확인합니다.',
    duration: '1~3일',
  },
  {
    title: '비자 예약',
    desc: '대사관 또는 비자센터 예약 가능 일정을 빠르게 선점하세요.',
    duration: '1일',
  },
  {
    title: '비자 신청 / 인터뷰',
    desc: '신청서와 원본 서류를 지참하고 예약 시간보다 여유 있게 도착합니다.',
    duration: '1일',
  },
  {
    title: '비자 수령',
    desc: '발급 완료 후 영문 이름, 체류 기간, 비자 유형을 확인합니다.',
    duration: '1~2주',
  },
] as const;

const VISA_DOCUMENTS = ['여권', '증명사진', '입학허가서', '재정증명서', '보험증명서', '비자 신청서', '숙소 확인서'];

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
  countryName,
  checkedVisaSteps,
  checkedDocs,
  onBack,
  onToggleStep,
  onToggleDoc,
}: {
  countryName: string;
  checkedVisaSteps: Record<number, boolean>;
  checkedDocs: Record<string, boolean>;
  onBack: () => void;
  onToggleStep: (index: number) => void;
  onToggleDoc: (doc: string) => void;
}) {
  const checkedDocCount = VISA_DOCUMENTS.filter((doc) => checkedDocs[doc]).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>비자 발급 가이드</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.visaSummaryCard}>
          <Text style={styles.heroEyebrow}>{countryName} 비자 준비</Text>
          <Text style={styles.visaSummaryTitle}>비자 신청부터 수령까지</Text>
          <Text style={styles.visaSummaryDesc}>
            출국 전 필요한 비자 절차를 단계별로 확인하고 완료 항목을 체크하세요.
          </Text>
        </View>

        <View style={styles.checkHeader}>
          <View>
            <Text style={styles.sectionTitle}>단계별 비자 준비 타임라인</Text>
            <Text style={styles.sectionSubtitle}>{VISA_GUIDE_STEPS.length}단계</Text>
          </View>
        </View>

        <View style={styles.visaTimeline}>
          {VISA_GUIDE_STEPS.map((step, index) => {
            const checked = checkedVisaSteps[index];

            return (
              <TouchableOpacity
                key={step.title}
                style={styles.visaStepCard}
                onPress={() => onToggleStep(index)}
                activeOpacity={0.86}
              >
                <View style={[styles.stepNumberBadge, checked && styles.stepNumberBadgeDone]}>
                  <Text style={[styles.stepNumberText, checked && styles.stepNumberTextDone]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.stepBody}>
                  <View style={styles.stepTitleRow}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <View style={[styles.checkCircle, checked && styles.checkCircleDone]}>
                      {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                    </View>
                  </View>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                  <View style={styles.durationPill}>
                    <Ionicons name="time-outline" size={13} color="#64748B" />
                    <Text style={styles.durationText}>{step.duration}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.checkHeader}>
          <View>
            <Text style={styles.sectionTitle}>필수 서류</Text>
            <Text style={styles.sectionSubtitle}>
              {checkedDocCount}/{VISA_DOCUMENTS.length}개 완료
            </Text>
          </View>
        </View>

        <View style={styles.checklistCard}>
          {VISA_DOCUMENTS.map((doc, index) => {
            const checked = checkedDocs[doc];

            return (
              <TouchableOpacity
                key={doc}
                style={[styles.checkRow, index === VISA_DOCUMENTS.length - 1 && styles.lastRow]}
                onPress={() => onToggleDoc(doc)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkCircle, checked && styles.checkCircleDone]}>
                  {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                </View>
                <View style={styles.checkTextBox}>
                  <Text style={[styles.checkTitle, checked && styles.checkTitleDone]}>{doc}</Text>
                  <Text style={styles.checkCategory}>비자 신청 서류</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  visaSummaryCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#EEF4FF',
    padding: 22,
  },
  visaSummaryTitle: {
    marginTop: 10,
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '900',
    color: '#111111',
  },
  visaSummaryDesc: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: '#64748B',
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
});
