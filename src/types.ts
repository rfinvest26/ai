export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelName?: string;
  tokenCount?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  activeManualIds: string[];
}

export interface Manual {
  id: string;
  name: string;
  content: string;
  category: string;
  isActive: boolean;
}

export interface TelegramUser {
  id: number;
  username: string;
  first_name: string;
  photo_url?: string;
}

export interface TelegramMessage {
  sender: string;
  text: string;
  time: string;
}

export interface TelegramDialog {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  messages: TelegramMessage[];
}

export interface AnalysisResult {
  id: string;
  dialogId: string;
  dialogName: string;
  summary: string;
  whatIsWorking: string[];
  whatIsNotWorking: string[];
  tacticalAdvice: string[];
  suggestedMessages: string[];
  overallAssessment: number; // 1-10
  overallVerdict: string;
  timestamp: string;
  goal: string;
  manualName?: string;
  conversationStructure?: string[];
  questionsToAsk?: string[];
  nextStepsPath?: string[];
  manualCompliance?: string;
}
