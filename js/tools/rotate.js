// js/tools/rotate.js
import { download, setStatus, parsePageRanges } from "../lib/utils.js";
import { PDFDocument, degrees } from "../vendor/pdf-lib.bundle.js";

async function rotatePDF() {
  const file = document.getElementById("rotateFile").files[0];
  const deg = Number(document.getElementById("rotateAngle").value);
  const rangeInput = document.getElementById("rotateRanges").value.trim();

  if (!file) return alert("Select a PDF");

  setStatus("Rotating pages...");

  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();
    const total = pages.length;

    let targetPages = [];

    if (rangeInput === "" || rangeInput === "-1") {
      // Rotate all pages
      targetPages = [...Array(total).keys()]; // [0,1,2,...]
    } else {
      // Parse numeric ranges
      const ranges = parsePageRanges(rangeInput, total); // already 1-based → converts to 0-based
      targetPages = ranges;
    }

    // Rotate only selected pages
    targetPages.forEach(i => {
      pages[i].setRotation(degrees(deg));
    });

    download("rotated.pdf", await pdf.save());
  } catch (e) {
    alert("Rotate failed: " + e.message);
  } finally {
    setStatus("");
  }
}

document
  .getElementById("rotateBtn")
  ?.addEventListener("click", rotatePDF);
