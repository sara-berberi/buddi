import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
  useFonts,
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

// Routes the auth gate redirects between.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { hydrate, hydrated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const segs = segments as string[];
    const inAuth = segs[0] === 'auth';
    const onOnboard = segs[1] === 'onboard';
    const needsOnboarding = user && !user.onboarded;

    if (!user && !inAuth) {
      router.replace('/auth');
    } else if (user && needsOnboarding && !onOnboard) {
      router.replace('/auth/onboard');
    } else if (user && !needsOnboarding && inAuth) {
      router.replace('/tabs');
    }
  }, [hydrated, user, segments, router]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.cream} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="tabs" />
            <Stack.Screen name="friendship/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="quest/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="people" options={{ headerShown: true, title: 'People' }} />
            <Stack.Screen name="avatar" options={{ headerShown: true, title: 'Edit avatar', presentation: 'modal' }} />
            <Stack.Screen name="dm/index" options={{ headerShown: true, title: 'Messages' }} />
            <Stack.Screen name="dm/[id]" options={{ headerShown: true, title: 'Chat' }} />
            <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Post' }} />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
