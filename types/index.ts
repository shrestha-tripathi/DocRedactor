// Type definitions for DocRedactor

export type EntityType = 
  | 'PER' 
  | 'LOC' 
  | 'ORG' 
  | 'MISC' 
  | 'EMAIL' 
  | 'PHONE' 
  | 'SSN' 
  | 'DATE' 
  | 'CREDIT_CARD'
  | 'IP_ADDRESS'
  | 'CUSTOM';

export type ProcessingStage = 
  | 'idle' 
  | 'loading' 
  | 'extracting' 
  | 'analyzing' 
  | 'mapping' 
  | 'ready' 
  | 'applying' 
  | 'complete'
  | 'error';

export type RedactionStatus = 'pending' | 'confirmed' | 'rejected';

export interface Entity {
  id: string;
  text: string;
  type: EntityType;
  page: number;
  startIndex: number;
  endIndex: number;
  confidence: number;
  source: 'ai' | 'regex' | 'manual';
}

export interface RedactionBox {
  id: string;
  entityId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: RedactionStatus;
}

export interface CustomPattern {
  id: string;
  name: string;
  pattern: string;
  type: 'CUSTOM';
  enabled: boolean;
}

export interface PageTextContent {
  page: number;
  text: string;
  items: TextItem[];
}

export interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
  fontName: string;
}

export interface TierLimits {
  maxPages: number;
  maxDocuments: number;
  watermark: boolean;
  maxCustomPatterns: number;
}

export interface ProcessingProgress {
  stage: ProcessingStage;
  currentPage: number;
  totalPages: number;
  message: string;
}

export interface EntityTypeConfig {
  type: EntityType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  enabled: boolean;
}

export const ENTITY_TYPE_CONFIGS: Record<EntityType, Omit<EntityTypeConfig, 'enabled'>> = {
  PER: {
    type: 'PER',
    label: 'Person',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
  LOC: {
    type: 'LOC',
    label: 'Location',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  ORG: {
    type: 'ORG',
    label: 'Organization',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  MISC: {
    type: 'MISC',
    label: 'Miscellaneous',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  EMAIL: {
    type: 'EMAIL',
    label: 'Email',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  PHONE: {
    type: 'PHONE',
    label: 'Phone',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
  },
  SSN: {
    type: 'SSN',
    label: 'SSN',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
  },
  DATE: {
    type: 'DATE',
    label: 'Date',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
  },
  CREDIT_CARD: {
    type: 'CREDIT_CARD',
    label: 'Credit Card',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  IP_ADDRESS: {
    type: 'IP_ADDRESS',
    label: 'IP Address',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-300',
  },
  CUSTOM: {
    type: 'CUSTOM',
    label: 'Custom',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
};

// Entity type colors for canvas rendering (RGB values)
export const ENTITY_COLORS: Record<EntityType, { fill: string; stroke: string }> = {
  PER: { fill: 'rgba(254, 202, 202, 0.5)', stroke: 'rgb(239, 68, 68)' },
  LOC: { fill: 'rgba(187, 247, 208, 0.5)', stroke: 'rgb(34, 197, 94)' },
  ORG: { fill: 'rgba(191, 219, 254, 0.5)', stroke: 'rgb(59, 130, 246)' },
  MISC: { fill: 'rgba(233, 213, 255, 0.5)', stroke: 'rgb(168, 85, 247)' },
  EMAIL: { fill: 'rgba(254, 215, 170, 0.5)', stroke: 'rgb(249, 115, 22)' },
  PHONE: { fill: 'rgba(153, 246, 228, 0.5)', stroke: 'rgb(20, 184, 166)' },
  SSN: { fill: 'rgba(251, 207, 232, 0.5)', stroke: 'rgb(236, 72, 153)' },
  DATE: { fill: 'rgba(199, 210, 254, 0.5)', stroke: 'rgb(99, 102, 241)' },
  CREDIT_CARD: { fill: 'rgba(254, 240, 138, 0.5)', stroke: 'rgb(234, 179, 8)' },
  IP_ADDRESS: { fill: 'rgba(165, 243, 252, 0.5)', stroke: 'rgb(6, 182, 212)' },
  CUSTOM: { fill: 'rgba(229, 231, 235, 0.5)', stroke: 'rgb(107, 114, 128)' },
};
