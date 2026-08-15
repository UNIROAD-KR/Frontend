import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, router } from 'expo-router';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';

import ChatFilledIcon from '@/assets/icon/Property 1=chat, Property 2=fill.svg';
import ChatLineIcon from '@/assets/icon/Property 1=chat, Property 2=line.svg';
import CommunityFilledIcon from '@/assets/icon/Property 1=community, Property 2=fill.svg';
import CommunityLineIcon from '@/assets/icon/Property 1=community, Property 2=line.svg';
import HomeFilledIcon from '@/assets/icon/Property 1=home, Property 2=fill.svg';
import HomeLineIcon from '@/assets/icon/Property 1=home, Property 2=line.svg';
import SearchFilledIcon from '@/assets/icon/Property 1=search, Property 2=fill.svg';
import SearchLineIcon from '@/assets/icon/Property 1=search, Property 2=line.svg';
import ShopFilledIcon from '@/assets/icon/Property 1=shop, Property 2=fill.svg';

type SvgIcon = ComponentType<SvgProps>;
type TabIcon = SvgIcon | keyof typeof Ionicons.glyphMap;

const tabMeta = {
  home: {
    label: '홈 화면',
    icon: HomeLineIcon,
    activeIcon: HomeFilledIcon,
  },
  explore: {
    label: '탐색하기',
    icon: SearchLineIcon,
    activeIcon: SearchFilledIcon,
  },
  community: {
    label: '커뮤니티',
    icon: CommunityLineIcon,
    activeIcon: CommunityFilledIcon,
  },
  market: {
    label: '중고마켓',
    icon: 'bag-handle-outline',
    activeIcon: ShopFilledIcon,
  },
  chat: {
    label: '채팅관리',
    icon: ChatLineIcon,
    activeIcon: ChatFilledIcon,
  },
} as const satisfies Record<
  string,
  {
    label: string;
    icon: TabIcon;
    activeIcon: TabIcon;
  }
>;

function TabBarIcon({ icon, active }: { icon: TabIcon; active: boolean }) {
  const color = active ? '#FFFFFF' : '#75808F';

  if (typeof icon === 'string') {
    return <Ionicons name={icon} size={24} color={color} />;
  }

  const Icon = icon;
  return <Icon width={24} height={24} color={color} />;
}

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
            <TabBarIcon icon={active ? meta.activeIcon : meta.icon} active={active} />
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
