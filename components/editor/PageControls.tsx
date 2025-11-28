'use client';

import { useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useDocumentStore } from '@/lib/store';

export default function PageControls() {
  const currentPage = useDocumentStore((state) => state.currentPage);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const scale = useDocumentStore((state) => state.scale);

  const handlePrevPage = useCallback(() => {
    const { currentPage, setCurrentPage } = useDocumentStore.getState();
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, []);

  const handleNextPage = useCallback(() => {
    const { currentPage, pageCount, setCurrentPage } = useDocumentStore.getState();
    if (currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const { scale, setScale } = useDocumentStore.getState();
    setScale(Math.min(scale + 0.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    const { scale, setScale } = useDocumentStore.getState();
    setScale(Math.max(scale - 0.25, 0.25));
  }, []);

  const handleFitToWidth = useCallback(() => {
    useDocumentStore.getState().setScale(1.0);
  }, []);

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="btn-ghost p-2 disabled:opacity-30"
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-[100px] text-center">
            Page <span className="font-medium text-gray-900">{currentPage}</span> of{' '}
            <span className="font-medium text-gray-900">{pageCount}</span>
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage >= pageCount}
            className="btn-ghost p-2 disabled:opacity-30"
            title="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.25}
            className="btn-ghost p-2 disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {zoomPercentage}%
          </span>
          
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="btn-ghost p-2 disabled:opacity-30"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <button
            onClick={handleFitToWidth}
            className="btn-ghost p-2"
            title="Reset zoom"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
