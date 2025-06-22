import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from './ui/card';
import { cn, formatTimestamp } from '../lib/utils';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="max-w-md">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to EduChat AI</h2>
          <p className="text-muted-foreground mb-6">
            Your intelligent study companion. Ask questions, upload images, or get help with any subject!
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Upload images of problems or diagrams</p>
            <p>• Get step-by-step explanations</p>
            <p>• Ask questions about any subject</p>
            <p>• Generate quizzes and study materials</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          <Card
            className={cn(
              "max-w-[85%] overflow-hidden",
              message.role === 'user'
                ? 'bg-primary text-primary-foreground ml-12'
                : 'bg-muted mr-12'
            )}
          >
            <CardContent className="p-4">
              {/* Message Content */}
              {message.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                                             code({ inline, className, children, ...props }: any) {
                        return inline ? (
                          <code
                            className="bg-muted px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                            <code className="text-sm" {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Images */}
              {message.images && message.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Uploaded image ${index + 1}`}
                        className="max-w-full h-auto rounded-lg border max-h-96 object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs opacity-70">
                {formatTimestamp(message.timestamp)}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
} 