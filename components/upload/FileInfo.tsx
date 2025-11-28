'use client';

import { FileText, X, FileCheck } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/file';

interface FileInfoProps {
  fileName: string;
  fileSize?: number;
  pageCount?: number;
  onRemove?: () => void;
}

export default function FileInfo({ fileName, fileSize, pageCount, onRemove }: FileInfoProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-2 rounded-lg bg-brand-100">
        <FileCheck className="w-5 h-5 text-brand-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {fileName}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {fileSize && <span>{formatFileSize(fileSize)}</span>}
          {pageCount && (
            <>
              <span>•</span>
              <span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
