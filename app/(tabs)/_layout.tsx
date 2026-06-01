import { Tabs, router, usePathname } from 'expo-router';
import { Image, StyleSheet } from 'react-native';

const VISIBLE_TAB_BAR_STYLE = {
  height: 92,
  paddingTop: 10,
  paddingBottom: 18,
  backgroundColor: '#FAFAFA',
  borderTopWidth: 0,
};

const HIDDEN_TAB_BAR_STYLE = {
  display: 'none' as const,
};

const MARKET_ROUTES_WITH_TABS = new Set([
  '/market',
  '/market/write',
  '/market/category',
  '/market/preview',
  '/market/verify',
]);

export default function TabLayout() {
  const pathname = usePathname();

  const isMarketActive =
    pathname.startsWith('/market') || pathname.includes('/home/market');
  const shouldHideTabBar =
    pathname === '/market/ticket-preview' ||
    (pathname.startsWith('/market/') && !MARKET_ROUTES_WITH_TABS.has(pathname));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2F66D0',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: shouldHideTabBar
          ? HIDDEN_TAB_BAR_STYLE
          : VISIBLE_TAB_BAR_STYLE,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
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
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/home.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? '#2F66D0' : '#6d7075' },
              ]}
            />
          ),
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
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/explore.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? '#2F66D0' : '#6d7075' },
              ]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/community.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? '#2F66D0' : '#6d7075' },
              ]}
            />
          ),
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
            <Image
              source={require('../../assets/images/market.png')}
              style={[
                styles.tabIcon,
                { tintColor: isMarketActive ? '#2F66D0' : '#6d7075' },
              ]}
            />
          ),
          tabBarLabelStyle: {
            color: isMarketActive ? '#2F66D0' : '#6d7075',
            fontSize: 14,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      />

      <Tabs.Screen
        name="mypage"
        options={{
          title: '나의 관리',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/my_manage.png')}
              style={[
                styles.tabIcon,
                { tintColor: focused ? '#2F66D0' : '#6d7075' },
              ]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});
