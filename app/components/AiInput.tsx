'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ArrowUp, Paperclip, X, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface AiInputProps {
  onSubmit: (message: string, images?: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  isDarkMode?: boolean;
}

export default function AiInput({ onSubmit, isLoading, placeholder = "Ask me anything...", isDarkMode = false }: AiInputProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && images.length === 0) return;
    
    onSubmit(input.trim(), images.length > 0 ? images : undefined);
    setInput('');
    setImages([]);
  }, [input, images, onSubmit]);

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
      <div className="max-w-5xl mx-auto px-6 py-5">
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
              "relative border rounded-2xl shadow-lg transition-all",
              isDarkMode ? "border-gray-600 bg-gray-700/90" : "border-gray-200 bg-white/90",
              isDragging && "border-rose-400",
              isDragging && (isDarkMode ? "bg-rose-900/20" : "bg-rose-50"),
              isDarkMode ? "hover:border-gray-500 focus-within:border-rose-400 focus-within:shadow-xl" : "hover:border-gray-300 focus-within:border-rose-300 focus-within:shadow-xl"
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
              className={`w-full min-h-[60px] max-h-36 px-5 py-4 pr-28 text-sm bg-transparent border-none outline-none resize-none transition-colors leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '60px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 144) + 'px';
              }}
            />

            {/* Action Buttons */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center disabled:opacity-50 ${isDarkMode ? 'text-rose-400 hover:bg-gray-600' : 'text-rose-500 hover:bg-rose-50'}`}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {(input.trim() || images.length > 0) && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-8 h-8 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center animate-in fade-in duration-200"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Drag Overlay */}
            {isDragging && (
              <div className={`absolute inset-0 border-2 border-dashed border-rose-400 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-50/90'}`}>
                <div className="text-center">
                  <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className={`text-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>Drop images here</p>
                </div>
              </div>
            )}
          </div>
        </form>

        <p className={`text-xs mt-2 text-center transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Press ⌘+Enter to send • Supports images up to 10MB
        </p>
      </div>
    </div>
  );
}
