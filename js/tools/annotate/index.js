// js/tools/annotate/index.js
// Main entry point for annotation tool

import { StateManager } from './core/StateManager.js';
import { HistoryManager } from './core/HistoryManager.js';
import { PDFManager } from './core/PDFManager.js';
import { LayerManager } from './core/LayerManager.js';
import { ExportManager } from './core/ExportManager.js';
import { InteractionManager } from './ui/InteractionManager.js';
import { TextAnnotation } from './annotations/TextAnnotation.js';
import { ScribbleAnnotation } from './annotations/ScribbleAnnotation.js';
import { TOOLS } from './utils/constants.js';

/**
 * Main initialization function
 * Call this from your app
 */
export async function initAnnotate() {
  // Create all managers
  const stateManager = new StateManager();
  const historyManager = new HistoryManager(stateManager);
  const layerManager = new LayerManager(stateManager);
  const pdfManager = new PDFManager(stateManager, layerManager);
  const exportManager = new ExportManager();
  const interactionManager = new InteractionManager(
    stateManager,
    pdfManager,
    layerManager,
    historyManager
  );

  // Initialize with existing HTML elements
  pdfManager.init('pdfCanvasWrapper');
  interactionManager.init('pdfCanvasWrapper');

  // Wire up existing buttons
  const fileInput = document.getElementById('annotateFile');
  const saveButton = document.getElementById('saveAnnotationsBtn');
  const textBtn = document.getElementById('addTextBtn');
  const scribbleBtn = document.getElementById('addScribbleBtn');

  if (!fileInput || !saveButton) {
    console.error('Required elements not found');
    return;
  }

  // File input change
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Clear all annotations and DOM elements
      document.querySelectorAll('.annotation-wrapper').forEach(el => el.remove());
      stateManager.set('annotations', []);
      
      await pdfManager.loadPDF(file);
      historyManager.clear();
      historyManager.push();
      console.log('PDF loaded successfully');
    } catch (error) {
      alert('Error loading PDF: ' + error.message);
      console.error(error);
    }
  });

  // Save button
  saveButton.addEventListener('click', async () => {
    await savePDF(stateManager, pdfManager, layerManager, exportManager);
  });

  // Text tool button
  if (textBtn) {
    textBtn.addEventListener('click', () => {
      stateManager.set('currentTool', TOOLS.TEXT);
      updateToolButtons(textBtn, [textBtn, scribbleBtn]);
      console.log('Text tool selected');
    });
  }

  // Scribble tool button
  if (scribbleBtn) {
    scribbleBtn.addEventListener('click', () => {
      stateManager.set('currentTool', TOOLS.SCRIBBLE);
      updateToolButtons(scribbleBtn, [textBtn, scribbleBtn]);
      console.log('Scribble tool selected');
    });
  }

  // Listen for annotation changes to redraw
  stateManager.on('annotations', () => {
    layerManager.redrawAll();
  });

  console.log('Annotation tool initialized');
}

/**
 * Update tool button states
 */
function updateToolButtons(activeBtn, allButtons) {
  allButtons.forEach(btn => {
    if (btn) {
      if (btn === activeBtn) {
        btn.style.background = '#007bff';
        btn.style.color = '#fff';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    }
  });
}

/**
 * Save annotated PDF using ExportManager
 */
async function savePDF(stateManager, pdfManager, layerManager, exportManager) {
  const pdfDocument = stateManager.get('pdfDocument');
  if (!pdfDocument) {
    alert('Please load a PDF first');
    return;
  }

  try {
    const annotations = stateManager.get('annotations');
    const scale = pdfManager.scale;
    
    await exportManager.exportPDF(pdfDocument, annotations, layerManager, scale);
  } catch (error) {
    alert('Error saving PDF: ' + error.message);
    console.error(error);
  }
}