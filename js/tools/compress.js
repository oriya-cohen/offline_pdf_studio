// js/tools/compress.js
import { download, setStatus } from "../lib/utils.js";
import { PDFDocument } from "../vendor/pdf-lib.bundle.js";

document.querySelector("#compressPanel button")
  ?.addEventListener("click", compressPDF);

// -----------------------------------------------------------
// MAIN ENTRY
// -----------------------------------------------------------
async function compressPDF() {
  const file = document.getElementById("compressFile").files[0];
  if (!file) return alert("Select a PDF");

  // Read selected mode from radios
  const mode = document.querySelector('input[name="compressMode"]:checked')?.value || "lossless";

  setStatus(mode === "lossless" ? "Optimizing (lossless)..." : "Compressing images...");
  try {
    const bytes = await file.arrayBuffer();

    if (mode === "lossless") {
      await doLosslessCompression(bytes);
    } else {
      await doHybridLossyCompression(bytes);
    }
  } catch (e) {
    alert("Compression failed: " + e.message);
  } finally {
    setStatus("");
  }
}

// -----------------------------------------------------------
// 1) LOSSLESS COMPRESSION
// -----------------------------------------------------------
async function doLosslessCompression(bytes) {
  const pdf = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  // Remove metadata (lossless)
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);

  // Remove useless garbage
  pdf.catalog.remove("Metadata");

  // Re-save with object streams (best compression pdf-lib offers)
  const optimized = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  download("compressed-lossless.pdf", optimized);
}

// -----------------------------------------------------------
// 2) HYBRID LOSSY — compress ONLY images
// -----------------------------------------------------------
async function doHybridLossyCompression(bytes) {
  const q = Number(document.getElementById("imageQualitySlider")?.value || 0.7);
  const maxSize = Number(document.getElementById("maxImageSize")?.value || 1000);

  const pdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();

  const PDFJS = window.pdfjsLib;
  const loadingPdf = await PDFJS.getDocument({ data: bytes }).promise;

  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Render page to canvas using PDF.js
    const pg = await loadingPdf.getPage(i + 1); // PDF.js is 1-based
    const viewport = pg.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pg.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    // SCALE if needed
    const scale = Math.min(1, maxSize / Math.max(canvas.width, canvas.height));
    const finalW = canvas.width * scale;
    const finalH = canvas.height * scale;

    const tmp = document.createElement("canvas");
    tmp.width = finalW;
    tmp.height = finalH;
    tmp.getContext("2d").drawImage(canvas, 0, 0, finalW, finalH);

    // Encode downscaled image to JPEG
    const jpgBytes = await canvasToJpgBytes(tmp, q);

    const jpg = await newPdf.embedJpg(jpgBytes);
    const newPage = newPdf.addPage([finalW, finalH]);

    newPage.drawImage(jpg, { x: 0, y: 0, width: finalW, height: finalH });
  }

  const output = await newPdf.save({ useObjectStreams: true });
  download("compressed-lossy.pdf", output);
}

// -----------------------------------------------------------
// Helper: Canvas → JPEG Uint8Array
// -----------------------------------------------------------
function canvasToJpgBytes(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.readAsArrayBuffer(blob);
    }, "image/jpeg", quality);
  });
}

// -----------------------------------------------------------
// Radio toggle for lossy options
// -----------------------------------------------------------
const radios = document.querySelectorAll('input[name="compressMode"]');
const lossyOptions = document.getElementById("lossyOptions");

radios.forEach(radio => {
  radio.addEventListener("change", () => {
    lossyOptions.style.display = radio.value === "lossy" ? "block" : "none";
  });
});

// Sync slider & number
const slider = document.getElementById("imageQualitySlider");
const number = document.getElementById("imageQualityNumber");
if (slider && number) {
  slider.addEventListener("input", () => { number.value = slider.value; });
  number.addEventListener("input", () => { slider.value = number.value; });
}
