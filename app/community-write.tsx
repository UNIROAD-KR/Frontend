import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const BLUE = '#102BE0';

export default function CommunityWriteScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const isCompanion = type === 'companion';

  const screenText = useMemo(
    () => ({
      title: isCompanion ? '동행 모집' : '글쓰기',
      subtitle: isCompanion
        ? '여행 일정과 모집 조건을 적어주세요.'
        : '익명으로 경험과 질문을 공유해보세요.',
      bodyPlaceholder: isCompanion
        ? '날짜, 도시, 모집 인원, 인증 선호 여부 등을 적어주세요.'
        : '본문을 입력해주세요.',
      button: isCompanion ? '모집글 등록' : '게시글 등록',
    }),
    [isCompanion],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111111" />
        </Pressable>
        <Text style={styles.headerTitle}>{screenText.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{screenText.subtitle}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요."
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {isCompanion && (
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={styles.label}>국가/도시</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 독일 뮌헨"
                placeholderTextColor="#A0A0A0"
              />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.label}>날짜</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 04/01"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.textarea}
            value={body}
            onChangeText={setBody}
            placeholder={screenText.bodyPlaceholder}
            placeholderTextColor="#A0A0A0"
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.submitButton,
            (!title.trim() || !body.trim()) && styles.submitButtonDisabled,
          ]}
          disabled={!title.trim() || !body.trim()}
        >
          <Text style={styles.submitText}>{screenText.button}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 108,
    paddingTop: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  headerSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 23,
    paddingTop: 22,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#777777',
    marginBottom: 22,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 9,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  inlineField: {
    flex: 1,
  },
  textarea: {
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#111111',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 23,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  submitButton: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    height: 54,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C9CED8',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
