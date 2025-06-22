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

  const handleSubmit = async (message: string, images?: string[]) => {
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          hasImages: images && images.length > 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
    <div className="flex flex-col h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chatSessions={chatSessions}
        currentChatId={currentChatId || undefined}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center px-4">
          <div className="flex items-center justify-between w-full">
            {/* Left - Sidebar Toggle & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                title="Open sidebar"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-rose-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">AI</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 text-sm leading-none">EduChat</span>
                  <span className="text-xs text-gray-500 leading-none">Your study companion</span>
                </div>
              </div>
            </div>

            {/* Right - Status */}
            <div className="w-8 h-8 flex items-center justify-center">
              {isLoading && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
              )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white">
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome to EduChat
                  </h1>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
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
                      className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50/50 transition-all duration-200 text-left hover:shadow-sm"
                    >
                      <div className="text-gray-500 group-hover:text-rose-600 transition-colors">
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-rose-700">
                        {action.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Start by selecting an option above or type your question below</span>
                </div>
              </div>
            ) : (
              // Messages
              <div className="py-4">
                {messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 px-4 py-6 bg-gray-50/50">
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
        />
      </div>
    </div>
  );
} 