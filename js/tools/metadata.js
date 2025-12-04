import { PDFDocument } from "../vendor/pdf-lib.bundle.js";
import { download, setStatus } from "../lib/utils.js";

let pdfDoc = null;
let currentPdfBytes = null;
let metaTableBody = document.querySelector("#metaTable tbody");

// Attach events immediately
document.getElementById("metaLoadBtn").addEventListener("click", loadMetadata);
document.getElementById("metaSaveBtn").addEventListener("click", saveMetadata);

function clearTable() {
  if (!metaTableBody) return;
  metaTableBody.innerHTML = "";
}

function addRow(label, value) {
  const tr = document.createElement("tr");

  const tdLabel = document.createElement("td");
  const inputLabel = document.createElement("input");
  inputLabel.type = "text";
  inputLabel.value = label;
  inputLabel.disabled = true;
  tdLabel.appendChild(inputLabel);

  const tdValue = document.createElement("td");
  const inputValue = document.createElement("input");
  inputValue.type = "text";
  inputValue.value = value || "";
  tdValue.appendChild(inputValue);

  const tdActions = document.createElement("td");

  tr.appendChild(tdLabel);
  tr.appendChild(tdValue);
  tr.appendChild(tdActions);

  metaTableBody.appendChild(tr);
}

// Load metadata
export async function loadMetadata() {
  const fileInput = document.getElementById("metaFile");
  const file = fileInput.files[0];
  if (!file) return alert("Select a PDF");

  setStatus("Loading metadata...");
  try {
    currentPdfBytes = await file.arrayBuffer();
    pdfDoc = await PDFDocument.load(currentPdfBytes);

    clearTable();

    addRow("Title", pdfDoc.getTitle() || "");
    addRow("Author", pdfDoc.getAuthor() || "");
    addRow("Subject", pdfDoc.getSubject() || "");

    // Normalize keywords
    let keywords = pdfDoc.getKeywords();
    if (!keywords) keywords = [];
    else if (typeof keywords === "string") keywords = [keywords];
    else if (!Array.isArray(keywords)) keywords = [];
    addRow("Keywords", keywords.join(","));
	
    addRow("Creator", pdfDoc.getCreator() || "");
    addRow("Producer", pdfDoc.getProducer() || "");
	
    addRow(
      "CreationDate",
      pdfDoc.getCreationDate() ? pdfDoc.getCreationDate().toISOString() : ""
    );
    addRow(
      "ModDate",
      pdfDoc.getModificationDate() ? pdfDoc.getModificationDate().toISOString() : ""
    );

    document.getElementById("metaFields").style.display = "block";
  } catch (e) {
    alert("Failed to load metadata: " + e.message);
  } finally {
    setStatus("");
  }
}

export async function saveMetadata() {
  if (!pdfDoc) return alert("Load a PDF first");
  setStatus("Saving metadata...");

  try {
    const rows = Array.from(metaTableBody.querySelectorAll("tr"));
    rows.forEach((tr) => {
      const field = tr.cells[0].querySelector("input").value;
      const value = tr.cells[1].querySelector("input").value;

      switch (field) {
        case "Title":
          pdfDoc.setTitle(value);
          break;
        case "Author":
          pdfDoc.setAuthor(value);
          break;
        case "Subject":
          pdfDoc.setSubject(value);
          break;
        case "Keywords":
          pdfDoc.setKeywords(value.split(",").map(s => s.trim()).filter(Boolean));
          break;		  
		case "Creator":
		  pdfDoc.setCreator(value);
		  break;
		case "Producer":
		  pdfDoc.setProducer(value);
		  break;
        case "CreationDate":
          if (value) pdfDoc.setCreationDate(new Date(value));
          break;
        case "ModDate":
          if (value) pdfDoc.setModificationDate(new Date(value));
          break;
      }
    });

    const bytes = await pdfDoc.save();
    download("updated_metadata.pdf", bytes);
  } catch (e) {
    alert("Failed to save metadata: " + e.message);
  } finally {
    setStatus("");
  }
}
