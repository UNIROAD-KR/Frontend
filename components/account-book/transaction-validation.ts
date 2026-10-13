export function validateTransactionInput(amount: string, title: string, isIncome: boolean) {
  const isAmountValid = /^\d+(\.\d+)?$/.test(amount) &&
    Number.isFinite(Number(amount)) && Number(amount) > 0;
  const amountError = amount.length > 0 && !isAmountValid
    ? "0보다 큰 숫자를 입력해주세요."
    : undefined;
  const titleError = title.length > 30
    ? "내역 이름은 최대 30자 이내로 입력해주세요."
    : !isIncome && title.length > 0 && !title.trim()
      ? "내역 이름을 입력해주세요."
      : undefined;
  return {
    amountError,
    titleError,
    isValid: isAmountValid && !titleError && (isIncome || title.trim().length > 0),
  };
}
