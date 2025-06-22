// Core message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  ragContext?: RAGContext[];
  toolResults?: ToolResult[];
  confidence?: number;
  sources?: Source[];
}

// Tool calling types
export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
  executionTime?: number;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
}

// RAG types
export interface RAGContext {
  id: string;
  content: string;
  source: string;
  score: number;
  metadata: {
    title?: string;
    subject?: string;
    level?: EducationLevel;
    type?: ContentType;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  values?: number[];
}

// Educational content types
export type EducationLevel = 'elementary' | 'middle' | 'high-school' | 'college' | 'graduate';
export type ContentType = 'explanation' | 'problem' | 'solution' | 'quiz' | 'resource' | 'reference';
export type Subject = 'math' | 'science' | 'history' | 'literature' | 'programming' | 'other';

export interface EducationalContent {
  id: string;
  title: string;
  content: string;
  subject: Subject;
  level: EducationLevel;
  type: ContentType;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  createdAt: Date;
  updatedAt: Date;
}

// UI state types
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentTool?: string;
  error?: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentChatId?: string;
  user?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  preferredSubjects: Subject[];
  educationLevel: EducationLevel;
  language: string;
}

// File upload types
export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  processed: boolean;
  extractedText?: string;
  embeddings?: number[];
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamingResponse {
  content: string;
  finished: boolean;
  toolCalls?: ToolCall[];
  error?: string;
}

// Chat session types
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    subject?: Subject;
    level?: EducationLevel;
    messageCount: number;
  };
}

// Source citation types
export interface Source {
  id: string;
  title: string;
  url?: string;
  type: 'web' | 'document' | 'knowledge-base' | 'calculation' | 'code-execution';
  confidence: number;
  relevance: number;
} 