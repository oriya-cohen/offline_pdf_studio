// js/tools/images-to-pdf.js
import { download, setStatus } from "../lib/utils.js";
// import * as PDFLib from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm" ;  //"../vendor/pdf-lib.js_deliver.min.js"
// const { PDFDocument } = PDFLib;
import { PDFDocument } from "../vendor/pdf-lib.bundle.js";

async function imagesToPdf() {
  const files = document.getElementById("imgToPdfFiles").files; // ✅ match HTML
  if (!files.length) return alert("Select images");

  setStatus("Converting images → PDF...");
  try {
    const pdf = await PDFDocument.create();

    for (const file of files) {
      if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
        alert(`Skipped ${file.name}: only PNG/JPEG/WEBP`);
        continue;
      }
      const bytes = await file.arrayBuffer();
      const img = file.type === "image/png" || file.type === "image/webp"
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);

      let { width, height } = img;
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(width, height));
      width *= scale; height *= scale;

      const page = pdf.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
    }

    if (pdf.getPageCount() === 0) return alert("No images processed");
    download("images_to_pdf.pdf", await pdf.save());
  } catch (e) {
    alert("Conversion failed: " + e.message);
  } finally {
    setStatus("");
  }
}

document.querySelector("#imgToPdfPanel button")?.addEventListener("click", imagesToPdf);

document.querySelector("#imgToPdfPanel button")?.addEventListener("click", imagesToPdf);