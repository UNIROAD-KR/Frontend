import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

type MockRecord = Record<string, unknown>;

const MOCK_DELAY_MS = 140;
const MOCK_MEMBER_ID = 1;

let nextId = 900;
const now = () => new Date().toISOString();

const mockMember: MockRecord = {
  id: MOCK_MEMBER_ID,
  username: 'uniroad2026',
  email: 'uniroad@example.com',
  name: '김유니',
  nickname: '유니',
  gender: 'FEMALE',
  currentSituation: 'DISPATCHED',
  age: 22,
  domesticUniversityId: 1,
  domesticUniversity: '한국대학교',
  homeUniversity: '한국대학교',
  dispatchedUniversity: '베를린 자유대학교',
  dispatchedCountry: '독일',
  dispatchedRegion: '베를린',
  dispatchSemester: '2026년 2학기',
  dispatchStartDate: '2026-08-20',
  role: 'USER',
  status: 'ACTIVE',
  balance: 580000,
};

const usedItems: MockRecord[] = [
  {
    id: 101,
    memberId: 2,
    title: '베를린 생활용품 일괄 판매해요',
    content: '기숙사에서 사용한 생활용품을 깨끗하게 정리해서 판매합니다.',
    price: 48000,
    country: '독일',
    region: '베를린',
    semester: '2026년 2학기',
    status: 'AVAILABLE',
    scrapCount: 7,
    thumbnailImageUrl: '',
    authorName: '김하니',
    authorNickname: '하니',
    authorDomesticUniversity: '한국대학교',
    authorHomeUniversity: '한국대학교',
    authorDispatchedUniversity: '베를린 자유대학교',
    authorDispatchedCountry: '독일',
    authorDispatchedRegion: '베를린',
    authorDispatchYear: 2026,
    authorDispatchSemester: '2학기',
    authorVerified: true,
    createdAt: '2026-08-10T10:20:00.000Z',
    updatedAt: '2026-08-10T10:20:00.000Z',
    items: [
      { category: 'KITCHEN', name: '주방 식기 세트', quantity: 1, description: '접시, 컵, 수저 포함' },
      { category: 'BEDDING', name: '이불과 베개', quantity: 1, description: '세탁 후 보관 중' },
    ],
    categoryImages: [],
  },
  {
    id: 102,
    memberId: 3,
    title: '뮌헨 기숙사 정리 물품 판매',
    content: '멀티탭, 수납함, 조명 등을 함께 드립니다.',
    price: 32000,
    country: '독일',
    region: '뮌헨',
    semester: '2026년 1학기',
    status: 'AVAILABLE',
    scrapCount: 3,
    thumbnailImageUrl: '',
    authorName: '서현',
    authorNickname: '서현',
    authorDomesticUniversity: '유니로드대학교',
    authorDispatchedUniversity: '뮌헨대학교',
    authorDispatchedCountry: '독일',
    authorDispatchedRegion: '뮌헨',
    authorVerified: true,
    createdAt: '2026-08-09T08:10:00.000Z',
    updatedAt: '2026-08-09T08:10:00.000Z',
    items: [{ category: 'LIFE', name: '수납함 세트', quantity: 2 }],
    categoryImages: [],
  },
  {
    id: 103,
    memberId: 4,
    title: '파리 귀국 전 일괄 판매',
    content: '짧게 사용한 생활용품이라 상태가 좋아요.',
    price: 55000,
    country: '프랑스',
    region: '파리',
    semester: '2026년 여름단기',
    status: 'COMPLETED',
    scrapCount: 12,
    thumbnailImageUrl: '',
    authorName: '민지',
    authorNickname: '민지',
    authorDomesticUniversity: '한국대학교',
    authorDispatchedUniversity: '파리 시테대학교',
    authorDispatchedCountry: '프랑스',
    authorDispatchedRegion: '파리',
    authorVerified: true,
    createdAt: '2026-08-07T12:20:00.000Z',
    updatedAt: '2026-08-07T12:20:00.000Z',
    items: [{ category: 'ELECTRONICS', name: '드라이기', quantity: 1 }],
    categoryImages: [],
  },
];

