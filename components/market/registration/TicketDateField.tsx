import { InlineDropdown } from "@/components/ui/inline-dropdown";
import { useEffect, useState } from "react";
import { View } from "react-native";

export function TicketDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [parts, setParts] = useState(() => (value || "--").split("-"));
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { setParts((value || "--").split("-")); }, [value]);
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([...(parts[0] ? [parts[0]] : []), ...Array.from({ length: 12 }, (_, i) => String(currentYear + i))])).sort();
  const days = new Date(Number(parts[0]) || currentYear, Number(parts[1]) || 1, 0).getDate();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[0, 1, 2].map((index) => (
        <InlineDropdown key={index} compact value={parts[index] || ""} placeholder={["연도", "월", "일"][index]}
          displayValue={parts[index] ? `${Number(parts[index])}${["년", "월", "일"][index]}` : ""}
          open={open === index} onPress={() => setOpen(open === index ? null : index)}
          options={(index === 0 ? years : Array.from({ length: index === 1 ? 12 : days }, (_, i) => String(i + 1).padStart(2, "0"))).map((value) => ({ value, label: `${Number(value)}${["년", "월", "일"][index]}` }))}
          onSelect={(selected) => {
            const next = [...parts]; next[index] = selected;
            if (next[0] && next[1] && next[2]) {
              next[2] = String(Math.min(Number(next[2]), new Date(Number(next[0]), Number(next[1]), 0).getDate())).padStart(2, "0");
              onChange(next.join("-"));
            }
            setParts(next); setOpen(null);
          }}
        />
      ))}
    </View>
  );
}
