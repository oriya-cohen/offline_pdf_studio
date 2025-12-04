// js/tools/merge.js
import { download, setStatus } from "../lib/utils.js";
// import * as PDFLib from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
// const { PDFDocument } = PDFLib;
import { PDFDocument } from "../vendor/pdf-lib.bundle.js";

async function mergePDFs() {
  const files = document.getElementById("mergeFiles").files;
  if (!files.length) return alert("Please select at least one PDF");

  setStatus("Merging PDFs...");
  try {
    const merged = await PDFDocument.create();
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

    for (const file of sorted) {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const copied = await merged.copyPages(pdf, pdf.getPageIndices());
      copied.forEach(p => merged.addPage(p));
    }
    download("merged.pdf", await merged.save());
  } catch (e) {
    alert("Merge failed: " + e.message);
  } finally {
    setStatus("");
  }
}

document.querySelector("#mergePanel button")?.addEventListener("click", mergePDFs);