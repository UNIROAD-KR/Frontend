import { StyleSheet } from 'react-native';

export const BLUE = '#123F9F';

export const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
  },

  header: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  headerBlank: {
    width: 40,
  },

  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 9,
  },

  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DCE5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    marginBottom: 7,
  },

  helpText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#667085',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  flexInput: {
    flex: 1,
  },

  idInput: {
    flex: 1,
  },

  emailInput: {
    flex: 1,
  },

  checkButton: {
    width: 92,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DCE5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  checkButtonActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  checkButtonDone: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6DCE5',
  },

  checkButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
  },

  checkButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  checkButtonTextDone: {
    color: '#667085',
    fontWeight: '700',
  },

  passwordSection: {
    marginTop: 28,
  },

  passwordLabel: {
    marginTop: 28,
  },

  emailSection: {
    marginTop: 28,
  },

  emailLabel: {
    marginTop: 28,
  },

  at: {
    fontSize: 18,
    color: '#555555',
    marginBottom: 8,
  },

  domainBox: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#F5F6F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 11,
    marginBottom: 8,
  },

  domainInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 0,
  },

  chevron: {
    fontSize: 27,
    lineHeight: 27,
    color: '#C4C4C4',
    marginTop: -5,
  },

  bottomSpacer: {
    flex: 1,
    minHeight: 56,
  },

  termsSummary: {
    marginTop: 24,
    minHeight: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  termsSummaryTextBox: {
    flex: 1,
  },

  termsSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D2939',
  },

  termsSummaryDesc: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: '#667085',
  },

  termsSummaryArrow: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '300',
    color: '#98A2B3',
    marginLeft: 8,
  },

  termsDivider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginVertical: 4,
  },

  termRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  termPressArea: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD3DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: '#D9DEE7',
    backgroundColor: '#D9DEE7',
    marginRight: 12,
  },

  checkboxChecked: {
    borderColor: BLUE,
    backgroundColor: BLUE,
  },

  checkboxCheckText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  termCheckMark: {
    width: 24,
    marginRight: 12,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '600',
    color: '#D1D5DB',
    textAlign: 'center',
  },

  termCheckMarkActive: {
    color: BLUE,
  },

  termText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: '#1F2937',
  },

  termAllText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  termLinkButton: {
    minWidth: 38,
    minHeight: 30,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  termLinkText: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '300',
    color: '#C4CAD4',
  },

  legalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  legalModal: {
    width: '100%',
    maxHeight: '78%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  legalHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
    paddingLeft: 20,
    paddingRight: 12,
  },

  legalTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#111827',
  },

  legalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  legalCloseText: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '300',
    color: '#667085',
  },

  legalScroll: {
    maxHeight: 480,
  },

  legalContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },

  legalBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    color: '#344054',
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  termsSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
  },

  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6DCE5',
    alignSelf: 'center',
    marginBottom: 10,
  },

  sheetConfirmButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#D9DCE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  sheetConfirmButtonActive: {
    backgroundColor: BLUE,
  },

  sheetConfirmText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  sheetConfirmTextActive: {
    color: '#FFFFFF',
  },

  submitButton: {
    height: 50,
    borderRadius: 6,
    backgroundColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonActive: {
    backgroundColor: BLUE,
  },

  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999999',
  },

  submitTextActive: {
    color: '#FFFFFF',
  },
  domainText: {
    flex: 1,
    fontSize: 16,
    color: '#8F8F8F',
  },

  domainTextActive: {
    color: '#111111',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  domainModal: {
    width: 260,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },

  domainOption: {
    height: 45,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  domainOptionText: {
    fontSize: 16,
    color: '#111111',
  },
  emailIdInput: {
    flex: 1.05,
  },
  customDomainInput: {
    flex: 1.15,
  },
  passwordInputBox: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DCE5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputFocused: {
    borderWidth: 1,
    borderColor: BLUE,
  },

  inputError: {
    borderWidth: 1,
    borderColor: '#E53935',
  },

  passwordConfirmBox: {
    marginTop: 12,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 0,
  },

  eyeText: {
    fontSize: 16,
    color: '#777777',
    marginLeft: 8,
  },

  passwordMatchText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },

  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  errorBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D94A45',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#D94A45',
  },

  successText: {
    fontSize: 12,
    lineHeight: 18,
    color: BLUE,
  },

  passwordMatchSuccess: {
    color: '#123F9F',
  },

  passwordMatchError: {
    color: '#D94A45',
  },
  eyeIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#6E6E6E',
    marginLeft: 8,
  },
});
