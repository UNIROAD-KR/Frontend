export const BLUE = '#102BE0';
export const GREEN = '#40A66A';

export const boardPosts = [
  {
    id: 1,
    status: '파견 중',
    title: '아우크스부르크 근처 가성비 맛집 리스트 공유',
    preview:
      '한 학기 동안 찾아낸 찐 맛집 리스트입니다. 현지인들도 자주 가는 곳 위주로 정리했어요.',
    content:
      '한 학기 동안 다니면서 저장해둔 가성비 맛집을 정리해봤어요.\n\n중앙역 근처에서는 점심 메뉴가 10유로 안쪽인 곳들이 꽤 있고, 학교 근처에는 현지 학생들이 많이 가는 작은 식당들이 많습니다. 처음 도착하면 구글맵 평점만 보고 가기보다 점심 시간에 사람이 많이 모이는 곳을 먼저 확인해보는 걸 추천해요.\n\n댓글로 궁금한 동네 남겨주시면 제가 아는 선에서 더 공유할게요.',
    author: '김서현',
    country: '독일',
    stage: '파견',
    time: '방금 전',
    likes: 57,
    comments: 7,
    commentItems: [
      {
        id: '1-1',
        author: '익명',
        content: '중앙역 근처 점심 추천 감사합니다. 혹시 혼밥하기 괜찮은 곳도 있을까요?',
        time: '방금 전',
      },
      {
        id: '1-2',
        author: '익명',
        content: '학교 근처 작은 식당은 구글맵보다 현지 친구 추천이 진짜 정확하더라고요.',
        time: '12분 전',
      },
    ],
    color: '#DDF4E4',
    textColor: '#238451',
    isMine: true,
  },
  {
    id: 2,
    status: '파견 전',
    title: '독일 비자 신청 후기 - 서울 영사관 직접 방문',
    preview:
      '비자 신청 준비하시는 분들 참고하세요. 예약부터 서류 준비까지 제가 겪은 것들 정리했어요.',
    content:
      '독일 비자 신청을 서울 영사관에서 직접 진행했습니다.\n\n예약은 생각보다 빨리 마감돼서 출국일이 정해졌다면 바로 확인하는 게 좋고, 서류는 원본과 사본을 분리해두면 현장에서 훨씬 편했습니다. 재정증명, 보험, 입학허가서, 여권 사본은 다시 한 번 체크하세요.\n\n대기 시간은 길지 않았지만 보완 요청이 생기면 일정이 밀릴 수 있으니 최소 2주 정도 여유를 두는 걸 추천합니다.',
    author: '이민준',
    country: '독일',
    stage: '파견 예정',
    time: '1시간 전',
    likes: 43,
    comments: 12,
    commentItems: [
      {
        id: '2-1',
        author: '익명',
        content: '예약이 빨리 마감된다는 부분 놓치고 있었는데 덕분에 바로 확인했어요.',
        time: '28분 전',
      },
    ],
    color: '#EAF1FF',
    textColor: '#2F66D0',
    isMine: false,
  },
  {
    id: 3,
    status: '귀국 후',
    title: '귀국하고 나서 학점 인정 받을 때 체크할 것',
    preview:
      '성적표 원본, 수강계획서, 실라버스는 미리 챙겨두면 훨씬 편합니다. 놓치기 쉬운 부분만 모았어요.',
    content:
      '귀국 후 학점 인정 절차를 진행하면서 놓치기 쉬웠던 부분을 남깁니다.\n\n성적표 원본은 도착까지 시간이 걸릴 수 있으니 학교 국제처에 발급 방식과 예상 일정을 미리 물어보세요. 수강계획서와 실라버스는 학기 중에 내려받아두는 게 안전합니다.\n\n특히 과목명이 영문으로 다르게 표기되는 경우가 있어, 신청서 작성 전에 담당 부서에 인정 기준을 한 번 확인하는 걸 추천해요.',
    author: '박하린',
    country: '프랑스',
    stage: '귀국',
    time: '3시간 전',
    likes: 31,
    comments: 5,
    commentItems: [
      {
        id: '3-1',
        author: '익명',
        content: '실라버스 미리 저장해두라는 말 정말 중요해요. 귀국 후에는 찾기 어렵더라고요.',
        time: '1시간 전',
      },
    ],
    color: '#FFF1DF',
    textColor: '#F28A2E',
    isMine: false,
  },
  {
    id: 4,
    status: '파견 중',
    title: '파리 Navigo 학생권 신청 성공한 분 계신가요?',
    preview:
      '학교 메일 인증에서 계속 막히는데 혹시 최근에 신청해보신 분 있으면 절차 공유 부탁드려요.',
    content:
      '파리 Navigo 학생권 신청을 진행 중인데 학교 메일 인증 단계에서 계속 막히고 있습니다.\n\n학교 포털 메일은 정상적으로 수신되는데 인증 링크가 만료됐다고 뜨거나, 학생 신분 확인 화면으로 넘어가지 않는 문제가 반복돼요. 최근에 성공하신 분이 있다면 어떤 서류로 인증했는지 공유 부탁드립니다.\n\n교통비가 꽤 차이 나서 가능하면 이번 달 안에 해결하고 싶습니다.',
    author: '최유진',
    country: '프랑스',
    stage: '파견',
    time: '어제',
    likes: 18,
    comments: 16,
    commentItems: [
      {
        id: '4-1',
        author: '익명',
        content: '저는 학교 재학증명서 영문 파일로 다시 올리니까 승인됐어요.',
        time: '어제',
      },
    ],
    color: '#DDF4E4',
    textColor: '#238451',
    isMine: false,
  },
];

