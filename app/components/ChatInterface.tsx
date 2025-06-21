'use client';

import React, { useState, useRef, useEffect } from 'react';
import { validateImageFile } from '../lib/utils';
import { Message as MessageType, ChatSession } from '../types';
import AiInput from './AiInput';
import Message from './Message';
import Sidebar from './Sidebar';

export default function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setChatSessions(sessions);
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Generate a title from the first message
  const generateChatTitle = (firstMessage: string): string => {
    const title = firstMessage.trim();
    if (title.length <= 50) return title;
    return title.substring(0, 47) + '...';
  };

  // Save current chat session
  const saveCurrentChat = () => {
    if (messages.length === 0 || !currentChatId) return;

    const now = new Date();
    const session: ChatSession = {
      id: currentChatId,
      title: generateChatTitle(messages[0].content),
      messages: messages,
      createdAt: chatSessions.find(s => s.id === currentChatId)?.createdAt || now,
      updatedAt: now,
      metadata: {
        messageCount: messages.length,
      },
    };

    setChatSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === currentChatId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = session;
        return updated;
      } else {
        return [session, ...prev];
      }
    });
  };

  // Create a new chat
  const handleNewChat = () => {
    // Save current chat before creating new one
    if (messages.length > 0 && currentChatId) {
      saveCurrentChat();
    }

    // Create new chat
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  // Select an existing chat
  const handleSelectChat = (chatId: string) => {
    // Save current chat before switching
    if (messages.length > 0 && currentChatId && currentChatId !== chatId) {
      saveCurrentChat();
    }

    const session = chatSessions.find(s => s.id === chatId);
    if (session) {
      setCurrentChatId(chatId);
      setMessages(session.messages);
    }
  };

  // Delete a chat session
  const handleDeleteChat = (chatId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== chatId));
    
    // If we're deleting the current chat, create a new one
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSubmit = async (message: string, images?: string[], useWebSearch?: boolean) => {
    if (!message && !images?.length) return;

    // Create new chat if none exists
    if (!currentChatId) {
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
    }

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      images: images,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: MessageType = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          hasImages: images && images.length > 0,
          useWebSearch: useWebSearch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Check if response is streaming (for text) or JSON (for images)
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/plain')) {
        // Handle streaming response for text
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('0:')) {
                // Extract the text content from the streaming format
                const textContent = line.slice(2).replace(/"/g, '');
                accumulatedContent += textContent;
                
                // Clean up the content - remove raw formatting characters
                const cleanedContent = accumulatedContent
                  .replace(/\\n/g, '\n')  // Convert \n to actual newlines
                  .replace(/\*\*/g, '')   // Remove markdown bold markers
                  .replace(/\*/g, '')     // Remove single asterisks
                  .replace(/`/g, '')      // Remove backticks
                  .replace(/#{1,6}\s/g, '') // Remove markdown headers
                  .trim();                // Remove extra whitespace
                
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: cleanedContent }
                      : msg
                  )
                );
              } else if (line.startsWith('e:') || line.startsWith('d:')) {
                // End of stream
                break;
              }
            }
          }
        }
      } else {
        // Handle JSON response for images
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: data.content }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save chat when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      const timeoutId = setTimeout(() => {
        saveCurrentChat();
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentChatId]);

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chatSessions={chatSessions}
        currentChatId={currentChatId || undefined}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isDarkMode={isDarkMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`h-14 border-b backdrop-blur-sm flex items-center px-4 transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'}`}>
          <div className="flex items-center justify-between w-full">
            {/* Left - Sidebar Toggle & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Open sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-rose-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">AI</span>
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium text-sm leading-none transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>EduChat</span>
                  <span className={`text-xs leading-none transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your study companion</span>
                </div>
              </div>
            </div>

            {/* Right - Theme Toggle & Status */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transform transition-all duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-6 bg-gray-800' : 'translate-x-0 bg-white'}`}>
                  {isDarkMode ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Loading Status */}
              <div className="w-8 h-8 flex items-center justify-center">
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-6">
                {/* Hero Icon */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-400 rounded-full flex items-center justify-center">
                    <span className="text-xs">✨</span>
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-rose-300 rounded-full"></div>
                </div>

                {/* Content */}
                <div className="text-center max-w-lg">
                  <h1 className={`text-3xl font-bold mb-3 transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Welcome to EduChat
                  </h1>
                  <p className={`text-lg mb-8 leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your intelligent study companion powered by AI. Ask questions, solve problems, or upload images for instant analysis.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-8">
                  {[
                    { 
                      text: 'Explain concepts', 
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )
                    },
                    { 
                      text: 'Solve problems', 
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )
                    },
                    { 
                      text: 'Create quizzes', 
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )
                    },
                    { 
                      text: 'Analyze images', 
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )
                    },
                  ].map((action) => (
                    <button
                      key={action.text}
                      onClick={() => handleSubmit(action.text)}
                      className={`group flex items-center gap-3 p-4 border rounded-xl hover:border-rose-300 hover:shadow-sm transition-all duration-200 text-left ${isDarkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700/50' : 'bg-white border-gray-200 hover:bg-rose-50/50'}`}
                    >
                      <div className={`group-hover:text-rose-500 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {action.icon}
                      </div>
                      <span className={`text-sm font-medium group-hover:text-rose-600 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {action.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Footer hint */}
                <div className={`flex items-center gap-2 text-xs transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                  <span>Start typing your questions...</span>
                </div>
              </div>
            ) : (
              // Messages
              <div className="py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex items-end ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-end mr-3 flex-shrink-0">
                        {/* Enhanced Bot Icon SVG */}
                        <div className={`relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center border-2 ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 border-gray-600 shadow-blue-500/20' 
                            : 'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 border-white shadow-lg'
                        }`}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="6" width="16" height="12" rx="2" fill="white" fillOpacity="0.95" />
                            <circle cx="8" cy="10" r="1.2" fill={isDarkMode ? '#1f2937' : '#374151'} />
                            <circle cx="16" cy="10" r="1.2" fill={isDarkMode ? '#1f2937' : '#374151'} />
                            <rect x="10" y="13" width="4" height="2" rx="1" fill={isDarkMode ? '#1f2937' : '#374151'} />
                            <path d="M8 4L10 6H14L16 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            {/* Glow effect for dark mode */}
                            {isDarkMode && (
                              <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" />
                            )}
                          </svg>
                        </div>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[75%] shadow-md break-words relative group ${
                        message.role === 'user'
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-rose-500/20'
                            : 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-900 shadow-lg'
                          : isDarkMode
                            ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-gray-500/20'
                            : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 shadow-lg'
                      }`}
                    >
                      {message.content}
                      
                      {/* Copy Icon for AI responses */}
                      {message.role === 'assistant' && (
                        <button
                          onClick={(event) => {
                            navigator.clipboard.writeText(message.content);
                            setCopiedMessageId(message.id);
                            setTimeout(() => {
                              setCopiedMessageId(null);
                            }, 1000);
                          }}
                          className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 ${
                            copiedMessageId === message.id
                              ? isDarkMode
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                                : 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                              : isDarkMode
                                ? 'bg-white hover:bg-gray-100 text-gray-600 shadow-lg'
                                : 'bg-white hover:bg-gray-50 text-gray-600 shadow-lg'
                          }`}
                          title="Copy message"
                        >
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="transition-transform duration-200"
                          >
                            <path 
                              d="M8 4V2C8 1.44772 8.44772 1 9 1H19C19.5523 1 20 1.44772 20 2V16C20 16.5523 19.5523 17 19 17H17V20C17 20.5523 16.5523 21 16 21H4C3.44772 21 3 20.5523 3 20V6C3 5.44772 3.44772 5 4 5H8V4Z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex items-end ml-3 flex-shrink-0">
                        {/* Enhanced Premium User Icon SVG */}
                        <div className="relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-gray-800">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-yellow-400 shadow-lg"></div>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                            <circle cx="12" cy="12" r="10" fill="url(#userGradient)" />
                            <ellipse cx="12" cy="10.5" rx="4" ry="4.5" fill="#fff" fillOpacity="0.95" />
                            <ellipse cx="12" cy="18" rx="6.5" ry="3.5" fill="#fff" fillOpacity="0.6" />
                            {/* Enhanced glow effect */}
                            <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="1" />
                            <defs>
                              <linearGradient id="userGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#f43f5e" />
                                <stop offset="0.5" stopColor="#ec4899" />
                                <stop offset="1" stopColor="#fbbf24" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className={`flex items-start gap-3 px-4 py-6 transition-colors ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1 pt-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <AiInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Ask me anything about your studies..."
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
} 