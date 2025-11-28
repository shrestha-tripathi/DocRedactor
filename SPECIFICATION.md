# DocRedactor - Privacy-First Redaction & Compliance SaaS

## Specification Document v1.0

---

## 1. Executive Summary

DocRedactor is a client-side SaaS application that enables users to automatically detect and redact Personally Identifiable Information (PII) from PDF documents. All processing occurs locally in the browser using WebAssembly and client-side AI models, ensuring sensitive documents never leave the user's device.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Environment                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Next.js    │  │  PDF.js      │  │   Transformers.js    │  │
│  │   App Router │  │  (Render)    │  │   (NER/WASM)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                    │               │
│         └──────────────────┼────────────────────┘               │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                    Zustand Store                          │  │
│  │  - Document State    - Redaction List    - UI State       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                     pdf-lib                               │  │
│  │             (Modification & Flattening)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                     ┌──────▼──────┐                             │
│                     │  Download   │                             │
│                     │  (Blob API) │                             │
│                     └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | Static site generation, routing |
| Styling | Tailwind CSS | Enterprise UI design |
| State | Zustand | Global state management |
| PDF Render | pdf.js | Client-side PDF rendering |
| PDF Edit | pdf-lib | PDF modification & flattening |
| AI/ML | transformers.js | Client-side NER inference |
| PWA | next-pwa | Service worker, offline support |
| Icons | Lucide React | UI icons |

---

## 3. AI Model Selection

### 3.1 Primary NER Model

**Recommendation**: `Xenova/bert-base-NER` (Quantized ONNX)

| Model | Size | Accuracy | Load Time | Inference/Page |
|-------|------|----------|-----------|----------------|
| bert-base-NER (FP32) | ~440MB | High | ~15s | ~2s |
| **bert-base-NER (INT8)** | ~110MB | High | ~4s | ~0.8s |
| distilbert-NER (INT8) | ~65MB | Medium | ~2s | ~0.4s |

**Rationale**: The INT8 quantized BERT model provides the best balance of accuracy and performance. For devices with limited memory, we can fall back to DistilBERT.

### 3.2 Entity Types Supported

| Entity | Label | Examples |
|--------|-------|----------|
| Person | PER | "John Smith", "Dr. Jane Doe" |
| Location | LOC | "New York", "123 Main St" |
| Organization | ORG | "Acme Corp", "FBI" |
| Miscellaneous | MISC | Product names, events |

### 3.3 Regex-Based Detection (Supplementary)

For structured PII not covered by NER:

```javascript
const REGEX_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};
```

---

## 4. Data Flow

### 4.1 Document Processing Pipeline

```
┌───────────────────────────────────────────────────────────────┐
│ 1. FILE INPUT                                                  │
│    User drops PDF → FileReader (ArrayBuffer)                   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. TEXT EXTRACTION                                             │
│    pdf.js → getTextContent() per page                          │
│    Output: Array<{page, text, items: TextItem[]}>              │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. NER PROCESSING (transformers.js)                            │
│    Input: Extracted text                                       │
│    Output: Array<{entity, type, start, end, score}>            │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. REGEX PROCESSING                                            │
│    Apply email, phone, SSN patterns                            │
│    Output: Merged entity list with positions                   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 5. POSITION MAPPING                                            │
│    Map text positions → PDF coordinates (viewport)             │
│    Output: Array<RedactionBox>                                 │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 6. USER REVIEW                                                 │
│    Display suggestions, allow confirm/reject/add               │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 7. REDACTION APPLICATION (pdf-lib)                             │
│    Remove text under boxes, draw black rectangles              │
│    Flatten annotations                                         │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│ 8. OUTPUT                                                      │
│    Generate new PDF → Blob → Download                          │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 State Schema (Zustand)

```typescript
interface DocumentState {
  // File
  file: File | null;
  fileName: string;
  arrayBuffer: ArrayBuffer | null;
  
  // PDF
  pdfDocument: PDFDocumentProxy | null;
  pageCount: number;
  currentPage: number;
  scale: number;
  
  // Text
  textContent: PageTextContent[];
  
  // Redactions
  detectedEntities: Entity[];
  redactionBoxes: RedactionBox[];
  
  // UI
  isProcessing: boolean;
  processingStage: ProcessingStage;
  selectedEntityTypes: EntityType[];
  
  // Settings
  customPatterns: CustomPattern[];
}

interface Entity {
  id: string;
  text: string;
  type: EntityType;
  page: number;
  startIndex: number;
  endIndex: number;
  confidence: number;
  source: 'ai' | 'regex' | 'manual';
}

interface RedactionBox {
  id: string;
  entityId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'pending' | 'confirmed' | 'rejected';
}

type EntityType = 'PER' | 'LOC' | 'ORG' | 'MISC' | 'EMAIL' | 'PHONE' | 'SSN' | 'DATE' | 'CUSTOM';