export const companionPosts = [
  {
    id: 1,
    icon: 'map-outline' as const,
    title: '뮌헨 맥주 축제 같이 가요',
    content:
      '뮌헨 맥주 축제 주말 일정으로 같이 움직일 분을 찾습니다.\n\n현지 이동은 기차로 맞추고, 숙소는 각자 예약해도 괜찮습니다. 낮에는 축제장 위주로 보고 저녁에는 시내에서 식사하는 일정으로 생각하고 있어요. 처음 가는 분도 편하게 참여할 수 있게 동선을 단순하게 잡겠습니다.',
    author: '김서현',
    country: '독일',
    cityName: '뮌헨',
    period: '04/01 - 04/02',
    startDate: '2026-04-01',
    endDate: '2026-04-02',
    dateValue: '2026-04-01',
    tags: ['축제', '맥주', '감성'],
    status: '모집중',
    current: 2,
    total: 4,
    verified: true,
    chatLink: 'https://open.kakao.com/o/example',
    genderRatio: '무관',
    tint: '#EAF1FF',
    iconColor: '#2F66D0',
    isMine: true,
  },
  {
    id: 2,
    icon: 'airplane-outline' as const,
    title: '암스테르담 당일치기',
    content:
      '암스테르담 당일치기 일정으로 같이 다녀올 분을 구합니다.\n\n미술관 한 곳과 운하 근처 산책을 중심으로 천천히 볼 예정입니다. 아침 일찍 출발해서 밤에는 각자 도시로 돌아오는 일정이고, 식사는 현장에서 맞춰도 좋습니다.',
    author: '이민준',
    country: '네덜란드',
    cityName: '암스테르담',
    period: '04/06',
    startDate: '2026-04-06',
    endDate: '2026-04-06',
    dateValue: '2026-04-06',
    tags: ['당일치기', '미술관'],
    status: '모집중',
    current: 1,
    total: 3,
    verified: true,
    chatLink: '',
    genderRatio: '무관',
    tint: '#FFF4E7',
    iconColor: '#E8872F',
    isMine: false,
  },
  {
    id: 3,
    icon: 'cafe-outline' as const,
    title: '파리 카페 투어 같이 해요',
    content:
      '파리 카페 투어 일정은 모집 완료되었습니다.\n\n비슷한 코스로 다음 달에도 한 번 더 다녀올 수 있어 관심 있는 분은 댓글 남겨주세요.',
    author: '박하린',
    country: '프랑스',
    cityName: '파리',
    period: '04/12 - 04/13',
    startDate: '2026-04-12',
    endDate: '2026-04-13',
    dateValue: '2026-04-12',
    tags: ['카페', '사진', '주말'],
    status: '모집완료',
    current: 4,
    total: 4,
    verified: false,
    chatLink: '',
    genderRatio: '무관',
    tint: '#EAF7EF',
    iconColor: '#40A66A',
    isMine: false,
  },
];

export type BoardPost = (typeof boardPosts)[number];
export type CompanionFixturePost = (typeof companionPosts)[number];
