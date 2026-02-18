# Annotation System - Quick Start Guide

## 🚀 Getting Started

### 1. Start Local Server
```bash
cd offline_pdf_studio
python -m http.server 8000
```

Open browser: `http://localhost:8000`

### 2. Load a PDF
1. Click "Annotate PDF" in sidebar
2. Click "Load PDF" button
3. Select a PDF file

### 3. Add Scribble
1. Click "Add Scribble" button (turns blue)
2. Click and drag on PDF to draw
3. Release mouse to finish

### 4. Add Text
1. Click "Add Text" button (turns blue)
2. Double-click on PDF where you want text
3. Type your text (any language)
4. Drag orange circle to rotate
5. Drag blue square to scale
6. Drag text box to move

### 5. Save PDF
1. Click "Save PDF" button
2. PDF downloads with annotations

## 🧪 Testing Multi-Language

### Test Arabic
```
مرحبا بك في عالم PDF
```

### Test Hebrew
```
שלום עולם
```

### Test Mixed
```
English + العربية + עברית
```

## 🐛 Troubleshooting

### Error: "Cannot read properties of null"
**Cause**: HTML elements not found
**Fix**: Ensure these IDs exist in HTML:
- `annotateFile`
- `saveAnnotationsBtn`
- `addTextBtn`
- `addScribbleBtn`
- `pdfCanvasWrapper`

### Fonts Not Loading
**Cause**: Font files missing or wrong path
**Fix**: Check these files exist:
```
assets/fonts/Noto_Sans,Noto_Sans_Arabic,Noto_Serif,Noto_Serif_Hebrew/
├── Noto_Sans/NotoSans-Regular.ttf
├── Noto_Sans_Arabic/NotoSansArabic-Regular.ttf
└── Noto_Serif_Hebrew/NotoSerifHebrew-Regular.ttf
```

### Scribble Not Exporting
**Cause**: Canvas-to-image conversion failed
**Fix**: Check browser console for errors. System will fallback to line-by-line drawing.

### Wrong Position After Export
**Cause**: Coordinate transformation issue
**Fix**: Verify viewport is stored in LayerManager. Check console for scale factors.

## 📋 Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Delete` - Delete selected annotation

## ✅ Verification Checklist

After loading PDF:
- [ ] Can draw scribbles
- [ ] Can add text
- [ ] Can rotate text (orange handle)
- [ ] Can scale text (blue handle)
- [ ] Can drag text to move
- [ ] Can type Arabic text
- [ ] Can type Hebrew text
- [ ] Can save PDF
- [ ] Exported PDF shows annotations correctly
- [ ] Scribbles appear in correct position
- [ ] Text appears in correct position
- [ ] Rotation is preserved
- [ ] Multi-language text renders correctly

## 🔍 Debug Mode

Add to browser console:
```javascript
// Check state
console.log(stateManager.get('annotations'));

// Check viewport
console.log(layerManager.getViewport(1));

// Check fonts
console.log(exportManager.fontCache);
```

## 📝 Common Issues

### Issue: Buttons not responding
**Solution**: Check browser console for JavaScript errors

### Issue: PDF not loading
**Solution**: Ensure pdf.js and pdf-lib are loaded correctly

### Issue: Annotations disappear after save
**Solution**: Check ExportManager is properly exporting annotations

### Issue: Text in wrong language font
**Solution**: Check detectFont() is detecting script correctly

## 🎯 Next Steps

1. Test all features with sample PDF
2. Test multi-language text
3. Test multi-page PDF
4. Test complex scribbles
5. Verify export quality
6. Add UI improvements (color picker, font selector)
7. Add more annotation types (highlight, shapes)

## 📞 Support

Check these files for detailed documentation:
- `ARCHITECTURE.md` - System architecture
- `test-scenarios.js` - Test cases
- Browser console - Error messages
