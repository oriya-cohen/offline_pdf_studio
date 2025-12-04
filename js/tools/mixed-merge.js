// js/tools/mixed-merge.js
import { download, setStatus } from "../lib/utils.js";
// import * as PDFLib from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
// const { PDFDocument, rgb } = PDFLib;
import { PDFDocument, rgb } from "../vendor/pdf-lib.bundle.js";

async function mixedMerge() {
  const files = document.getElementById("mixedMergeFiles").files;
  if (!files.length) return alert("Select PDFs and/or images");

  setStatus("Creating mixed PDF...");
  try {
    const pdf = await PDFDocument.create();

    for (const file of files) {
      if (file.type === "application/pdf") {
        const src = await PDFDocument.load(await file.arrayBuffer());
        const pages = await pdf.copyPages(src, src.getPageIndices());
        pages.forEach(p => pdf.addPage(p));
      } else if (/image\/(png|jpeg|jpg|webp)/.test(file.type)) {
        const bytes = await file.arrayBuffer();
        const img = file.type.includes("png") || file.type === "image/webp"
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);

        let { width, height } = img;
        const MAX = 1000;
        const scale = Math.min(1, MAX / Math.max(width, height));
        width *= scale; height *= scale;

        const page = pdf.addPage([width, height]);
        page.drawImage(img, { x: 0, y: 0, width, height });
      }
    }
    download("mixed_merge.pdf", await pdf.save());
  } catch (e) {
    alert("Mixed merge failed: " + e.message);
  } finally {
    setStatus("");
  }
}

document.querySelector("#mixedMergePanel button")?.addEventListener("click", mixedMerge);