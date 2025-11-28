// PDF Reading utilities using pdf.js

import type { PageTextContent, TextItem } from '@/types';

// We need to dynamically import pdfjs-dist to handle the worker
let pdfjs: any = null;

async function loadPdfJs() {
  if (!pdfjs) {
    pdfjs = await import('pdfjs-dist');
    
    // Set up the worker using unpkg CDN (more reliable)
    // Use https:// explicitly to avoid protocol issues
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

/**
 * Load a PDF document from a Uint8Array or ArrayBuffer
 */
export async function loadPdfDocument(data: Uint8Array | ArrayBuffer): Promise<any> {
  const pdfjsLib = await loadPdfJs();
  
  const loadingTask = pdfjsLib.getDocument({
    data: data,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/cmaps/',
    cMapPacked: true,
  });
  
  return await loadingTask.promise;
}

/**
 * Extract text content from all pages of a PDF document
 */
export async function extractTextFromPdf(
  pdfDocument: any
): Promise<PageTextContent[]> {
  const pageContents: PageTextContent[] = [];
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Combine all text items into a single string
    let fullText = '';
    const items: TextItem[] = [];
    
    for (const item of textContent.items) {
      if ('str' in item) {
        items.push({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height,
          dir: item.dir || 'ltr',
          fontName: item.fontName || '',
        });
        fullText += item.str + ' ';
      }
    }
    
    pageContents.push({
      page: pageNum,
      text: fullText.trim(),
      items,
    });
  }
  
  return pageContents;
}

/**
 * Get the viewport for a specific page at a given scale
 */
export async function getPageViewport(
  pdfDocument: any,
  pageNum: number,
  scale: number = 1.0
): Promise<any> {
  const page = await pdfDocument.getPage(pageNum);
  return page.getViewport({ scale });
}

/**
 * Render a PDF page to a canvas
 */
export async function renderPageToCanvas(
  pdfDocument: any,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<void> {
  const page = await pdfDocument.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
}

/**
 * Get text items with their positions for a specific page
 */
export async function getTextItemsWithPositions(
  pdfDocument: any,
  pageNum: number,
  scale: number = 1.0
): Promise<{
  items: Array<{
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    transform: number[];
  }>;
  viewport: any;
}> {
  const page = await pdfDocument.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const textContent = await page.getTextContent();
  
  const items = textContent.items
    .filter((item: any) => 'str' in item && item.str.trim())
    .map((item: any) => {
      // Transform coordinates from PDF space to viewport space
      const tx = item.transform[4];
      const ty = item.transform[5];
      
      // Convert to viewport coordinates
      const [x, y] = viewport.convertToViewportPoint(tx, ty);
      
      // Calculate dimensions
      const fontSize = Math.sqrt(
        item.transform[0] * item.transform[0] + 
        item.transform[1] * item.transform[1]
      );
      
      return {
        str: item.str,
        x,
        y: y - (fontSize * scale), // Adjust for baseline
        width: item.width * scale,
        height: fontSize * scale,
        transform: item.transform,
      };
    });
  
  return { items, viewport };
}
