import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DESIGN_WIDTH = 402;
const scale = SCREEN_WIDTH / DESIGN_WIDTH;

// SVG Path Data
const svgPaths = {
  p13318180:
    'M17.0834 0C7.65508 0 0 7.65508 0 17.0834C0 26.5117 7.65508 34.1667 17.0834 34.1667C26.5117 34.1667 34.1667 26.5117 34.1667 17.0834C34.1667 7.65508 26.5117 0 17.0834 0ZM17.0834 9.39587C19.8792 9.39587 22.1459 11.6625 22.1459 14.4584C22.1459 17.2542 19.8792 19.5209 17.0834 19.5209C14.2875 19.5209 12.0209 17.2542 12.0209 14.4584C12.0209 11.6625 14.2875 9.39587 17.0834 9.39587ZM17.0834 29.5417C13.3959 29.5417 10.1167 27.8209 8.02087 25.1417C8.06379 22.3884 13.5834 20.8709 17.0834 20.8709C20.5692 20.8709 26.1029 22.3884 26.1459 25.1417C24.05 27.8209 20.7709 29.5417 17.0834 29.5417Z',
  p6b880a0:
    'M2.5 15.8333H17.5V18.3333H2.5V15.8333ZM2.5 1.66667H17.5V4.16667H2.5V1.66667ZM2.5 9.16667H17.5V11.6667H2.5V9.16667Z',
  p8e5f4f0: 'M8.5 0L0 8.5L8.5 17L10.625 14.875L4.25 8.5L10.625 2.125L8.5 0Z',
  p1b0ad300:
    'M5.25 3.0625L9.1875 7L5.25 10.9375L4.375 10.0625L7.4375 7L4.375 3.9375L5.25 3.0625Z',
  p19255980: 'M4.32245 3.5L0.822449 7L4.32245 10.5V3.5Z',
  p3f37d540:
    'M8.10807 0L0 6.48649V19.4595L8.10807 12.973V0ZM16.2162 0V12.973L8.10807 19.4595V6.48649L16.2162 0Z',
};

// Image imports (you'll need to copy these images to your React Native project)
const images = {
  rectangle2: require('../assets/src/imports/Home/f1259078373f69f440e5c5c94b0db9d9488b12ea.png'),
  rectangle112: require('../assets/src/imports/Home/4e53df4d1e1c6c5a3d566e59aff229f8bfacc4ac.png'),
  rectangle113: require('../assets/src/imports/Home/c0aebca7450dc48144bf4c4b01d46d1e705d9970.png'),
  rectangle114: require('../assets/src/imports/Home/db42d8d2e486e9a5661bbefe85db1ce0bf50c5fe.png'),
  rectangle22: require('../assets/src/imports/Home/0d9de5031788a1431dd255cfab19aab97a78758d.png'),
  location: require('../assets/src/imports/Home/68a3d1200ea3f10a9eeb6f9538364d176d16f3dc.png'),
  rectangle122: require('../assets/src/imports/Home/2be959ac26a39131fa26027eb872c8a6c279aa04.png'),
  calender: require('../assets/src/imports/Home/5d4a26146c420f7f577959af3da6fa59156846c8.png'),
  fire: require('../assets/src/imports/Home/7124b4b945ceb78d277bc2e9f521e7b63f080782.png'),
  travelBook: require('../assets/src/imports/Home/b99f3eb588a93b62feaa091f3e39bc9a8c559378.png'),
  wallet: require('../assets/src/imports/Home/399482c90a7c204543ec505e5fd9a5e2ec41e352.png'),
  compass: require('../assets/src/imports/Home/9202b6db6ef47098bdfb7ebb2f0701ddbf6869e5.png'),
  shoppingCart: require('../assets/src/imports/Home/84cb1c0daafe7ca98dce450a59e81454a06f7efe.png'),
  devops: require('../assets/src/imports/Home/6f7eef858e89311f642739309218169c8b03e180.png'),
};

