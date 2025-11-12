import { v4 as uuidv4 } from 'uuid';
import { getUserIdFromWebApp, getWebApp, isMaxWebApp } from './webapp';

const CLIENT_ID_KEY = 'max-quiz-client-id';
const USER_ID_KEY = 'max-quiz-user-id';

export function getOrCreateClientId(): string {
  // В MAX используем DeviceStorage, если доступен
  const webApp = getWebApp();
  if (isMaxWebApp() && webApp?.DeviceStorage) {
    let clientId = webApp.DeviceStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = uuidv4();
      webApp.DeviceStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }
  
  // Fallback на localStorage
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = uuidv4();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export function getOrCreateUserId(): string {
  // В MAX используем ID пользователя из WebApp
  const webAppUserId = getUserIdFromWebApp();
  if (webAppUserId) {
    return webAppUserId;
  }
  
  // Fallback на localStorage
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = 'teacher-1';
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function setUserId(userId: string): void {
  // В MAX используем DeviceStorage, если доступен
  const webApp = getWebApp();
  if (isMaxWebApp() && webApp?.DeviceStorage) {
    webApp.DeviceStorage.setItem(USER_ID_KEY, userId);
  } else {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

