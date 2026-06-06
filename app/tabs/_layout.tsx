import { Stack } from 'expo-router';
import { colors } from '../../lib/constants';

// The tabs are now a single swipeable pager (app/tabs/index.tsx) rather than
// file-based Tabs, so we can support swipe + tap and a fully custom, reachable
// bottom bar. This Stack just hosts that one screen.
export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}
