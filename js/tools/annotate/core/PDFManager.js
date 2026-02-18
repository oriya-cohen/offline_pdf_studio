// js/tools/annotate/core/PDFManager.js

import { DEFAULTS, DPR } from '../utils/constants.js';

/**
 * Manages PDF loading and rendering
 */
export class PDFManager {
  constructor(stateManager, layerManager) {
    this.stateManager = stateManager;
    this.layerManager = layerManager;
    this.scale = DEFAULTS.SCALE;
    this.container = null;
  }

  /**
   * Initialize with DOM container
   */
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }
  }

  /**
   * Load PDF file
   */
  async loadPDF(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    this.stateManager.set('pdfDocument', pdfDocument);
    
    // Clear previous content
    this.container.innerHTML = '';
    this.layerManager.clear();

    // Render all pages
    await this.renderAllPages(pdfDocument);

    return pdfDocument;
  }

  /**
   * Render all PDF pages with annotation layers
   */
  async renderAllPages(pdfDocument) {
    const numPages = pdfDocument.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      await this.renderPage(pdfDocument, pageNum);
    }
  }

  /**
   * Render single page
   */
  async renderPage(pdfDocument, pageNum) {
    const page = await pdfDocument.getPage(pageNum);
    
    // Get viewport WITHOUT manual rotation - let pdf.js handle it
    const viewport = page.getViewport({ 
      scale: this.scale
    });

    // Create page container
    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.dataset.page = pageNum;
    pageDiv.style.position = 'relative';
    pageDiv.style.marginBottom = '20px';
    pageDiv.style.width = viewport.width + 'px';
    pageDiv.style.height = viewport.height + 'px';

    // Create PDF canvas
    const pdfCanvas = document.createElement('canvas');
    pdfCanvas.width = viewport.width * DPR;
    pdfCanvas.height = viewport.height * DPR;
    pdfCanvas.style.width = viewport.width + 'px';
    pdfCanvas.style.height = viewport.height + 'px';

    const pdfCtx = pdfCanvas.getContext('2d');
    pdfCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Render PDF page
    await page.render({
      canvasContext: pdfCtx,
      viewport: viewport
    }).promise;

    // Create annotation layer
    const annotationCanvas = this.layerManager.createLayer(pageNum, viewport);

    // Assemble page
    pageDiv.appendChild(pdfCanvas);
    pageDiv.appendChild(annotationCanvas);
    this.container.appendChild(pageDiv);

    return pageDiv;
  }

  /**
   * Get page element
   */
  getPageElement(pageNum) {
    return this.container.querySelector(`[data-page="${pageNum}"]`);
  }

  /**
   * Get page number from mouse event
   */
  getPageFromEvent(event) {
    let element = event.target;
    while (element && !element.dataset.page) {
      element = element.parentElement;
    }
    return element ? parseInt(element.dataset.page) : null;
  }

  /**
   * Get coordinates relative to page
   */
  getPageCoordinates(event, pageNum) {
    const pageEl = this.getPageElement(pageNum);
    if (!pageEl) return null;

    const rect = pageEl.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left),
      y: (event.clientY - rect.top)
    };
  }
}
