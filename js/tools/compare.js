import { setStatus } from "../lib/utils.js";

async function comparePDFs() {
  const fileA = document.getElementById("compareFileA").files[0];
  const fileB = document.getElementById("compareFileB").files[0];
  if (!fileA || !fileB) return alert("Select both PDFs");

  setStatus("Comparing PDFs (this may take a moment)...");
  const resultDiv = document.getElementById("compareResult");
  const totalPagesSpan = document.getElementById("totalPages");
  const diffCountSpan = document.getElementById("diffCount");
  const missingCountSpan = document.getElementById("missingCount");

  resultDiv.innerHTML = "";
  totalPagesSpan.textContent = "0";
  diffCountSpan.textContent = "0";
  missingCountSpan.textContent = "0";

  try {
    const pdfA = await pdfjsLib.getDocument({ data: await fileA.arrayBuffer() }).promise;
    const pdfB = await pdfjsLib.getDocument({ data: await fileB.arrayBuffer() }).promise;

    const maxPages = Math.max(pdfA.numPages, pdfB.numPages);
    let diffCount = 0;
    let missingCount = 0;

    for (let i = 1; i <= maxPages; i++) {
      const pageA = i <= pdfA.numPages ? await pdfA.getPage(i) : null;
      const pageB = i <= pdfB.numPages ? await pdfB.getPage(i) : null;

      const pageDiv = document.createElement("div");
      pageDiv.className = "pageCompare";

      const canvasA = document.createElement("canvas");
      const canvasB = document.createElement("canvas");

      const statusDiv = document.createElement("div");
      statusDiv.className = "pageStatus";

      if (!pageA) {
        statusDiv.textContent = `Page ${i}: Missing in PDF A`;
        canvasB.textContent = "PDF B page";
        missingCount++;
      } else if (!pageB) {
        statusDiv.textContent = `Page ${i}: Missing in PDF B`;
        canvasA.textContent = "PDF A page";
        missingCount++;
      } else {
        const vpA = pageA.getViewport({ scale: 0.5 });
        const vpB = pageB.getViewport({ scale: 0.5 });

        canvasA.width = vpA.width; canvasA.height = vpA.height;
        canvasB.width = vpB.width; canvasB.height = vpB.height;

        await pageA.render({ canvasContext: canvasA.getContext("2d"), viewport: vpA }).promise;
        await pageB.render({ canvasContext: canvasB.getContext("2d"), viewport: vpB }).promise;

        if (vpA.width !== vpB.width || vpA.height !== vpB.height) {
          statusDiv.textContent = `Page ${i}: Size differs`;
          canvasA.classList.add("diff");
          canvasB.classList.add("diff");
          diffCount++;
        } else {
          statusDiv.textContent = `Page ${i}: Identical size`;
        }
      }

      pageDiv.appendChild(canvasA);
      pageDiv.appendChild(canvasB);
      pageDiv.appendChild(statusDiv);
      resultDiv.appendChild(pageDiv);
    }

    totalPagesSpan.textContent = maxPages;
    diffCountSpan.textContent = diffCount;
    missingCountSpan.textContent = missingCount;
  } catch (e) {
    resultDiv.textContent = "Error: " + e.message;
  } finally {
    setStatus("");
  }
}

document.getElementById("compareBtn")?.addEventListener("click", comparePDFs);
