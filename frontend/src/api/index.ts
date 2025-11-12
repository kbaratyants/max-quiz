import axios from 'axios';
import { getOrCreateClientId, getOrCreateUserId } from '../utils/ids';
import { getInitData, isMaxWebApp } from '../utils/webapp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем userId, clientId и initData (из MAX) в заголовки для всех запросов
api.interceptors.request.use((config) => {
  const userId = getOrCreateUserId();
  const clientId = getOrCreateClientId();
  
  config.headers['x-user-id'] = userId;
  config.headers['x-client-id'] = clientId;
  
  // Если приложение запущено в MAX, отправляем initData для валидации на бэкенде
  if (isMaxWebApp()) {
    const initData = getInitData();
    if (initData) {
      config.headers['x-max-init-data'] = initData;
    }
  }
  
  return config;
});

export interface Survey {
  _id: string;
  title: string;
  ownerId: string;
  questions: {
    text: string;
    options: string[];
  }[];
  createdAt: string;
  publicId?: string;
  expiresAt?: string;
  timeLimitSec?: number;
  isClosed?: boolean;
}

export interface MySurvey {
  _id: string;
  title: string;
  createdAt: string;
  publicId: string;
  shareUrl: string;
  isClosed: boolean;
  expiresAt?: string;
  isExpired?: boolean;
  questionsCount: number;
}

export interface SurveyStats {
  survey: {
    _id: string;
    title: string;
  };
  totalResponses: number;
  questionStats: {
    questionIndex: number;
    questionText: string;
    optionCounts: {
      optionIndex: number;
      optionText: string;
      count: number;
      percentage: number;
    }[];
  }[];
}

export interface MyResponse {
  _id: string;
  surveyId: string;
  surveyTitle: string;
  createdAt: string;
}
