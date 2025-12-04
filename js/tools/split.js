// js/tools/split.js
import { download, setStatus, parsePageRanges } from "../lib/utils.js";
// import * as PDFLib from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
// const { PDFDocument } = PDFLib;
import { PDFDocument } from "../vendor/pdf-lib.bundle.js";

async function splitPDF() {
  const file = document.getElementById("splitFile").files[0];
  const range = document.getElementById("splitRanges").value.trim(); // ✅ match HTML
  if (!file) return alert("Select a PDF");
  if (!range) return alert("Enter page range (e.g. 1,3-5)");

  setStatus("Splitting PDF...");
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const indices = parsePageRanges(range, pdf.getPageCount());
    if (indices.length === 0) return alert("No valid pages selected");

    const out = await PDFDocument.create();
    const pages = await out.copyPages(pdf, indices);
    pages.forEach(p => out.addPage(p));

    download(`split_${range.replace(/[^0-9-]/g,"-")}.pdf`, await out.save());
  } catch (e) {
    alert("Split failed: " + e.message);
  } finally {
    setStatus("");
  }
}


document.querySelector("#splitPanel button")?.addEventListener("click", splitPDF);