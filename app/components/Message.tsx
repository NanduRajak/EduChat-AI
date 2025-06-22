'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-6 max-w-4xl mx-auto",
      isUser ? "bg-white" : "bg-gray-50/50"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser ? "bg-gray-900" : "bg-gradient-to-br from-rose-500 to-rose-600"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {message.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Uploaded image ${index + 1}`}
                className="max-w-xs max-h-48 object-contain rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "text-gray-900" : "text-gray-800"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  return inline ? (
                    <code
                      className="bg-rose-50 px-2 py-1 rounded-md text-sm font-mono text-rose-800 border border-rose-100"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-x-auto my-4 shadow-sm">
                      <code className="text-sm font-mono text-gray-800" {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                p({ children }) {
                  return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-4 pl-6 space-y-2 list-disc">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-4 pl-6 space-y-2 list-decimal">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 border-b border-gray-200 pb-2">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-semibold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-rose-300 pl-4 py-3 my-4 bg-rose-50/50 rounded-r-lg italic text-gray-700">
                      {children}
                    </blockquote>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-3 font-medium">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
} 