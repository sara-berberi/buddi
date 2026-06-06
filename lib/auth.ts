// Token storage. AsyncStorage everywhere (works on web; SecureStore does not).
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'buddi.accessToken';
const REFRESH_KEY = 'buddi.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, accessToken],
    [REFRESH_KEY, refreshToken],
  ]);
}

export async function setAccessToken(accessToken: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_KEY, accessToken);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
