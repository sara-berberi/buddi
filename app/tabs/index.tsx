import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TabView } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedScreen from '../../components/screens/FeedScreen';
import DailyScreen from '../../components/screens/DailyScreen';
import GardenScreen from '../../components/screens/GardenScreen';
import TonightScreen from '../../components/screens/TonightScreen';
import ProfileScreen from '../../components/screens/ProfileScreen';
import { colors, fonts } from '../../lib/constants';
import { TAB_BAR_HEIGHT } from '../../components/nav/tabBarMetrics';
import { Icon, type IconName } from '../../components/ui/Icon';

type RouteKey = 'feed' | 'daily' | 'garden' | 'tonight' | 'profile';

const ROUTES: { key: RouteKey; title: string; icon: IconName; center?: boolean }[] = [
  { key: 'feed', title: 'Feed', icon: 'home' },
  { key: 'daily', title: 'Daily', icon: 'daily' },
  { key: 'tonight', title: 'Tonight', icon: 'tonight', center: true },
  { key: 'garden', title: 'Garden', icon: 'garden' },
  { key: 'profile', title: 'Profile', icon: 'profile' },
];

const SCENES: Record<RouteKey, React.ComponentType> = {
  feed: FeedScreen,
  daily: DailyScreen,
  garden: GardenScreen,
  tonight: TonightScreen,
  profile: ProfileScreen,
};

export default function TabsPager() {
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const renderScene = ({ route }: { route: { key: RouteKey } }) => {
    const Scene = SCENES[route.key];
    return <Scene />;
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes: ROUTES }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        // Swipe enabled on all platforms; bottom bar gives tap navigation.
        swipeEnabled
        renderTabBar={() => null} // we draw our own bottom bar below
        // Render only the active scene's neighbors to keep things light.
        lazy
      />

      <BottomBar index={index} onSelect={setIndex} bottomInset={insets.bottom} />
    </View>
  );
}

function BottomBar({
  index,
  onSelect,
  bottomInset,
}: {
  index: number;
  onSelect: (i: number) => void;
  bottomInset: number;
}) {
  // Guarantee the bar sits above the home indicator / gesture area and is
  // reachable: a comfortable height plus the device's safe-area inset (with a
  // sensible minimum so it's never flush to the very bottom edge).
  const pad = Math.max(bottomInset, 12);
  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + pad, paddingBottom: pad }]}>
      {ROUTES.map((r, i) => {
        const active = i === index;
        if (r.center) {
          return (
            <Pressable key={r.key} style={styles.centerWrap} onPress={() => onSelect(i)}>
              <View style={[styles.centerButton, { opacity: active ? 1 : 0.9 }]}>
                <Icon name={r.icon} size={24} color={colors.white} filled />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{r.title}</Text>
            </Pressable>
          );
        }
        return (
          <Pressable key={r.key} style={styles.item} onPress={() => onSelect(i)} hitSlop={6}>
            <Icon name={r.icon} size={24} color={active ? colors.forest : colors.muted} />
            <Text style={[styles.label, active && styles.labelActive]}>{r.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    ...(Platform.OS === 'web'
      ? { position: 'sticky' as 'absolute', bottom: 0 }
      : null),
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 2 },
  glyph: { fontSize: 22 },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  labelActive: { color: colors.forest, fontFamily: fonts.bodyMedium },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 2 },
  centerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18, // lift it above the bar like IG's center action
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  centerGlyph: { fontSize: 22, color: colors.white },
});
