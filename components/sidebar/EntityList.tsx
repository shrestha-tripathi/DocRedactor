'use client';

import { useMemo } from 'react';
import { useDocumentStore, useCurrentPageEntities } from '@/lib/store';
import EntityCard from './EntityCard';

export default function EntityList() {
  const currentPage = useDocumentStore((state) => state.currentPage);
  const detectedEntities = useDocumentStore((state) => state.detectedEntities);
  const selectedEntityTypes = useDocumentStore((state) => state.selectedEntityTypes);
  const currentPageEntities = useCurrentPageEntities();

  // Get all visible entities across all pages
  const allVisibleEntities = useMemo(() => 
    detectedEntities.filter((e) => selectedEntityTypes.includes(e.type)),
    [detectedEntities, selectedEntityTypes]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Detected Entities
        </h3>
        <span className="text-xs text-gray-500">
          {currentPageEntities.length} on page {currentPage}
        </span>
      </div>

      {allVisibleEntities.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No entities detected
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          {/* Current page entities first */}
          {currentPageEntities.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Current Page
              </p>
              {currentPageEntities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </div>
          )}

          {/* Other pages */}
          {allVisibleEntities.filter(e => e.page !== currentPage).length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Other Pages
              </p>
              {allVisibleEntities
                .filter(e => e.page !== currentPage)
                .slice(0, 20) // Limit for performance
                .map((entity) => (
                  <EntityCard key={entity.id} entity={entity} />
                ))
              }
              {allVisibleEntities.filter(e => e.page !== currentPage).length > 20 && (
                <p className="text-xs text-gray-400 text-center">
                  +{allVisibleEntities.filter(e => e.page !== currentPage).length - 20} more
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
