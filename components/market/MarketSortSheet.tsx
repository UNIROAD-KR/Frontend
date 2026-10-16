import { SortSheet } from "@/components/ui/sort-sheet";
import type { MarketSortOrder } from "@/src/utils/marketSort";

type Props = {
  visible: boolean;
  value: MarketSortOrder;
  onClose: () => void;
  onSelect: (value: MarketSortOrder) => void;
};

const options = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
] as const;

export function MarketSortSheet(props: Props) {
  return <SortSheet {...props} options={options} />;
}
