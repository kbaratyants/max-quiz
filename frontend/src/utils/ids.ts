import { v4 as uuidv4 } from 'uuid';

const CLIENT_ID_KEY = 'max-quiz-client-id';
const USER_ID_KEY = 'max-quiz-user-id';

export function getOrCreateClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = uuidv4();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export function getOrCreateUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = 'teacher-1';
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
}

