'use client';

import { useCallback } from 'react';
import { Check, CheckCheck, XCircle } from 'lucide-react';
import { useDocumentStore, useEntityCounts } from '@/lib/store';
import type { EntityType } from '@/types';
import { ENTITY_TYPE_CONFIGS } from '@/types';

const FILTER_ENTITY_TYPES: EntityType[] = [
  'PER', 'LOC', 'ORG', 'EMAIL', 'PHONE', 'SSN', 'DATE', 'MISC', 'CUSTOM'
];

export default function EntityFilter() {
  const selectedEntityTypes = useDocumentStore((state) => state.selectedEntityTypes);
  const entityCounts = useEntityCounts();

  const handleToggle = useCallback((type: EntityType) => {
    useDocumentStore.getState().toggleEntityType(type);
  }, []);

  const handleConfirmAll = useCallback((type: EntityType) => {
    useDocumentStore.getState().confirmAllByType(type);
  }, []);

  const handleRejectAll = useCallback((type: EntityType) => {
    useDocumentStore.getState().rejectAllByType(type);
  }, []);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Filter by Entity Type
      </h3>
      
      <div className="space-y-2">
        {FILTER_ENTITY_TYPES.map((type) => {
          const config = ENTITY_TYPE_CONFIGS[type];
          const count = entityCounts[type] || 0;
          const isSelected = selectedEntityTypes.includes(type);
          
          if (count === 0) return null;

          return (
            <div 
              key={type}
              className="flex items-center justify-between group"
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(type)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`badge ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs text-gray-500">({count})</span>
              </label>
              
              {/* Quick actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleConfirmAll(type)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title={`Confirm all ${config.label}`}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRejectAll(type)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title={`Reject all ${config.label}`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
