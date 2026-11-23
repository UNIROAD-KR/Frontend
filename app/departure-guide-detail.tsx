import VisaGuideScreen from "@/components/home/visa-guide";
import { useLocalSearchParams } from "expo-router";

export default function DepartureGuideDetailScreen() {
  const { country, category } = useLocalSearchParams<{ country?: string; category?: string }>();
  return <VisaGuideScreen initialCountry={country} detailCategory={category} />;
}