type ProcessingStage = 'idle' | 'loading' | 'extracting' | 'analyzing' | 'mapping' | 'ready' | 'applying' | 'complete';
```

---

## 5. UI/UX Specification

### 5.1 Color Palette (Enterprise Theme)

```css
:root {
  /* Primary */
  --navy-900: #0f172a;
  --navy-800: #1e293b;
  --navy-700: #334155;
  --navy-600: #475569;
  
  /* Accent */
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  
  /* Status */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  
  /* Neutral */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
}
```

### 5.2 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER                                                               │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [Logo] DocRedactor          [Processing: Local ✓]     [Export]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├───────────────────┬─────────────────────────────────────────────────┤
│ SIDEBAR (280px)   │ MAIN CANVAS                                      │
│ ┌───────────────┐ │ ┌─────────────────────────────────────────────┐ │
│ │ Entity Filter │ │ │                                             │ │
│ │ ☑ Names (12)  │ │ │                                             │ │
│ │ ☑ Emails (3)  │ │ │         PDF Page Render                     │ │
│ │ ☑ Phones (2)  │ │ │         + Redaction Overlay                 │ │
│ │ ☐ Dates (8)   │ │ │                                             │ │
│ ├───────────────┤ │ │                                             │ │
│ │ Entity List   │ │ │                                             │ │
│ │ ┌───────────┐ │ │ │                                             │ │
│ │ │ John Doe  │ │ │ └─────────────────────────────────────────────┘ │
│ │ │ PER | p.1 │ │ │ ┌─────────────────────────────────────────────┐ │
│ │ │ [✓] [✗]   │ │ │ │ [<] Page 1 of 5 [>]    [Zoom -][100%][+]   │ │
│ │ └───────────┘ │ │ └─────────────────────────────────────────────┘ │
│ │ ┌───────────┐ │ │                                                 │
│ │ │ jane@...  │ │ │                                                 │
│ │ │ EMAIL|p.2 │ │ │                                                 │
│ │ │ [✓] [✗]   │ │ │                                                 │
│ │ └───────────┘ │ │                                                 │
│ ├───────────────┤ │                                                 │
│ │ Custom Rules  │ │                                                 │
│ │ [+ Add Regex] │ │                                                 │
│ └───────────────┘ │                                                 │
└───────────────────┴─────────────────────────────────────────────────┘
```

### 5.3 UI States

| State | Description | UI Feedback |
|-------|-------------|-------------|
| **Empty** | No document loaded | Drop zone with instructions |
| **Loading** | File being read | Progress bar, "Reading file..." |
| **Extracting** | pdf.js extracting text | "Extracting text from X pages..." |
| **Analyzing** | NER model processing | "AI analyzing for PII... (Page X/Y)" |
| **Mapping** | Calculating positions | "Mapping entities to document..." |
| **Ready** | Review mode | Full editor with sidebar |
| **Applying** | Generating redacted PDF | "Applying redactions..." |
| **Complete** | PDF ready for download | Success message, download button |

### 5.4 Privacy Indicator Component

Always visible badge showing:
```
🔒 All processing happens locally on your device
   Documents are never uploaded to any server
```

---

## 6. Component Hierarchy

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing/Upload page
└── editor/
    └── page.tsx            # Editor page

components/
├── ui/                     # Reusable UI primitives
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Progress.tsx
│   ├── Checkbox.tsx
│   └── Tooltip.tsx
├── upload/
│   ├── DropZone.tsx        # Drag & drop file input
│   └── FileInfo.tsx        # File metadata display
├── editor/
│   ├── EditorLayout.tsx    # Main editor container
│   ├── PDFViewer.tsx       # pdf.js canvas wrapper
│   ├── RedactionOverlay.tsx # SVG/Canvas overlay for boxes
│   ├── PageControls.tsx    # Navigation & zoom
│   └── ProcessingOverlay.tsx
├── sidebar/
│   ├── Sidebar.tsx         # Container
│   ├── EntityFilter.tsx    # Type checkboxes
│   ├── EntityList.tsx      # Scrollable entity cards
│   ├── EntityCard.tsx      # Individual entity item
│   └── CustomPatterns.tsx  # Regex input
└── common/
    ├── Header.tsx
    ├── PrivacyBadge.tsx
    └── ExportButton.tsx
