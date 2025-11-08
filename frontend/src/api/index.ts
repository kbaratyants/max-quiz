import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем userId в заголовки для всех запросов
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      config.headers['x-user-id'] = user._id;
    } catch (e) {
      // Игнорируем ошибки парсинга
    }
  }
  return config;
});

export interface Survey {
  _id: string;
  title: string;
  type: 'quiz' | 'feedback';
  ownerId: string;
  questions: {
    text: string;
    options: string[];
    correctOptionIndex?: number;
  }[];
  createdAt: string;
}

export interface SurveyStats {
  survey: {
    _id: string;
    title: string;
    type: string;
  };
  totalResponses: number;
  avgScore?: number;
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

