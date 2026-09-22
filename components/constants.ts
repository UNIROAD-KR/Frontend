import type { LifecycleStatus } from "@/components/types";
import { CurrentSituation } from "@/src/api/auth";
import AirplaneIcon from "../assets/icon/actions/airplane.svg";
import BuildingIcon from "../assets/icon/actions/building.svg";
import CartIcon from "../assets/icon/actions/cart.svg";
import DocumentIcon from "../assets/icon/actions/document.svg";
import HandshakeIcon from "../assets/icon/actions/handshake.svg";
import SchoolIcon from "../assets/icon/actions/school.svg";
import TicketIcon from "../assets/icon/actions/ticket.svg";
import TrophyIcon from "../assets/icon/actions/trophy.svg";
import WalletIcon from "../assets/icon/actions/wallet.svg";

export const CAROUSEL_ITEMS = [
  {
    id: "1",
    category: "중고거래",
    title: "인증된 학생들과\n안전하게 거래하세요",
    description:
      "교환학생이 직접 인증한 회원들과\n티켓, 생활용품, 교재를 거래할 수 있어요.",
    image: require("../assets/images/illust_trade.png"),
  },
  {
    id: "2",
    category: "동행",
    title: "같이 가는 친구를\n쉽게 찾을 수 있어요",
    description:
      "여행, 공연, 맛집 탐방까지\n같은 학교 학생들과 동행을 구해보세요.",
    image: require("../assets/images/illust_companion.png"),
  },
  {
    id: "3",
    category: "커뮤니티",
    title: "교환학생 이야기를\n모아보세요",
    description:
      "기숙사, 수강신청, 생활정보 등\n실제 파견 학생들의 이야기를 만나보세요.",
    image: require("../assets/images/illust_community.png"),
  },
  {
    id: "4",
    category: "정보탐색",
    title: "교환학생 정보를\n빠르게 찾아보세요",
    description: "학교별 후기와 국가별 정보를\n한 곳에서 확인할 수 있어요.",
    image: require("../assets/images/illust_info.png"),
  },
];

export const SHOW_TEMP_ONBOARDING_SIGNUP = __DEV__;

export const SOCIAL_LOGIN_ICONS = {
  kakao: require("../assets/images/login/kakao-round.png"),
  naver: require("../assets/images/login/naver-round.png"),
  google: require("../assets/images/login/google-round.png"),
  apple: require("../assets/images/login/apple-round.png"),
} as const;

export type SocialProvider = keyof typeof SOCIAL_LOGIN_ICONS;

export const quickActionsByStatus = [
  {
    title: "파견교",
    icon: SchoolIcon,
    route: "/home/school-info",
  },
  {
    title: "장학금",
    icon: TrophyIcon,
    route: "/home/scholarship-info",
  },
  {
    title: "출국 가이드",
    icon: DocumentIcon,
    route: "/home/visa-guide",
  },
  {
    title: "지원 기준",
    icon: BuildingIcon,
    route: "/home/my-school-info",
  },
  {
    title: "중고 마켓",
    icon: CartIcon,
    route: {
      pathname: "/market",
      params: { fromHome: "true" },
    },
  },
  {
    title: "티켓 양도",
    icon: TicketIcon,
    route: {
      pathname: "/market",
      params: { tab: "ticket" },
    },
  },
  {
    title: "동행 구하기",
    icon: HandshakeIcon,
    route: {
      pathname: "/community",
      params: { tab: "companion" },
    },
  },

  {
    title: "지출 관리",
    icon: WalletIcon,
    route: {
      pathname: "/mypage",
      params: { fromHome: "true" },
    },
  },
  {
    title: "출국 준비",
    icon: AirplaneIcon,
    route: "/home/departure-checklist",
  },

  // {
  //   title: "후기 작성",
  //   icon: "create-outline",
  //   route: "/community",
  // },
  // {
  //   title: "중고 판매",
  //   icon: "storefront-outline",
  //   route: {
  //     pathname: "/market",
  //     params: { fromHome: "true" },
  //   },
  // },
  // {
  //   title: "후배 질문 답변",
  //   icon: "chatbubbles-outline",
  //   route: "/community",
  // },
] as const;

export const statusDisplayMap: Record<string, LifecycleStatus> = {
  preparing: "지원 준비 중",
  applying: "지원 준비 중",
  beforeAccepted: "지원 준비 중",
  support: "지원 준비 중",
  preApply: "지원 준비 중",
  accepted: "출국 준비 중",
  dispatched: "파견 중",
  returned: "귀국",
};

export const currentSituationLifecycleMap: Record<
  CurrentSituation,
  LifecycleStatus
> = {
  PREPARING_APPLICATION: "지원 준비 중",
  WAITING_RESULT: "지원 준비 중",
  ACCEPTED: "지원 준비 중",
  PREPARING_DEPARTURE: "출국 준비 중",
  DISPATCHED: "파견 중",
  RETURNED: "귀국",
};
