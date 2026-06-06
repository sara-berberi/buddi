import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { colors, fonts } from '../../lib/constants';

// Simple emoji icons keep us font/asset-free and web-safe.
function Icon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'web' ? 64 : undefined,
        },
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="daily"
        options={{ title: 'Daily', tabBarIcon: ({ focused }) => <Icon glyph="✶" focused={focused} /> }}
      />
      <Tabs.Screen
        name="garden"
        options={{ title: 'Garden', tabBarIcon: ({ focused }) => <Icon glyph="🌿" focused={focused} /> }}
      />
      <Tabs.Screen
        name="tonight"
        options={{
          title: 'Tonight',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.amber,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: Platform.OS === 'web' ? 0 : -14,
                opacity: focused ? 1 : 0.85,
              }}
            >
              <Text style={{ fontSize: 22 }}>✦</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <Icon glyph="◍" focused={focused} /> }}
      />
    </Tabs>
  );
}
