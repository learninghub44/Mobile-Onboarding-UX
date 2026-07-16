import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function EntryScreen() {
  const { hasSeenOnboarding, isAuthenticated, isLoading } = useApp();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;
    if (!hasSeenOnboarding) {
      router.replace('/(onboarding)');
    } else if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, hasSeenOnboarding, isAuthenticated, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
