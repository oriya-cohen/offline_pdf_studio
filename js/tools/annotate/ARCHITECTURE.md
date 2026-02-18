# Annotation System - Architecture Documentation

## 🎯 Overview

The annotation system has been re-architected to fix critical issues and support multi-language text rendering.

## ✅ Fixed Issues

### 1. **Scribble Export** ✓
- **Problem**: Scribbles were not exporting correctly or disappearing
- **Solution**: 
  - Canvas-to-image conversion for scribbles
  - Proper coordinate transformation (screen → PDF)
  - Fallback to line-by-line drawing if image embedding fails

### 2. **Coordinate Transformation** ✓
- **Problem**: Annotations appeared in wrong positions after export
- **Solution**:
  - Store viewport dimensions in LayerManager
  - Calculate scale factors: `scaleX = pdfWidth / canvasWidth`
  - Apply transformation during export

### 3. **Multi-Language Support** ✓
- **Problem**: Arabic, Hebrew, and other scripts not rendering
- **Solution**:
  - Font loading system with Noto fonts
  - Auto-detection of script type (Arabic, Hebrew, CJK, Latin)
  - RTL (Right-to-Left) text handling
  - Font fallback mechanism

### 4. **Rotation & Resize** ✓
- **Problem**: Rotation and resize not working properly
- **Solution**:
  - Proper transformation matrix handling
  - Rotation handle (orange circle)
  - Scale handle (blue square)
  - Geometry utilities for rotated bounding boxes

## 📁 Architecture

```
js/tools/annotate/
├── annotations/          # Annotation types
│   ├── BaseAnnotation.js
│   ├── TextAnnotation.js
│   └── ScribbleAnnotation.js
├── core/                 # Core managers
│   ├── StateManager.js       # Centralized state
│   ├── HistoryManager.js     # Undo/Redo
│   ├── PDFManager.js         # PDF loading & rendering
│   ├── LayerManager.js       # Canvas layer management
│   └── ExportManager.js      # ✨ NEW: Export with fonts
├── ui/                   # User interaction
│   ├── Toolbar.js
│   └── InteractionManager.js
├── utils/                # Utilities
│   ├── constants.js
│   └── geometry.js           # ✨ ENHANCED: Rotation utils
└── index.js              # Main entry point
```

## 🔧 Core Components

### ExportManager (NEW)
**Purpose**: Handle PDF export with proper coordinate transformation and multi-language support

**Key Features**:
- Font loading and caching
- Script detection (Arabic, Hebrew, CJK, Latin)
- RTL text handling
- Canvas-to-image scribble export
- Coordinate transformation

**Methods**:
```javascript
await exportManager.loadFonts(pdfDoc)
const font = exportManager.detectFont(text)
await exportManager.exportPDF(pdfDocument, annotations, layerManager, scale)
```

### LayerManager (ENHANCED)
**Purpose**: Manage canvas layers for each PDF page

**New Features**:
- Stores viewport dimensions for coordinate transformation
- `getViewport(pageNum)` returns viewport info

### Geometry Utils (ENHANCED)
**Purpose**: Mathematical utilities for transformations

**New Functions**:
```javascript
rotatePoint(px, py, cx, cy, angle)
pointInRotatedRect(px, py, rect, rotation)
getRotatedBounds(x, y, width, height, rotation)
```

## 🌍 Multi-Language Support

### Supported Languages
- ✅ **Latin** (English, French, German, Spanish, etc.)
- ✅ **Arabic** (with RTL support)
- ✅ **Hebrew** (with RTL support)
- ✅ **Cyrillic** (Russian, Ukrainian, etc.)
- ⚠️ **CJK** (Chinese, Japanese, Korean) - requires additional fonts

### Font Files Required
```
assets/fonts/
└── Noto_Sans,Noto_Sans_Arabic,Noto_Serif,Noto_Serif_Hebrew/
    ├── Noto_Sans/
    │   └── NotoSans-Regular.ttf
    ├── Noto_Sans_Arabic/
    │   └── NotoSansArabic-Regular.ttf
    └── Noto_Serif_Hebrew/
        └── NotoSerifHebrew-Regular.ttf
```

### How It Works
1. **Auto-Detection**: Text is analyzed for Unicode ranges
2. **Font Selection**: Appropriate font is selected automatically
3. **RTL Handling**: Arabic/Hebrew text is right-aligned
4. **Fallback**: If font fails to load, uses standard Helvetica

### Adding CJK Support
To add Chinese/Japanese/Korean support:

1. Download Noto CJK fonts:
   - Noto Sans SC (Simplified Chinese)
   - Noto Sans JP (Japanese)
   - Noto Sans KR (Korean)

2. Add to `ExportManager.loadFonts()`:
```javascript
'NotoSansSC': 'assets/fonts/.../NotoSansSC-Regular.ttf',
'NotoSansJP': 'assets/fonts/.../NotoSansJP-Regular.ttf',
'NotoSansKR': 'assets/fonts/.../NotoSansKR-Regular.ttf'
```

