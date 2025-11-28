'use client';

import { useCallback, useMemo } from 'react';
import { FilePlus, CheckCheck } from 'lucide-react';
import FileInfo from '@/components/upload/FileInfo';
import EntityFilter from './EntityFilter';
import EntityList from './EntityList';
import CustomPatterns from './CustomPatterns';
import ExportButton from '@/components/common/ExportButton';
import PrivacyBadge from '@/components/common/PrivacyBadge';
import { useDocumentStore } from '@/lib/store';

interface SidebarProps {
  onExport: () => Promise<void>;
  onNewDocument: () => void;
}

export default function Sidebar({ onExport, onNewDocument }: SidebarProps) {
  const fileName = useDocumentStore((state) => state.fileName);
  const file = useDocumentStore((state) => state.file);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const redactionBoxes = useDocumentStore((state) => state.redactionBoxes);
  const detectedEntities = useDocumentStore((state) => state.detectedEntities);
  const selectedEntityTypes = useDocumentStore((state) => state.selectedEntityTypes);
  
  // Get entity IDs that are currently visible (match selected filters)
  const visibleEntityIds = useMemo(() => {
    return new Set(
      detectedEntities
        .filter((e) => selectedEntityTypes.includes(e.type))
        .map((e) => e.id)
    );
  }, [detectedEntities, selectedEntityTypes]);
  
  // Count only pending boxes for visible/filtered entities
  const pendingCount = useMemo(() => {
    return redactionBoxes.filter(
      (b) => b.status === 'pending' && visibleEntityIds.has(b.entityId)
    ).length;
  }, [redactionBoxes, visibleEntityIds]);
  
  const handleConfirmAll = useCallback(() => {
    useDocumentStore.getState().confirmAllVisible();
  }, []);

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <FileInfo 
          fileName={fileName} 
          fileSize={file?.size}
          pageCount={pageCount}
          onRemove={onNewDocument}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Privacy Badge */}
        <div className="p-4 border-b border-gray-100">
          <PrivacyBadge variant="full" />
        </div>

        {/* Entity Filter */}
        <div className="p-4 border-b border-gray-100">
          <EntityFilter />
        </div>

        {/* Entity List */}
        <div className="p-4 border-b border-gray-100">
          <EntityList />
        </div>

        {/* Custom Patterns */}
        <div className="p-4">
          <CustomPatterns />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {pendingCount > 0 && (
          <button
            onClick={handleConfirmAll}
            className="btn-secondary w-full gap-2 text-green-700 border-green-300 hover:bg-green-50"
          >
            <CheckCheck className="w-4 h-4" />
            Confirm All ({pendingCount})
          </button>
        )}
        
        <ExportButton onExport={onExport} />
        
        <button
          onClick={onNewDocument}
          className="btn-secondary w-full gap-2"
        >
          <FilePlus className="w-4 h-4" />
          New Document
        </button>
      </div>
    </aside>
  );
}
