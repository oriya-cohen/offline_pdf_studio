// js/tools/pdf-to-images.js
import { setStatus } from "../lib/utils.js";

async function pdfToImages() {
  const file = document.getElementById("pdfToImgFile").files[0];
  const format = document.getElementById("pdfToImgFormat").value;
  if (!file) return alert("Select a PDF");

  setStatus("Rendering pages as " + format.toUpperCase() + "...");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const zip = new JSZip();

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise(r => canvas.toBlob(r, `image/${format}`, 0.95));
      zip.file(`page_${String(i).padStart(3, "0")}.${format}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pdf_pages.zip";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Export failed: " + e.message);
  } finally {
    setStatus("");
  }
}

document.querySelector("#pdfToImgPanel button")?.addEventListener("click", pdfToImages);