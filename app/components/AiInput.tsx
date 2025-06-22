'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface AiInputProps {
  onSubmit: (message: string, images?: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function AiInput({ onSubmit, isLoading, placeholder = "Ask me anything..." }: AiInputProps) {
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
    <div className="bg-white/80 backdrop-blur-sm">
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
              "relative border border-gray-200 rounded-xl bg-white shadow-sm transition-all",
              isDragging && "border-rose-400 bg-rose-50",
              "hover:border-gray-300 focus-within:border-gray-400 focus-within:shadow-md"
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
              className="w-full min-h-[52px] max-h-32 px-4 py-3 pr-24 text-sm bg-transparent border-none outline-none resize-none placeholder:text-gray-500"
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
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={isLoading || (!input.trim() && images.length === 0)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  (input.trim() || images.length > 0) && !isLoading
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
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

        <p className="text-xs text-gray-500 mt-2 text-center">
          Press ⌘+Enter to send • Supports images up to 10MB
        </p>
      </div>
    </div>
  );
}
