import { StyleSheet } from 'react-native';

export const BLUE = '#123F9F';

export const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 27,
    paddingTop: 58,
    paddingBottom: 46,
  },

  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 46,
  },

  back: {
    fontSize: 30,
    lineHeight: 32,
    color: '#111111',
    fontWeight: '400',
  },

  headerBlank: {
    width: 28,
  },

  title: {
    fontSize: 27,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.8,
  },

  label: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 15,
  },

  input: {
    height: 57,
    borderRadius: 6,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#111111',
    marginBottom: 10,
  },

  helpText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#222222',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    width: 110,
    height: 57,
    borderRadius: 6,
    backgroundColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  checkButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#777777',
  },

  passwordSection: {
    marginTop: 66,
  },

  passwordLabel: {
    marginTop: 66,
  },

  emailSection: {
    marginTop: 66,
  },

  emailLabel: {
    marginTop: 66,
  },

  at: {
    fontSize: 21,
    color: '#555555',
    marginBottom: 10,
  },

  domainBox: {
    flex: 1,
    height: 57,
    borderRadius: 6,
    backgroundColor: '#F5F6F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 13,
    marginBottom: 10,
  },

  domainInput: {
    flex: 1,
    fontSize: 18,
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
    minHeight: 260,
  },

  submitButton: {
    height: 65,
    borderRadius: 6,
    backgroundColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonActive: {
    backgroundColor: BLUE,
  },

  submitText: {
    fontSize: 21,
    fontWeight: '700',
    color: '#999999',
  },

  submitTextActive: {
    color: '#FFFFFF',
  },
  domainText: {
    flex: 1,
    fontSize: 18,
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
    height: 57,
    borderRadius: 6,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#111111',
    paddingVertical: 0,
  },

  eyeText: {
    fontSize: 18,
    color: '#777777',
    marginLeft: 8,
  },

  passwordMatchText: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },

  passwordMatchSuccess: {
    color: '#123F9F',
  },

  passwordMatchError: {
    color: '#E53935',
  },
  eyeIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    tintColor: '#6E6E6E',
    marginLeft: 8,
  },
});
