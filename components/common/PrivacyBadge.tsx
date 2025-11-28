'use client';

import { Lock, Shield } from 'lucide-react';

interface PrivacyBadgeProps {
  variant?: 'compact' | 'full';
}

export default function PrivacyBadge({ variant = 'compact' }: PrivacyBadgeProps) {
  if (variant === 'compact') {
    return (
      <div className="privacy-pulse inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-500/30">
        <Lock className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs font-medium text-green-300">
          Processing Locally
        </span>
      </div>
    );
  }

  return (
    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Shield className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-green-300 mb-1">
            100% Private Processing
          </h4>
          <p className="text-xs text-green-400/80">
            All document analysis happens locally in your browser.
            Your files are never uploaded to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
