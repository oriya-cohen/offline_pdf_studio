// js/tools/annotate/index.js

import { StateManager } from './core/StateManager.js';
import { HistoryManager } from './core/HistoryManager.js';
import { PDFManager } from './core/PDFManager.js';
import { LayerManager } from './core/LayerManager.js';
import { ExportManager } from './core/ExportManager.js';
import { InteractionManager } from './ui/InteractionManager.js';
import { TOOLS } from './utils/constants.js';

export async function initAnnotate() {
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

  pdfManager.init('pdfCanvasWrapper');
  interactionManager.init('pdfCanvasWrapper');

  const fileInput = document.getElementById('annotateFile');
  const saveButton = document.getElementById('saveAnnotationsBtn');
  const textBtn = document.getElementById('addTextBtn');
  const scribbleBtn = document.getElementById('addScribbleBtn');
  const loadBtn = document.getElementById('loadPdfBtn');

  if (!fileInput || !saveButton) {
    console.error('Required elements not found');
    return;
  }

  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<i data-feather="loader"></i> Loading...';
        if (window.feather) feather.replace();
      }

      document.querySelectorAll('.annotation-wrapper').forEach(el => el.remove());
      stateManager.set('annotations', []);
      
      await pdfManager.loadPDF(file);
      historyManager.clear();
      historyManager.push();

      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i data-feather="upload"></i> Choose PDF File';
        if (window.feather) feather.replace();
      }

      console.log('PDF loaded successfully');
    } catch (error) {
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i data-feather="upload"></i> Choose PDF File';
        if (window.feather) feather.replace();
      }
      alert('Error loading PDF: ' + error.message);
      console.error(error);
    }
  });

  saveButton.addEventListener('click', async () => {
    await savePDF(stateManager, pdfManager, layerManager, exportManager);
  });

  if (textBtn) {
    textBtn.addEventListener('click', () => {
      stateManager.set('currentTool', TOOLS.TEXT);
      updateToolButtons(textBtn, [textBtn, scribbleBtn]);
      console.log('Text tool selected');
    });
  }

  if (scribbleBtn) {
    scribbleBtn.addEventListener('click', () => {
      stateManager.set('currentTool', TOOLS.SCRIBBLE);
      updateToolButtons(scribbleBtn, [textBtn, scribbleBtn]);
      console.log('Scribble tool selected');
    });
  }

  stateManager.on('annotations', () => {
    layerManager.redrawAll();
  });

  console.log('Annotation tool initialized');
}

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
