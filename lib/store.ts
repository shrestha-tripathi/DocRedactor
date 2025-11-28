import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useMemo } from 'react';
import type { 
  Entity, 
  RedactionBox, 
  CustomPattern, 
  PageTextContent, 
  ProcessingStage,
  EntityType,
  TierLimits 
} from '@/types';

// Free tier limits
const FREE_TIER: TierLimits = {
  maxPages: 50,
  maxDocuments: 100,
  watermark: false,
  maxCustomPatterns: 10,
};

interface DocumentState {
  // File
  file: File | null;
  fileName: string;
  fileBytes: Uint8Array | null;  // Store as Uint8Array to prevent detachment
  
  // PDF state (we'll store minimal info, actual PDF doc handled separately)
  pageCount: number;
  currentPage: number;
  scale: number;
  
  // Text content
  textContent: PageTextContent[];
  
  // Entities and redactions
  detectedEntities: Entity[];
  redactionBoxes: RedactionBox[];
  
  // UI state
  isProcessing: boolean;
  processingStage: ProcessingStage;
  processingMessage: string;
  processingProgress: number;
  selectedEntityTypes: EntityType[];
  hoveredEntityId: string | null;
  selectedEntityId: string | null;
  
  // Settings
  customPatterns: CustomPattern[];
  
  // Tier
  tierLimits: TierLimits;
  documentsProcessed: number;
  
  // Error state
  error: string | null;
}

interface DocumentActions {
  // File actions
  setFile: (file: File) => Promise<void>;
  clearDocument: () => void;
  
  // PDF navigation
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  setPageCount: (count: number) => void;
  
  // Text content
  setTextContent: (content: PageTextContent[]) => void;
  
  // Entities
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  addEntities: (entities: Omit<Entity, 'id'>[]) => void;
  setEntitiesWithIds: (entities: Entity[]) => void;
  removeEntity: (id: string) => void;
  clearEntities: () => void;
  
  // Redaction boxes
  addRedactionBox: (box: Omit<RedactionBox, 'id'>) => void;
  addRedactionBoxes: (boxes: Omit<RedactionBox, 'id'>[]) => void;
  updateRedactionStatus: (id: string, status: 'pending' | 'confirmed' | 'rejected') => void;
  updateAllRedactionStatus: (status: 'pending' | 'confirmed' | 'rejected') => void;
  confirmAllVisible: () => void;
  rejectAllVisible: () => void;
  confirmAllByType: (type: EntityType) => void;
  rejectAllByType: (type: EntityType) => void;
  removeRedactionBox: (id: string) => void;
  clearRedactionBoxes: () => void;
  
  // UI state
  setProcessingStage: (stage: ProcessingStage, message?: string, progress?: number) => void;
  setSelectedEntityTypes: (types: EntityType[]) => void;
  toggleEntityType: (type: EntityType) => void;
  setHoveredEntityId: (id: string | null) => void;
  setSelectedEntityId: (id: string | null) => void;
  
  // Custom patterns
  addCustomPattern: (pattern: Omit<CustomPattern, 'id'>) => void;
  updateCustomPattern: (id: string, pattern: Partial<CustomPattern>) => void;
  removeCustomPattern: (id: string) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  
  // Tier checking
  checkTierLimit: (pageCount: number) => boolean;
}

const initialState: DocumentState = {
  file: null,
  fileName: '',
  fileBytes: null,
  pageCount: 0,
  currentPage: 1,
  scale: 1.0,
  textContent: [],
  detectedEntities: [],
  redactionBoxes: [],
  isProcessing: false,
  processingStage: 'idle',
  processingMessage: '',
  processingProgress: 0,
  selectedEntityTypes: ['PER', 'LOC', 'ORG', 'EMAIL', 'PHONE', 'SSN'],
  hoveredEntityId: null,
  selectedEntityId: null,
  customPatterns: [],
  tierLimits: FREE_TIER,
  documentsProcessed: 0,
  error: null,
};

