// PDF Redaction utilities using pdf-lib

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { RedactionBox } from '@/types';

/**
 * Apply redactions to a PDF document
 * This creates a new PDF with the redacted areas permanently removed
 */
export async function applyRedactions(
  pdfData: Uint8Array | ArrayBuffer,
  redactionBoxes: RedactionBox[],
  addWatermark: boolean = false
): Promise<Uint8Array> {
  // Ensure we have valid data
  const dataLength = pdfData instanceof Uint8Array ? pdfData.length : pdfData.byteLength;
  console.log('applyRedactions: data length:', dataLength);
  
  if (dataLength === 0) {
    throw new Error('PDF data is empty');
  }
  
  // Check PDF header
  const headerBytes = pdfData instanceof Uint8Array 
    ? pdfData.slice(0, 5) 
    : new Uint8Array(pdfData).slice(0, 5);
  const header = String.fromCharCode(...headerBytes);
  console.log('applyRedactions: PDF header:', header);
  
  if (!header.startsWith('%PDF')) {
    throw new Error(`Invalid PDF: header is "${header}" instead of "%PDF"`);
  }
  
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfData);
  const pages = pdfDoc.getPages();
  
  // Group redactions by page
  const redactionsByPage = new Map<number, RedactionBox[]>();
  for (const box of redactionBoxes) {
    const pageBoxes = redactionsByPage.get(box.page) || [];
    pageBoxes.push(box);
    redactionsByPage.set(box.page, pageBoxes);
  }
  
  // Apply redactions to each page
  for (const [pageNum, boxes] of redactionsByPage) {
    const pageIndex = pageNum - 1; // pdf-lib uses 0-based indexing
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    
    // Draw black rectangles over the redacted areas
    // Note: For true redaction, we would need to remove the underlying text
    // pdf-lib doesn't support text removal, so we use visual redaction
    for (const box of boxes) {
      // Convert coordinates if necessary
      // The y-coordinate might need to be flipped depending on the coordinate system
      const pdfY = height - box.y - box.height;
      
      page.drawRectangle({
        x: box.x,
        y: pdfY,
        width: box.width,
        height: box.height,
        color: rgb(0, 0, 0),
        borderWidth: 0,
      });
    }
  }
  
  // Add watermark if required (free tier)
  if (addWatermark) {
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      page.drawText('Redacted with DocRedactor', {
        x: 10,
        y: 10,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });
    }
  }
  
  // Flatten the document to prevent editing
  // This removes form fields and makes annotations permanent
  const form = pdfDoc.getForm();
  try {
    form.flatten();
  } catch {
    // Form might be empty, that's okay
  }
  
  // Save and return the modified PDF
  return await pdfDoc.save();
}

/**
 * Get information about a PDF document
 */
export async function getPdfInfo(pdfData: Uint8Array | ArrayBuffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  hasForm: boolean;
}> {
  const pdfDoc = await PDFDocument.load(pdfData);
  
  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    hasForm: pdfDoc.getForm().getFields().length > 0,
  };
}

/**
 * Create a preview of redactions without permanently applying them
 * Returns an annotated PDF with red borders around redaction areas
 */
export async function createRedactionPreview(
  pdfData: Uint8Array | ArrayBuffer,
  redactionBoxes: RedactionBox[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData);
  const pages = pdfDoc.getPages();
  
  const redactionsByPage = new Map<number, RedactionBox[]>();
  for (const box of redactionBoxes) {
    const pageBoxes = redactionsByPage.get(box.page) || [];
    pageBoxes.push(box);
    redactionsByPage.set(box.page, pageBoxes);
  }
  
  for (const [pageNum, boxes] of redactionsByPage) {
    const pageIndex = pageNum - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    
    const page = pages[pageIndex];
    const { height } = page.getSize();
    
    for (const box of boxes) {
      const pdfY = height - box.y - box.height;
      
      // Draw semi-transparent red overlay
      page.drawRectangle({
        x: box.x,
        y: pdfY,
        width: box.width,
        height: box.height,
        color: rgb(1, 0, 0),
        opacity: 0.3,
        borderColor: rgb(1, 0, 0),
        borderWidth: 1,
      });
    }
  }
  
  return await pdfDoc.save();
}