```

---

## 7. File Structure

```
DocRedactor/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── editor/
│       └── page.tsx
├── components/
│   ├── ui/
│   ├── upload/
│   ├── editor/
│   ├── sidebar/
│   └── common/
├── lib/
│   ├── store.ts            # Zustand store
│   ├── ai/
│   │   ├── ner.ts          # transformers.js wrapper
│   │   ├── patterns.ts     # Regex patterns
│   │   └── entities.ts     # Entity processing utilities
│   ├── pdf/
│   │   ├── reader.ts       # pdf.js text extraction
│   │   ├── renderer.ts     # Page rendering
│   │   ├── coordinates.ts  # Position mapping
│   │   └── redactor.ts     # pdf-lib redaction
│   └── utils/
│       ├── file.ts
│       └── download.ts
├── hooks/
│   ├── useDocument.ts
│   ├── useRedaction.ts
│   └── useAIProcessor.ts
├── types/
│   └── index.ts
├── public/
│   ├── models/             # Downloaded ONNX models (gitignored)
│   └── icons/              # PWA icons
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 8. Freemium Model Implementation

### 8.1 Tier Definitions

| Feature | Free Tier | Pro Tier (Future) |
|---------|-----------|-------------------|
| Pages per document | 3 | Unlimited |
| Documents per session | 5 | Unlimited |
| Watermark on export | Yes | No |
| Custom regex patterns | 2 | Unlimited |
| Batch processing | No | Yes |
| Priority model loading | No | Yes (CDN) |

### 8.2 Implementation

```typescript
// lib/tier.ts
interface TierLimits {
  maxPages: number;
  maxDocuments: number;
  watermark: boolean;
  maxCustomPatterns: number;
}

const FREE_TIER: TierLimits = {
  maxPages: 3,
  maxDocuments: 5,
  watermark: true,
  maxCustomPatterns: 2,
};

// Check in components
function checkTierLimit(pageCount: number): boolean {
  const limits = getCurrentTierLimits();
  if (pageCount > limits.maxPages) {
    showUpgradeModal();
    return false;
  }
  return true;
}
```

---

## 9. PWA Configuration

### 9.1 Service Worker Strategy

```javascript
// next.config.js with next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@xenova/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'ai-models',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});
```

### 9.2 Manifest

```json
{
  "name": "DocRedactor - Privacy-First Redaction",
  "short_name": "DocRedactor",
  "description": "Automatically redact PII from documents - all processing happens locally",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [...]
}
```

---

## 10. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Model Load Time | < 5s | Custom metric |
| NER Processing | < 1s/page | Custom metric |
| PDF Render | < 500ms/page | Custom metric |
| Export Generation | < 3s for 10 pages | Custom metric |

---

## 11. Security Considerations

1. **No Network Requests for Documents**: Documents are NEVER sent to any server
2. **Model Loading**: Models loaded from CDN (jsDelivr) with SRI hashes
3. **Memory Cleanup**: ArrayBuffers cleared after processing
4. **No Persistent Storage of Documents**: Files not stored in IndexedDB/localStorage
5. **CSP Headers**: Strict Content Security Policy in static export

---

## 12. Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 90+ | Full support |
| Safari | 15+ | WebAssembly SIMD may be limited |
| Edge | 90+ | Full support |

---

## 13. Development Phases

### Phase 1: Foundation (Week 1)
- [x] Project setup (Next.js, Tailwind, Zustand)
- [x] Basic UI components
- [x] Drop zone and file reading
- [x] pdf.js integration

### Phase 2: AI Integration (Week 2)
- [ ] transformers.js setup
- [ ] NER model loading and caching
- [ ] Text extraction pipeline
- [ ] Entity detection

### Phase 3: Editor (Week 3)
- [ ] PDF viewer with zoom/pan
- [ ] Redaction overlay rendering
- [ ] Sidebar with entity management
- [ ] Manual drawing tools

### Phase 4: Export & Polish (Week 4)
- [ ] pdf-lib redaction application
- [ ] Flattening implementation
- [ ] PWA configuration
- [ ] Performance optimization
- [ ] Testing and bug fixes

---

## 14. Model Download Instructions

### Automatic (Recommended)
Models are automatically downloaded from Hugging Face CDN via transformers.js on first use. They are cached in the browser's Cache Storage.

### Manual Setup (For Offline Development)
```bash
# Download models to public/models/
npx transformers-cli download Xenova/bert-base-NER --cache-dir ./public/models
```

---

## Appendix A: API Reference

### Zustand Store Actions

```typescript
interface DocumentActions {
  // File
  setFile: (file: File) => Promise<void>;
  clearDocument: () => void;
  
  // Navigation
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  
  // Entities
  addEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  updateEntityStatus: (id: string, status: 'confirmed' | 'rejected') => void;
  
  // Redactions
  confirmRedaction: (id: string) => void;
  rejectRedaction: (id: string) => void;
  addManualRedaction: (box: Omit<RedactionBox, 'id'>) => void;
  
  // Processing
  processDocument: () => Promise<void>;
  applyRedactions: () => Promise<Blob>;
  
  // Custom Patterns
  addCustomPattern: (pattern: CustomPattern) => void;
  removeCustomPattern: (id: string) => void;
}
```

---

*Document Version: 1.0*
*Last Updated: November 28, 2025*
*Author: DocRedactor Development Team*
