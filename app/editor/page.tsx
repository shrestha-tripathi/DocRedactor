'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentStore } from '@/lib/store';
import EditorLayout from '@/components/editor/EditorLayout';
import ProcessingOverlay from '@/components/editor/ProcessingOverlay';
import { loadPdfDocument, extractTextFromPdf } from '@/lib/pdf/reader';
import { processTextWithNER, processTextWithRegex, mergeEntities } from '@/lib/ai/ner';
import { mapEntitiesToRedactionBoxes } from '@/lib/pdf/coordinates';
import { v4 as uuidv4 } from 'uuid';
import type { Entity, RedactionBox } from '@/types';

export default function EditorPage() {
  const router = useRouter();
  const fileBytes = useDocumentStore((state) => state.fileBytes);
  const processingStage = useDocumentStore((state) => state.processingStage);

  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const isProcessingRef = useRef(false);

  // Redirect if no document loaded
  useEffect(() => {
    if (!fileBytes) {
      router.push('/');
    }
  }, [fileBytes, router]);

  // Process document when loaded
  useEffect(() => {
    if (!fileBytes || isProcessingRef.current) return;
    isProcessingRef.current = true;

    const processDocument = async () => {
      const store = useDocumentStore.getState();
      
      try {
        // Step 1: Load PDF
        store.setProcessingStage('loading', 'Loading PDF document...');
        console.log('Loading PDF...');
        
        let pdf;
        try {
          // IMPORTANT: Pass a COPY to pdf.js because it detaches the ArrayBuffer
          const pdfDataCopy = new Uint8Array(fileBytes);
          pdf = await loadPdfDocument(pdfDataCopy);
        } catch (pdfError) {
          console.error('PDF loading error:', pdfError);
          throw new Error(`Failed to load PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
        }
        
        setPdfDocument(pdf);
        store.setPageCount(pdf.numPages);
        console.log('PDF loaded, pages:', pdf.numPages);
        
        // Check tier limits
        if (!store.checkTierLimit(pdf.numPages)) {
          store.setError(`Free tier limit: Maximum ${store.tierLimits.maxPages} pages allowed. This document has ${pdf.numPages} pages.`);
          store.setProcessingStage('error', 'Page limit exceeded');
          return;
        }

        // Step 2: Extract text
        store.setProcessingStage('extracting', 'Extracting text from document...');
        console.log('Extracting text...');
        
        let textContent;
        try {
          textContent = await extractTextFromPdf(pdf);
        } catch (extractError) {
          console.error('Text extraction error:', extractError);
          throw new Error(`Failed to extract text: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
        }
        
        store.setTextContent(textContent);
        console.log('Text extracted from', textContent.length, 'pages');

        // Step 3: Run NER
        store.setProcessingStage('analyzing', 'Loading AI model (first time may take a moment)...');
        console.log('Starting NER analysis...');
        
        const allEntities: Array<Omit<Entity, 'id'> & { tempId: string }> = [];
        
        for (let i = 0; i < textContent.length; i++) {
          const pageContent = textContent[i];
          store.setProcessingStage('analyzing', `Analyzing page ${i + 1} of ${textContent.length}...`, ((i + 1) / textContent.length) * 100);
          
          try {
            // AI NER detection
            const nerEntities = await processTextWithNER(pageContent.text, pageContent.page);
            console.log(`Page ${i + 1}: Found ${nerEntities.length} NER entities`);
            
            // Regex detection
            const regexEntities = processTextWithRegex(pageContent.text, pageContent.page);
            console.log(`Page ${i + 1}: Found ${regexEntities.length} regex entities`);
            
            // Merge and dedupe
            const pageEntities = mergeEntities(nerEntities, regexEntities);
            
            // Assign temporary IDs so we can link boxes
            pageEntities.forEach((e) => {
              allEntities.push({ ...e, tempId: uuidv4() });
            });
          } catch (nerError) {
            console.error(`NER error on page ${i + 1}:`, nerError);
            // Continue with other pages, just skip NER for this one
          }
        }
        
        console.log('Total entities found:', allEntities.length);

        // Step 4: Map to redaction boxes with proper entity linking
        store.setProcessingStage('mapping', 'Mapping entities to document positions...');
        console.log('Mapping entities to coordinates...');
        
        // Create entities with their IDs
        const entitiesWithIds: Entity[] = allEntities.map((e) => ({
          id: e.tempId,
          text: e.text,
          type: e.type,
          confidence: e.confidence,
          page: e.page,
          startIndex: e.startIndex,
          endIndex: e.endIndex,
          source: (e as any).source || 'ai' as const,
        }));
        
        // Now create boxes and link them to entities
        const boxes: Omit<RedactionBox, 'id'>[] = [];
        for (const entity of entitiesWithIds) {
          try {
            const entityBoxes = await mapEntitiesToRedactionBoxes(
              [entity], 
              textContent, 
              pdf
            );
            // Link each box to this entity
            entityBoxes.forEach((box) => {
              boxes.push({
                ...box,
                entityId: entity.id,
              });
            });
          } catch (mapError) {
            console.error('Error mapping entity:', entity.text, mapError);
          }
        }
        
        console.log('Created', boxes.length, 'redaction boxes');
        
        // Add to store - use raw set to include the IDs we generated
        store.setEntitiesWithIds(entitiesWithIds);
        store.addRedactionBoxes(boxes);

        // Done
        store.setProcessingStage('ready', 'Document ready for review');
        console.log('Processing complete!');

      } catch (error) {
        console.error('Error processing document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
        store.setError(errorMessage);
        store.setProcessingStage('error', errorMessage);
      }
    };

    processDocument();
  }, [fileBytes]);

  // Show loading if redirecting
  if (!fileBytes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      {processingStage !== 'ready' && processingStage !== 'complete' && (
        <ProcessingOverlay />
      )}
      <EditorLayout pdfDocument={pdfDocument} />
    </>
  );
}
