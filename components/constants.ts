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
import WalletIcon from "../assets/icon/actions/wallet.svg"

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