const tickets: MockRecord[] = [
  {
    id: 201,
    memberId: 2,
    authorId: 2,
    authorName: '김하니',
    authorNickname: '하니',
    authorDomesticUniversity: '한국대학교',
    authorHomeUniversity: '한국대학교',
    authorDispatchedUniversity: '베를린 자유대학교',
    authorDispatchedCountry: '독일',
    authorDispatchedRegion: '베를린',
    authorDispatchYear: 2026,
    authorDispatchSemester: '2학기',
    title: '베를린 박물관 섬 입장권 양도',
    content: '날짜 변경이 어려워서 저렴하게 양도합니다.',
    country: '독일',
    eventDate: '2026-08-18',
    eventTime: '14:00',
    location: '베를린 박물관 섬',
    ticketType: 'TOUR',
    quantity: 1,
    transferPrice: 18,
    originalPrice: 25,
    status: 'AVAILABLE',
    scrapCount: 5,
    thumbnailImageUrl: '',
    imageUrls: [],
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 202,
    memberId: 3,
    authorId: 3,
    authorName: '서현',
    authorNickname: '서현',
    authorDomesticUniversity: '유니로드대학교',
    authorDispatchedUniversity: '뮌헨대학교',
    authorDispatchedCountry: '독일',
    authorDispatchedRegion: '뮌헨',
    authorDispatchYear: 2026,
    authorDispatchSemester: '1학기',
    title: '뮌헨 콘서트 티켓 양도',
    content: '공연을 보러 가지 못하게 되어 양도합니다.',
    country: '독일',
    eventDate: '2026-08-24',
    eventTime: '19:30',
    location: '올림피아홀',
    ticketType: 'CONCERT',
    quantity: 2,
    transferPrice: 90,
    originalPrice: 110,
    status: 'AVAILABLE',
    scrapCount: 8,
    thumbnailImageUrl: '',
    imageUrls: [],
    createdAt: '2026-08-09T11:00:00.000Z',
    updatedAt: '2026-08-09T11:00:00.000Z',
  },
];

const freePosts: MockRecord[] = [
  {
    id: 301,
    title: '독일 비자 인터뷰 예약 가능한 날짜 공유해요',
    preview: '인터뷰 예약할 때 참고하면 좋을 날짜를 정리했어요.',
    content: '인터뷰 예약할 때 참고하면 좋을 날짜를 정리했어요.',
    country: '독일',
    status: '파견 전',
    authorName: '유니',
    likeCount: 23,
    scrapCount: 8,
    commentCount: 0,
    liked: false,
    mine: true,
    imageUrls: [],
    createdAt: '2026-08-10T12:30:00.000Z',
    comments: [],
  },
  {
    id: 302,
    title: '베를린 기숙사 신청 팁 있어요?',
    preview: '처음 신청하는데 필요한 서류가 궁금해요.',
    content: '처음 신청하는데 필요한 서류가 궁금해요.',
    country: '독일',
    status: '파견 중',
    authorName: '하니',
    likeCount: 11,
    scrapCount: 2,
    commentCount: 0,
    liked: false,
    mine: false,
    imageUrls: [],
    createdAt: '2026-08-09T08:40:00.000Z',
    comments: [],
  },
];

const companionPosts: MockRecord[] = [
  {
    id: 401,
    memberName: '하니',
    title: '베를린 박물관 같이 가실 분 구해요',
    content: '주말 오후에 함께 관람할 분을 구합니다.',
    startDate: '2026-08-16',
    endDate: '2026-08-16',
    country: '독일',
    region: '베를린',
    chatLink: '',
    status: 'RECRUITING',
    statusDescription: '모집 중',
    scrapCount: 4,
    capacity: 4,
    currentParticipants: 2,
    genderRatio: '무관',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 402,
    memberName: '민지',
    title: '파리 근교 당일치기 동행 구합니다',
    content: '기차 타고 베르사유에 다녀올 예정이에요.',
    startDate: '2026-08-22',
    endDate: '2026-08-22',
    country: '프랑스',
    region: '파리',
    chatLink: '',
    status: 'RECRUITING',
    statusDescription: '모집 중',
    scrapCount: 6,
    capacity: 3,
    currentParticipants: 1,
    genderRatio: '무관',
    createdAt: '2026-08-09T15:00:00.000Z',
  },
];

