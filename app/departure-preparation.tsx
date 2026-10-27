import { DepartureTab } from '@/components/management/departure-tab';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '@/constants/theme';
export default function DeparturePreparationScreen() {
    const { id } = useLocalSearchParams<{
        id: string;
    }>();
    return <SafeAreaView style={commonStyles.container}><DepartureTab preparationId={id}/></SafeAreaView>;
}
