import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { getScholarships } from '../../../src/api/scholarships';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🎖️ 장학금 데이터 구조
interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  target: string;
  eligibility: string;
  description: string;
  tips: string;
}

const SCHOLARSHIP_DATA: Scholarship[] = [
  {
    id: 'mirae',
    name: '미래에셋 해외교환 장학생(로컬)',
    provider: '미래에셋 박현주재단',
    amount: '7,000,000원 (일시 지급)',
    target: '전 세계 파견 대학 대상',
    eligibility: '대한민국 국적 대학생 중 한국장학재단 학자금 지원구간 1~8구간 이하인 자 (GPA 3.5/4.5 이상)',
    description: '국내 최대 규모의 민간 교환학생 장학금으로, 매 기수 수백 명을 선발합니다. 생활비성 장학금이라 타 장학금과 중복 수혜가 가능한 최고의 혜택입니다.',
    tips: '소득 분위 심사를 통과한 후 오직 자기소개서만으로 최종 선발하므로 자소서에 본인의 간절함과 진로 계획을 정교하게 담아야 합니다.',
  },
  {
    id: 'asem',
    name: 'ASEM-DUO 아셈듀오 장학금',
    provider: '아셈듀오 재단',
    amount: '최대 4,000유로 (약 6,000,000원)',
    target: '유럽 자매결연 대학 대상',
    eligibility: '한국 대학생 1명과 유럽 자매 대학생 1명이 1:1로 매칭되어 상호 교환 파견을 가고 양국 대학 총장 추천을 받은 자',
    description: '유럽과 아시아 간 인적 교류 활성화를 위한 장학금입니다. 반드시 파견 대상 학교에 상대편 유럽 교환학생이 본교로 와야 매칭 신청이 가능합니다.',
    tips: '두 대학의 국제교류처 담당자를 통해 상대 교환학생 매칭 여부를 미리 확인하고 양측 학교의 긴밀한 서류 지원 조율을 받아야 접수 가능합니다.',
  },
  {
    id: 'erasmus',
    name: 'Erasmus+ 에라스무스 장학금',
    provider: 'EU 유럽연합',
    amount: '매월 300~500유로 + 항공비 일부',
    target: '유럽연합 회원국 파견 대학 대상',
    eligibility: '본교와 Erasmus+ 프로젝트 협정이 체결된 유럽 자매교로 파견되는 학생 중 선발 기준 충족자',
    description: '유럽 연합이 지원하는 유학생 지원 프로그램입니다. 수혜 조건과 선발 과정은 본교와 파견교의 협정 세부 조항에 따라 다르게 적용됩니다.',
    tips: '본교 국제교류실 홈페이지 공지사항에서 파견 연도에 Erasmus+ 장학 수혜 가능 대학 리스트가 있는지 학기 초에 반드시 우선 조회해야 합니다.',
  },
];

