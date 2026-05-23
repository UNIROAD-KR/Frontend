import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const pathname = usePathname();

  const isMarketActive =
    pathname.startsWith('/market') || pathname.includes('/home/market');
  const isExploreActive =
    pathname.startsWith('/explore') || pathname.includes('/home/explore');
  const isCommunityActive = pathname.startsWith('/community');
  const isMyPageActive = pathname.startsWith('/mypage');
  const isHomeActive =
    (pathname === '/home' || pathname === '/') &&
    !isExploreActive &&
    !isMarketActive &&
    !isCommunityActive &&
    !isMyPageActive;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: {
          height: 86,
          paddingTop: 6,
          paddingBottom: 22,
          backgroundColor: '#FAFAFA',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#E6E6E6',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginBottom: -1,
        },
        tabBarItemStyle: {
          paddingTop: 1,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/(tabs)/home' as any);
          },
        }}
        options={{
          title: '홈',
          tabBarIcon: () => (
            <Ionicons
              name={isHomeActive ? 'home' : 'home-outline'}
              size={26}
              color={isHomeActive ? '#111111' : '#6d7075'}
            />
          ),
          tabBarLabelStyle: {
            color: isHomeActive ? '#111111' : '#6d7075',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 0,
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();

            if (pathname.includes('/home/explore')) {
              router.replace('/(tabs)/home/explore');
              return;
            }

            router.replace('/(tabs)/home/explore');
          },
        }}
        options={{
          title: '탐색',
          tabBarIcon: () => (
            <Ionicons
              name={isExploreActive ? 'school' : 'school-outline'}
              size={26}
              color={isExploreActive ? '#111111' : '#6d7075'}
            />
          ),
          tabBarLabelStyle: {
            color: isExploreActive ? '#111111' : '#6d7075',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 0,
          },
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: () => (
            <Ionicons
              name={isCommunityActive ? 'people' : 'people-outline'}
              size={26}
              color={isCommunityActive ? '#111111' : '#6d7075'}
            />
          ),
          tabBarLabelStyle: {
            color: isCommunityActive ? '#111111' : '#6d7075',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 0,
          },
        }}
      />

      <Tabs.Screen
        name="market"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();

            if (pathname.startsWith('/market')) {
              return;
            }

            router.replace('/(tabs)/market');
          },
        }}
        options={{
          title: '중고 마켓',
          tabBarIcon: () => (
            <Ionicons
              name={isMarketActive ? 'cart' : 'cart-outline'}
              size={26}
              color={isMarketActive ? '#111111' : '#6d7075'}
            />
          ),
          tabBarLabelStyle: {
            color: isMarketActive ? '#111111' : '#6d7075',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 0,
          },
        }}
      />

      <Tabs.Screen
        name="mypage"
        options={{
          title: '나의 관리',
          tabBarIcon: () => (
            <Ionicons
              name={isMyPageActive ? 'person' : 'person-outline'}
              size={25}
              color={isMyPageActive ? '#111111' : '#6d7075'}
            />
          ),
          tabBarLabelStyle: {
            color: isMyPageActive ? '#111111' : '#6d7075',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 0,
          },
        }}
      />
    </Tabs>
  );
}
