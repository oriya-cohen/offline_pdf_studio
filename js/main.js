// js/main.js
import { setStatus } from "./lib/utils.js";

document.addEventListener("DOMContentLoaded", () => {

  // Dynamically load tools
  import("./tools/merge.js");
  import("./tools/mixed-merge.js");
  import("./tools/split.js");
  import("./tools/images-to-pdf.js");
  import("./tools/pdf-to-images.js");
  import("./tools/watermark.js");
  import("./tools/rotate.js");
  import("./tools/compress.js");
  import("./tools/reorder.js");
  import("./tools/metadata.js");
  import("./tools/compare.js");

  // Panel switching
  document.querySelectorAll("#sidebar button").forEach(btn => {
    btn.addEventListener("click", () => {

      // hide all
      document.querySelectorAll(".panel").forEach(p => p.style.display = "none");

      // show selected
      const panel = document.getElementById(btn.dataset.panel);
      if (panel) {
        panel.style.display = "block";
      } else {
        console.error("Panel not found:", btn.dataset.panel);
      }
    });
  });

  // Show default panel
  const first = document.getElementById("mergePanel");
  if (first) first.style.display = "block";
});
