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
    <div className="flex items-start gap-3 px-4 py-4 max-w-4xl mx-auto">
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-gray-900" : "bg-rose-500"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <span className="text-white text-xs font-semibold">AI</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {message.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Uploaded image ${index + 1}`}
                className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200 shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div className="prose prose-sm max-w-none text-gray-900">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  return inline ? (
                    <code
                      className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg overflow-x-auto my-3">
                      <code className="text-sm font-mono text-gray-800" {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-relaxed text-gray-900">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-3 pl-5 space-y-1 list-disc">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-3 pl-5 space-y-1 list-decimal">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-gray-900">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="text-xl font-semibold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-3 bg-gray-50 rounded-r">
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
        <div className="text-xs text-gray-500 mt-2">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
} 