import { Stack } from 'expo-router';
import { colors } from '../../lib/constants';

// Makes `auth` a route group so the root layout can reference <Stack.Screen name="auth" />
// and router.replace('/auth') resolves to auth/index.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}
