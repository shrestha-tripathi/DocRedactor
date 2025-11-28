'use client';

import { useCallback, useMemo } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { useDocumentStore } from '@/lib/store';
import type { Entity } from '@/types';
import { ENTITY_TYPE_CONFIGS } from '@/types';

interface EntityCardProps {
  entity: Entity;
}

export default function EntityCard({ entity }: EntityCardProps) {
  const redactionBoxes = useDocumentStore((state) => state.redactionBoxes);
  const hoveredEntityId = useDocumentStore((state) => state.hoveredEntityId);
  const selectedEntityId = useDocumentStore((state) => state.selectedEntityId);
  const currentPage = useDocumentStore((state) => state.currentPage);

  const config = ENTITY_TYPE_CONFIGS[entity.type];
  const box = useMemo(() => redactionBoxes.find((b) => b.entityId === entity.id), [redactionBoxes, entity.id]);
  const isHovered = hoveredEntityId === entity.id;
  const isSelected = selectedEntityId === entity.id;
  const isOnCurrentPage = entity.page === currentPage;

  const handleConfirm = useCallback(() => {
    const b = useDocumentStore.getState().redactionBoxes.find((r) => r.entityId === entity.id);
    if (b) {
      useDocumentStore.getState().updateRedactionStatus(b.id, 'confirmed');
    }
  }, [entity.id]);

  const handleReject = useCallback(() => {
    const b = useDocumentStore.getState().redactionBoxes.find((r) => r.entityId === entity.id);
    if (b) {
      useDocumentStore.getState().updateRedactionStatus(b.id, 'rejected');
    }
  }, [entity.id]);

  const handleClick = useCallback(() => {
    const store = useDocumentStore.getState();
    store.setSelectedEntityId(entity.id);
    if (entity.page !== store.currentPage) {
      store.setCurrentPage(entity.page);
    }
  }, [entity.id, entity.page]);

  const handleHover = useCallback((id: string | null) => {
    useDocumentStore.getState().setHoveredEntityId(id);
  }, []);

  const handleGoToPage = useCallback(() => {
    useDocumentStore.getState().setCurrentPage(entity.page);
  }, [entity.page]);

  return (
    <div
      className={`
        p-2 rounded-lg border transition-all cursor-pointer
        ${isHovered || isSelected 
          ? `${config.bgColor} ${config.borderColor}` 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }
        ${box?.status === 'confirmed' ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
        ${box?.status === 'rejected' ? 'opacity-50' : ''}
      `}
      onMouseEnter={() => handleHover(entity.id)}
      onMouseLeave={() => handleHover(null)}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={entity.text}>
            {entity.text}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge text-xs ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-400">
              p.{entity.page}
            </span>
            {entity.confidence < 0.9 && (
              <span className="text-xs text-amber-600">
                {Math.round(entity.confidence * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!isOnCurrentPage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGoToPage();
              }}
              className="p-1 text-gray-400 hover:text-brand-600 rounded"
              title="Go to page"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            className={`p-1 rounded transition-colors ${
              box?.status === 'confirmed'
                ? 'text-green-600 bg-green-100'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
            }`}
            title="Confirm redaction"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReject();
            }}
            className={`p-1 rounded transition-colors ${
              box?.status === 'rejected'
                ? 'text-red-600 bg-red-100'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
            title="Reject redaction"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
