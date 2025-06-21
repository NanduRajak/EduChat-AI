'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ArrowUp, Paperclip, X, Upload, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface AiInputProps {
  onSubmit: (message: string, images?: string[], useWebSearch?: boolean) => void;
  isLoading?: boolean;
  placeholder?: string;
  isDarkMode?: boolean;
}

export default function AiInput({ onSubmit, isLoading, placeholder = "Ask me anything...", isDarkMode = false }: AiInputProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && images.length === 0) return;
    
    onSubmit(input.trim(), images.length > 0 ? images : undefined, webSearchEnabled);
    setInput('');
    setImages([]);
  }, [input, images, webSearchEnabled, onSubmit]);

  const handleImageUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  return (
    <div className={`backdrop-blur-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
      <div className="max-w-4xl mx-auto p-4">
        {/* Image Preview */}
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={cn(
              "relative border rounded-xl shadow-sm transition-all",
              isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-white",
              isDragging && "border-rose-400",
              isDragging && (isDarkMode ? "bg-rose-900/20" : "bg-rose-50"),
              isDarkMode ? "hover:border-gray-500 focus-within:border-rose-400 focus-within:shadow-md" : "hover:border-gray-300 focus-within:border-gray-400 focus-within:shadow-md"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={`w-full min-h-[52px] max-h-32 px-4 py-3 pr-32 text-sm bg-transparent border-none outline-none resize-none transition-colors ${isDarkMode ? 'text-gray-100 placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '52px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />

            {/* Action Buttons */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />
              
              {/* Web Search Toggle */}
              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                disabled={isLoading}
                className={cn(
                  "group relative p-2 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50",
                  webSearchEnabled
                    ? "bg-rose-500 text-white shadow-md hover:bg-rose-600 hover:shadow-lg"
                    : isDarkMode
                      ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700/50"
                      : "text-gray-500 hover:text-rose-500 hover:bg-rose-50"
                )}
                title={webSearchEnabled ? "Web search enabled - Get up-to-date information" : "Enable web search for current information"}
              >
                <div className="relative">
                  <Globe className={cn(
                    "w-4 h-4 transition-all duration-300",
                    webSearchEnabled && "animate-pulse"
                  )} />
                  {webSearchEnabled && (
                    <>
                      {/* Animated rings */}
                      <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
                      <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className={cn(
                  "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs rounded-lg shadow-lg transition-all duration-200 pointer-events-none whitespace-nowrap z-10",
                  "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0",
                  isDarkMode 
                    ? "bg-gray-800 text-gray-100 border border-gray-600" 
                    : "bg-white text-gray-800 border border-gray-200"
                )}>
                  {webSearchEnabled ? "Web search ON" : "Enable web search"}
                  <div className={cn(
                    "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent",
                    isDarkMode ? "border-t-gray-800" : "border-t-white"
                  )} />
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50",
                  isDarkMode
                    ? "text-rose-400 hover:text-rose-500 hover:bg-gray-700/50"
                    : "text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                )}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={isLoading || (!input.trim() && images.length === 0)}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300 transform hover:scale-105",
                  (input.trim() || images.length > 0) && !isLoading
                    ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : isDarkMode
                      ? "text-gray-600 cursor-not-allowed opacity-0"
                      : "text-gray-400 cursor-not-allowed opacity-0"
                )}
                style={{
                  opacity: (input.trim() || images.length > 0) && !isLoading ? 1 : 0,
                  transform: (input.trim() || images.length > 0) && !isLoading ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-rose-50/90 border-2 border-dashed border-rose-400 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm text-rose-700">Drop images here</p>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-center gap-4 mt-2">
          <p className={`text-xs transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Press ⌘+Enter to send • Supports images up to 10MB
          </p>
          {webSearchEnabled && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                Web search enabled
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
