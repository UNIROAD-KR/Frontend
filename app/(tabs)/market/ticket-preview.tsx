import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '@/components/back-button';
import { createOrGetChatRoom } from '../../../src/api/chat';

export default function TicketPreviewPage() {
  const [tab, setTab] = useState<'ticket' | 'seller'>('ticket');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BackButton style={styles.backButton} />

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>바르셀로나</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>관광</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>사그라다 파밀리아 표 양도</Text>
          <Text style={styles.share}>↥</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>€20</Text>
          <Text style={styles.originalPrice}>원가 €26</Text>
          <Text style={styles.meta}>1매 / 5월 9일(목) 16:15</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable style={styles.tabButton} onPress={() => setTab('ticket')}>
            <Text style={styles.tabText}>티켓 정보</Text>
            {tab === 'ticket' && <View style={styles.activeLine} />}
          </Pressable>

          <Pressable style={styles.tabButton} onPress={() => setTab('seller')}>
            <Text style={styles.tabText}>판매자 정보</Text>
            {tab === 'seller' && <View style={styles.activeLine} />}
          </Pressable>
        </View>

        {tab === 'ticket' ? (
          <>
            <Text style={styles.sectionTitle}>티켓 정보</Text>
            <Text style={styles.sectionDesc}>
              티켓 정보 및 판매자가 직접 작성한 내용이에요
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>● 날짜</Text>
                <Text style={styles.infoValue}>2026년 5월 9일 (목)</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>▣ 시간</Text>
                <Text style={styles.infoValue}>16:15</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>● 장소</Text>
                <Text style={styles.infoValue}>스페인 바르셀로나</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>▣ 양도 매수</Text>
                <Text style={styles.infoValue}>1매</Text>
              </View>
            </View>

            <Text style={styles.sellerTitle}>판매자 글</Text>

            <View style={styles.contentBox}>
              <Text style={styles.contentText}>
                사그라다 파밀리아 5/9 당일 표 양도합니다! 오후 4:15이고{'\n'}
                입장 티켓 받아서 드려요~!{'\n'}
                티켓은 한 장이고 근처에 있어서 입장 도와드릴 수 있어요!{'\n\n'}
                관심 있으신 분은 채팅 부탁드려요 :)
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>판매자 정보</Text>
            <Text style={styles.sectionDesc}>
              교환학생 선배 판매자의 기본 정보예요
            </Text>

            <Text style={styles.nickname}>may.be</Text>

            <View style={styles.profileCard}>
              <View style={styles.profileCircle} />

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>may.be</Text>
                <Text style={styles.profileMeta}>
                  독일　아샤펜부르크　26-2학기 파견생
                </Text>
              </View>

              <Text style={styles.profileArrow}>›</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.heartButton}>
          <Text style={styles.heart}>♡</Text>
        </Pressable>

        <Pressable style={styles.chatButton} onPress={handleStartChat}>
          <Text style={styles.chatText}>채팅 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}
const handleStartChat = async () => {
  try {
    const response = await createOrGetChatRoom({
      referenceType: 'TRADE',
      referenceId: 1,
      targetMemberId: 1,
    });

    const roomId = response.data.data?.roomId ?? response.data.roomId;

    router.push({
      pathname: '/chat/[roomId]',
      params: {
        roomId: String(roomId),
      },
    } as any);
  } catch (error: any) {
    console.log('채팅방 생성 실패:', error.response?.data || error.message);
  }
};
const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 120,
  },

  backButton: {
    marginBottom: 18,
  },

  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },

  tag: {
    height: 22,
    minWidth: 62,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#777777',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  title: {
    flex: 1,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.8,
  },

  share: {
    fontSize: 27,
    color: '#000000',
    marginLeft: 8,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  price: {
    fontSize: 18,
    fontWeight: '900',
    color: BLUE,
    marginRight: 8,
  },

  originalPrice: {
    fontSize: 12,
    color: '#C8C8C8',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },

  meta: {
    fontSize: 12,
    color: '#555555',
  },

  tabRow: {
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 25,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
  },

  activeLine: {
    position: 'absolute',
    bottom: -1,
    width: '92%',
    height: 4,
    borderRadius: 99,
    backgroundColor: '#102BE0',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8,
  },

  sectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#666666',
    marginBottom: 28,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 48,
  },

  infoCard: {
    width: '48.5%',
    height: 65,
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 11,
    paddingTop: 10,
  },

  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#555555',
    marginBottom: 12,
  },

  infoValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#111111',
  },

  sellerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 18,
  },

  contentBox: {
    minHeight: 143,
    borderRadius: 3,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 21,
    paddingVertical: 22,
  },

  contentText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '600',
    color: '#111111',
  },

  nickname: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginTop: 16,
    marginBottom: 15,
  },

  profileCard: {
    height: 81,
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  profileCircle: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    backgroundColor: '#D9D9D9',
    marginRight: 17,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#333333',
    marginBottom: 5,
  },

  profileMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },

  profileArrow: {
    fontSize: 33,
    color: '#000000',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 93,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
  },

  heartButton: {
    width: 50,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  heart: {
    fontSize: 35,
    color: '#000000',
    lineHeight: 38,
  },

  chatButton: {
    flex: 1,
    height: 49,
    borderRadius: 4,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