const scrappedUsedItemIds = new Set<number>();
const scrappedTicketIds = new Set<number>();
const scrappedFreePostIds = new Set<number>();
const scrappedCompanionIds = new Set<number>();

const chatRooms: MockRecord[] = [
  {
    roomId: 501,
    referenceType: 'TRADE',
    referenceId: 101,
    opponentMemberId: 2,
    opponentName: '김하니',
    opponentNickname: '하니',
    lastMessage: '네, 아직 거래 가능해요!',
    lastMessageType: 'TALK',
    lastMessageCreatedAt: '2026-08-10T10:45:00.000Z',
    unreadCount: 1,
    lastReadAt: '2026-08-10T10:40:00.000Z',
  },
];

const chatMessages = new Map<number, MockRecord[]>([
  [
    501,
    [
      {
        id: 601,
        roomId: 501,
        senderId: 2,
        message: '안녕하세요, 아직 거래 가능한가요?',
        content: '안녕하세요, 아직 거래 가능한가요?',
        type: 'TALK',
        createdAt: '2026-08-10T10:35:00.000Z',
        isRead: true,
      },
      {
        id: 602,
        roomId: 501,
        senderId: MOCK_MEMBER_ID,
        message: '네, 아직 거래 가능해요!',
        content: '네, 아직 거래 가능해요!',
        type: 'TALK',
        createdAt: '2026-08-10T10:45:00.000Z',
        isRead: true,
      },
    ],
  ],
]);

const notices: MockRecord[] = [
  {
    id: 1,
    title: '유니로드 테스트 공지',
    content: '현재 앱 화면 확인을 위한 Mock API가 연결되어 있습니다.',
    createdAt: '2026-08-11T00:00:00.000Z',
    updatedAt: '2026-08-11T00:00:00.000Z',
  },
];

const parseBody = (value: unknown): MockRecord => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as MockRecord;
    } catch {
      return {};
    }
  }

  return value as MockRecord;
};

const toBaseResponse = (data: unknown) => ({
  timestamp: now(),
  status: 0,
  message: 'Mock API 응답',
  data,
});

const toPage = (content: MockRecord[]) => ({
  totalElements: content.length,
  totalPages: 1,
  pageable: {
    pageNumber: 0,
    pageSize: content.length,
    paged: true,
    unpaged: false,
    offset: 0,
    sort: [],
  },
  numberOfElements: content.length,
  size: content.length,
  content,
  number: 0,
  sort: [],
  first: true,
  last: true,
  empty: content.length === 0,
});

const toCursor = (items: MockRecord[]) => ({
  items,
  nextCursorId: null,
  hasNext: false,
});

const getParam = (config: InternalAxiosRequestConfig, key: string) => {
  const params = config.params as MockRecord | undefined;
  const value = params?.[key];

  return typeof value === 'string' ? value : value == null ? '' : String(value);
};

const includesKeyword = (value: unknown, keyword: string) =>
  !keyword || String(value ?? '').toLowerCase().includes(keyword.toLowerCase());

const filterRecords = (records: MockRecord[], config: InternalAxiosRequestConfig) => {
  const title = getParam(config, 'title');
  const content = getParam(config, 'content');
  const country = getParam(config, 'country');
  const region = getParam(config, 'region') || getParam(config, 'location');
  const status = getParam(config, 'status');

  return records.filter(
    (record) =>
      includesKeyword(record.title, title) &&
      includesKeyword(record.content, content) &&
      includesKeyword(record.country, country) &&
      includesKeyword(record.region ?? record.location, region) &&
      (!status || record.status === status),
  );
};

const findRecord = (records: MockRecord[], id: number) =>
  records.find((record) => Number(record.id) === id);

const response = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse => ({
  data,
  status,
  statusText: status >= 400 ? 'Error' : 'OK',
  headers: {},
  config,
  request: {},
});

const nextMockId = () => {
  nextId += 1;
  return nextId;
};

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

const getIdFromPath = (path: string) => {
  const match = path.match(/\/(\d+)(?:\/[^/]+)?$/);
  return match ? Number(match[1]) : null;
};

