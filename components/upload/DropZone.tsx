'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function DropZone({ onFileSelect, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const acceptedMimes = Object.keys(ACCEPTED_TYPES);
    if (!acceptedMimes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Please upload a PDF file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 50MB';
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <label
        className={`
          relative flex flex-col items-center justify-center
          w-full h-64 border-2 border-dashed rounded-2xl
          cursor-pointer transition-all duration-300
          ${isDragging 
            ? 'border-brand-400 bg-brand-500/10 drop-zone-active' 
            : 'border-gray-300 bg-white/5 hover:border-brand-400 hover:bg-brand-500/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-brand-500/20' : 'bg-gray-100'}
          `}>
            {isDragging ? (
              <FileText className="w-10 h-10 text-brand-400" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-semibold text-white mb-1">
              {isDragging ? 'Drop your file here' : 'Drag & drop your document'}
            </p>
            <p className="text-sm text-gray-400">
              or click to browse • PDF files up to 50MB
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              PDF
            </span>
          </div>
        </div>
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