3. Update `detectFont()`:
```javascript
// Chinese
if (/[\u4E00-\u9FFF]/.test(text)) {
  return this.fontCache.get('NotoSansSC');
}
// Japanese
if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
  return this.fontCache.get('NotoSansJP');
}
// Korean
if (/[\uAC00-\uD7AF]/.test(text)) {
  return this.fontCache.get('NotoSansKR');
}
```

## 🎨 Annotation Types

### TextAnnotation
- Editable text box
- Rotation handle (orange circle)
- Scale handle (blue square)
- Drag to move
- Multi-language support
- Font selection

### ScribbleAnnotation
- Free-hand drawing
- Smooth curves
- Exports as embedded PNG image
- Fallback to line drawing

## 🔄 Export Pipeline

### Flow
```
1. User clicks "Save"
2. ExportManager.exportPDF() called
3. Load original PDF with pdf-lib
4. Load fonts (Noto Sans, Arabic, Hebrew)
5. For each page:
   a. Get viewport dimensions
   b. Calculate scale factors
   c. For each annotation:
      - Text: Draw with appropriate font
      - Scribble: Convert canvas to PNG, embed
6. Save modified PDF
7. Download to user
```

### Coordinate Transformation
```javascript
// Screen coordinates → PDF coordinates
const scaleX = pdfWidth / viewportWidth;
const scaleY = pdfHeight / viewportHeight;

const pdfX = screenX * scaleX;
const pdfY = pdfHeight - (screenY * scaleY); // Flip Y-axis
```

## 🧪 Testing

### Test Cases
1. **Scribble Export**
   - Draw long scribble
   - Export PDF
   - Verify scribble appears correctly

2. **Text Rotation**
   - Add text annotation
   - Rotate 45°
   - Export PDF
   - Verify rotation preserved

3. **Multi-Language**
   - Add Arabic text: "مرحبا"
   - Add Hebrew text: "שלום"
   - Add English text: "Hello"
   - Export PDF
   - Verify all render correctly

4. **Mixed Content**
   - Add text + scribble on same page
   - Export PDF
   - Verify both appear correctly

5. **Multi-Page**
   - Annotate page 1 and page 3
   - Export PDF
   - Verify annotations on correct pages

## 🚀 Usage

### Initialize
```javascript
import { initAnnotate } from './js/tools/annotate/index.js';

await initAnnotate();
```

### Add Text Annotation
1. Click "Text" tool
2. Double-click on PDF
3. Type text (any language)
4. Drag orange handle to rotate
5. Drag blue handle to scale
6. Drag text to move

### Add Scribble
1. Click "Scribble" tool
2. Click and drag on PDF
3. Release to finish

### Export
1. Click "Save Annotations"
2. PDF downloads with annotations embedded

## 🔧 Configuration

### Constants
```javascript
// js/tools/annotate/utils/constants.js

export const DEFAULTS = {
  SCALE: 1.5,              // PDF render scale
  TEXT_SIZE: 16,           // Default font size
  TEXT_COLOR: '#000000',   // Default text color
  SCRIBBLE_WIDTH: 2,       // Scribble line width
  HANDLE_SIZE: 16,         // Rotation handle size
};
```

## 🐛 Troubleshooting

### Fonts Not Loading
- Check font file paths in `ExportManager.loadFonts()`
- Verify fonts exist in `assets/fonts/`
- Check browser console for errors

### Scribbles Not Exporting
- Ensure canvas is not empty
- Check `exportScribbleAnnotation()` for errors
- Verify PNG embedding is supported

### Wrong Position After Export
- Verify viewport dimensions are stored
- Check scale factor calculation
- Ensure Y-axis flip is applied

### RTL Text Not Working
- Verify Arabic/Hebrew fonts loaded
- Check `isRTL()` detection
- Ensure text width calculation is correct

## 📝 Future Enhancements

### Planned Features
- [ ] Highlight annotation
- [ ] Shape annotation (rectangle, circle, arrow)
- [ ] Image annotation
- [ ] Signature annotation
- [ ] Font size selector in UI
- [ ] Color picker in UI
- [ ] Line width selector for scribbles
- [ ] Full CJK font support
- [ ] Text search and replace
- [ ] Annotation comments/notes

### Performance Optimizations
- [ ] Lazy load fonts on demand
- [ ] Cache rendered pages
- [ ] Virtualize long PDFs
- [ ] Web Worker for export

## 📚 References

- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Noto Fonts](https://fonts.google.com/noto)
- [Unicode Ranges](https://en.wikipedia.org/wiki/Unicode_block)

## ✅ Checklist

- [x] Fix scribble export
- [x] Fix coordinate transformation
- [x] Add multi-language support
- [x] Add rotation utilities
- [x] Add font loading system
- [x] Add RTL text support
- [x] Create ExportManager
- [x] Enhance LayerManager
- [x] Enhance geometry utils
- [x] Update documentation
- [ ] Add UI for font selection
- [ ] Add UI for color picker
- [ ] Add comprehensive tests
- [ ] Add CJK fonts