const createUsedItem = (body: MockRecord) => {
  const id = nextMockId();
  const item: MockRecord = {
    id,
    memberId: MOCK_MEMBER_ID,
    title: body.title ?? '새 중고거래 글',
    content: body.content ?? '',
    price: Number(body.price ?? 0),
    country: body.country ?? mockMember.dispatchedCountry,
    region: body.region ?? mockMember.dispatchedRegion,
    semester: body.semester ?? mockMember.dispatchSemester,
    returnDate: body.returnDate,
    status: body.status ?? 'AVAILABLE',
    scrapCount: 0,
    thumbnailImageUrl: body.thumbnailImageUrl ?? '',
    authorName: mockMember.name,
    authorNickname: mockMember.nickname,
    authorDomesticUniversity: mockMember.domesticUniversity,
    authorHomeUniversity: mockMember.homeUniversity,
    authorDispatchedUniversity: mockMember.dispatchedUniversity,
    authorDispatchedCountry: mockMember.dispatchedCountry,
    authorDispatchedRegion: mockMember.dispatchedRegion,
    authorDispatchSemester: mockMember.dispatchSemester,
    authorVerified: true,
    createdAt: now(),
    updatedAt: now(),
    items: body.items ?? [],
    categoryImages: body.categoryImages ?? [],
  };

  usedItems.unshift(item);
  return item;
};

const createTicket = (body: MockRecord) => {
  const id = nextMockId();
  const ticket: MockRecord = {
    id,
    memberId: MOCK_MEMBER_ID,
    authorId: MOCK_MEMBER_ID,
    authorName: mockMember.name,
    authorNickname: mockMember.nickname,
    authorDomesticUniversity: mockMember.domesticUniversity,
    authorHomeUniversity: mockMember.homeUniversity,
    authorDispatchedUniversity: mockMember.dispatchedUniversity,
    authorDispatchedCountry: mockMember.dispatchedCountry,
    authorDispatchedRegion: mockMember.dispatchedRegion,
    authorDispatchSemester: mockMember.dispatchSemester,
    title: body.title ?? '새 티켓 양도 글',
    content: body.content ?? '',
    country: body.country ?? mockMember.dispatchedCountry,
    eventDate: body.eventDate ?? '2026-08-20',
    eventEndDate: body.eventEndDate,
    eventTime: body.eventTime ?? '12:00',
    location: body.location ?? '',
    ticketType: body.ticketType ?? 'TOUR',
    quantity: Number(body.quantity ?? 1),
    transferPrice: Number(body.transferPrice ?? 0),
    originalPrice: Number(body.originalPrice ?? 0),
    status: 'AVAILABLE',
    scrapCount: 0,
    thumbnailImageUrl: '',
    imageUrls: [],
    createdAt: now(),
    updatedAt: now(),
  };

  tickets.unshift(ticket);
  return ticket;
};