export const useDocumentStore = create<DocumentState & DocumentActions>((set, get) => ({
  ...initialState,

  setFile: async (file: File) => {
    set({ 
      file, 
      fileName: file.name,
      isProcessing: true,
      processingStage: 'loading',
      processingMessage: 'Reading file...',
      error: null,
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Store as Uint8Array to prevent ArrayBuffer detachment issues
      const fileBytes = new Uint8Array(arrayBuffer);
      set({ 
        fileBytes,
        documentsProcessed: get().documentsProcessed + 1,
      });
    } catch (error) {
      set({ 
        error: 'Failed to read file',
        isProcessing: false,
        processingStage: 'error',
      });
    }
  },

  clearDocument: () => {
    set({
      ...initialState,
      documentsProcessed: get().documentsProcessed,
      customPatterns: get().customPatterns,
    });
  },

  setCurrentPage: (page: number) => {
    const { pageCount } = get();
    if (page >= 1 && page <= pageCount) {
      set({ currentPage: page });
    }
  },

  setScale: (scale: number) => {
    if (scale >= 0.25 && scale <= 3.0) {
      set({ scale });
    }
  },

  setPageCount: (count: number) => {
    set({ pageCount: count });
  },

  setTextContent: (content: PageTextContent[]) => {
    set({ textContent: content });
  },

  addEntity: (entity: Omit<Entity, 'id'>) => {
    const newEntity: Entity = { ...entity, id: uuidv4() };
    set((state) => ({
      detectedEntities: [...state.detectedEntities, newEntity],
    }));
  },

  addEntities: (entities: Omit<Entity, 'id'>[]) => {
    const newEntities: Entity[] = entities.map((e) => ({ ...e, id: uuidv4() }));
    set((state) => ({
      detectedEntities: [...state.detectedEntities, ...newEntities],
    }));
  },

  setEntitiesWithIds: (entities: Entity[]) => {
    set({ detectedEntities: entities });
  },

  removeEntity: (id: string) => {
    set((state) => ({
      detectedEntities: state.detectedEntities.filter((e) => e.id !== id),
      redactionBoxes: state.redactionBoxes.filter((b) => b.entityId !== id),
    }));
  },

  clearEntities: () => {
    set({ detectedEntities: [], redactionBoxes: [] });
  },

  addRedactionBox: (box: Omit<RedactionBox, 'id'>) => {
    const newBox: RedactionBox = { ...box, id: uuidv4() };
    set((state) => ({
      redactionBoxes: [...state.redactionBoxes, newBox],
    }));
  },

  addRedactionBoxes: (boxes: Omit<RedactionBox, 'id'>[]) => {
    const newBoxes: RedactionBox[] = boxes.map((b) => ({ ...b, id: uuidv4() }));
    set((state) => ({
      redactionBoxes: [...state.redactionBoxes, ...newBoxes],
    }));
  },

  updateRedactionStatus: (id: string, status: 'pending' | 'confirmed' | 'rejected') => {
    set((state) => ({
      redactionBoxes: state.redactionBoxes.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    }));
  },

  updateAllRedactionStatus: (status: 'pending' | 'confirmed' | 'rejected') => {
    set((state) => ({
      redactionBoxes: state.redactionBoxes.map((b) => ({ ...b, status })),
    }));
  },

  confirmAllVisible: () => {
    const { detectedEntities, redactionBoxes, selectedEntityTypes } = get();
    // Get entity IDs that match the current filter
    const visibleEntityIds = new Set(
      detectedEntities
        .filter((e) => selectedEntityTypes.includes(e.type))
        .map((e) => e.id)
    );
    
    set({
      redactionBoxes: redactionBoxes.map((b) =>
        visibleEntityIds.has(b.entityId) && b.status === 'pending'
          ? { ...b, status: 'confirmed' }
          : b
      ),
    });
  },

  rejectAllVisible: () => {
    const { detectedEntities, redactionBoxes, selectedEntityTypes } = get();
    // Get entity IDs that match the current filter
    const visibleEntityIds = new Set(
      detectedEntities
        .filter((e) => selectedEntityTypes.includes(e.type))
        .map((e) => e.id)
    );
    
    set({
      redactionBoxes: redactionBoxes.map((b) =>
        visibleEntityIds.has(b.entityId) && b.status === 'pending'
          ? { ...b, status: 'rejected' }
          : b
      ),
    });
  },

  confirmAllByType: (type: EntityType) => {
    const { detectedEntities, redactionBoxes } = get();
    const entityIds = detectedEntities
      .filter((e) => e.type === type)
      .map((e) => e.id);
    
    set({
      redactionBoxes: redactionBoxes.map((b) =>
        entityIds.includes(b.entityId) ? { ...b, status: 'confirmed' } : b
      ),
    });
  },

  rejectAllByType: (type: EntityType) => {
    const { detectedEntities, redactionBoxes } = get();
    const entityIds = detectedEntities
      .filter((e) => e.type === type)
      .map((e) => e.id);
    
    set({
      redactionBoxes: redactionBoxes.map((b) =>
        entityIds.includes(b.entityId) ? { ...b, status: 'rejected' } : b
      ),
    });
  },

  removeRedactionBox: (id: string) => {
    set((state) => ({
      redactionBoxes: state.redactionBoxes.filter((b) => b.id !== id),
    }));
  },

  clearRedactionBoxes: () => {
    set({ redactionBoxes: [] });
  },

  setProcessingStage: (stage: ProcessingStage, message?: string, progress?: number) => {
    set({
      processingStage: stage,
      isProcessing: stage !== 'idle' && stage !== 'ready' && stage !== 'complete' && stage !== 'error',
      processingMessage: message || '',
      processingProgress: progress || 0,
    });
  },

  setSelectedEntityTypes: (types: EntityType[]) => {
    set({ selectedEntityTypes: types });
  },

  toggleEntityType: (type: EntityType) => {
    const { selectedEntityTypes } = get();
    if (selectedEntityTypes.includes(type)) {
      set({ selectedEntityTypes: selectedEntityTypes.filter((t) => t !== type) });
    } else {
      set({ selectedEntityTypes: [...selectedEntityTypes, type] });
    }
  },

  setHoveredEntityId: (id: string | null) => {
    set({ hoveredEntityId: id });
  },

  setSelectedEntityId: (id: string | null) => {
    set({ selectedEntityId: id });
  },

  addCustomPattern: (pattern: Omit<CustomPattern, 'id'>) => {
    const { customPatterns, tierLimits } = get();
    if (customPatterns.length >= tierLimits.maxCustomPatterns) {
      set({ error: `Free tier allows only ${tierLimits.maxCustomPatterns} custom patterns` });
      return;
    }
    const newPattern: CustomPattern = { ...pattern, id: uuidv4() };
    set((state) => ({
      customPatterns: [...state.customPatterns, newPattern],
    }));
  },

  updateCustomPattern: (id: string, pattern: Partial<CustomPattern>) => {
    set((state) => ({
      customPatterns: state.customPatterns.map((p) =>
        p.id === id ? { ...p, ...pattern } : p
      ),
    }));
  },

  removeCustomPattern: (id: string) => {
    set((state) => ({
      customPatterns: state.customPatterns.filter((p) => p.id !== id),
    }));
  },

  setError: (error: string | null) => {
    set({ error });
  },

  checkTierLimit: (pageCount: number) => {
    const { tierLimits } = get();
    return pageCount <= tierLimits.maxPages;
  },
}));

// Selector hooks for common operations - use useMemo to prevent creating new arrays
export const useCurrentPageEntities = () => {
  const currentPage = useDocumentStore((state) => state.currentPage);
  const detectedEntities = useDocumentStore((state) => state.detectedEntities);
  const selectedEntityTypes = useDocumentStore((state) => state.selectedEntityTypes);
  
  return useMemo(() => 
    detectedEntities.filter(
      (e) => e.page === currentPage && selectedEntityTypes.includes(e.type)
    ),
    [detectedEntities, currentPage, selectedEntityTypes]
  );
};

export const useCurrentPageRedactions = () => {
  const currentPage = useDocumentStore((state) => state.currentPage);
  const redactionBoxes = useDocumentStore((state) => state.redactionBoxes);
  const detectedEntities = useDocumentStore((state) => state.detectedEntities);
  const selectedEntityTypes = useDocumentStore((state) => state.selectedEntityTypes);
  
  return useMemo(() => {
    const visibleEntityIds = new Set(
      detectedEntities
        .filter((e) => selectedEntityTypes.includes(e.type))
        .map((e) => e.id)
    );
    
    return redactionBoxes.filter(
      (b) => b.page === currentPage && visibleEntityIds.has(b.entityId)
    );
  }, [redactionBoxes, currentPage, detectedEntities, selectedEntityTypes]);
};

export const useEntityCounts = () => {
  const detectedEntities = useDocumentStore((state) => state.detectedEntities);
  
  return useMemo(() => {
    const counts: Record<string, number> = {};
    detectedEntities.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [detectedEntities]);
};

export const useConfirmedRedactionCount = () => {
  const redactionBoxes = useDocumentStore((state) => state.redactionBoxes);
  return useMemo(() => 
    redactionBoxes.filter((b) => b.status === 'confirmed').length,
    [redactionBoxes]
  );
};
