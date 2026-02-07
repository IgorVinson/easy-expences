import { Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function BudgetScreen() {
  const { theme } = useTheme();

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bg }}>
      <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
        Budget Screen
      </Text>
    </View>
  );
}