export const mockApiAdapter: AxiosAdapter = async (config) => {
  await wait();

  const requestConfig = config as InternalAxiosRequestConfig;
  const method = (requestConfig.method ?? 'get').toLowerCase();
  const path = (requestConfig.url ?? '').split('?')[0];
  const body = parseBody(requestConfig.data);
  const base = (data: unknown) => response(requestConfig, toBaseResponse(data));

  if (path === '/api/auth/login' || path === '/api/auth/social-login') {
    return base({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      accessTokenExpiresIn: 3600,
      status: 'ACTIVE',
    });
  }

  if (path === '/api/auth/reissue') {
    return base({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      accessTokenExpiresIn: 3600,
      status: 'ACTIVE',
    });
  }

  if (path === '/api/auth/sign-up' || path === '/api/auth/social-sign-up') {
    Object.assign(mockMember, {
      username: body.username ?? mockMember.username,
      name: body.name ?? mockMember.name,
      email: body.email ?? mockMember.email,
      status: 'NEED_ONBOARDING',
    });
    return base(null);
  }

  if (path === '/api/auth/onboarding') {
    Object.assign(mockMember, {
      ...body,
      domesticUniversity: body.domesticUniversity ?? mockMember.domesticUniversity,
      dispatchedUniversity: body.dispatchedUniversity ?? mockMember.dispatchedUniversity,
      dispatchedCountry: body.dispatchedCountry ?? mockMember.dispatchedCountry,
      dispatchedRegion: body.dispatchedRegion ?? mockMember.dispatchedRegion,
      dispatchSemester: body.dispatchSemester ?? mockMember.dispatchSemester,
      status: 'ACTIVE',
    });
    return base(mockMember);
  }

  if (path === '/api/auth/check-username' || path === '/api/auth/check-email') {
    return base(true);
  }

  if (path === '/api/auth/logout' || path === '/api/members/me') {
    if (path === '/api/members/me' && method === 'get') return base(mockMember);
    if (path === '/api/members/me' && method === 'delete') return base(null);
    return base(null);
  }

  if (path === '/api/members/me/profile' && method === 'patch') {
    Object.assign(mockMember, body);
    return base(mockMember);
  }

  if (path === '/api/members/me/password' && method === 'patch') {
    return base(null);
  }

  if (path === '/api/used-items' && method === 'get') {
    return base(toCursor(usedItems));
  }

  if (path === '/api/used-items/search' && method === 'get') {
    return base(toCursor(filterRecords(usedItems, requestConfig)));
  }

  if (path === '/api/used-items/my' && method === 'get') {
    return base(toCursor(usedItems.filter((item) => item.memberId === MOCK_MEMBER_ID)));
  }

  if (path === '/api/used-items/scraps' && method === 'get') {
    return base(toCursor(usedItems.filter((item) => scrappedUsedItemIds.has(Number(item.id)))));
  }

  if (path === '/api/used-items' && method === 'post') {
    return base(createUsedItem(body).id);
  }

  if (path.startsWith('/api/used-items/')) {
    const id = getIdFromPath(path);
    const item = id == null ? undefined : findRecord(usedItems, id);

    if (path.endsWith('/scrap') && id != null) {
      if (scrappedUsedItemIds.has(id)) scrappedUsedItemIds.delete(id);
      else scrappedUsedItemIds.add(id);
      return base(scrappedUsedItemIds.has(id));
    }

    if (path.endsWith('/complete') && item) {
      item.status = 'COMPLETED';
      return base(null);
    }

    if (path.endsWith('/reopen') && item) {
      item.status = 'AVAILABLE';
      return base(null);
    }

    if (item && method === 'get') return base(item);
    if (item && method === 'patch') {
      Object.assign(item, body, { updatedAt: now() });
      return base(null);
    }
    if (item && method === 'delete') {
      usedItems.splice(usedItems.indexOf(item), 1);
      return base(null);
    }
  }

  if (path === '/api/tickets' && method === 'get') {
    return base(toCursor(tickets));
  }

  if (path === '/api/tickets/search' && method === 'get') {
    return base(toCursor(filterRecords(tickets, requestConfig)));
  }

  if (path === '/api/tickets/my' && method === 'get') {
    return base(toCursor(tickets.filter((item) => item.memberId === MOCK_MEMBER_ID)));
  }

  if (path === '/api/tickets/scraps' && method === 'get') {
    return base(toCursor(tickets.filter((item) => scrappedTicketIds.has(Number(item.id)))));
  }

  if (path === '/api/tickets' && method === 'post') {
    return base(createTicket(body).id);
  }

  if (path.startsWith('/api/tickets/')) {
    const id = getIdFromPath(path);
    const ticket = id == null ? undefined : findRecord(tickets, id);

    if (path.endsWith('/scrap') && id != null) {
      if (scrappedTicketIds.has(id)) scrappedTicketIds.delete(id);
      else scrappedTicketIds.add(id);
      return base(scrappedTicketIds.has(id));
    }

    if (path.endsWith('/complete') && ticket) {
      ticket.status = 'COMPLETED';
      return base(null);
    }

    if (ticket && method === 'get') return base(ticket);
    if (ticket && (method === 'put' || method === 'patch')) {
      Object.assign(ticket, body, { updatedAt: now() });
      return base(null);
    }
    if (ticket && method === 'delete') {
      tickets.splice(tickets.indexOf(ticket), 1);
      return base(null);
    }
  }

  if (path.startsWith('/api/community/free-posts')) {
    const isMine = path.endsWith('/my');
    const isScraps = path.endsWith('/scraps');
    const isLiked = path.endsWith('/liked');
    const isList =
      path === '/api/community/free-posts' ||
      path.endsWith('/all') ||
      path.endsWith('/pre-dispatch') ||
      path.endsWith('/before-dispatch') ||
      path.endsWith('/dispatching') ||
      path.endsWith('/dispatched') ||
      isMine ||
      isScraps ||
      isLiked;

    if (isList && method === 'get') {
      let items = freePosts;
      if (isMine) items = items.filter((item) => item.mine);
      if (isScraps) items = items.filter((item) => scrappedFreePostIds.has(Number(item.id)));
      if (isLiked) items = items.filter((item) => item.liked);
      if (path.endsWith('/pre-dispatch') || path.endsWith('/before-dispatch')) {
        items = items.filter((item) => item.status === '파견 전');
      }
      if (path.endsWith('/dispatching') || path.endsWith('/dispatched')) {
        items = items.filter((item) => item.status === '파견 중');
      }
      return base(toCursor(filterRecords(items, requestConfig)));
    }

    if (path === '/api/community/free-posts' && method === 'post') {
      const id = nextMockId();
      freePosts.unshift({
        id,
        title: body.title ?? '새 자유게시판 글',
        preview: body.content ?? '',
        content: body.content ?? '',
        country: mockMember.dispatchedCountry,
        status: '파견 중',
        authorName: mockMember.nickname,
        likeCount: 0,
        scrapCount: 0,
        commentCount: 0,
        liked: false,
        mine: true,
        imageUrls: body.imageUrls ?? [],
        createdAt: now(),
        comments: [],
      });
      return base(id);
    }

    const id = getIdFromPath(path);
    const post = id == null ? undefined : findRecord(freePosts, id);
    if (path.endsWith('/like') && post) {
      post.liked = !post.liked;
      post.likeCount = Number(post.likeCount ?? 0) + (post.liked ? 1 : -1);
      return base({ liked: post.liked, likeCount: post.likeCount });
    }
    if (path.endsWith('/scrap') && id != null) {
      if (scrappedFreePostIds.has(id)) scrappedFreePostIds.delete(id);
      else scrappedFreePostIds.add(id);
      return base(scrappedFreePostIds.has(id));
    }
    if (post && method === 'get') return base(post);
    if (post && method === 'put') {
      Object.assign(post, body);
      return base(null);
    }
    if (post && method === 'delete') {
      freePosts.splice(freePosts.indexOf(post), 1);
      return base(null);
    }
  }

  if (path.startsWith('/api/companions')) {
    const isMine = path.endsWith('/my');
    const isScraps = path.endsWith('/scraps');
    if ((path === '/api/companions' || isMine || isScraps) && method === 'get') {
      let items = companionPosts;
      if (isMine) items = items.filter((item) => item.memberName === mockMember.nickname);
      if (isScraps) items = items.filter((item) => scrappedCompanionIds.has(Number(item.id)));
      return base(toCursor(filterRecords(items, requestConfig)));
    }
    if (path === '/api/companions' && method === 'post') {
      const id = nextMockId();
      companionPosts.unshift({
        id,
        ...body,
        memberName: mockMember.nickname,
        statusDescription: body.status === 'COMPLETED' ? '모집 완료' : '모집 중',
        scrapCount: 0,
        createdAt: now(),
      });
      return base(id);
    }
    const id = getIdFromPath(path);
    const post = id == null ? undefined : findRecord(companionPosts, id);
    if (path.endsWith('/scrap') && id != null) {
      if (scrappedCompanionIds.has(id)) scrappedCompanionIds.delete(id);
      else scrappedCompanionIds.add(id);
      return base(scrappedCompanionIds.has(id));
    }
    if (post && method === 'get') return base(post);
    if (post && method === 'put') {
      Object.assign(post, body);
      return base(null);
    }
    if (post && method === 'delete') {
      companionPosts.splice(companionPosts.indexOf(post), 1);
      return base(null);
    }
  }

  if (path === '/api/v1/chat/rooms' && method === 'get') {
    return response(requestConfig, chatRooms);
  }

  if (path === '/api/v1/chat/rooms' && method === 'post') {
    const referenceType = body.referenceType ?? 'TRADE';
    const referenceId = Number(body.referenceId ?? 101);
    const existing = chatRooms.find(
      (room) => room.referenceType === referenceType && room.referenceId === referenceId,
    );
    if (existing) return response(requestConfig, existing);
    const room: MockRecord = {
      roomId: nextMockId(),
      referenceType,
      referenceId,
      opponentMemberId: body.targetMemberId ?? 2,
      opponentName: '거래 상대',
      opponentNickname: '거래 상대',
      lastMessage: '',
      unreadCount: 0,
    };
    chatRooms.unshift(room);
    chatMessages.set(Number(room.roomId), []);
    return response(requestConfig, room);
  }

  if (path.startsWith('/api/v1/chat/rooms/')) {
    const roomId = getIdFromPath(path);
    if (roomId != null && path.endsWith('/messages') && method === 'get') {
      return response(requestConfig, chatMessages.get(roomId) ?? []);
    }
    if (roomId != null && path.endsWith('/messages') && method === 'post') {
      const message: MockRecord = {
        id: nextMockId(),
        roomId,
        senderId: MOCK_MEMBER_ID,
        message: body.message ?? '',
        content: body.message ?? '',
        type: body.type ?? 'TALK',
        createdAt: now(),
        isRead: false,
      };
      const messages = chatMessages.get(roomId) ?? [];
      messages.push(message);
      chatMessages.set(roomId, messages);
      const room = chatRooms.find((item) => Number(item.roomId) === roomId);
      if (room) Object.assign(room, { lastMessage: message.message, lastMessageCreatedAt: message.createdAt });
      return response(requestConfig, message);
    }
    if (roomId != null && path.endsWith('/read')) {
      return response(requestConfig, { roomId, lastReadAt: now() });
    }
  }

  if (path === '/api/countries') {
    return base([
      { id: 1, name: '독일', code: 'DE' },
      { id: 2, name: '프랑스', code: 'FR' },
      { id: 3, name: '스페인', code: 'ES' },
      { id: 4, name: '체코', code: 'CZ' },
    ]);
  }

  if (path === '/api/notices' && method === 'get') return base(notices);
  if (path.startsWith('/api/notices/') && method === 'get') {
    return base(findRecord(notices, getIdFromPath(path) ?? -1) ?? notices[0]);
  }

  if (path === '/api/v1/notifications/unread-count') return base({ count: 1 });
  if (path === '/api/v1/notifications' && method === 'get') {
    return base(toPage([
      {
        notificationId: 1,
        type: 'CHAT',
        title: '새 메시지가 도착했어요',
        content: '거래 상대가 메시지를 보냈어요.',
        referenceId: 101,
        roomId: 501,
        createdAt: '2026-08-10T10:45:00.000Z',
      },
    ]));
  }

  if (path === '/api/account-book/summary') {
    return base({
      totalIncome: 650000,
      totalExpense: 72000,
      dailySummaries: {
        '2026-08-01': { income: 0, expense: 18000 },
        '2026-08-02': { income: 0, expense: 24000 },
      },
    });
  }
  if (path === '/api/account-book/daily') return base([]);
  if (path === '/api/account-book/balance') return base({ balance: 578000 });
  if (path === '/api/account-book' && method === 'post') return base(nextMockId());

  if (path === '/api/v1/verifications/me') {
    return base([
      {
        id: 260731,
        imageUrl: '',
        status: 'APPROVED',
        rejectReason: null,
        submittedAt: '2012-01-01T00:00:00.000Z',
        reviewedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 260730,
        imageUrl: '',
        status: 'APPROVED',
        rejectReason: null,
        submittedAt: '2012-01-01T00:00:00.000Z',
        reviewedAt: '2012-01-02T00:00:00.000Z',
      },
    ]);
  }
  if (path === '/api/v1/verifications' && method === 'post') {
    return base({ id: nextMockId(), imageUrl: body.imageUrl ?? '', status: 'PENDING', submittedAt: now() });
  }

  if (path === '/api/s3/presigned-url' && method === 'post') {
    const fileName = String(body.fileName ?? 'image.jpg');
    return base({
      uploadUrl: 'https://example.invalid/mock-upload',
      fileUrl: `mock://uploads/${fileName}`,
      key: `mock/${fileName}`,
    });
  }

  if (path.startsWith('/api/partner-schools') || path.startsWith('/api/scholarships') || path.startsWith('/api/reviews') || path.startsWith('/api/exchange-reviews')) {
    return base(toPage([]));
  }

  if (path.startsWith('/api/exchange-info')) return base([]);

  if (path === '/api/reports' && method === 'post') return base(nextMockId());

  return base(method === 'get' ? [] : null);
};
