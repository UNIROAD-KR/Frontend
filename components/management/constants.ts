import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";
import DocumentActionIcon from "@/assets/icon/actions/document.svg";
import HomeActionIcon from "@/assets/icon/actions/home.svg";
import WalletActionIcon from "@/assets/icon/actions/wallet.svg";
import MoneyActionIcon from "@/assets/icon/actions/money.svg";
import UsimActionIcon from "@/assets/icon/actions/usim.svg";
import { AccountBookCategory } from "@/src/api/accountBook";

export const ESSENTIAL_PRESENTATION: Record<
  string,
  { category: string; title: string; Icon: ComponentType<SvgProps> }
> = {
  "visa-apply": {
    category: "비자",
    title: "비자 신청하기",
    Icon: DocumentActionIcon,
  },
  "visa-pickup": {
    category: "비자",
    title: "비자 수령하기",
    Icon: DocumentActionIcon,
  },
  "housing-secure": {
    category: "거주",
    title: "숙소 확보하기",
    Icon: HomeActionIcon,
  },
  "insurance-join": {
    category: "보험",
    title: "보험 가입하기",
    Icon: WalletActionIcon,
  },
  "card-ready": {
    category: "은행/재정",
    title: "해외결제 카드 준비",
    Icon: MoneyActionIcon,
  },
  "esim-ready": {
    category: "통신",
    title: "유심/eSIM 준비",
    Icon: UsimActionIcon,
  },
  "flight-booking": {
    category: "항공",
    title: "항공권 예약하기",
    Icon: UsimActionIcon,
  },
};

export const CATEGORIES: {
  key: AccountBookCategory;
  label: string;
}[] = [
  { key: "FOOD", label: "식비" },
  { key: "TRANSPORT", label: "교통비" },
  { key: "SHOPPING", label: "쇼핑" },
  { key: "TRAVEL", label: "여행" },
  {
    key: "ETC",
    label: "기타 지출",
  },
];
