import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type OnboardingSelectModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectionMode?: 'immediate' | 'confirm';
  searchPlaceholder?: string;
};

export function OnboardingSelectModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  selectionMode = 'immediate',
  searchPlaceholder = '검색어를 입력해주세요',
}: OnboardingSelectModalProps) {
  const [draftValue, setDraftValue] = useState(selectedValue);
  const [searchQuery, setSearchQuery] = useState('');
  const isConfirmMode = selectionMode === 'confirm';

  useEffect(() => {
    if (!visible) return;

    setDraftValue(selectedValue);
    setSearchQuery('');
  }, [selectedValue, visible]);

  const filteredOptions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter((option) => option.toLowerCase().includes(keyword));
  }, [options, searchQuery]);

  const handleSelect = (option: string) => {
    if (isConfirmMode) {
      setDraftValue(option);
      return;
    }

    onSelect(option);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, isConfirmMode && styles.confirmSheet]}>
          <View style={[styles.handle, isConfirmMode && styles.confirmHandle]} />

          {isConfirmMode ? (
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmTitle}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={12}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={27} color="#141416" />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}

          {isConfirmMode ? (
            <View style={styles.searchField}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="#9AA5B4"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Ionicons name="search-outline" size={22} color="#141416" />
            </View>
          ) : null}

          <ScrollView
            style={[styles.optionScroll, isConfirmMode && styles.confirmOptionScroll]}
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.map((option) => {
              const selected = (isConfirmMode ? draftValue : selectedValue) === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.option, isConfirmMode && styles.confirmOption]}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isConfirmMode && styles.confirmOptionText,
                      selected && (isConfirmMode ? styles.confirmOptionTextSelected : styles.optionTextSelected),
                    ]}
                  >
                    {option}
                  </Text>
                  {isConfirmMode && selected ? (
                    <Ionicons name="checkmark" size={22} color="#1473FF" />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {isConfirmMode ? (
            <Pressable
              style={[styles.confirmButton, !draftValue && styles.confirmButtonDisabled]}
              disabled={!draftValue}
              onPress={() => onSelect(draftValue)}
            >
              <Text style={styles.confirmButtonText}>선택하기</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    justifyContent: 'flex-end',
  },

  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
  },
  confirmSheet: {
    height: '69%',
    maxHeight: 580,
    backgroundColor: '#F6F8FA',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9DEE8',
    marginBottom: 18,
  },
  confirmHandle: {
    width: 80,
    marginBottom: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 14,
  },

  optionScroll: {
    maxHeight: 440,
  },

  option: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  optionSelected: {
    backgroundColor: '#F2F5FF',
  },

  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },

  optionTextSelected: {
    color: BLUE,
    fontWeight: '900',
  },
  confirmHeader: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  confirmTitle: {
    color: '#141416',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E1E5EA',
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#18202B',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  confirmOptionScroll: {
    flex: 1,
    maxHeight: undefined,
  },
  confirmOption: {
    minHeight: 48,
    borderRadius: 0,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmOptionText: {
    color: '#141416',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmOptionTextSelected: {
    color: '#1473FF',
    fontWeight: '800',
  },
  confirmButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#18202B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#B3BDC9',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