export default function ScholarshipInfoScreen() {
  const [selectedSch, setSelectedSch] = useState<string | null>(null);
  const [activeMenuTab, setActiveMenuTab] = useState<'info' | 'doc' | 'essay'>('info');
  const [scholarships, setScholarships] = useState<Scholarship[]>(SCHOLARSHIP_DATA);

  // 서류 체크리스트 상태
  const [docs, setDocs] = useState([
    { id: 1, text: '장학생 지원 신청서 (온라인 양식)', checked: false },
    { id: 2, text: '교환학생 파견 승인서 (본교 발행)', checked: false },
    { id: 3, text: '한국장학재단 학자금 지원구간 통지서 (최근 분기)', checked: false },
    { id: 4, text: '영문/국문 성적증명서 및 어학 성적 증명서', checked: false },
    { id: 5, text: '장학생 전용 자기소개서 및 수학계획서', checked: false },
  ]);

  const toggleDoc = (id: number) => {
    setDocs(docs.map(d => d.id === id ? { ...d, checked: !d.checked } : d));
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedSch === id) {
      setSelectedSch(null);
    } else {
      setSelectedSch(id);
    }
  };

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const response = await getScholarships({ page: 0, size: 20 });
        const apiScholarships = response.data.data.content.map((scholarship) => ({
          id: String(scholarship.id),
          name: scholarship.name,
          provider: scholarship.provider,
          amount: scholarship.amount,
          target: scholarship.target,
          eligibility: scholarship.eligibility,
          description: scholarship.description,
          tips: scholarship.tips,
        }));

        if (apiScholarships.length > 0) {
          setScholarships(apiScholarships);
        }
      } catch (error: any) {
        console.log('장학금 API 조회 실패:', error.response?.data || error.message);
      }
    };

    fetchScholarships();
  }, []);

  return (
    <View style={styles.container}>
      {/* 🔝 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#0F2042" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>장학금 정보</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Image
              source={require('../../../assets/images/alarm.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* 안내 배너 카드 */}
        <View style={styles.bannerCard}>
          <Ionicons name="gift-outline" size={32} color="#FFFFFF" />
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>교외 장학금 모아보기</Text>
            <Text style={styles.bannerDesc}>교내 지원을 제외한 매년 수백 명을 선발하는 대표 외부 지원 프로그램</Text>
          </View>
        </View>

        {/* 1. 외부 장학금 카드 리스트 */}
        <Text style={styles.sectionTitle}>추천 교외 장학금 리스트</Text>
        <Text style={styles.sectionSubtitle}>카드를 눌러 상세 자격요건과 선발 혜택을 확인하세요</Text>

        <View style={styles.schList}>
          {scholarships.map((sch) => {
            const isExpanded = selectedSch === sch.id;
            return (
              <View key={sch.id} style={[styles.schCard, isExpanded && styles.schCardExpanded]}>
                <TouchableOpacity
                  style={styles.schCardHeader}
                  onPress={() => toggleExpand(sch.id)}
                >
                  <View style={styles.schTitleRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{sch.provider}</Text>
                    </View>
                    <Text style={styles.schName}>{sch.name}</Text>
                    <Text style={styles.schAmount}>{sch.amount}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.schCardBody}>
                    <View style={styles.infoLine}>
                      <Text style={styles.infoLabel}>지원 대상</Text>
                      <Text style={styles.infoValue}>{sch.target}</Text>
                    </View>
                    <View style={styles.infoLine}>
                      <Text style={styles.infoLabel}>신청 자격</Text>
                      <Text style={styles.infoValue}>{sch.eligibility}</Text>
                    </View>
                    <View style={styles.infoLine}>
                      <Text style={styles.infoLabel}>장학 설명</Text>
                      <Text style={styles.infoValue}>{sch.description}</Text>
                    </View>
                    <View style={styles.tipsBox}>
                      <Text style={styles.tipsTitle}>💡 합격자 추천 공략법</Text>
                      <Text style={styles.tipsText}>{sch.tips}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 2. 추가 탐색 정보 영역 (탭 전환 구조) */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabBtn, activeMenuTab === 'info' && styles.tabBtnActive]}
              onPress={() => setActiveMenuTab('info')}
            >
              <Text style={[styles.tabBtnText, activeMenuTab === 'info' && styles.tabBtnTextActive]}>지원 시기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeMenuTab === 'doc' && styles.tabBtnActive]}
              onPress={() => setActiveMenuTab('doc')}
            >
              <Text style={[styles.tabBtnText, activeMenuTab === 'doc' && styles.tabBtnTextActive]}>필요 서류</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeMenuTab === 'essay' && styles.tabBtnActive]}
              onPress={() => setActiveMenuTab('essay')}
            >
              <Text style={[styles.tabBtnText, activeMenuTab === 'essay' && styles.tabBtnTextActive]}>자기소개서 팁</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            
            {/* 1) 지원 시기 (타임라인) */}
            {activeMenuTab === 'info' && (
              <View style={styles.timelineList}>
                <Text style={styles.timelineDesc}>각 장학금은 파견 학기에 맞춰 약 4~6개월 전에 신청을 완료해야 합니다.</Text>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineNode} />
                  <View style={styles.timelineTextRow}>
                    <Text style={styles.timelineStep}>미래에셋 장학금 접수</Text>
                    <Text style={styles.timelinePeriod}>• 1학기 파견자: 9월 말 ~ 10월 중순 신청</Text>
                    <Text style={styles.timelinePeriod}>• 2학기 파견자: 3월 말 ~ 4월 중순 신청</Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineNode} />
                  <View style={styles.timelineTextRow}>
                    <Text style={styles.timelineStep}>아셈듀오 장학금 접수</Text>
                    <Text style={styles.timelinePeriod}>• 매년 4월 중순 ~ 5월 중순 신청 (가을/봄 학기 파견 동시 선발)</Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineNode} />
                  <View style={styles.timelineTextRow}>
                    <Text style={styles.timelineStep}>에라스무스+ 수혜 확정</Text>
                    <Text style={styles.timelinePeriod}>• 본교 교환학생 1차 선발 후 매학기 10월 / 4월 경 소속 대학에서 선발</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 2) 필요 서류 체크리스트 */}
            {activeMenuTab === 'doc' && (
              <View style={styles.docCheckList}>
                <Text style={styles.checklistTitle}>🗂️ 교외 장학금 신청용 필수 서류 가이드</Text>
                {docs.map(doc => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.checkItem}
                    onPress={() => toggleDoc(doc.id)}
                  >
                    <Ionicons
                      name={doc.checked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={doc.checked ? '#0F2042' : '#94A3B8'}
                    />
                    <Text style={[styles.checkText, doc.checked && styles.checkTextChecked]}>
                      {doc.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 3) 자기소개서 작성 꿀팁 */}
            {activeMenuTab === 'essay' && (
              <View style={styles.essayTipList}>
                <Text style={styles.essayHeaderTitle}>✍️ 미래에셋 자소서 핵심 문항별 합격 포인트</Text>

                <View style={styles.essayTipCard}>
                  <Text style={styles.essayTipNum}>문항 1</Text>
                  <View style={styles.essayTipContent}>
                    <Text style={styles.essayQuestion}>본인의 성장 배경 및 가치관 소개 (500자)</Text>
                    <Text style={styles.essayTipText}>
                      • 성장의 역경 극복보다 본인의 성격을 규정하는 특별한 에피소드 하나를 설정하고, 그것이 교환학생 파견 결심에 미친 가치관의 영향을 연결하는 것이 좋습니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.essayTipCard}>
                  <Text style={styles.essayTipNum}>문항 2</Text>
                  <View style={styles.essayTipContent}>
                    <Text style={styles.essayQuestion}>교환학생 파견 목적 및 학업 계획 (700자)</Text>
                    <Text style={styles.essayTipText}>
                      • "영어 실력 향상" 같은 뻔한 내용 대신, 파견교의 특정 전공 수업(실제 개설 과목명 언급)과 학술 환경을 왜 누려야 하는지 전공 역량 강화 위주로 설계하세요.
                    </Text>
                  </View>
                </View>

                <View style={styles.essayTipCard}>
                  <Text style={styles.essayTipNum}>문항 3</Text>
                  <View style={styles.essayTipContent}>
                    <Text style={styles.essayQuestion}>귀국 후 지역사회 기여 방안 및 진로 계획 (500자)</Text>
                    <Text style={styles.essayTipText}>
                      • 교환학생을 통해 배운 전공 지식이나 현지 네트워크를 활용하여, 진로 목표를 실현하는 과정 속에서 어떻게 사회에 긍정적인 가치를 전파할 것인지 구체적으로 설명해야 높은 점수를 받습니다.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2042',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#0F2042',
  },
  headerRight: {
    flexDirection: 'row',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 130,
  },

  // 배너 카드
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3988D8', // Deep Navy color
    borderRadius: 20,
    padding: 20,
    shadowColor: '#3988D8',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  bannerTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerDesc: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2042',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },

  // 장학금 카드 리스트
  schList: {
    gap: 12,
  },
  schCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  schCardExpanded: {
    borderColor: '#0F2042',
    borderWidth: 1.5,
  },
  schCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  schTitleRow: {
    flex: 1,
    marginRight: 10,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F2042',
  },
  schName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2042',
    marginTop: 4,
  },
  schAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F66D0',
    marginTop: 2,
  },
  schCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 14,
    backgroundColor: '#FCFDFF',
    gap: 12,
  },
  infoLine: {
    flexDirection: 'row',
  },
  infoLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  tipsBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2F66D0',
    marginTop: 4,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },

  // 추가 탭 컨테이너
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F2042',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#0F2042',
  },
  tabContent: {
    paddingHorizontal: 4,
  },

  // 지원시기 타임라인 스타일
  timelineList: {
    gap: 16,
  },
  timelineDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F2042',
    marginTop: 5,
  },
  timelineTextRow: {
    flex: 1,
    gap: 4,
  },
  timelineStep: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2042',
  },
  timelinePeriod: {
    fontSize: 11,
    color: '#475569',
  },

  // 필요서류 체크리스트 스타일
  docCheckList: {
    gap: 10,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  checkText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  checkTextChecked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  // 자소서 팁 스타일
  essayTipList: {
    gap: 12,
  },
  essayHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 8,
  },
  essayTipCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  essayTipNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2F66D0',
    backgroundColor: '#EBF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 24,
    textAlign: 'center',
  },
  essayTipContent: {
    flex: 1,
    gap: 6,
  },
  essayQuestion: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2042',
  },
  essayTipText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});
