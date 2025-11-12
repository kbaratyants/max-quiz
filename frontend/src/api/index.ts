import axios from 'axios';
import { getOrCreateClientId, getOrCreateUserId } from '../utils/ids';
import { getInitData, isMaxWebApp } from '../utils/webapp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
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

// Интерфейсы для Quiz (квизов)
export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  authorId: string;
  authorName?: string;
  uuid: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MyQuiz {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
  publicUrl?: string;
  questionsCount: number;
}

export interface QuizStats {
  quizId: string;
  title: string;
  totalSubmissions: number;
  avgScore: number;
}

export interface QuizDetailedStats {
  quizId: string;
  title: string;
  totalSubmissions: number;
  avgScore: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    totalAttempts: number;
    correctCount: number;
    correctPercentage: number;
  }[];
}

// Интерфейсы для Submission (ответов)
export interface Submission {
  score: number;
  total: number;
  submissionId: string;
}

export interface SubmissionSummary {
  pp: number;
  submissionId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  submittedAt: string;
}

export interface SubmissionDetail {
  quizTitle: string;
  score: number;
  total: number;
  submittedAt: string;
  questions: {
    question: string;
    options: string[];
    selectedAnswer: number;
    correctAnswer: number;
  }[];
}
