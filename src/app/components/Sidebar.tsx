'use client';

import React, { useState, useEffect } from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  isDarkMode?: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  chatSessions,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isDarkMode = false,
}: SidebarProps) {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-80 ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-600' 
            : 'bg-white/95 border-gray-200'
        } border-r backdrop-blur-xl shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Chat history sidebar"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-900/50' 
            : 'border-gray-200 bg-white/50'
        } backdrop-blur-md`}>
          <h2 className={`text-lg font-semibold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Chat History</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className={`p-4 ${
          isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'
        } backdrop-blur-md`}>
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:bg-rose-700 transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat Sessions */}
        <div className={`flex-1 overflow-y-auto px-4 pb-4 ${
          isDarkMode ? 'bg-gray-900/30' : 'bg-white/30'
        } backdrop-blur-sm`}>
          {chatSessions.length === 0 ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <svg className={`w-12 h-12 mx-auto mb-3 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-300'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`relative group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                    currentChatId === session.id
                      ? isDarkMode
                        ? 'bg-rose-900/30 border border-rose-400/30 shadow-sm'
                        : 'bg-rose-50 border border-rose-200 shadow-sm'
                      : isDarkMode
                        ? 'bg-gray-800/50 hover:bg-gray-700/50 hover:shadow-sm border border-transparent backdrop-blur-sm'
                        : 'bg-white/50 hover:bg-gray-50/50 hover:shadow-sm border border-transparent backdrop-blur-sm'
                  }`}
                  onMouseEnter={() => setHoveredChatId(session.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                  onClick={() => {
                    onSelectChat(session.id);
                    onClose();
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                                          <h3 className={`text-sm font-medium truncate ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {truncateTitle(session.title)}
                    </h3>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span>{formatDate(session.updatedAt)}</span>
                    <span>•</span>
                    <span>{session.metadata.messageCount} messages</span>
                  </div>
                  </div>

                  {/* Delete Button */}
                  {hoveredChatId === session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(session.id);
                      }}
                      className={`flex-shrink-0 p-1.5 rounded transition-all duration-200 transform hover:scale-110 ${
                        isDarkMode
                          ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="Delete chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pinned to bottom */}
        <div className={`mt-auto border-t p-4 ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-900/50' 
            : 'border-gray-200 bg-white/50'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>EduChat AI</p>
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Your study companion</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 