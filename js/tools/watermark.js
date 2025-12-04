// js/tools/watermark.js
import { download, setStatus } from "../lib/utils.js";
// const { PDFDocument, StandardFonts, rgb, degrees, BlendMode } = PDFLib;
import { PDFDocument, StandardFonts, rgb, degrees, BlendMode } from "../vendor/pdf-lib.bundle.js";

async function addWatermark() {
  const file = document.getElementById("watermarkFile").files[0];
  const text = document.getElementById("watermarkText").value.trim() || "CONFIDENTIAL";
  if (!file) return alert("Select a PDF");

  setStatus("Adding watermark...");
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);

    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width * 0.15,
        y: height / 2,
        size: 70,
        font,
        color: rgb(0.85, 0, 0),
        rotate: degrees(45),
        opacity: 0.28,
        blendMode: BlendMode.Multiply,
      });
    }
    download("watermarked.pdf", await pdf.save());
  } catch (e) {
    alert("Watermark failed: " + e.message);
  } finally {
    setStatus("");
  }
}

document.querySelector("#watermarkPanel button")?.addEventListener("click", addWatermark);