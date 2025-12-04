// js/lib/utils.js
export function download(filename, uint8Array) {
  const blob = new Blob([uint8Array], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function setStatus(msg, show = true) {
  const bar = document.getElementById("statusBar");
  bar.style.display = show ? "block" : "none";
  bar.textContent = msg || "";
}

export function parsePageRanges(str, total) {
  const set = new Set();
  for (let part of str.split(",")) {
    part = part.trim();
    if (!part) continue;
    if (part.includes("-")) {
      let [a, b] = part.split("-").map(Number);
      if (isNaN(a) || isNaN(b)) continue;
      if (a > b) [a, b] = [b, a];
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) set.add(i - 1);
    } else {
      const n = Number(part);
      if (n >= 1 && n <= total) set.add(n - 1);
    }
  }
  return [...set];
}