const AccountCircle = () => (
  <TouchableOpacity
    style={[styles.absolute, { left: 30, top: 7, width: 41, height: 41 }]}
    onPress={() => console.log('Account pressed')}
  >
    <Svg width={41} height={41} viewBox="0 0 41 41">
      <G>
        <View
          style={{
            position: 'absolute',
            left: '8.33%',
            right: '8.33%',
            top: '8.33%',
            bottom: '8.33%',
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 34.1667 34.1667">
            <Path d={svgPaths.p13318180} fill="black" />
          </Svg>
        </View>
      </G>
    </Svg>
  </TouchableOpacity>
);

const HorizontalSplit = ({
  left = 350,
  top = 14,
  onPress,
}: {
  left?: number;
  top?: number;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.absolute, { left, top, width: 20, height: 20 }]}
    onPress={onPress || (() => console.log('Menu pressed'))}
  >
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <G clipPath="url(#clip0_1_149)">
        <Path d={svgPaths.p6b880a0} fill="black" />
      </G>
      <Defs>
        <ClipPath id="clip0_1_149">
          <Rect fill="white" height={20} width={20} />
        </ClipPath>
      </Defs>
    </Svg>
  </TouchableOpacity>
);

const Frame = () => (
  <View style={[styles.absolute, { left: 0, top: 17, width: 402, height: 48 }]}>
    <View
      style={[styles.absolute, { left: 344, top: 8, width: 31, height: 31 }]}
    >
      <Svg width={31} height={31} viewBox="0 0 31 31">
        <Circle cx={15.5} cy={15.5} r={15.5} fill="white" />
      </Svg>
    </View>
    <View
      style={[styles.absolute, { left: 307, top: 9, width: 31, height: 31 }]}
    >
      <Svg width={31} height={31} viewBox="0 0 31 31">
        <Circle cx={15.5} cy={15.5} r={15.5} fill="white" />
      </Svg>
    </View>
    <Text style={[styles.text, { left: 77, top: 11, fontSize: 12 }]}>
      안녕, 서현!
    </Text>
    <Text
      style={[styles.text, { left: 77, top: 28, fontSize: 10, color: '#666' }]}
    >
      새로운 모험을 떠날 준비 됐나요?
    </Text>
    <AccountCircle />
    <HorizontalSplit left={350} top={14} />
    <View
      style={[
        styles.absolute,
        { left: '33.33%', right: '16.42%', top: '33.33%', bottom: '31.25%' },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 17 17">
        <Path d={svgPaths.p8e5f4f0} fill="black" />
      </Svg>
    </View>
  </View>
);

const ProfileButton = () => (
  <TouchableOpacity
    style={[styles.absolute, { left: 306, top: 60 }]}
    onPress={() => console.log('Profile settings pressed')}
  >
    <View style={[styles.button, { backgroundColor: '#001bc8' }]}>
      <Text style={styles.buttonText}>프로필 설정</Text>
    </View>
  </TouchableOpacity>
);

const BannerCard = () => (
  <View
    style={[styles.absolute, { left: 0, top: 100, width: 402, height: 134 }]}
  >
    <View
      style={[
        styles.absolute,
        {
          left: '50%',
          marginLeft: -182.5,
          top: 3,
          width: 365,
          height: 128,
          borderRadius: 5,
        },
      ]}
    >
      <Image
        source={images.rectangle2}
        style={[StyleSheet.absoluteFill, { borderRadius: 5 }]}
        resizeMode="cover"
      />
    </View>
    <View
      style={[
        styles.absolute,
        {
          left: 38,
          top: 32,
          width: 315,
          height: 70,
          backgroundColor: 'black',
          opacity: 0.4,
          borderRadius: 5,
        },
      ]}
    />
    <Text
      style={[styles.text, { left: 50, top: 75, fontSize: 9, color: 'white' }]}
    >
      독일 뮌헨 대학교 파견까지
    </Text>
    <Text
      style={[
        styles.text,
        {
          left: 50,
          top: 43,
          fontSize: 24,
          fontWeight: '600',
          color: 'white',
          letterSpacing: -1.68,
        },
      ]}
    >
      D-67 to Munich
    </Text>
    <ProfileButton />
  </View>
);

const ContentCard = ({ left, top, imageSrc, title, date, onPress }: any) => (
  <TouchableOpacity
    style={[styles.absolute, { left, top, width: 157, height: 168 }]}
    onPress={onPress || (() => console.log('Content card pressed'))}
  >
    <Image
      source={imageSrc}
      style={[StyleSheet.absoluteFill]}
      resizeMode="cover"
    />
    {title && (
      <Text
        style={[
          styles.text,
          { left: 0, bottom: 25, fontSize: 12, color: 'black' },
        ]}
      >
        {title}
      </Text>
    )}
    {date && (
      <Text
        style={[
          styles.text,
          { left: 0, bottom: 5, fontSize: 7, color: '#666' },
        ]}
      >
        {date}
      </Text>
    )}
  </TouchableOpacity>
);

const ContentSection = () => (
  <View
    style={[styles.absolute, { left: 0, top: 515, width: 402, height: 286 }]}
  >
    <View
      style={[
        styles.absolute,
        {
          left: '50%',
          marginLeft: -201,
          top: 0,
          width: 402,
          height: 286,
          backgroundColor: 'white',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
      ]}
    />
    <Text
      style={[
        styles.text,
        { left: 21, top: 17, fontSize: 15, fontWeight: '500' },
      ]}
    >
      파견 준비생을 위한 맞춤 콘텐츠
    </Text>
    <ContentCard
      left={19}
      top={53}
      imageSrc={images.rectangle22}
      title="[독일 교환학생] 비자신청부터 수령까지"
      date="2026.02.25 / 작성자: Lumy"
      onPress={() => console.log('Article 1 pressed')}
    />
    <ContentCard
      left={187}
      top={53}
      imageSrc={images.rectangle112}
      title="루프트한자 학생 운임 항공편 특가 및 수하물 혜택"
      date="AD"
      onPress={() => console.log('Article 2 pressed')}
    />
    <TouchableOpacity
      style={[styles.absolute, { right: 24, top: 19 }]}
      onPress={() => console.log('See more pressed')}
    >
      <Text style={[styles.text, { fontSize: 10, color: '#666' }]}>더보기</Text>
    </TouchableOpacity>
  </View>
);

const ExploreCard = ({ left, top, width, children, title, onPress }: any) => (
  <TouchableOpacity
    style={[styles.absolute, { left, top, width, height: 109 }]}
    onPress={onPress || (() => console.log(`${title} pressed`))}
  >
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'white',
          borderRadius: 10,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        },
      ]}
    />
    {children}
    <Text
      style={[
        styles.text,
        {
          position: 'absolute',
          bottom: 10,
          fontSize: 11,
          fontWeight: 'bold',
          textAlign: 'center',
          width: '100%',
        },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const QuickAccessButton = ({ left, icon, title }: any) => (
  <TouchableOpacity
    style={[styles.absolute, { left, top: 437 }]}
    onPress={() => console.log(`${title} pressed`)}
  >
    <View
      style={{
        backgroundColor: '#f9f8f7',
        borderRadius: 5,
        width: 52,
        height: 52,
      }}
    />
    <Image
      source={icon}
      style={[styles.absolute, { left: 4, top: 3, width: 42, height: 43 }]}
      resizeMode="contain"
    />
    <Text
      style={[
        styles.text,
        {
          top: 51,
          fontSize: 10,
          textAlign: 'center',
          width: 52,
        },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const BottomBarTab = ({ left, icon, title, isActive, onPress }: any) => (
  <TouchableOpacity
    style={[styles.bottomBarItem, { left }]}
    onPress={onPress || (() => console.log(`${title} tab pressed`))}
  >
    {typeof icon === 'string' ? (
      <Svg width={16.216} height={19.459} viewBox="0 0 16.2162 19.4595">
        <Path d={icon} fill={isActive ? '#2457C5' : '#666'} />
      </Svg>
    ) : (
      <Image
        source={icon}
        style={{ width: 21.622, height: 21.622, opacity: isActive ? 1 : 0.5 }}
        resizeMode="contain"
      />
    )}
    <Text
      style={[
        styles.bottomBarText,
        {
          color: isActive ? '#2457C5' : '#666',
          fontWeight: isActive ? '600' : '400',
        },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const BottomBar = () => (
  <View
    style={[styles.absolute, { left: 0, top: 801, width: 393, height: 68 }]}
  >
    <BottomBarTab
      left={38}
      icon={svgPaths.p3f37d540}
      title="홈"
      isActive={true}
    />
    <BottomBarTab
      left={113}
      icon={images.compass}
      title="탐색"
      isActive={false}
    />
    <BottomBarTab
      left={266.81}
      icon={images.shoppingCart}
      title="중고 마켓"
      isActive={false}
    />
    <BottomBarTab
      left={343.81}
      icon={images.devops}
      title="지출 관리"
      isActive={false}
    />
  </View>
);

export default function HomeRN() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Frame />
        <BannerCard />
        <ExploreCard
          left={18}
          top={255}
          width={169}
          title="교환학생 정보 탐색하기"
          onPress={() => console.log('Explore exchange students pressed')}
        >
          <Image
            source={images.location}
            style={[
              styles.absolute,
              { left: 46, top: 0, width: 87, height: 83 },
            ]}
            resizeMode="contain"
          />
        </ExploreCard>
        <ExploreCard
          left={215}
          top={255}
          width={169}
          title="교환학생 전용 거래"
          onPress={() => console.log('Exchange student deals pressed')}
        >
          <Image
            source={images.rectangle122}
            style={[
              styles.absolute,
              { left: 52, top: 11, width: 64, height: 67 },
            ]}
            resizeMode="cover"
          />
        </ExploreCard>
        <TouchableOpacity
          style={[
            styles.absolute,
            {
              left: '50%',
              marginLeft: -182.5,
              top: 375,
              width: 365,
              height: 41,
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
          onPress={() => console.log('Open chat room pressed')}
        >
          <Text style={[styles.text, { fontSize: 11, position: 'relative' }]}>
            오픈 채팅방 바로가기
          </Text>
        </TouchableOpacity>
        <QuickAccessButton
          left={19}
          icon={images.calender}
          title="대학별 모집 일정"
        />
        <QuickAccessButton left={152} icon={images.fire} title="장학금 정보" />
        <QuickAccessButton
          left={269}
          icon={images.travelBook}
          title="교환학생 여행 정보"
        />
        <ContentSection />
        <View
          style={[
            styles.absolute,
            {
              left: 0,
              top: 803,
              width: 402,
              height: 71,
              backgroundColor: '#fbfbfb',
            },
          ]}
        />
        <BottomBar />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfb',
  },
  content: {
    width: SCREEN_WIDTH,
    height: 874,
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
  },
  text: {
    position: 'absolute',
    fontFamily: 'System',
    color: 'black',
  },
  button: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 5,
    height: 15,
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 8,
    fontWeight: '500',
    color: 'white',
  },
  bottomBarItem: {
    position: 'absolute',
    top: 18,
    alignItems: 'center',
  },
  bottomBarText: {
    fontSize: 10,
    marginTop: 4,
  },
});
