// js/tools/reorder.js
import { download, setStatus } from "../lib/utils.js";
// import * as PDFLib from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
// const { PDFDocument } = PDFLib;
import { PDFDocument } from "../vendor/pdf-lib.bundle.js";

let reorderPdfDoc = null;
async function loadReorder() {
  const file = document.getElementById("reorderFile").files[0];
  if (!file) return;
  setStatus("Loading pages...");
  reorderPdfDoc = await PDFDocument.load(await file.arrayBuffer());

  const container = document.getElementById("reorderPreview");
  container.innerHTML = "";

  const pages = reorderPdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Create a canvas thumbnail
    const canvas = document.createElement("canvas");
    const viewportHeight = 250; // 100px tall thumbnails
    const { width, height } = page.getSize();
    const scale = viewportHeight / height;
    canvas.width = width * scale;
    canvas.height = viewportHeight;

    const ctx = canvas.getContext("2d");
    // Render page to canvas using PDF.js
    const pdfData = await reorderPdfDoc.save(); // save PDF bytes
    const pdfJS = window.pdfjsLib;
    const pdf = await pdfJS.getDocument({ data: pdfData }).promise;
    const pg = await pdf.getPage(i + 1);
    const vp = pg.getViewport({ scale });
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;

    // Wrap canvas in draggable div
    const div = document.createElement("div");
    div.className = "pageThumb";
    div.draggable = true;
    div.dataset.index = i;
    div.appendChild(canvas);
    container.appendChild(div);
  }

  makeDraggable(container);
  setStatus("");
}


async function saveReorder() {
  if (!reorderPdfDoc) return alert("Load a PDF first");
  const container = document.getElementById("reorderPreview");
  const order = Array.from(container.children).map(el => Number(el.dataset.index));
  const out = await PDFDocument.create();
  const copied = await out.copyPages(reorderPdfDoc, order);
  copied.forEach(p => out.addPage(p));
  download("reordered.pdf", await out.save());
}

function makeDraggable(container) {
  let dragged = null;

  container.addEventListener("dragstart", e => {
    // Always find the .pageThumb div, even if canvas was clicked
    const thumb = e.target.closest(".pageThumb");
    if (thumb && container.contains(thumb)) {
      dragged = thumb;
      e.dataTransfer.effectAllowed = "move";
    }
  });

  container.addEventListener("dragover", e => e.preventDefault());

  container.addEventListener("drop", e => {
    e.preventDefault();
    if (!dragged) return;

    // Find drop target
    const thumb = e.target.closest(".pageThumb");
    if (!thumb || thumb === dragged) return;

    const rect = thumb.getBoundingClientRect();
    const next = (e.clientY - rect.top) / rect.height > 0.5;
    container.insertBefore(dragged, next ? thumb.nextSibling : thumb);
  });
}


document.getElementById("reorderFile").addEventListener("change", loadReorder);
document.querySelector("#reorderPanel button")?.addEventListener("click", saveReorder);