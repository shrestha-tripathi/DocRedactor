'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import PDFViewer from '@/components/editor/PDFViewer';
import PageControls from '@/components/editor/PageControls';
import { useDocumentStore } from '@/lib/store';
import { applyRedactions } from '@/lib/pdf/redactor';
import { downloadBlob, generateRedactedFileName } from '@/lib/utils/download';

interface EditorLayoutProps {
  pdfDocument: any;
}

export default function EditorLayout({ pdfDocument }: EditorLayoutProps) {
  const router = useRouter();
  
  // Only subscribe to data we need for rendering
  const fileName = useDocumentStore((state) => state.fileName);

  const handleExport = useCallback(async () => {
    const store = useDocumentStore.getState();
    const { fileBytes, redactionBoxes, tierLimits, setProcessingStage } = store;
    
    if (!fileBytes || fileBytes.length === 0) {
      console.error('No fileBytes available or empty');
      setProcessingStage('error', 'No document data available. Please reload the document.');
      return;
    }
    
    console.log('Export: fileBytes length:', fileBytes.length);

    try {
      setProcessingStage('applying', 'Applying redactions to document...');
      
      const confirmedBoxes = redactionBoxes.filter((b) => b.status === 'confirmed');
      console.log('Export: confirmed boxes:', confirmedBoxes.length);
      
      // Create a fresh copy of the bytes for pdf-lib
      const pdfBytesCopy = new Uint8Array(fileBytes);
      
      const redactedPdfBytes = await applyRedactions(
        pdfBytesCopy, 
        confirmedBoxes,
        tierLimits.watermark
      );
      
      const blob = new Blob([new Uint8Array(redactedPdfBytes)], { type: 'application/pdf' });
      const newFileName = generateRedactedFileName(store.fileName);
      downloadBlob(blob, newFileName);
      
      setProcessingStage('complete', 'Redaction complete!');
      
      // Reset to ready state after download
      setTimeout(() => {
        setProcessingStage('ready', 'Document ready for review');
      }, 2000);
      
    } catch (error) {
      console.error('Export error:', error);
      useDocumentStore.getState().setProcessingStage('error', 'Failed to export document');
    }
  }, []);

  const handleNewDocument = useCallback(() => {
    useDocumentStore.getState().clearDocument();
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onExport={handleExport} onNewDocument={handleNewDocument} />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto p-4">
            <PDFViewer pdfDocument={pdfDocument} />
          </div>
          
          {/* Page Controls */}
          <PageControls />
        </main>
      </div>
    </div>
  );
}
