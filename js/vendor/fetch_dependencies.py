import os
import re
import requests

ROOT = "https://cdn.jsdelivr.net"
OUTDIR = "esm"

# Regex to find ESM import paths
IMPORT_RE = re.compile(r'import\s+[^\'"]+[\'"]([^\'"]+)[\'"]')

visited = set()

def download_es_module(url_path):
    """Recursively download an ESM file and its dependencies."""
    if url_path in visited:
        return
    visited.add(url_path)

    # Full URL on jsDelivr
    full_url = ROOT + url_path
    print(f"Downloading: {full_url}")

    # Local output path
    local_path = os.path.join(OUTDIR, url_path[1:] + ".mjs")
    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    # Download file
    r = requests.get(full_url)
    r.raise_for_status()
    code = r.text

    # Save file
    with open(local_path, "w", encoding="utf-8") as f:
        f.write(code)

    # Find imports in this module
    deps = IMPORT_RE.findall(code)

    # Process each dependency
    for dep in deps:
        if dep.startswith("/npm/"):  # jsDelivr internal dependency
            download_es_module(dep)


if __name__ == "__main__":
    # Entry point: pdf-lib ESM build on jsDelivr
    entry = "/npm/pdf-lib@1.17.1/+esm"
    download_es_module(entry)

    print("\nDone! All files saved in:", OUTDIR)
