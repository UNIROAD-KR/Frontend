import { Linking } from 'react-native';

const KAKAO_TALK_URL = 'kakaotalk://';
const KAKAO_OPEN_CHAT_URL = 'https://open.kakao.com/';

export const openKakaoContact = async () => {
  try {
    await Linking.openURL(KAKAO_TALK_URL);
    return;
  } catch {
    await Linking.openURL(KAKAO_OPEN_CHAT_URL);
  }
};
