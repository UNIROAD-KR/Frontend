import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tabMeta = {
  home: {
    label: '홈 화면',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  explore: {
    label: '탐색하기',
    icon: 'search-outline',
    activeIcon: 'search',
  },
  community: {
    label: '커뮤니티',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  market: {
    label: '중고마켓',
    icon: 'bag-handle-outline',
    activeIcon: 'bag-handle',
  },
  chat: {
    label: '채팅관리',
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
  },
} as const satisfies Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }
>;

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const tabBarWidth = Math.max(screenWidth - 32, 280);
  const tabContentWidth = tabBarWidth - 10;
  // Keep the selected pill compact on wider phones while leaving enough room for every label.
  const activeTabWidth = Math.min(Math.max(tabContentWidth * 0.32, 112), 124);
  const inactiveTabWidth = (tabContentWidth - activeTabWidth) / 4;

  return (
    <View
      style={[
        styles.tabBar,
        {
          width: tabBarWidth,
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {state.routes.map((route, routeIndex) => {
        const meta = tabMeta[route.name as keyof typeof tabMeta];

        if (!meta) {
          return null;
        }

        const active = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!active && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={meta.label}
            accessibilityState={active ? { selected: true } : {}}
            onPress={onPress}
            style={[
              styles.tabSlot,
              active ? styles.tabSlotActive : styles.tabSlotInactive,
              { width: active ? activeTabWidth : inactiveTabWidth },
            ]}
          >
            <Ionicons
              name={active ? meta.activeIcon : meta.icon}
              size={24}
              color={active ? '#FFFFFF' : '#75808F'}
            />
            {active ? (
              <Text numberOfLines={1} style={styles.activeLabel}>
                {meta.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/home' as any);
          },
        }}
        options={{
          title: '홈',
        }}
      />
      <Tabs.Screen
        name="explore"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/explore' as any);
          },
        }}
        options={{
          title: '탐색하기',
        }}
      />

      <Tabs.Screen
        name="community"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace({
              pathname: '/community',
              params: { fromTab: 'true' },
            } as any);
          },
        }}
        options={{
          title: '커뮤니티',
        }}
      />

      <Tabs.Screen
        name="market"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();

            router.replace({
              pathname: '/market',
              params: { fromTab: 'true' },
            } as any);
          },
        }}
        options={{
          title: '중고마켓',
        }}
      />

      <Tabs.Screen
        name="chat"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/chat' as any);
          },
        }}
        options={{
          title: '채팅관리',
        }}
      />

      <Tabs.Screen name="mypage" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111820',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabSlot: {
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  tabSlotInactive: {
    flexShrink: 0,
  },
  tabSlotActive: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: '#19212C',
  },
  activeLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
