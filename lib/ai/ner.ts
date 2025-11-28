// NER Processing with Transformers.js
// This module handles Named Entity Recognition using client-side AI models

import type { Entity, EntityType } from '@/types';

// Lazy load transformers.js to avoid SSR issues
let pipeline: any = null;
let nerPipeline: any = null;
let initError: Error | null = null;
let isInitializing = false;

async function loadPipeline() {
  if (initError) {
    throw initError;
  }
  
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (initError) throw initError;
    if (pipeline) return pipeline;
  }
  
  if (!pipeline) {
    isInitializing = true;
    try {
      // Dynamically import transformers with specific import path for web-only build
      const { pipeline: pipelineFn, env } = await import('@xenova/transformers');
      
      // CRITICAL: Configure environment BEFORE any model loading
      // Force web/WASM backend only - completely disable Node.js backend attempts
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      
      // Configure WASM backend settings
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
      }
      
      pipeline = pipelineFn;
      isInitializing = false;
    } catch (error) {
      isInitializing = false;
      // Only log if it's not the onnxruntime-node error (which is expected in browser)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('onnxruntime-node')) {
        console.error('Failed to load transformers.js:', error);
      }
      initError = error instanceof Error ? error : new Error('Failed to load transformers.js');
      throw initError;
    }
  }
  return pipeline;
}

async function getNERPipeline() {
  if (!nerPipeline) {
    const pipelineFn = await loadPipeline();
    // Use quantized model for faster loading and lower memory usage
    nerPipeline = await pipelineFn('token-classification', 'Xenova/bert-base-NER', {
      quantized: true,
    });
  }
  return nerPipeline;
}

// Map NER model labels to our entity types
const LABEL_MAP: Record<string, EntityType> = {
  'B-PER': 'PER',
  'I-PER': 'PER',
  'B-LOC': 'LOC',
  'I-LOC': 'LOC',
  'B-ORG': 'ORG',
  'I-ORG': 'ORG',
  'B-MISC': 'MISC',
  'I-MISC': 'MISC',
};

interface NERResult {
  entity: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

/**
 * Process text with NER model to detect entities
 */
export async function processTextWithNER(
  text: string,
  page: number
): Promise<Omit<Entity, 'id'>[]> {
  try {
    const ner = await getNERPipeline();
    const results: NERResult[] = await ner(text);
    
    // Group consecutive tokens into entities
    const entities: Omit<Entity, 'id'>[] = [];
    let currentEntity: {
      text: string;
      type: EntityType;
      startIndex: number;
      endIndex: number;
      scores: number[];
    } | null = null;

    for (const result of results) {
      const entityType = LABEL_MAP[result.entity];
      if (!entityType) continue;

      const isBeginning = result.entity.startsWith('B-');
      
      if (isBeginning || !currentEntity || currentEntity.type !== entityType) {
        // Save previous entity
        if (currentEntity) {
          entities.push({
            text: currentEntity.text.trim(),
            type: currentEntity.type,
            page,
            startIndex: currentEntity.startIndex,
            endIndex: currentEntity.endIndex,
            confidence: currentEntity.scores.reduce((a, b) => a + b, 0) / currentEntity.scores.length,
            source: 'ai',
          });
        }
        
        // Start new entity
        currentEntity = {
          text: result.word.replace(/^##/, ''),
          type: entityType,
          startIndex: result.start,
          endIndex: result.end,
          scores: [result.score],
        };
      } else {
        // Continue current entity
        const separator = result.word.startsWith('##') ? '' : ' ';
        currentEntity.text += separator + result.word.replace(/^##/, '');
        currentEntity.endIndex = result.end;
        currentEntity.scores.push(result.score);
      }
    }

    // Don't forget the last entity
    if (currentEntity) {
      entities.push({
        text: currentEntity.text.trim(),
        type: currentEntity.type,
        page,
        startIndex: currentEntity.startIndex,
        endIndex: currentEntity.endIndex,
        confidence: currentEntity.scores.reduce((a, b) => a + b, 0) / currentEntity.scores.length,
        source: 'ai',
      });
    }

    // Filter out very short or low-confidence entities
    return entities.filter(
      (e) => e.text.length >= 2 && e.confidence >= 0.5
    );
  } catch (error) {
    // Suppress onnxruntime-node errors as they're expected in browser environment
    // The app falls back to regex-based detection which works fine
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('onnxruntime-node')) {
      console.error('NER processing error:', error);
    }
    return [];
  }
}

// Regex patterns for structured PII
const REGEX_PATTERNS: { type: EntityType; pattern: RegExp; name: string }[] = [
  {
    type: 'EMAIL',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    name: 'Email',
  },
  {
    type: 'PHONE',
    pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    name: 'Phone',
  },
  {
    type: 'SSN',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    name: 'SSN',
  },
  {
    type: 'DATE',
    pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
    name: 'Date',
  },
  {
    type: 'CREDIT_CARD',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    name: 'Credit Card',
  },
  {
    type: 'IP_ADDRESS',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    name: 'IP Address',
  },
];

/**
 * Process text with regex patterns to detect structured PII
 */
export function processTextWithRegex(
  text: string,
  page: number
): Omit<Entity, 'id'>[] {
  const entities: Omit<Entity, 'id'>[] = [];

  for (const { type, pattern, name } of REGEX_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type,
        page,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 1.0, // Regex matches are exact
        source: 'regex',
      });
    }
  }

  return entities;
}

/**
 * Process text with custom regex patterns
 */
export function processTextWithCustomPatterns(
  text: string,
  page: number,
  patterns: { pattern: string; enabled: boolean }[]
): Omit<Entity, 'id'>[] {
  const entities: Omit<Entity, 'id'>[] = [];

  for (const { pattern: patternStr, enabled } of patterns) {
    if (!enabled) continue;
    
    try {
      const pattern = new RegExp(patternStr, 'g');
      let match: RegExpExecArray | null;
      
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'CUSTOM',
          page,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 1.0,
          source: 'regex',
        });
      }
    } catch (error) {
      console.error('Invalid custom pattern:', patternStr, error);
    }
  }

  return entities;
}

/**
 * Merge entities from different sources, removing duplicates
 */
export function mergeEntities(
  ...entityArrays: Omit<Entity, 'id'>[][]
): Omit<Entity, 'id'>[] {
  const allEntities = entityArrays.flat();
  
  // Sort by position
  allEntities.sort((a, b) => a.startIndex - b.startIndex);
  
  // Remove overlapping entities, keeping higher confidence ones
  const merged: Omit<Entity, 'id'>[] = [];
  
  for (const entity of allEntities) {
    const overlapping = merged.find(
      (e) => 
        e.page === entity.page &&
        ((entity.startIndex >= e.startIndex && entity.startIndex < e.endIndex) ||
         (entity.endIndex > e.startIndex && entity.endIndex <= e.endIndex) ||
         (entity.startIndex <= e.startIndex && entity.endIndex >= e.endIndex))
    );
    
    if (overlapping) {
      // Keep the one with higher confidence or the longer one
      if (entity.confidence > overlapping.confidence || 
          (entity.confidence === overlapping.confidence && entity.text.length > overlapping.text.length)) {
        const index = merged.indexOf(overlapping);
        merged[index] = entity;
      }
    } else {
      merged.push(entity);
    }
  }
  
  return merged;
}

/**
 * Preload the NER model in the background
 */
export async function preloadNERModel(): Promise<void> {
  try {
    await getNERPipeline();
  } catch (error) {
    console.error('Failed to preload NER model:', error);
  }
}
