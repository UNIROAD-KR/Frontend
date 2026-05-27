import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';

const VISA_COUNTRIES = [
  {
    name: '독일',
    visaName: '독일 학생비자',
    period: '4~8주',
    difficulty: '보통',
    items: 6,
    accent: '#2F66D0',
  },
  {
    name: '프랑스',
    visaName: '프랑스 장기 학생비자',
    period: '5~9주',
    difficulty: '보통',
    items: 7,
    accent: '#2563EB',
  },
  {
    name: '미국',
    visaName: '미국 F-1/J-1 비자',
    period: '3~6주',
    difficulty: '높음',
    items: 8,
    accent: '#1D4ED8',
  },
  {
    name: '일본',
    visaName: '일본 유학비자',
    period: '2~5주',
    difficulty: '낮음',
    items: 6,
    accent: '#315B9C',
  },
] as const;

const timelineSteps = [
  {
    title: '여권 유효기간 확인',
    desc: '귀국 예정일 이후 6개월 이상 남아있는지 먼저 확인하세요.',
    duration: '10분',
    status: '완료',
  },
  {
    title: '입학허가서 / 교환학생 수락서 준비',
    desc: '파견교에서 발급한 공식 문서를 PDF와 출력본으로 보관합니다.',
    duration: '1~2주',
    status: '진행 중',
  },
  {
    title: '재정증명 준비',
    desc: '은행 잔고증명, 장학금 증명서 등 체류비 증빙 자료를 준비합니다.',
    duration: '2~5일',
    status: '준비 전',
  },
  {
    title: '보험 가입',
    desc: '국가별 요구 조건에 맞는 유학생 보험 또는 공보험 가입을 확인합니다.',
    duration: '1~3일',
    status: '준비 전',
  },
  {
    title: '비자 예약',
    desc: '대사관 또는 비자센터 예약 가능 일정을 빠르게 선점하세요.',
    duration: '1일',
    status: '준비 전',
  },
  {
    title: '비자 신청 / 인터뷰',
    desc: '신청서와 원본 서류를 지참하고 예약 시간보다 여유 있게 도착합니다.',
    duration: '1일',
    status: '준비 전',
  },
  {
    title: '비자 수령',
    desc: '발급 완료 후 영문 이름, 체류 기간, 비자 유형을 확인합니다.',
    duration: '1~2주',
    status: '준비 전',
  },
] as const;

const requiredDocuments = [
  '여권',
  '증명사진',
  '입학허가서',
  '재정증명서',
  '보험증명서',
  '비자 신청서',
  '숙소 확인서',
];

export default function VisaGuideScreen() {
  const [selectedCountry, setSelectedCountry] = useState('독일');
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({
    0: true,
  });
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    여권: true,
    증명사진: true,
  });

  const country = useMemo(
    () => VISA_COUNTRIES.find((item) => item.name === selectedCountry) ?? VISA_COUNTRIES[0],
    [selectedCountry],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>비자 발급 가이드</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={21} color={NAVY} />
          </TouchableOpacity>
        </View>
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
          {VISA_COUNTRIES.map((item) => {
            const active = item.name === selectedCountry;

            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.countryChip, active && styles.countryChipActive]}
                onPress={() => setSelectedCountry(item.name)}
                activeOpacity={0.85}
              >
                <Text style={[styles.countryChipText, active && styles.countryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>선택 국가</Text>
            <Text style={styles.summaryTitle}>{country.visaName}</Text>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryMetric label="예상 준비 기간" value={country.period} />
            <SummaryMetric label="난이도" value={country.difficulty} />
            <SummaryMetric label="필수 준비 항목" value={`${country.items}개`} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>단계별 비자 준비 타임라인</Text>
          <Text style={styles.sectionMeta}>7단계</Text>
        </View>

        <View style={styles.timelineList}>
          {timelineSteps.map((step, index) => {
            const checked = checkedSteps[index];

            return (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.stepDot, checked && styles.stepDotDone]}>
                    <Text style={[styles.stepNumber, checked && styles.stepNumberDone]}>
                      {index + 1}
                    </Text>
                  </View>
                  {index < timelineSteps.length - 1 && <View style={styles.railLine} />}
                </View>

                <TouchableOpacity
                  style={[styles.stepCard, checked && styles.stepCardDone]}
                  onPress={() =>
                    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }))
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.stepTopRow}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <View style={[styles.statusTag, statusStyle(step.status)]}>
                      <Text style={[styles.statusText, statusTextStyle(step.status)]}>
                        {checked ? '완료' : step.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.stepDesc}>{step.desc}</Text>

                  <View style={styles.stepBottomRow}>
                    <View style={styles.durationPill}>
                      <Ionicons name="time-outline" size={13} color="#64748B" />
                      <Text style={styles.durationText}>{step.duration}</Text>
                    </View>

                    <View style={[styles.checkCircle, checked && styles.checkCircleDone]}>
                      <Ionicons
                        name={checked ? 'checkmark' : 'ellipse-outline'}
                        size={16}
                        color={checked ? '#FFFFFF' : '#CBD5E1'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>필수 서류</Text>
          <Text style={styles.sectionMeta}>
            {Object.values(checkedDocs).filter(Boolean).length}/{requiredDocuments.length}
          </Text>
        </View>

        <View style={styles.documentCard}>
          {requiredDocuments.map((doc) => {
            const checked = checkedDocs[doc];

            return (
              <TouchableOpacity
                key={doc}
                style={styles.docRow}
                onPress={() => setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }))}
                activeOpacity={0.85}
              >
                <View style={[styles.docCheck, checked && styles.docCheckDone]}>
                  {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                </View>
                <Text style={[styles.docText, checked && styles.docTextDone]}>{doc}</Text>
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function statusStyle(status: string) {
  if (status === '완료') return styles.statusDone;
  if (status === '진행 중') return styles.statusProgress;
  return styles.statusReady;
}

function statusTextStyle(status: string) {
  if (status === '완료') return styles.statusDoneText;
  if (status === '진행 중') return styles.statusProgressText;
  return styles.statusReadyText;
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  headerRight: {
    width: 38,
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  countryScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  countryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  countryChip: {
    height: 36,
    paddingHorizontal: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  countryChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  countryChipTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: NAVY,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: BLUE,
  },
  summaryTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '900',
    color: NAVY,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  metricBox: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 10,
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '900',
    color: NAVY,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
  },
  timelineList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
  },
  timelineRail: {
    width: 32,
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  stepNumberDone: {
    color: '#FFFFFF',
  },
  railLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  stepCard: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  stepCardDone: {
    borderColor: '#D5E4FF',
    backgroundColor: '#FBFDFF',
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
    lineHeight: 20,
  },
  statusTag: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDone: {
    backgroundColor: '#EAF1FF',
  },
  statusProgress: {
    backgroundColor: '#FFF7ED',
  },
  statusReady: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusDoneText: {
    color: BLUE,
  },
  statusProgressText: {
    color: '#C2410C',
  },
  statusReadyText: {
    color: '#64748B',
  },
  stepDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  stepBottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  documentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  docRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  docCheckDone: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  docText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  docTextDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
});
