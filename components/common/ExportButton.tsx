'use client';

import { Download, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDocumentStore, useConfirmedRedactionCount } from '@/lib/store';

interface ExportButtonProps {
  onExport: () => Promise<void>;
}

export default function ExportButton({ onExport }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const confirmedCount = useConfirmedRedactionCount();
  const processingStage = useDocumentStore((state) => state.processingStage);
  const tierLimitsWatermark = useDocumentStore((state) => state.tierLimits.watermark);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);

  const isDisabled = isExporting || processingStage !== 'ready' || confirmedCount === 0;

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className="btn-primary w-full gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 spinner" />
            Applying Redactions...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Redacted PDF
          </>
        )}
      </button>
      
      {confirmedCount === 0 && processingStage === 'ready' && (
        <p className="text-xs text-amber-600 text-center">
          Confirm at least one redaction to export
        </p>
      )}
      
      {tierLimitsWatermark && (
        <p className="text-xs text-gray-500 text-center">
          Free tier: Output includes watermark
        </p>
      )}
    </div>
  );
}
