// js/tools/annotate/ui/Toolbar.js

import { TOOLS } from '../utils/constants.js';

/**
 * Manages the annotation toolbar UI
 */
export class Toolbar {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.buttons = {};
    this.fileInput = null;
  }

  /**
   * Create toolbar DOM
   */
  create(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Toolbar container ${containerId} not found`);
    }

    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.padding = '10px';
    container.style.background = '#f5f5f5';
    container.style.borderBottom = '1px solid #ddd';

    // File input (hidden)
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'application/pdf';
    this.fileInput.style.display = 'none';
    this.fileInput.id = 'annotateFileInput';
    container.appendChild(this.fileInput);

    // Load PDF button
    this.createButton(container, 'loadPdf', 'Load PDF', () => {
      this.fileInput.click();
    });

    // Save PDF button
    this.createButton(container, 'savePdf', 'Save PDF', null);

    // Separator
    const separator = document.createElement('div');
    separator.style.width = '1px';
    separator.style.background = '#ddd';
    separator.style.margin = '0 10px';
    container.appendChild(separator);

    // Scribble tool
    this.createButton(container, 'scribble', 'Scribble', () => {
      this.setActiveTool(TOOLS.SCRIBBLE);
    }, TOOLS.SCRIBBLE);

    // Text tool
    this.createButton(container, 'text', 'Add Text', () => {
      this.setActiveTool(TOOLS.TEXT);
    }, TOOLS.TEXT);

    return container;
  }

  /**
   * Create a toolbar button
   */
  createButton(container, id, label, onclick, tool = null) {
    const button = document.createElement('button');
    button.id = `annotate-${id}-btn`;
    button.textContent = label;
    button.style.padding = '8px 16px';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '4px';
    button.style.background = '#fff';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';

    if (onclick) {
      button.onclick = onclick;
    }

    if (tool) {
      button.dataset.tool = tool;
    }

    container.appendChild(button);
    this.buttons[id] = button;

    return button;
  }

  /**
   * Set active tool and update button states
   */
  setActiveTool(tool) {
    this.stateManager.set('currentTool', tool);

    // Update button visual states
    Object.values(this.buttons).forEach(button => {
      if (button.dataset.tool === tool) {
        button.style.background = '#007bff';
        button.style.color = '#fff';
      } else if (button.dataset.tool) {
        button.style.background = '#fff';
        button.style.color = '#000';
      }
    });
  }

  /**
   * Get file input element
   */
  getFileInput() {
    return this.fileInput;
  }

  /**
   * Get button by ID
   */
  getButton(id) {
    return this.buttons[id];
  }
}
