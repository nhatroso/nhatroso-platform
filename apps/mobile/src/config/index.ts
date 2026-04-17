export const CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8080/api',
  BANK: {
    ID: process.env.EXPO_PUBLIC_BANK_ID || 'TPB',
    ACCOUNT_NO: process.env.EXPO_PUBLIC_ACCOUNT_NO || '00002599719',
    ACCOUNT_NAME: process.env.EXPO_PUBLIC_ACCOUNT_NAME || 'DINH NHAT BAO',
  },
};
