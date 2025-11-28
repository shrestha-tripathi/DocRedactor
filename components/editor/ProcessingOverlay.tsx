'use client';

import { Loader2, Shield, FileText, Brain, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDocumentStore } from '@/lib/store';
import PrivacyBadge from '@/components/common/PrivacyBadge';

export default function ProcessingOverlay() {
  const processingStage = useDocumentStore((state) => state.processingStage);
  const processingMessage = useDocumentStore((state) => state.processingMessage);
  const processingProgress = useDocumentStore((state) => state.processingProgress);
  const error = useDocumentStore((state) => state.error);

  const stageIcons = {
    idle: FileText,
    loading: FileText,
    extracting: FileText,
    analyzing: Brain,
    mapping: MapPin,
    ready: CheckCircle,
    applying: Loader2,
    complete: CheckCircle,
    error: AlertTriangle,
  };

  const StageIcon = stageIcons[processingStage] || Loader2;
  const isError = processingStage === 'error';
  const isComplete = processingStage === 'complete';

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/95 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        {/* Privacy Badge */}
        <div className="mb-8">
          <PrivacyBadge variant="full" />
        </div>

        {/* Icon */}
        <div className={`
          inline-flex p-6 rounded-full mb-6
          ${isError ? 'bg-red-500/20' : isComplete ? 'bg-green-500/20' : 'bg-brand-500/20'}
        `}>
          <StageIcon className={`
            w-12 h-12
            ${isError ? 'text-red-400' : isComplete ? 'text-green-400' : 'text-brand-400'}
            ${!isError && !isComplete ? 'spinner' : ''}
          `} />
        </div>

        {/* Message */}
        <h2 className={`
          text-xl font-semibold mb-2
          ${isError ? 'text-red-300' : 'text-white'}
        `}>
          {isError ? 'Processing Error' : processingMessage || 'Processing...'}
        </h2>

        {/* Error details */}
        {isError && error && (
          <div className="bg-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {/* Retry hint for errors */}
        {isError && (
          <p className="text-gray-400 text-sm mb-4">
            Try refreshing the page or uploading a different document.
          </p>
        )}

        {/* Progress bar */}
        {processingProgress > 0 && !isError && !isComplete && (
          <div className="w-full bg-navy-700 rounded-full h-2 mb-4">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        )}

        {/* Stage indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4 text-green-400" />
          <span>All processing happens locally on your device</span>
        </div>
      </div>
    </div>
  );
}
