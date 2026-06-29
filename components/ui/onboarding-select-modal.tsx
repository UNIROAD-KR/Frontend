import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type OnboardingSelectModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function OnboardingSelectModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: OnboardingSelectModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{title}</Text>

          <ScrollView
            style={styles.optionScroll}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const selected = selectedValue === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => onSelect(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
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

  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9DEE8',
    marginBottom: 18,
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
});
