sti# DocRedactor

Privacy-First Document Redaction SaaS - A Next.js PWA that automatically detects and redacts PII from documents entirely client-side.

## Features

- 🔒 **100% Client-Side Processing** - Documents never leave your device
- 🤖 **AI-Powered Detection** - Uses transformers.js for Named Entity Recognition
- 📄 **PDF Support** - View, annotate, and redact PDF documents
- 🎯 **Smart Detection** - Identifies names, locations, organizations, emails, phones, SSNs, and more
- ✏️ **Custom Patterns** - Add your own regex patterns for specific data formats
- 📱 **PWA Ready** - Works offline and can be installed as an app
- 🏢 **Enterprise Ready** - Built for GDPR/HIPAA compliance workflows

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build static export
npm run build

# The output will be in the 'out' directory
```

## Tech Stack

- **Framework**: Next.js 14 (App Router, Static Export)
- **AI/ML**: transformers.js (ONNX Runtime Web)
- **PDF**: pdf.js (rendering) + pdf-lib (modification)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Icons**: Lucide React

## How It Works

1. **Upload** - Drag and drop a PDF or text file
2. **Extract** - pdf.js extracts text content from the document
3. **Analyze** - AI models (BERT NER) identify entities + regex patterns detect structured data
4. **Map** - Entity positions are mapped to PDF coordinates
5. **Review** - Confirm or reject detected entities in the sidebar
6. **Export** - Apply redactions and download the sanitized document

## AI Model

The app uses `Xenova/bert-base-NER` - a quantized BERT model for Named Entity Recognition. The model is automatically downloaded from Hugging Face CDN on first use and cached in the browser.

Detected entity types:
- **PER** - Person names
- **LOC** - Locations
- **ORG** - Organizations
- **MISC** - Miscellaneous entities

Additional regex patterns detect:
- Email addresses
- Phone numbers
- Social Security Numbers
- Dates
- Credit card numbers
- IP addresses

## Project Structure

```
DocRedactor/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page with upload
│   └── editor/page.tsx    # Main editor view
├── components/
│   ├── common/            # Shared components
│   ├── editor/            # PDF viewer and overlay
│   ├── sidebar/           # Entity list and controls
│   └── upload/            # File upload components
├── lib/
│   ├── ai/ner.ts          # AI model integration
│   ├── pdf/               # PDF utilities
│   └── store.ts           # Zustand state management
├── types/                 # TypeScript definitions
└── public/                # Static assets
```

## Freemium Model

The app includes hooks for a freemium tier:
- **Free**: 3 pages per document, 5 documents per session, watermarked output
- **Pro** (future): Unlimited pages, no watermark, batch processing

## Privacy & Security

- Documents are processed entirely in the browser using WebAssembly
- No data is sent to any server
- AI models are loaded from CDN and cached locally
- All processing happens in memory and is cleared after use

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

---

Built with ❤️ for privacy-conscious organizations
