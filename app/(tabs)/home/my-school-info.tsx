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
import {
  getMyUniversityExchangeInfo,
  MyUniversityExchangeInfoResponse,
  updateMyUniversityDocumentCheck,
} from '../../../src/api/universityExchangeInfo';

// Android에서 LayoutAnimation을 활성화하기 위한 설정
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MySchoolInfoScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [myExchangeInfo, setMyExchangeInfo] = useState<MyUniversityExchangeInfoResponse | null>(null);

  // 제출 서류 체크리스트 상태
  const [documents, setDocuments] = useState([
    { id: 1, text: '교환학생 지원 신청서(로컬입니다.) (웹 종합정보시스템 작성)', checked: false },
    { id: 2, text: '대학 국문/영문 성적증명서 (발급 1개월 이내)', checked: false },
    { id: 3, text: '공인 어학성적표 사본 (TOEFL, IELTS, TOEIC 등)', checked: false },
    { id: 4, text: '국문 수학계획서 및 자기소개서 (A4 2매 이내)', checked: false },
    { id: 5, text: '지도교수 추천서 (해당 파견교 필수 요청 시)', checked: false },
  ]);

  useEffect(() => {
    const fetchMyExchangeInfo = async () => {
      try {
        const response = await getMyUniversityExchangeInfo();
        const data = response.data.data;
        setMyExchangeInfo(data);
        setDocuments(
          data.requiredDocuments.map((document) => ({
            id: document.id,
            text: document.text,
            checked: document.checkedByMe,
          })),
        );
      } catch (error: any) {
        console.log('내 학교 교환학생 정보 API 조회 실패:', error.response?.data || error.message);
      }
    };

    fetchMyExchangeInfo();
  }, []);

  // 체크리스트 토글
  const toggleDoc = async (id: number) => {
    const nextChecked = !(documents.find((doc) => doc.id === id)?.checked ?? false);
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, checked: nextChecked } : doc
      )
    );

    try {
      await updateMyUniversityDocumentCheck(id, nextChecked);
    } catch (error: any) {
      console.log('내 학교 체크리스트 저장 API 실패:', error.response?.data || error.message);
    }
  };

  // 준비 완료율 계산
  const checkedCount = documents.filter((d) => d.checked).length;
  const progressPercent = Math.round((checkedCount / documents.length) * 100);

  // 아코디언 토글
  const toggleAccordion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  // 모의 교환학교 파트너 리스트
  const partnerSchools =
    myExchangeInfo?.partnerSchools.map((school) => ({
      id: school.id,
      name: school.name,
      country: `${school.country} / ${school.city}`,
      rating: String(school.rating),
    })) ?? [
      { id: 1, name: '뮌헨 공과대학교 (TUM)', country: '독일 / 뮌헨', rating: '4.8' },
      { id: 2, name: '베를린 자유대학교', country: '독일 / 베를린', rating: '4.6' },
      { id: 3, name: 'UCLA', country: '미국 / 로스앤젤레스', rating: '4.8' },
      { id: 4, name: '와세다 대학교', country: '일본 / 도쿄', rating: '4.7' },
    ];

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

        <Text style={styles.headerTitle}>내 학교 정보</Text>

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
        {/* 🏫 학교 프로필 카드 */}
        <View style={styles.schoolCard}>
          <View style={styles.schoolHeader}>
            <View style={styles.logoCircle}>
              <Ionicons name="school-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.schoolNameBox}>
              <Text style={styles.schoolName}>{myExchangeInfo?.universityName ?? '서울과학기술대학교'}</Text>
              <Text style={styles.departmentName}>{myExchangeInfo?.officeName ?? '국제교류처 (대외협력본부)'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="call" size={14} color="#64748B" />
            <Text style={styles.infoText}>{myExchangeInfo?.phone ?? '02-970-6892 (유럽/미주 지역 담당)'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={14} color="#64748B" />
            <Text style={styles.infoText}>{myExchangeInfo?.email ?? 'studyabroad@seoultech.ac.kr'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>교환학생 지원 준비 가이드</Text>
        <Text style={styles.sectionSubtitle}>각 항목을 눌러 세부 요건을 탐색해보세요</Text>

        {/* 📌 리스트형 버튼 UI (아코디언 구조) */}
        <View style={styles.accordionContainer}>
          {/* 1. 지원 자격 */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleAccordion(0)}
            >
              <View style={styles.accordionTitleRow}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#0F2042" style={styles.accordionIcon} />
                <Text style={styles.accordionTitle}>지원 자격 요건</Text>
              </View>
              <Ionicons
                name={expandedIndex === 0 ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {expandedIndex === 0 && (
              <View style={styles.accordionBody}>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>학적 상태: </Text>신청일 현재 본교 학부 재학생 또는 휴학생 (파견 시점 기준 2학기 이상 6학기 이하 이수자)
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>성적 기준: </Text>전체 학년 평점 평균(CGPA)이 <Text style={styles.boldNavyText}>3.0 / 4.5 이상</Text>인 자
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>어학 기준: </Text>파견교가 요구하는 최저 공인 어학 성적 충족자
                  </Text>
                </View>
                <View style={styles.languageBox}>
                  <Text style={styles.languageTitle}>💡 대표적인 기준 가이드라인</Text>
                  <Text style={styles.languageText}>- 영미권: TOEFL iBT 80점 이상 또는 IELTS 6.0 이상</Text>
                  <Text style={styles.languageText}>- 유럽권: TOEFL iBT 75점 이상 / TOEIC 800점 이상</Text>
                  <Text style={styles.languageText}>- 일본권: JLPT N2 이상 취득 필수</Text>
                </View>
              </View>
            )}
          </View>

          {/* 2. 선발 일정 */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleAccordion(1)}
            >
              <View style={styles.accordionTitleRow}>
                <Ionicons name="calendar-outline" size={22} color="#0F2042" style={styles.accordionIcon} />
                <Text style={styles.accordionTitle}>선발 일정 (연간 일정)</Text>
              </View>
              <Ionicons
                name={expandedIndex === 1 ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {expandedIndex === 1 && (
              <View style={styles.accordionBody}>
                <Text style={styles.timelineNotice}>※ 매년 파견 6개월~1년 전에 모집이 시작됩니다.</Text>
                
                <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLine} />
                    <View style={[styles.timelineNode, { backgroundColor: '#0F2042' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStep}>모집 공고 게시</Text>
                      <Text style={styles.timelinePeriod}>1학기 파견: 7월 말 / 2학기 파견: 1월 말</Text>
                    </View>
                  </View>

                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLine} />
                    <View style={[styles.timelineNode, { backgroundColor: '#2F66D0' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStep}>서류 접수 (온라인)</Text>
                      <Text style={styles.timelinePeriod}>1학기 파견: 8월 중순 / 2학기 파견: 2월 중순</Text>
                    </View>
                  </View>

                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLine} />
                    <View style={[styles.timelineNode, { backgroundColor: '#2F66D0' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStep}>면접 심사 (인성 및 어학)</Text>
                      <Text style={styles.timelinePeriod}>1학기 파견: 9월 초 / 2학기 파견: 3월 초</Text>
                    </View>
                  </View>

                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineNode, { backgroundColor: '#10B981' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStep}>최종 배정교 발표 & 오리엔테이션</Text>
                      <Text style={styles.timelinePeriod}>1학기 파견: 9월 말 / 2학기 파견: 3월 말</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 3. 제출 서류 체크리스트 */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleAccordion(2)}
            >
              <View style={styles.accordionTitleRow}>
                <Ionicons name="document-text-outline" size={22} color="#0F2042" style={styles.accordionIcon} />
                <Text style={styles.accordionTitle}>필요 제출 서류 체크리스트</Text>
              </View>
              <Ionicons
                name={expandedIndex === 2 ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {expandedIndex === 2 && (
              <View style={styles.accordionBody}>
                {/* 준비 현황 프로그레스 바 */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>나의 서류 준비 현황</Text>
                    <Text style={styles.progressPercentText}>{progressPercent}% 완료</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>

                {documents.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.checkboxItem}
                    onPress={() => toggleDoc(doc.id)}
                  >
                    <Ionicons
                      name={doc.checked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={doc.checked ? '#0F2042' : '#94A3B8'}
                    />
                    <Text style={[styles.checkboxText, doc.checked && styles.checkboxTextChecked]}>
                      {doc.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 4. 교환학교 리스트 */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleAccordion(3)}
            >
              <View style={styles.accordionTitleRow}>
                <Ionicons name="list-outline" size={22} color="#0F2042" style={styles.accordionIcon} />
                <Text style={styles.accordionTitle}>자매결연 교환학교 리스트</Text>
              </View>
              <Ionicons
                name={expandedIndex === 3 ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {expandedIndex === 3 && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionDesc}>서울과기대와 협약을 맺은 대표적인 교환학교입니다. 카드를 탭하면 상세 정보를 확인해보실 수 있습니다.</Text>
                
                {partnerSchools.map((school, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.partnerSchoolItem}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/home/school-detail',
                        params: { id: String(school.id), name: school.name }
                      });
                    }}
                  >
                    <View style={styles.partnerSchoolInfo}>
                      <Text style={styles.partnerSchoolName}>{school.name}</Text>
                      <Text style={styles.partnerSchoolCountry}>{school.country}</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#EAB308" />
                      <Text style={styles.ratingText}>{school.rating}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#64748B" style={{ marginLeft: 6 }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 5. 합격자 팁 (후기 요약) */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleAccordion(4)}
            >
              <View style={styles.accordionTitleRow}>
                <Ionicons name="ribbon-outline" size={22} color="#0F2042" style={styles.accordionIcon} />
                <Text style={styles.accordionTitle}>선배들의 합격자 핵심 팁</Text>
              </View>
              <Ionicons
                name={expandedIndex === 4 ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {expandedIndex === 4 && (
              <View style={styles.accordionBody}>
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>💬 서류 준비 팁</Text>
                  <Text style={styles.tipText}>
                    "자기소개서 작성 시 왜 하필 그 파견교여야 하는지 학과 커리큘럼을 직접 대조하며 어필하는 것이 선발 확률을 높입니다."
                  </Text>
                </View>
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>🗣️ 면접 준비 팁</Text>
                  <Text style={styles.tipText}>
                    "영어 면접은 지원 동기와 가서 무슨 과목을 배울지, 돌발 상황(길을 잃거나 아플 때)에 어떻게 대처할 것인지를 영어로 시뮬레이션 해보는 것으로 충분합니다."
                  </Text>
                </View>
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>📈 어학 성적 가이드</Text>
                  <Text style={styles.tipText}>
                    "경쟁률이 센 독일이나 미국 메이저 학교를 지원할 경우 최저 성적 기준보다 최소 5~10점 이상의 성적표를 갖추는 것이 안정적입니다."
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 6. 블로그 후기 탐색 */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleAccordion(5)}
            >
              <View style={styles.accordionTitleRow}>
                <Ionicons name="logo-rss" size={22} color="#0F2042" style={styles.accordionIcon} />
                <Text style={styles.accordionTitle}>내 학교 블로그 후기 링크</Text>
              </View>
              <Ionicons
                name={expandedIndex === 5 ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {expandedIndex === 5 && (
              <View style={styles.accordionBody}>
                <TouchableOpacity
                  style={styles.blogLinkBtn}
                  onPress={() => {
                    // 모달이나 외부 링크가 아닌, 후기 필터링으로 메인 탐색 탭으로 유도할 수도 있음.
                    // 여기서는 후기 탐색을 위한 모의 알림을 제공
                    alert('준비생들이 가작 추천하는 서울과기대 공식 교환 블로그 리스트입니다.');
                  }}
                >
                  <Ionicons name="link" size={16} color="#0F2042" />
                  <Text style={styles.blogLinkText}>[서울과기대] 교환학생 신청 A to Z 총정리</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.blogLinkBtn}
                  onPress={() => alert('수학계획서 무료 공유 블로그 포스트입니다.')}
                >
                  <Ionicons name="link" size={16} color="#0F2042" />
                  <Text style={styles.blogLinkText}>합격자 수학계획서 & 자소서 양식 배포 (독문/영문)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.blogLinkBtn}
                  onPress={() => alert('학점 인정 절차 안내 포스트입니다.')}
                >
                  <Ionicons name="link" size={16} color="#0F2042" />
                  <Text style={styles.blogLinkText}>파견 후 귀국 시 필수 제출용 학점 인정 프로세스</Text>
                </TouchableOpacity>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 130,
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
    gap: 8,
  },

  // 🏫 학교 프로필 카드
  schoolCard: {
    backgroundColor: '#0F2042', // Navy Point Color
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F2042',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolNameBox: {
    marginLeft: 14,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  departmentName: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#E2E8F0',
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

  // 📌 아코디언 컨테이너
  accordionContainer: {
    gap: 12,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIcon: {
    marginRight: 10,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2042',
  },
  accordionBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 14,
    backgroundColor: '#FCFDFF',
  },
  accordionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },

  // 아코디언 내용 세부 스타일
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: '#2F66D0',
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F2042',
  },
  boldNavyText: {
    fontWeight: '800',
    color: '#2F66D0',
  },
  languageBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    gap: 4,
  },
  languageTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 4,
  },
  languageText: {
    fontSize: 11,
    color: '#475569',
  },

  // 선발일정 타임라인
  timelineNotice: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
    marginBottom: 14,
  },
  timeline: {
    paddingLeft: 10,
    marginTop: 5,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 4.5,
    top: 10,
    bottom: 0,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineNode: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    marginTop: 4,
    marginRight: 14,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStep: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2042',
  },
  timelinePeriod: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },

  // 체크리스트
  progressContainer: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2042',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F66D0',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F2042',
    borderRadius: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  checkboxTextChecked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  // 자매결연 교환학교 아이템
  partnerSchoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  partnerSchoolInfo: {
    flex: 1,
    marginRight: 10,
  },
  partnerSchoolName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2042',
  },
  partnerSchoolCountry: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F2042',
    marginLeft: 3,
  },

  // 팁 카드
  tipCard: {
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0F2042',
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F2042',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },

  // 블로그 링크
  blogLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  blogLinkText: {
    fontSize: 12,
    color: '#2F66D0',
    fontWeight: '600',
    flex: 1,
  },
});
