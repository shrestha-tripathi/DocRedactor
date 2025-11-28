'use client';

import { useEffect, useRef, useState } from 'react';
import { useDocumentStore, useCurrentPageRedactions } from '@/lib/store';
import RedactionOverlay from './RedactionOverlay';

interface PDFViewerProps {
  pdfDocument: any;
}

export default function PDFViewer({ pdfDocument }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageViewport, setPageViewport] = useState<any>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  
  const currentPage = useDocumentStore((state) => state.currentPage);
  const scale = useDocumentStore((state) => state.scale);
  const redactionBoxes = useCurrentPageRedactions();

  // Render PDF page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        setPageViewport(viewport);

        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setCanvasDimensions({ width: viewport.width, height: viewport.height });

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering PDF page:', error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  if (!pdfDocument) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading document...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex items-start justify-center min-h-full"
    >
      <div className="relative inline-block shadow-xl rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="pdf-canvas block"
        />
        <RedactionOverlay 
          boxes={redactionBoxes}
          viewport={pageViewport}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
        />
      </div>
    </div>
  );
}
