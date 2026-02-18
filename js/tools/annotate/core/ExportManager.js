// js/tools/annotate/core/ExportManager.js

const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;

/**
 * Manages PDF export with coordinate transformation
 */
export class ExportManager {
  constructor() {
    this.fontCache = new Map();
  }

  /**
   * Load standard fonts (no fontkit needed)
   */
  async loadFonts(pdfDoc) {
    try {
      this.fontCache.set('Helvetica', await pdfDoc.embedFont(StandardFonts.Helvetica));
      this.fontCache.set('TimesRoman', await pdfDoc.embedFont(StandardFonts.TimesRoman));
      this.fontCache.set('Courier', await pdfDoc.embedFont(StandardFonts.Courier));
      console.log('Standard fonts loaded');
    } catch (error) {
      console.warn('Font loading failed:', error);
    }
  }

  /**
   * Get font (always use Helvetica for now)
   */
  detectFont(text) {
    return this.fontCache.get('Helvetica') || this.fontCache.get('TimesRoman');
  }

  /**
   * Check if text is RTL
   */
  isRTL(text) {
    return /[\u0590-\u05FF\u0600-\u06FF]/.test(text);
  }

  /**
   * Export annotations to PDF with rotation compensation
   */
  async exportPDF(pdfDocument, annotations, layerManager, scale) {
    try {
      const pdfData = await pdfDocument.getData();
      const pdfDoc = await PDFDocument.load(pdfData);
      
      await this.loadFonts(pdfDoc);

      const annotationsByPage = new Map();
      annotations.forEach(ann => {
        if (!annotationsByPage.has(ann.page)) {
          annotationsByPage.set(ann.page, []);
        }
        annotationsByPage.get(ann.page).push(ann);
      });

      for (const [pageNum, pageAnnotations] of annotationsByPage) {
        const page = pdfDoc.getPage(pageNum - 1);
        const pageHeight = page.getHeight();
        const pageWidth = page.getWidth();
        
        const viewport = layerManager.getViewport(pageNum);
        if (!viewport) {
          console.warn(`No viewport found for page ${pageNum}`);
          continue;
        }

        const scaleX = pageWidth / viewport.width;
        const scaleY = pageHeight / viewport.height;

        for (const ann of pageAnnotations) {
          await this.exportAnnotation(ann, page, pageHeight, pageWidth, scaleX, scaleY, scale, layerManager);
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'annotated.pdf';
      link.click();
      URL.revokeObjectURL(url);

      console.log('PDF exported successfully');
      return true;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Export single annotation
   */
  async exportAnnotation(ann, page, pageHeight, pageWidth, scaleX, scaleY, scale, layerManager) {
    const { TextAnnotation } = await import('../annotations/TextAnnotation.js');
    const { ScribbleAnnotation } = await import('../annotations/ScribbleAnnotation.js');

    if (ann.constructor.name === 'TextAnnotation' || ann instanceof TextAnnotation) {
      await this.exportTextAnnotation(ann, page, pageHeight, pageWidth, scaleX, scaleY, scale);
    } else if (ann.constructor.name === 'ScribbleAnnotation' || ann instanceof ScribbleAnnotation) {
      await this.exportScribbleAnnotation(ann, page, pageHeight, pageWidth, scaleX, scaleY, layerManager);
    }
  }

  /**
   * Check if text contains non-Latin characters
   */
  hasUnicodeChars(text) {
    return /[^\x00-\x7F]/.test(text);
  }

  /**
   * Export text annotation
   */
  async exportTextAnnotation(ann, page, pageHeight, pageWidth, scaleX, scaleY, scale) {
    if (ann.syncFromDOM) {
      ann.syncFromDOM();
    }

    // If text contains Hebrew or other Unicode, render as image
    if (this.hasUnicodeChars(ann.text)) {
      await this.exportTextAsImage(ann, page, pageHeight, pageWidth, scaleX, scaleY);
      return;
    }

    const font = this.detectFont(ann.text);
    const fontSize = (ann.fontSize * ann.scale * scaleX);
    const lines = ann.text.split('\n');
    const lineHeight = fontSize * 1.2;
    const rotationDegrees = -ann.rotation * (180 / Math.PI);

    // Calculate text box height in screen coordinates
    const textBoxHeight = (ann.fontSize * ann.scale) * lines.length * 1.2;
    
    // Convert coordinates: PDF origin is bottom-left, screen is top-left
    // Y position should be at the BOTTOM of the text box
    const pdfX = ann.x * scaleX;
    const pdfY = pageHeight - ((ann.y + textBoxHeight) * scaleY);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      try {
        page.drawText(line, {
          x: pdfX,
          y: pdfY + (i * lineHeight),
          size: fontSize,
          font: font,
          color: this.parseColor(ann.color),
          rotate: degrees(rotationDegrees)
        });
      } catch (err) {
        console.warn('Could not draw text line:', line, err);
      }
    }
  }

  /**
   * Export text as image (for Unicode/Hebrew text)
   */
  async exportTextAsImage(ann, page, pageHeight, pageWidth, scaleX, scaleY) {
    // Create temporary canvas to render text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with padding
    const fontSize = ann.fontSize * ann.scale;
    const lines = ann.text.split('\n');
    const lineHeight = fontSize * 1.2;
    const textWidth = Math.max(...lines.map(line => {
      ctx.font = `${fontSize}px Arial`;
      return ctx.measureText(line).width;
    }));
    
    canvas.width = textWidth + 20;
    canvas.height = lines.length * lineHeight + 10;
    
    // Draw text (no background - transparent)
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = ann.color || '#000000';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, i) => {
      ctx.fillText(line, 10, 5 + i * lineHeight);
    });
    
    try {
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngImage = await page.doc.embedPng(pngDataUrl);
      
      const imgWidth = canvas.width * scaleX;
      const imgHeight = canvas.height * scaleY;
      const pdfX = ann.x * scaleX;
      const pdfY = pageHeight - ((ann.y + canvas.height) * scaleY);
      
      page.drawImage(pngImage, {
        x: pdfX,
        y: pdfY,
        width: imgWidth,
        height: imgHeight,
        rotate: degrees(-ann.rotation * (180 / Math.PI))
      });
    } catch (err) {
      console.error('Could not export text as image:', err);
    }
  }

  /**
   * Export scribble annotation
   */
  async exportScribbleAnnotation(ann, page, pageHeight, pageWidth, scaleX, scaleY, layerManager) {
    if (!ann.stroke || ann.stroke.length < 2) {
      console.warn('Scribble has no stroke data');
      return;
    }

    const canvas = layerManager.getLayer(ann.page);
    if (!canvas) {
      console.warn(`No canvas found for page ${ann.page}`);
      return;
    }

    const tempCanvas = document.createElement('canvas');
    const viewport = layerManager.getViewport(ann.page);
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;
    const ctx = tempCanvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(ann.stroke[0].x, ann.stroke[0].y);
    
    for (let i = 1; i < ann.stroke.length; i++) {
      ctx.lineTo(ann.stroke[i].x, ann.stroke[i].y);
    }
    
    ctx.strokeStyle = ann.color || '#000000';
    ctx.lineWidth = ann.lineWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    try {
      const pngDataUrl = tempCanvas.toDataURL('image/png');
      const pngImage = await page.doc.embedPng(pngDataUrl);
      
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
    } catch (err) {
      console.warn('Could not embed scribble as image:', err);
      this.exportScribbleAsLines(ann, page, pageHeight, pageWidth, scaleX, scaleY);
    }
  }

  /**
   * Fallback: Export scribble as lines
   */
  exportScribbleAsLines(ann, page, pageHeight, pageWidth, scaleX, scaleY) {
    const stroke = ann.stroke;
    for (let i = 1; i < stroke.length; i++) {
      const p1 = stroke[i - 1];
      const p2 = stroke[i];

      const x1 = p1.x * scaleX;
      const y1 = pageHeight - (p1.y * scaleY);
      const x2 = p2.x * scaleX;
      const y2 = pageHeight - (p2.y * scaleY);

      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: (ann.lineWidth || 2) * scaleX,
        color: this.parseColor(ann.color || '#000000')
      });
    }
  }

  /**
   * Parse color string to RGB
   */
  parseColor(colorStr) {
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    return rgb(0, 0, 0);
  }
}
